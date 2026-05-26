// app/utils/uploadImage.server.js
import { unstable_parseMultipartFormData, unstable_createMemoryUploadHandler } from "@remix-run/node";
import { PutObjectCommand } from "@aws-sdk/client-s3";
import { s3, BUCKET_NAME } from "./storage.server";
import { v4 as uuidv4 } from "uuid";
import path from "path";
export async function uploadImageToRailway(request) {
  const uploadHandler = unstable_createMemoryUploadHandler({
    maxPartSize: 5_000_000, 
  });
  const formData = await unstable_parseMultipartFormData(request, uploadHandler);
  const image = formData.get("image"); 
  if (!image || typeof image === "string") {
    throw new Error("Image nahi mili");
  }
  const ext = path.extname(image.name);
  const fileName = `uploads/${uuidv4()}${ext}`;
  const arrayBuffer = await image.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);
  await s3.send(
    new PutObjectCommand({
      Bucket: BUCKET_NAME,
      Key: fileName,
      Body: buffer,
      ContentType: image.type,
    })
  );
  const imageUrl = `${process.env.RAILWAY_BUCKET_ENDPOINT_URL}/${BUCKET_NAME}/${fileName}`;
  return { imageUrl, formData };
}