
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Content Policy',
  description: 'Content Policy for the Daadaar Platform',
};

export default function ContentPolicyPage() {
  return (
    <div>
      <h1>Content Policy</h1>
      <p>Last updated: January 2026</p>

      <h2>1. Purpose of the Platform</h2>
      <p>
        Daadaar exists to document and visualize relationships and events related to institutional injustice. 
        Contributions should be factual, relevant, and constructive.
      </p>

      <h2>2. Prohibited Content</h2>
      <p>
        To maintain a safe and reliable environment, the following content is strictly prohibited:
      </p>
      <ul>
        <li><strong>Hate Speech:</strong> Content that promotes violence or hatred against individuals or groups based on race, ethnicity, religion, disability, gender, age, or sexual orientation.</li>
        <li><strong>Harassment:</strong> Targeting individuals for malicious abuse or doxxing (revealing private personal information not relevant to the public interest).</li>
        <li><strong>Spam:</strong> Promotional content, repetitive posts, or automated gibberish.</li>
        <li><strong>Illegal Content:</strong> Material that violates applicable laws, including child exploitation material or promotion of terrorism.</li>
        <li><strong>False Information:</strong> Deliberately fabricating events or evidence.</li>
      </ul>

      <h2>3. Verification and Factual Accuracy</h2>
      <p>
        We encourage users to provide evidence for their claims. 
        Our system uses AI and community voting to estimate the credibility of reports. 
        Content that is debunked or lacks credible sourcing may be flagged or removed.
      </p>

      <h2>4. Reporting Violations</h2>
      <p>
        If you encounter content that violates this policy, please use the "Report" feature present on every entity and report page. 
        Our moderation team reviews these reports regularly.
      </p>
      
      <h2>5. Appeal Process</h2>
      <p>
        If your content has been removed or your access restricted, and you believe this was in error, 
        you may appeal the decision through our standard support channels if you have a registered account. 
        Anonymous temporary bans (session-based) typically expire automatically.
      </p>
    </div>
  );
}
