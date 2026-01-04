import { db, schema } from './backend/src/db';

async function main() {
  const mediaItems = await db.query.media.findMany();
  console.log('--- Media Records ---');
  for (const item of mediaItems) {
    console.log(
      `ID: ${item.id}, ReportID: ${item.reportId}, Bucket: ${item.s3Bucket}, Key: ${item.s3Key}, Type: ${item.mediaType}`
    );
  }
  process.exit(0);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
