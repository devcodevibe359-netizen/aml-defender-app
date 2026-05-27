// app/utils/uploadImage.server.js
import { PutObjectCommand, GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { s3, BUCKET_NAME } from "./storage.server";
import path from "path";

export async function uploadFileToRailway(file, prefix = "uploads") {
  const ext = path.extname(file.name) || ".jpg";
  const fileName = `${prefix}/${crypto.randomUUID()}${ext}`;

  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);

  // Upload karo
  await s3.send(
    new PutObjectCommand({
      Bucket: BUCKET_NAME,
      Key: fileName,
      Body: buffer,
      ContentType: file.type || "image/jpeg",
    })
  );

  // ✅ Presigned URL banao — 7 din valid
  const getCommand = new GetObjectCommand({
    Bucket: BUCKET_NAME,
    Key: fileName,
  });

  const signedUrl = await getSignedUrl(s3, getCommand, {
    expiresIn: 60 * 60 * 24 * 7, // 7 din
  });

  return signedUrl;
}