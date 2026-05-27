import { S3Client } from "@aws-sdk/client-s3";

console.log("S3 Config Check:", {
  endpoint: process.env.ENDPOINT,
  bucket: process.env.BUCKET,
  region: process.env.REGION,
  keyExists: !!process.env.ACCESS_KEY_ID,
  secretExists: !!process.env.SECRET_ACCESS_KEY,
});

export const s3 = new S3Client({
  region: process.env.REGION ?? "auto",
  endpoint: process.env.ENDPOINT,
  credentials: {
    accessKeyId: process.env.ACCESS_KEY_ID ?? "",
    secretAccessKey: process.env.SECRET_ACCESS_KEY ?? "",
  },
  forcePathStyle: true,
});

export const BUCKET_NAME = process.env.BUCKET;