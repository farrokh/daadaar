
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Copyright & Licensing',
  description: 'Copyright and Licensing information for the Daadaar Platform',
};

export default function CopyrightPage() {
  return (
    <div>
      <h1>Copyright and Licensing</h1>
      <p>Last updated: January 2026</p>

      <h2>1. User-Generated Content License</h2>
      <p>
        By submitting text, images, or other media to Daadaar, you agree to license your contributions under the 
        <a href="https://creativecommons.org/licenses/by-sa/4.0/" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline"> Creative Commons Attribution-ShareAlike 4.0 International License (CC BY-SA 4.0)</a>.
      </p>
      <p>
        This means that others are free to:
      </p>
      <ul>
        <li><strong>Share:</strong> Copy and redistribute the material in any medium or format.</li>
        <li><strong>Adapt:</strong> Remix, transform, and build upon the material for any purpose, even commercially.</li>
      </ul>
      <p>
        Under the following terms:
      </p>
      <ul>
        <li><strong>Attribution:</strong> You must give appropriate credit to Daadaar and the original author (if known).</li>
        <li><strong>ShareAlike:</strong> If you remix, transform, or build upon the material, you must distribute your contributions under the same license as the original.</li>
      </ul>

      <h2>2. Copyright Infringement (DMCA)</h2>
      <p>
        Daadaar respects the intellectual property rights of others. It is our policy to respond to any claim that Content posted on the Service 
        infringes on the copyright or other intellectual property rights ("Infringement") of any person or entity.
      </p>
      <p>
        If you are a copyright owner, or authorized on behalf of one, and you believe that the copyrighted work has been copied 
        in a way that constitutes copyright infringement, please submit your claim via email or our reporting tool, 
        with the subject line: "Copyright Infringement" and include in your claim a detailed description of the alleged Infringement as detailed below.
      </p>

      <h3>DMCA Notice Requirements</h3>
      <p>
        To be effective, the notification must be a written communication that includes the following:
      </p>
      <ol>
        <li>An electronic or physical signature of the person authorized to act on behalf of the owner of the copyright's interest.</li>
        <li>Description of the copyrighted work that you claim has been infringed.</li>
        <li>Description of the material that is claimed to be infringing and where it is located on the Service.</li>
        <li>Your address, telephone number, and email address.</li>
        <li>A statement by you that you have a good faith belief that the disputed use is not authorized by the copyright owner, its agent, or the law.</li>
        <li>A statement by you, made under penalty of perjury, that the above information in your notice is accurate and that you are the copyright owner or authorized to act on the copyright owner's behalf.</li>
      </ol>

      <h2>3. Third-Party Content</h2>
      <p>
        Some content on the platform may be sourced from public domain records or other openly licensed sources. 
        We strive to attribute these sources correctly.
      </p>
    </div>
  );
}
