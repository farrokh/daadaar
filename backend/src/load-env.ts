import dotenv from 'dotenv';

console.log('Loading environment variables...');

if (process.env.NODE_ENV !== 'production') {
  // Load .env first
  dotenv.config({ override: true });
  // Then load .env.local which overrides .env
  dotenv.config({ path: '.env.local', override: true });
}
