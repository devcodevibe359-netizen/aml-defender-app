import type { ActionFunctionArgs, LoaderFunctionArgs } from "react-router";
import { authenticate, unauthenticated } from "../shopify.server";
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
    return new Response(null, { status: 200, headers });
  }
  return new Response("OK", { headers });
}

type QRRequestBody = {
  orderId?: string;
  orderDetails?: string | null;
};

export async function action({ request }: ActionFunctionArgs) {
  try { 
    const {sessionToken } = await authenticate.public.customerAccount(request);
    const body = (await request.json()) as QRRequestBody;
    const token = crypto.randomUUID();
    const url = new URL(request.url);
    const protocol =  request.headers.get("x-forwarded-proto") || url.protocol.replace(":", "");
    const appDomain = `${protocol}://${url.host}`;
    const kycUrl = `${appDomain}/kyc?token=${token}`;
    const qrImage = await QRCode.toDataURL(kycUrl);
    return new Response(
      JSON.stringify({
        success: true,
        qrUrl: qrImage,
        dd:body,
        token,
        redirectUrl: kycUrl,
      }),
      {
        headers: {
          "Content-Type": "application/json",
          ...headers,
        },
      }
    );
  } catch (err: unknown) {
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