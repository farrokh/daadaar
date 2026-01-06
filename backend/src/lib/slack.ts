/**
 * Slack Notification Utility
 * Handles sending messages to Slack via Webhooks
 */

import { InvokeCommand, LambdaClient } from '@aws-sdk/client-lambda';

const SLACK_WEBHOOK_URL = process.env.SLACK_WEBHOOK_URL;
const SLACK_LAMBDA_FUNCTION =
  process.env.SLACK_LAMBDA_FUNCTION_NAME || process.env.SLACK_LAMBDA_FUNCTION_ARN;
const AWS_REGION = process.env.AWS_REGION || 'us-east-1';

let lambdaClient: LambdaClient | null = null;

const getLambdaClient = () => {
  if (!lambdaClient) {
    lambdaClient = new LambdaClient({ region: AWS_REGION });
  }
  return lambdaClient;
};

interface SlackMessageOptions {
  text: string;
  blocks?: Record<string, unknown>[];
}

/**
 * Send a notification to Slack
 */
export async function sendSlackNotification(options: SlackMessageOptions): Promise<void> {
  if (SLACK_LAMBDA_FUNCTION) {
    try {
      const payload = Buffer.from(
        JSON.stringify({
          text: options.text,
          blocks: options.blocks,
        }),
        'utf-8'
      );

      const response = await getLambdaClient().send(
        new InvokeCommand({
          FunctionName: SLACK_LAMBDA_FUNCTION,
          InvocationType: 'Event',
          Payload: payload,
        })
      );

      if (response.StatusCode && response.StatusCode !== 202) {
        console.error(`Slack Lambda invocation failed: ${response.StatusCode}`);
      }
    } catch (error) {
      console.error('Error invoking Slack Lambda:', error);
    }
    return;
  }

  if (!SLACK_WEBHOOK_URL) {
    console.warn('SLACK_WEBHOOK_URL is not defined. Skipping notification.');
    return;
  }

  // We use a AbortController to set a small timeout (e.g. 2s)
  // so we don't hang the request if the VPC has no internet access
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 2000);

  try {
    const response = await fetch(SLACK_WEBHOOK_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(options),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Failed to send Slack notification: ${response.status} ${errorText}`);
    }
  } catch (error: unknown) {
    clearTimeout(timeoutId);
    if (error instanceof Error && error.name === 'AbortError') {
      console.warn('Slack notification timed out (likely due to VPC internet restrictions).');
    } else {
      console.error('Error sending Slack notification:', error);
    }
  }
}

export async function checkSlackNotifierHealth(): Promise<{
  ok: boolean;
  configured: boolean;
  mode: 'lambda' | 'webhook' | 'disabled';
  error?: string;
  note?: string;
}> {
  if (SLACK_LAMBDA_FUNCTION) {
    try {
      await getLambdaClient().send(
        new InvokeCommand({
          FunctionName: SLACK_LAMBDA_FUNCTION,
          InvocationType: 'DryRun',
        })
      );
      return { ok: true, configured: true, mode: 'lambda' };
    } catch (error) {
      return {
        ok: false,
        configured: true,
        mode: 'lambda',
        error: error instanceof Error ? error.message : 'Slack lambda dry-run failed',
      };
    }
  }

  if (SLACK_WEBHOOK_URL) {
    return {
      ok: true,
      configured: true,
      mode: 'webhook',
      note: 'Webhook configured; no dry-run check available.',
    };
  }

  return {
    ok: false,
    configured: false,
    mode: 'disabled',
    error: 'Slack notifier is not configured.',
  };
}

/**
 * Format and send a notification for a new user
 */
export async function notifyNewUser(user: {
  email: string;
  username: string;
  displayName: string;
}) {
  await sendSlackNotification({
    text: `🆕 *New User Registered*\n*Username:* ${user.username}\n*Display Name:* ${user.displayName}\n*Email:* ${user.email}`,
  });
}

/**
 * Format and send a notification for a new report
 */
export async function notifyNewReport(report: { id: number; title: string; author: string }) {
  const reportUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/reports/${report.id}`;
  await sendSlackNotification({
    text: `📝 *New Report Created*\n*Title:* ${report.title}\n*Author:* ${report.author}\n*Link:* <${reportUrl}|View Report>`,
  });
}

/**
 * Format and send a notification for a new individual
 */
export async function notifyNewIndividual(individual: { id: number; fullName: string }) {
  const individualUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/individuals/${individual.id}`;
  await sendSlackNotification({
    text: `👤 *New Individual Added*\n*Name:* ${individual.fullName}\n*Link:* <${individualUrl}|View Profile>`,
  });
}

/**
 * Format and send a notification for a new organization
 */
export async function notifyNewOrganization(org: { id: number; name: string }) {
  const orgUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/organizations/${org.id}`;
  await sendSlackNotification({
    text: `🏢 *New Organization Added*\n*Name:* ${org.name}\n*Link:* <${orgUrl}|View Organization>`,
  });
}

/**
 * Format and send a notification for a new content report (abuse/moderation)
 */
export async function notifyNewContentReport(report: {
  id: number;
  contentType: string;
  contentId: number;
  reason: string;
  description?: string | null;
}) {
  const adminUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/admin/reports`; // Assuming there's an admin path
  await sendSlackNotification({
    text: `🚩 *New Content Report (Abuse)*\n*Type:* ${report.contentType}\n*Content ID:* ${report.contentId}\n*Reason:* ${report.reason}\n*Description:* ${report.description || 'N/A'}\n*Admin Link:* <${adminUrl}|View Reports>`,
  });
}
