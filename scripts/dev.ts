#!/usr/bin/env bun
/**
 * Development script to run both frontend and backend concurrently
 */

import { spawn } from 'bun';

console.log('🚀 Starting development servers...\n');

// Run frontend (Next.js dev server) - use bun to execute next
const frontend = spawn({
  cmd: ['bun', 'x', 'next', 'dev'],
  cwd: './frontend',
  stdout: 'inherit',
  stderr: 'inherit',
  env: process.env,
});

// Run backend (Express server with Bun watch) - use the actual command from package.json
const backend = spawn({
  cmd: ['bun', '--watch', 'src/server.ts'],
  cwd: './backend',
  stdout: 'inherit',
  stderr: 'inherit',
  env: process.env,
});

// Handle cleanup on exit
const cleanup = async () => {
  console.log('\n🛑 Stopping servers...');
  frontend.kill();
  backend.kill();
  try {
    await Promise.all([frontend.exited, backend.exited]);
  } catch {
    // Ignore errors during cleanup
  }
  process.exit(0);
};

process.on('SIGINT', cleanup);
process.on('SIGTERM', cleanup);

// Keep the script running and wait for both processes
try {
  await Promise.all([frontend.exited, backend.exited]);
} catch {
  // Processes will run indefinitely, so this is expected
}

