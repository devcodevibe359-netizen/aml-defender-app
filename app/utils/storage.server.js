import { S3Client } from "@aws-sdk/client-s3";
export const s3 = new S3Client({
  region: process.env.RAILWAY_BUCKET_REGION ?? "auto",
  endpoint: process.env.RAILWAY_BUCKET_ENDPOINT_URL,
  credentials: {
    accessKeyId: process.env.RAILWAY_BUCKET_ACCESS_KEY_ID,
    secretAccessKey: process.env.RAILWAY_BUCKET_SECRET_ACCESS_KEY,
  },
  forcePathStyle: true,
});
export const BUCKET_NAME = process.env.RAILWAY_BUCKET_NAME;