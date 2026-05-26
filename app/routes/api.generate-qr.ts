import type { ActionFunctionArgs, LoaderFunctionArgs } from "react-router";
import { authenticate } from "../shopify.server";
import prisma from "../db.server";
import QRCode from "qrcode";
import crypto from "crypto";

const headers = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers":
    "Content-Type, Authorization",
};

export async function loader({ request }: LoaderFunctionArgs) {
  await authenticate.public.customerAccount(request);

  if (request.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers,
    });
  }

  return new Response("OK", { headers });
}

type QRRequestBody = {
  orderDetails?: string | null;
  reason?: string;
};

export async function action({ request }: ActionFunctionArgs) {
  try {
    await authenticate.public.customerAccount(request);

    const body = (await request.json()) as QRRequestBody;

    // Shopify Order Identity ID
    const orderIdentityId = body.orderDetails;

    if (!orderIdentityId) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "Order identity missing",
        }),
        {
          status: 400,
          headers,
        }
      );
    }

    // Check if KYC already exists
    const existing = await prisma.kycVerification.findUnique({
      where: {
        orderIdentityId,
      },
    });

    const url = new URL(request.url);

    const protocol =
      request.headers.get("x-forwarded-proto") ||
      url.protocol.replace(":", "");

    const appDomain = `${protocol}://${url.host}`;

    // If already exists return same QR
    if (existing) {
      const kycUrl = `${appDomain}/kyc?token=${existing.kycToken}`;

      const qrImage = await QRCode.toDataURL(kycUrl);

      return new Response(
        JSON.stringify({
          success: true,
          alreadyExists: true,
          qrUrl: qrImage,
          token: existing.kycToken,
          redirectUrl: kycUrl,
          status: existing.status,
          kycStatus: existing.kycStatus,
        }),
        {
          headers: {
            "Content-Type": "application/json",
            ...headers,
          },
        }
      );
    }

    // Generate new token
    const kycToken = crypto.randomUUID();

    // Save in DB
    const kycRecord = await prisma.kycVerification.create({
      data: {
        orderIdentityId,
        kycToken,
        kycStatus: false,
        status: "PENDING",
        reason: body.reason || "checkout_kyc",
      },
    });

    // Create KYC URL with token
    const kycUrl = `${appDomain}/kyc?token=${kycRecord.kycToken}`;

    // Generate QR Image
    const qrImage = await QRCode.toDataURL(kycUrl);

    // Return response
    return new Response(
      JSON.stringify({
        success: true,
        qrUrl: qrImage,
        token: kycRecord.kycToken,
        redirectUrl: kycUrl,
        status: "PENDING",
        kycStatus: false,
        orderIdentityId,
      }),
      {
        headers: {
          "Content-Type": "application/json",
          ...headers,
        },
      }
    );
  } catch (err: unknown) {
    console.error("KYC QR Error:", err);

    const message =
      err instanceof Error
        ? err.message
        : "Unknown error occurred";

    return new Response(
      JSON.stringify({
        success: false,
        error: message,
      }),
      {
        status: 500,
        headers,
      }
    );
  }
}