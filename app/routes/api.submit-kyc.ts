import type { ActionFunctionArgs } from "react-router";

import prisma from "../db.server";

import fs from "fs/promises";

import path from "path";

export async function action({
  request,
}: ActionFunctionArgs) {
  try {
    const formData = await request.formData();

    const token = formData.get("token") as string;

    const frontId = formData.get("frontId") as File;

    const backId = formData.get("backId") as File;

    const selfie = formData.get("selfie") as File;

    if (!token || !frontId || !backId || !selfie) {
      return Response.json(
        {
          success: false,
          error: "Missing required data",
        },
        {
          status: 400,
        }
      );
    }

    // Find KYC session
    const kyc = await prisma.kycVerification.findUnique({
      where: {
        kycToken: token,
      },
    });

    if (!kyc) {
      return Response.json(
        {
          success: false,
          error: "Invalid token",
        },
        {
          status: 404,
        }
      );
    }

    // Upload folder
    const uploadDir = path.join(
      process.cwd(),
      "public/uploads"
    );

    await fs.mkdir(uploadDir, {
      recursive: true,
    });

    async function saveFile(
      file: File,
      prefix: string
    ) {
      const bytes = await file.arrayBuffer();

      const buffer = Buffer.from(bytes);

      const filename = `${prefix}-${Date.now()}.jpg`;

      const filepath = path.join(
        uploadDir,
        filename
      );

      await fs.writeFile(filepath, buffer);

      return `/uploads/${filename}`;
    }

    // Save images
    const frontImageUrl = await saveFile(
      frontId,
      "front"
    );

    const backImageUrl = await saveFile(
      backId,
      "back"
    );

    const selfieImageUrl = await saveFile(
      selfie,
      "selfie"
    );

    // Save documents table
    await prisma.kycDocument.create({
      data: {
        kycVerificationId: kyc.id,

        frontImageUrl,

        backImageUrl,

        selfieImageUrl,
      },
    });

    // Update verification table
    await prisma.kycVerification.update({
      where: {
        id: kyc.id,
      },
      data: {
        kycStatus: true,

        status: "UNDER_REVIEW",

        submittedAt: new Date(),
      },
    });

    return Response.json({
      success: true,
    });
  } catch (err) {
    console.error(err);

    return Response.json(
      {
        success: false,
        error: "Upload failed",
      },
      {
        status: 500,
      }
    );
  }
}