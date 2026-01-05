
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Terms of Service',
  description: 'Terms of Service for the Daadaar Platform',
};

export default function TermsPage() {
  return (
    <div>
      <h1>Terms of Service</h1>
      <p>Last updated: January 2026</p>

      <h2>1. Introduction</h2>
      <p>
        Welcome to Daadaar ("the Platform"). By accessing or using our website, you agree to be bound by these Terms of Service. 
        Daadaar is a decentralized, anonymous platform designed to expose institutional injustices through community-driven reporting.
      </p>

      <h2>2. Anonymous Participation</h2>
      <p>
        We prioritize your privacy and anonymity. You may use the Platform without registering an account ("Anonymous User"). 
        However, to ensure the integrity of the Platform, we employ Proof-of-Work (PoW) mechanisms and session-based rate limiting. 
        By using the Platform, you consent to these security measures.
      </p>

      <h2>3. User Responsibilities</h2>
      <p>
        You are solely responsible for the content you submit, including reports, votes, and media. You agree not to submit content that:
      </p>
      <ul>
        <li>Is knowingly false or misleading.</li>
        <li>Violates any applicable laws.</li>
        <li>Infringes on the intellectual property rights of others.</li>
        <li>Contains spam, malware, or malicious code.</li>
        <li>Is intended to harass, bully, or harm individuals.</li>
      </ul>

      <h2>4. Content Moderation and Banning</h2>
      <p>
        While we strive for a censorship-resistant platform, we reserve the right to remove content and ban users (via Session ID or User ID) 
        that violate these Terms or our Content Policy. This includes, but is not limited to, spam, hate speech, and verifiably false information.
        Moderators and Admins have the authority to review flagged content and take appropriate action.
      </p>

      <h2>5. Disclaimer of Warranties</h2>
      <p>
        The Platform is provided "as is" and "as available" without any warranties of any kind. 
        We do not guarantee the accuracy, completeness, or reliability of any user-generated content. 
        The verification scores provided by our AI systems are estimates and should not be taken as absolute truth.
      </p>

      <h2>6. Limitation of Liability</h2>
      <p>
        To the fullest extent permitted by law, Daadaar and its operators shall not be liable for any indirect, incidental, special, consequential, or punitive damages, 
        or any loss of profits or revenues, whether incurred directly or indirectly, or any loss of data, use, goodwill, or other intangible losses, 
        resulting from your access to or use of or inability to access or use the Platform.
      </p>

      <h2>7. Changes to Terms</h2>
      <p>
        We may modify these Terms at any time. We will provide notice of significant changes by updating the "Last updated" date at the top of this page. 
        Your continued use of the Platform signifies your acceptance of the modification.
      </p>

      <h2>8. Governing Law</h2>
      <p>
        These Terms shall be governed by and construed in accordance with the laws of the jurisdiction in which the Platform operates, without regard to its conflict of law provisions.
      </p>

      <h2>9. Contact Us</h2>
      <p>
        If you have any questions about these Terms, please contact us through the available channels on the Platform.
      </p>
    </div>
  );
}
