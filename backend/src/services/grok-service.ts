import { eq } from 'drizzle-orm';
import OpenAI from 'openai';
import { aiVerification, reports } from '../../../database/schema';
import { db } from '../db';

// Initialize OpenAI client with Perplexity configuration
const perplexity = new OpenAI({
  apiKey: process.env.PERPLEXITY_API_KEY,
  baseURL: 'https://api.perplexity.ai',
});

interface AIAnalysisResult {
  confidenceScore: number;
  consistencyScore: number;
  credibilityScore: number;
  factCheckSummary: string;
  factCheckSummaryEn: string;
  flags: string[];
  flagsEn: string[];
}

export const verifyReportWithAI = async (reportId: number) => {
  // 1. Fetch the report data
  const report = await db.query.reports.findFirst({
    where: eq(reports.id, reportId),
  });

  if (!report) {
    throw new Error(`Report with ID ${reportId} not found`);
  }

  // 2. Construct the prompt for Perplexity
  const prompt = `
    You are an expert fact-checker and human rights conflict analyst. Your task is to verify the following incident report.
    Use your internal knowledge base, recent news, and logical consistency checks to evaluate the report.
    
    Report Title: ${report.title}
    Report Content: ${report.content}
    Incident Date: ${report.incidentDate ? new Date(report.incidentDate).toISOString() : 'Unknown'}
    Incident Location: ${report.incidentLocation || 'Unknown'}

    Please analyze this report and provide a JSON response with the following structure:
    {
      "confidenceScore": number (0-100),
      "consistencyScore": number (0-100),
      "credibilityScore": number (0-100),
      "factCheckSummary": "A concise summary of your findings in Persian",
      "factCheckSummaryEn": "A concise summary of your findings in English",
      "flags": ["list", "of", "potential", "inconsistencies", "or", "issues in Persian"],
      "flagsEn": ["list", "of", "potential", "inconsistencies", "or", "issues in English"]
    }
  `;

  const startTime = Date.now();

  try {
    // 3. Call Perplexity API
    const completion = await perplexity.chat.completions.create({
      model: 'sonar',
      messages: [
        {
          role: 'system',
          content: `You are a helpful and rigorous fact-checking assistant. You always output valid JSON. Today is ${new Date().toISOString().split('T')[0]}.`,
        },
        { role: 'user', content: prompt },
      ],
    });

    const processingTimeMs = Date.now() - startTime;
    // Perplexity might return extra text or markdown code blocks
    let content = completion.choices[0].message.content;

    if (!content) {
      throw new Error('Received empty response from Perplexity');
    }

    // Extract JSON from potential markdown blocks or search for the first '{' and last '}'
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('Could not find JSON object in Perplexity response');
    }

    content = jsonMatch[0];

    const result: AIAnalysisResult = JSON.parse(content);

    // 4. Save the results to the database
    await db
      .insert(aiVerification)
      .values({
        reportId: report.id,
        confidenceScore: result.confidenceScore,
        consistencyScore: result.consistencyScore,
        credibilityScore: result.credibilityScore,
        factCheckSummary: result.factCheckSummary,
        factCheckSummaryEn: result.factCheckSummaryEn,
        flags: JSON.stringify(result.flags),
        flagsEn: JSON.stringify(result.flagsEn),
        analysisJson: content,
        modelUsed: 'sonar',
        processingTimeMs,
      })
      .onConflictDoUpdate({
        target: aiVerification.reportId,
        set: {
          confidenceScore: result.confidenceScore,
          consistencyScore: result.consistencyScore,
          credibilityScore: result.credibilityScore,
          factCheckSummary: result.factCheckSummary,
          factCheckSummaryEn: result.factCheckSummaryEn,
          flags: JSON.stringify(result.flags),
          flagsEn: JSON.stringify(result.flagsEn),
          analysisJson: content,
          modelUsed: 'sonar',
          processingTimeMs,
          updatedAt: new Date(),
        },
      });

    return result;
  } catch (error) {
    console.error('Error verifying report with AI:', error);
    throw error;
  }
};
