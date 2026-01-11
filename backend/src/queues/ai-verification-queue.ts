import { Queue } from 'bullmq';
import IORedis from 'ioredis';
import { redisConfig } from '../lib/redis';

// Define the name of the queue
export const AI_VERIFICATION_QUEUE_NAME = 'ai-verification-Queue';

// Create a dedicated Redis connection for BullMQ
const connection = new IORedis(process.env.REDIS_URL || '', redisConfig);

// Create and export the queue instance
export const aiVerificationQueue = new Queue(AI_VERIFICATION_QUEUE_NAME, {
  connection,
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 1000,
    },
    removeOnComplete: true,
    removeOnFail: false,
  },
});

export const addVerificationJob = async (reportId: number) => {
  return aiVerificationQueue.add('verify-report', { reportId });
};
