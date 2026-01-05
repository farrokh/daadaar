import nodemailer from 'nodemailer';

/**
 * Email Service
 * Handles sending emails for notifications, etc.
 */

const getTransporter = async () => {
  // Use environment variables for SMTP configuration
  const {
    SMTP_HOST,
    SMTP_PORT,
    SMTP_USER,
    SMTP_PASS,
  } = process.env;

  if (SMTP_HOST && SMTP_PORT && SMTP_USER && SMTP_PASS) {
    return nodemailer.createTransport({
      host: SMTP_HOST,
      port: parseInt(SMTP_PORT),
      secure: parseInt(SMTP_PORT) === 465,
      auth: {
        user: SMTP_USER,
        pass: SMTP_PASS,
      },
    });
  }

  // Development: Use Ethereal for testing if no SMTP is configured
  if (process.env.NODE_ENV !== 'production') {
    // Note: Creating a test account can be slow, in real app we'd cached this
    try {
      const testAccount = await nodemailer.createTestAccount();
      console.log('Ethereal Email Test Account Created:', testAccount.user);
      return nodemailer.createTransport({
        host: 'smtp.ethereal.email',
        port: 587,
        secure: false,
        auth: {
          user: testAccount.user,
          pass: testAccount.pass,
        },
      });
    } catch (error) {
      console.warn('Failed to create Ethereal test account, falling back to dummy logger');
    }
  }

  // Fallback: Dummy logger transporter
  return {
    sendMail: async (mailOptions: any) => {
      console.log('--- DUMMY EMAIL SENT ---');
      console.log('To:', mailOptions.to);
      console.log('Subject:', mailOptions.subject);
      console.log('Body:', mailOptions.text || mailOptions.html);
      console.log('------------------------');
      return { messageId: 'dummy-id' };
    }
  } as nodemailer.Transporter;
};

export async function sendEmail({
  to,
  subject,
  text,
  html,
}: {
  to: string;
  subject: string;
  text?: string;
  html?: string;
}) {
  try {
    const transporter = await getTransporter();
    const info = await transporter.sendMail({
      from: process.env.EMAIL_FROM || '"Daadaar Platform" <noreply@daadaar.com>',
      to,
      subject,
      text,
      html,
    });

    console.log('Email sent: %s', info.messageId);
    
    // If using Ethereal, log the preview URL
    const previewUrl = nodemailer.getTestMessageUrl(info);
    if (previewUrl) {
      console.log('Preview URL: %s', previewUrl);
    }

    return { success: true, messageId: info.messageId, previewUrl };
  } catch (error) {
    console.error('Error sending email:', error);
    return { success: false, error };
  }
}

/**
 * Notify moderators of a new content report
 */
export async function notifyModeratorsOfReport(report: any) {
  const moderatorEmail = process.env.MODERATOR_EMAIL;
  if (!moderatorEmail) {
    console.warn('MODERATOR_EMAIL is not set, skipping notification');
    return;
  }

  const dashboardUrl = `${process.env.FRONTEND_URL}/admin/content-reports`;
  
  await sendEmail({
    to: moderatorEmail,
    subject: `[Moderation] New Content Report - ${report.contentType} #${report.contentId}`,
    text: `A new content report has been submitted.\n\nReason: ${report.reason}\nContent Type: ${report.contentType}\nContent ID: ${report.contentId}\nDescription: ${report.description || 'N/A'}\n\nReview it here: ${dashboardUrl}`,
    html: `
      <h2>New Content Report</h2>
      <p>A new content report has been submitted for review.</p>
      <ul>
        <li><strong>Reason:</strong> ${report.reason}</li>
        <li><strong>Content Type:</strong> ${report.contentType}</li>
        <li><strong>Content ID:</strong> ${report.contentId}</li>
        <li><strong>Description:</strong> ${report.description || 'N/A'}</li>
      </ul>
      <p><a href="${dashboardUrl}">Click here to review the report in the Admin Dashboard</a></p>
    `,
  });
}
