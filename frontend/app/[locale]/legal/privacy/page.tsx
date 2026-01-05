
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Privacy Policy',
  description: 'Privacy Policy for the Daadaar Platform',
};

export default function PrivacyPage() {
  return (
    <div>
      <h1>Privacy Policy</h1>
      <p>Last updated: January 2026</p>

      <h2>1. Our Commitment to Privacy</h2>
      <p>
        Daadaar is built on the principle of privacy by default. We believe you should be able to expose injustice without sacrificing your anonymity. 
        This Privacy Policy explains what information we collect, how we use it, and the steps we take to protect your identity.
      </p>

      <h2>2. Information We DO NOT Collect</h2>
      <p>
        <strong>Zero IP Logging:</strong> We explicitly do not log or store your IP address. 
        Our infrastructure, including our Cloudflare integration, is configured to anonymize requests at the edge.
      </p>
      <p>
        <strong>No Usage Tracking:</strong> We do not track your browsing history or personal behavior on the Platform beyond what is necessary for security (see Rate Limiting).
      </p>

      <h2>3. Information We Collect</h2>
      <h3>a. Anonymous Sessions</h3>
      <p>
         When you visit Daadaar, a random Session ID is generated and stored locally on your device. This identifier is used solely for:
      </p>
      <ul>
        <li>Rate limiting to prevent spam (e.g., limiting the number of reports you can submit in an hour).</li>
        <li>Managing your "upvotes" and "downvotes" to prevent double-voting.</li>
      </ul>
      <p>This Session ID is not linked to your real-world identity.</p>

      <h3>b. Optional Account Information</h3>
      <p>
        If you choose to create an account, we collect:
      </p>
      <ul>
        <li><strong>Username:</strong> A pseudonym you choose.</li>
        <li><strong>Password:</strong> Hashed and salted securely.</li>
        <li><strong>Email (Optional):</strong> Only if you wish to recover your account. We recommend using a secure, anonymous email provider.</li>
      </ul>

      <h3>c. Content You Submit</h3>
      <p>
        Any reports, images, or text you submit to the Platform are public. Please be mindful of any personally identifiable information (PII) 
        included in your submissions. We strive to sanitize content, but you are responsible for what you share.
      </p>

      <h2>4. How We Use Information</h2>
      <ul>
        <li><strong>Security:</strong> To protect the Platform from abuse, spam, and "sybil attacks" using Proof-of-Work (PoW) and rate limiting.</li>
        <li><strong>Platform Operation:</strong> To display reports, verify content via AI, and maintain the knowledge graph.</li>
      </ul>

      <h2>5. Cookies and Local Storage</h2>
      <p>
        We use local storage and session cookies strictly for necessary functions:
      </p>
      <ul>
        <li>Maintaining your login state or anonymous session.</li>
        <li>Storing your preferences (e.g., language, theme).</li>
        <li>Completing Proof-of-Work challenges.</li>
      </ul>
      <p>We do not use third-party tracking cookies for advertising.</p>

      <h2>6. Data Security</h2>
      <p>
        We employ robust security measures to protect your data:
      </p>
      <ul>
        <li><strong>Encryption:</strong> All data is encrypted in transit (HTTPS/TLS) and at rest (stored encrypted in our databases and object storage).</li>
        <li><strong>Minimal Retention:</strong> We do not retain logs that could identify you. Rate limit keys expire automatically.</li>
      </ul>

      <h2>7. Third-Party Services</h2>
      <p>
        We use trusted third-party providers for infrastructure, including:
      </p>
      <ul>
        <li><strong>Cloudflare:</strong> For DDoS protection and content delivery.</li>
        <li><strong>AWS:</strong> For hosting and storage.</li>
        <li><strong>OpenAI:</strong> For verifying report content (only the report text is sent, not metadata).</li>
      </ul>
      <p>These providers are vetted to ensure they align with our security and privacy standards.</p>

      <h2>8. Changes to this Policy</h2>
      <p>
        We may update this Privacy Policy to reflect changes in our practices or legal requirements. 
        We will notify you of any material changes by posting the new Privacy Policy on this page.
      </p>

      <h2>9. Contact Us</h2>
      <p>
        If you have concerns about your privacy, please contact the administrators via the Platform's reporting channels.
      </p>
    </div>
  );
}
