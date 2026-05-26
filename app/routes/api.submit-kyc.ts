import type { ActionFunctionArgs } from "react-router";
import { PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import prisma from "../db.server";
import { v4 as uuidv4 } from "uuid";

// ─── S3 Client (Railway Bucket) ───────────────────────────────────────────────
const s3 = new S3Client({
  region: process.env.RAILWAY_BUCKET_REGION ?? "auto",
  endpoint: process.env.RAILWAY_BUCKET_ENDPOINT_URL,
  credentials: {
    accessKeyId: process.env.RAILWAY_BUCKET_ACCESS_KEY_ID!,
    secretAccessKey: process.env.RAILWAY_BUCKET_SECRET_ACCESS_KEY!,
  },
  forcePathStyle: true, // Railway ke liye zaroori
});

const BUCKET_NAME = process.env.RAILWAY_BUCKET_NAME!;
const BUCKET_URL  = process.env.RAILWAY_BUCKET_ENDPOINT_URL!;

// ─── Helper: File → Railway Bucket ───────────────────────────────────────────
async function uploadToRailway(file: File, prefix: string): Promise<string> {
  const bytes     = await file.arrayBuffer();
  const buffer    = Buffer.from(bytes);
  const key       = `kyc/${prefix}-${uuidv4()}.jpg`; // unique path

  await s3.send(
    new PutObjectCommand({
      Bucket:      BUCKET_NAME,
      Key:         key,
      Body:        buffer,
      ContentType: file.type || "image/jpeg",
    })
  );

  // CDN URL — DB mein yahi save hoga
  return `${BUCKET_URL}/${BUCKET_NAME}/${key}`;
}

// ─── Action ───────────────────────────────────────────────────────────────────
export async function action({ request }: ActionFunctionArgs) {
  try {
    const formData = await request.formData();

    const token   = formData.get("token")   as string;
    const frontId = formData.get("frontId") as File;
    const backId  = formData.get("backId")  as File;
    const selfie  = formData.get("selfie")  as File;

    if (!token || !frontId || !backId || !selfie) {
      return Response.json(
        { success: false, error: "Missing required data" },
        { status: 400 }
      );
    }

    // KYC session dhundo
    const kyc = await prisma.kycVerification.findUnique({
      where: { kycToken: token },
    });

    if (!kyc) {
      return Response.json(
        { success: false, error: "Invalid token" },
        { status: 404 }
      );
    }

    // ✅ Teeno images Railway pe upload karo (parallel — faster)
    const [frontImageUrl, backImageUrl, selfieImageUrl] = await Promise.all([
      uploadToRailway(frontId, "front"),
      uploadToRailway(backId,  "back"),
      uploadToRailway(selfie,  "selfie"),
    ]);

    // DB mein URLs save karo
    await prisma.kycDocument.create({
      data: {
        kycVerificationId: kyc.id,
        frontImageUrl,
        backImageUrl,
        selfieImageUrl,
      },
    });

    await prisma.kycVerification.update({
      where: { id: kyc.id },
      data: {
        kycStatus:   true,
        status:      "UNDER_REVIEW",
        submittedAt: new Date(),
      },
    });

    return Response.json({ success: true });

  } catch (err) {
    console.error(err);
    return Response.json(
      { success: false, error: "Upload failed" },
      { status: 500 }
    );
  }
}