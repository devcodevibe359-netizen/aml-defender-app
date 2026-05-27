// app/utils/uploadImage.server.js
import { PutObjectCommand } from "@aws-sdk/client-s3";
import { s3, BUCKET_NAME } from "./storage.server";
import path from "path";

export async function uploadFileToRailway(file, prefix = "uploads") {
  const ext = path.extname(file.name) || ".jpg";
  const fileName = `${prefix}/${crypto.randomUUID()}${ext}`;
  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);

  await s3.send(
    new PutObjectCommand({
      Bucket: BUCKET_NAME,
      Key: fileName,
      Body: buffer,
      ContentType: file.type || "image/jpeg",
    })
  );
  const imageUrl = `${process.env.RAILWAY_BUCKET_ENDPOINT_URL}/${BUCKET_NAME}/${fileName}`;
  return imageUrl;
}