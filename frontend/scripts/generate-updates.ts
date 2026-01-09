
import { exec } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { promisify } from "node:util";
import OpenAI from "openai";

const execAsync = promisify(exec);

// Output path
const outputPath = path.resolve(process.cwd(), "data/updates.json");
const dataDir = path.dirname(outputPath);

async function generateUpdates() {
  try {
    console.log("Generating updates from git log...");
    // Ensure directory exists
    if (!fs.existsSync(dataDir)) {
      console.log(`Creating directory: ${dataDir}`);
      fs.mkdirSync(dataDir, { recursive: true });
    }

    // Get git log
    // Format: hash | date | subject | author
    // Limit to last 500 commits
    // Use line separator for commits, and null bytes for fields to handle pipe characters in messages
    const { stdout } = await execAsync('git log --pretty=format:"%H%x00%ad%x00%s%x00%an" --date=short -n 500');

    const updates = stdout
      .split("\n")
      .filter(line => line.trim())
      .map(line => {
        const parts = line.split("\0");
        const [hash, date, message, author] = parts;
        return {
          hash,
          date,
          // Fallback if split fails, though highly unlikely with \0
          message: message || "No message", 
          author: author || "Unknown"
        };
      });

    // Group by date
    const grouped: Record<string, any[]> = {};
    
    updates.forEach(update => {
      if (!grouped[update.date]) {
        grouped[update.date] = [];
      }
      grouped[update.date].push(update);
    });

    // Load existing translations into memory
    const translationCache: Record<string, string> = {};
    if (fs.existsSync(outputPath)) {
        try {
            const existingData = JSON.parse(fs.readFileSync(outputPath, 'utf-8'));
            if (Array.isArray(existingData)) {
                existingData.forEach((day: any) => {
                    if (day.public) {
                        day.public.forEach((update: any) => {
                            if (update.message && typeof update.message === 'object' && update.message.en && update.message.fa) {
                                translationCache[update.message.en] = update.message.fa;
                            }
                        });
                    }
                });
            }
        } catch (e) {
            console.warn("Could not read existing updates.json for cache.", e);
        }
    }

    // Process for public/technical
    const processed = Object.keys(grouped)
      .sort((a, b) => new Date(b).getTime() - new Date(a).getTime())
      .map(date => {
        const commits = grouped[date];

        // Technical: just the commits (keep raw message)
        const technical = commits;

        // Public: filter and clean
        const publicUpdates = commits
          .map(c => {
            let cleanMsg = c.message;
            let type = "other";
            
            const lowerMsg = c.message.toLowerCase();
            if (lowerMsg.startsWith("feat")) type = "feature";
            else if (lowerMsg.startsWith("fix")) type = "fix";
            else if (lowerMsg.startsWith("perf")) type = "performance";
            else if (lowerMsg.startsWith("docs")) type = "documentation";
            else if (lowerMsg.startsWith("style") || lowerMsg.startsWith("ui")) type = "ui";

            // Clean message
            cleanMsg = cleanMsg.replace(/^(feat|fix|chore|docs|style|refactor|perf|test|build|ci)(\(.*\))?:\s*/i, "");
            cleanMsg = cleanMsg.charAt(0).toUpperCase() + cleanMsg.slice(1);

            return { ...c, message: cleanMsg, type };
          })
          .filter(c => ["feature", "fix", "performance", "ui"].includes(c.type));

        // Deduplicate public messages
        const uniquePublic = Array.from(new Map(publicUpdates.map(item => [item.message, item])).values());

        return {
          date,
          technical,
          public: uniquePublic.map(item => {
              // Apply cache immediately if available
              const cachedFa = translationCache[item.message];
              return {
                ...item,
                message: { en: item.message, fa: cachedFa || item.message } // Use cached or fallback to English
             };
          })
        };
      })
      .filter(d => d.technical.length > 0);

      // Translation Step
      if (process.env.OPENAI_API_KEY) {
        
        // Identify missing translations
        const textsToTranslate: { date: string, hash: string, text: string }[] = [];
        
        processed.forEach(day => {
            day.public.forEach(update => {
                // If the fa version matches the en version, it means we haven't translated it (or fallback was used).
                // Check cache again just in case, though logically it should be covered.
                if (update.message.en === update.message.fa && !translationCache[update.message.en]) {
                    textsToTranslate.push({ date: day.date, hash: update.hash, text: update.message.en });
                }
            });
        });

        if (textsToTranslate.length > 0) {
            console.log(`Translating ${textsToTranslate.length} new updates with OpenAI...`);
            const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
            
            // Re-implementing correctly with wait
             const translateChunk = async (chunk: typeof textsToTranslate) => {
                 try {
                     const prompt = `Translate these git commit summaries to Persian (Farsi). Maintain technical context. Return a JSON object with a key 'translations' containing an array of translated strings in the same order. Input: ${JSON.stringify(chunk.map(c => c.text))}`;
                     
                     const response = await openai.chat.completions.create({
                         model: "gpt-4o-mini",
                         messages: [
                             { role: "system", content: "You are a helpful translator for a software project changelog. Translate to formal but modern Persian." },
                             { role: "user", content: prompt }
                         ],
                         response_format: { type: "json_object" }
                     });
                     
                     if (response.choices[0].message.content) {
                        const result = JSON.parse(response.choices[0].message.content);
                        if (result.translations && Array.isArray(result.translations)) {
                            return result.translations;
                        }
                     }
                     return chunk.map(c => c.text); // Fallback
                 } catch (e) {
                     console.error("Translation error:", e);
                     return chunk.map(c => c.text); // Fallback
                 }
             };

             const CHUNK_SIZE = 50;
             const chunks = [];
             for (let i = 0; i < textsToTranslate.length; i += CHUNK_SIZE) {
                 chunks.push(textsToTranslate.slice(i, i + CHUNK_SIZE));
             }

             // Process chunks sequentially to not hit rate limits heavily
             let translatedTexts: string[] = [];
             for (const chunk of chunks) {
                 const translations = await translateChunk(chunk);
                 translatedTexts = [...translatedTexts, ...translations];
             }

             // Update map with new translations so we matched them correctly
             // Since we flattened the list, we need to apply them back to the processed array.
             // But wait, the processed array is nested.
             // Easy way: update the cache map and then re-map or mutate 'processed'.
             
             textsToTranslate.forEach((item, index) => {
                 if (translatedTexts[index]) {
                     translationCache[item.text] = translatedTexts[index];
                 }
             });

             // Re-apply full cache to processed (covers both old and newly translated)
             processed.forEach(day => {
                day.public.forEach(update => {
                    const translated = translationCache[update.message.en];
                    if (translated) {
                        update.message.fa = translated;
                    }
                });
             });
        } else {
             console.log("No new updates to translate. Using cached translations.");
        }
      } else {
        console.log("No OPENAI_API_KEY found. Skipping translation.");
      }

    fs.writeFileSync(outputPath, JSON.stringify(processed, null, 2));
    console.log(`Updates generated at ${outputPath}`);
    console.log(`Total days processed: ${processed.length}`);

  } catch (error) {
    console.warn("Warning: Could not generate updates from git log. Using empty updates list.", error);
    
    // Check if we have an existing file we can preserve
    if (fs.existsSync(outputPath)) {
        console.log("Preserving existing updates.json found in build.");
    } else {
        // Only write empty if absolutely nothing exists
        console.warn("No existing data found. Creating empty updates list.");
        if (!fs.existsSync(dataDir)) {
          fs.mkdirSync(dataDir, { recursive: true });
        }
        fs.writeFileSync(outputPath, JSON.stringify([], null, 2));
    }
    // Do not fail the build, allow existing file to be used
    process.exit(0); 
  }
}

generateUpdates();
