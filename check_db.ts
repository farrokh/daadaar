import { db, closeDatabaseConnection } from './backend/src/db';

async function main() {
  const mediaItems = await db.query.media.findMany();
  console.log('--- Media Records ---');
  for (const item of mediaItems) {
    console.log(
      `ID: ${item.id}, ReportID: ${item.reportId}, Bucket: ${item.s3Bucket}, Key: ${item.s3Key}, Type: ${item.mediaType}`
    );
  }
  await closeDatabaseConnection();
  process.exit(0);
}

main().catch(async err => {
  console.error(err);
  await closeDatabaseConnection();
  process.exit(1);
});
