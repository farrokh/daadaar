import '../load-env';
import { Worker } from 'bullmq';
import IORedis from 'ioredis';
import { redisConfig } from '../lib/redis';
import { AI_VERIFICATION_QUEUE_NAME } from '../queues/ai-verification-queue';
import { verifyReportWithAI } from '../services/grok-service';

// Dedicated connection for the worker (blocking)
const connection = new IORedis(process.env.REDIS_URL || '', redisConfig);

// Define the worker to process jobs from the queue
export const aiVerificationWorker = new Worker(
  AI_VERIFICATION_QUEUE_NAME,
  async job => {
    const { reportId } = job.data;
    console.log(`Processing AI verification for report ${reportId}...`);

    try {
      await verifyReportWithAI(reportId);
      console.log(`AI verification for report ${reportId} completed.`);
    } catch (error) {
      console.error(`AI verification for report ${reportId} failed:`, error);
      throw error;
    }
  },
  {
    connection,
    concurrency: 5, // Process up to 5 verification jobs concurrently
  }
);

// Listen for completed jobs
aiVerificationWorker.on('completed', job => {
  console.log(`Job ${job.id} has completed!`);
});

// Listen for failed jobs
aiVerificationWorker.on('failed', (job, err) => {
  console.log(`Job ${job?.id} has failed with ${err.message}`);
});
