import { useLoaderData, useNavigate } from "react-router";
import { authenticate } from "../shopify.server";
import prisma from "../db.server";

// Extract numeric ID from GID
function extractNumericId(gid = "") {
  const parts = gid.split("/");
  return parts[parts.length - 1];
}

export const loader = async ({ request, params }) => {
  const { admin } = await authenticate.admin(request);
  const { id } = params; // This is the KYC DB record id

  // 1. Fetch KYC record from DB
  const kyc = await prisma.kycVerification.findUnique({
    where: { id },
    include: { documents: true },
  });

  if (!kyc) {
    throw new Response("KYC record not found", { status: 404 });
  }

  // 2. Build Shopify Order GID from orderIdentityId
  const numericId = extractNumericId(kyc.orderIdentityId);
  const orderGid = `gid://shopify/Order/${numericId}`;

  // 3. Fetch full order details from Shopify
  const query = `
    query getOrder($id: ID!) {
      order(id: $id) {
        id
        name
        createdAt
        displayFinancialStatus
        displayFulfillmentStatus
        note
        tags
        totalPriceSet {
          shopMoney { amount currencyCode }
        }
        subtotalPriceSet {
          shopMoney { amount currencyCode }
        }
        totalTaxSet {
          shopMoney { amount currencyCode }
        }
        totalShippingPriceSet {
          shopMoney { amount currencyCode }
        }
        customer {
          displayName
          email
          phone
          defaultAddress {
            address1
            address2
            city
            province
            country
            zip
          }
        }
        lineItems(first: 10) {
          edges {
            node {
              title
              quantity
              originalUnitPriceSet {
                shopMoney { amount currencyCode }
              }
              variant {
                sku
                image { url }
              }
            }
          }
        }
      }
    }
  `;

  let shopifyOrder = null;
  try {
    const response = await admin.graphql(query, {
      variables: { id: orderGid },
    });
    const data = await response.json();
    shopifyOrder = data?.data?.order || null;
  } catch (err) {
    console.error("Shopify API error:", err);
  }

  return { kyc, shopifyOrder };
};

export const action = async ({ request, params }) => {
  await authenticate.admin(request);
  const { id } = params;
  const formData = await request.formData();
  const newStatus = formData.get("status");

  await prisma.kycVerification.update({
    where: { id },
    data: { status: newStatus },
  });

  return { success: true };
};

export default function KycOrderDetail() {
  const { kyc, shopifyOrder } = useLoaderData();
  const navigate = useNavigate();

  const order = shopifyOrder;
  const docs = kyc.documents;

  const formatMoney = (moneySet) => {
    if (!moneySet?.shopMoney) return "-";
    return `${moneySet.shopMoney.currencyCode} ${parseFloat(moneySet.shopMoney.amount).toFixed(2)}`;
  };

  const address = order?.customer?.defaultAddress;
  const fullAddress = address
    ? [address.address1, address.address2, address.city, address.province, address.zip, address.country]
        .filter(Boolean)
        .join(", ")
    : "-";

  return (
    <s-page heading={order?.name ? `KYC — ${order.name}` : "KYC Details"}>

      {/* Breadcrumb */}
      <s-link slot="breadcrumb-actions" onClick={() => navigate("/app/orders")}>
        KYC Verifications
      </s-link>

      {/* Action Buttons */}
      <s-button
        slot="primary-action"
        variant="primary"
        onClick={async () => {
          const form = new FormData();
          form.append("status", "APPROVED");
          await fetch(window.location.pathname, { method: "POST", body: form });
          navigate("/app/orders");
        }}
        disabled={kyc.status === "APPROVED"}
      >
        Approve
      </s-button>

      <s-button
        slot="secondary-actions"
        tone="critical"
        onClick={async () => {
          const form = new FormData();
          form.append("status", "REJECTED");
          await fetch(window.location.pathname, { method: "POST", body: form });
          navigate("/app/orders");
        }}
        disabled={kyc.status === "REJECTED"}
      >
        Reject
      </s-button>

      <s-button
        slot="secondary-actions"
        onClick={async () => {
          const form = new FormData();
          form.append("status", "UNDER_REVIEW");
          await fetch(window.location.pathname, { method: "POST", body: form });
          navigate("/app/orders");
        }}
        disabled={kyc.status === "UNDER_REVIEW"}
      >
        Mark Under Review
      </s-button>

      {/* ========================= */}
      {/* KYC Status Banner         */}
      {/* ========================= */}

      <s-section accessibilityLabel="KYC status section">
        <s-stack direction="inline" alignItems="center" gap="base">
          <s-text>KYC Status:</s-text>
          <s-badge
            tone={
              kyc.status === "APPROVED"
                ? "success"
                : kyc.status === "REJECTED"
                ? "critical"
                : kyc.status === "UNDER_REVIEW"
                ? "warning"
                : "neutral"
            }
          >
            {kyc.status}
          </s-badge>
          {kyc.submittedAt && (
            <s-text>
              Submitted: {new Date(kyc.submittedAt).toLocaleString()}
            </s-text>
          )}
        </s-stack>
      </s-section>

      {/* ========================= */}
      {/* Order Details             */}
      {/* ========================= */}

      {order && (
        <s-section heading="Order Details" accessibilityLabel="Order details section">

          <s-grid columns="2" gap="base">

            {/* Left: Customer Info */}
            <s-section heading="Customer" accessibilityLabel="Customer info">
              <s-stack gap="base">
                <s-stack direction="inline" gap="base">
                  <s-text type="strong">Name:</s-text>
                  <s-text>{order.customer?.displayName || "-"}</s-text>
                </s-stack>
                <s-stack direction="inline" gap="base">
                  <s-text type="strong">Email:</s-text>
                  <s-text>{order.customer?.email || "-"}</s-text>
                </s-stack>
                <s-stack direction="inline" gap="base">
                  <s-text type="strong">Phone:</s-text>
                  <s-text>{order.customer?.phone || "-"}</s-text>
                </s-stack>
                <s-stack direction="inline" gap="base">
                  <s-text type="strong">Address:</s-text>
                  <s-text>{fullAddress}</s-text>
                </s-stack>
              </s-stack>
            </s-section>

            {/* Right: Order Summary */}
            <s-section heading="Order Summary" accessibilityLabel="Order summary">
              <s-stack gap="base">
                <s-stack direction="inline" gap="base">
                  <s-text type="strong">Order:</s-text>
                  <s-text>{order.name}</s-text>
                </s-stack>
                <s-stack direction="inline" gap="base">
                  <s-text type="strong">Date:</s-text>
                  <s-text>{new Date(order.createdAt).toLocaleString()}</s-text>
                </s-stack>
                <s-stack direction="inline" gap="base">
                  <s-text type="strong">Payment:</s-text>
                  <s-badge
                    tone={order.displayFinancialStatus === "PAID" ? "success" : "warning"}
                  >
                    {order.displayFinancialStatus}
                  </s-badge>
                </s-stack>
                <s-stack direction="inline" gap="base">
                  <s-text type="strong">Fulfillment:</s-text>
                  <s-badge tone="neutral">{order.displayFulfillmentStatus}</s-badge>
                </s-stack>
                <s-stack direction="inline" gap="base">
                  <s-text type="strong">Total:</s-text>
                  <s-text type="strong">{formatMoney(order.totalPriceSet)}</s-text>
                </s-stack>
              </s-stack>
            </s-section>

          </s-grid>

        </s-section>
      )}

      {/* ========================= */}
      {/* Line Items Table          */}
      {/* ========================= */}

      {order?.lineItems?.edges?.length > 0 && (
        <s-section
          padding="none"
          heading="Items Ordered"
          accessibilityLabel="Line items section"
        >
          <s-table>
            <s-table-header-row>
              <s-table-header listSlot="primary">Product</s-table-header>
              <s-table-header listSlot="labeled">SKU</s-table-header>
              <s-table-header listSlot="labeled">Qty</s-table-header>
              <s-table-header listSlot="labeled">Unit Price</s-table-header>
            </s-table-header-row>

            <s-table-body>
              {order.lineItems.edges.map((edge, i) => {
                const item = edge.node;
                return (
                  <s-table-row key={i}>
                    <s-table-cell>{item.title}</s-table-cell>
                    <s-table-cell>{item.variant?.sku || "-"}</s-table-cell>
                    <s-table-cell>{item.quantity}</s-table-cell>
                    <s-table-cell>
                      {formatMoney(item.originalUnitPriceSet)}
                    </s-table-cell>
                  </s-table-row>
                );
              })}
            </s-table-body>
          </s-table>

          {/* Price breakdown */}
          <s-stack
            direction="block"
            gap="base"
            padding="base"
            alignItems="end"
          >
            <s-stack direction="inline" justifyContent="space-between" gap="large">
              <s-text>Subtotal</s-text>
              <s-text>{formatMoney(order.subtotalPriceSet)}</s-text>
            </s-stack>
            <s-stack direction="inline" justifyContent="space-between" gap="large">
              <s-text>Shipping</s-text>
              <s-text>{formatMoney(order.totalShippingPriceSet)}</s-text>
            </s-stack>
            <s-stack direction="inline" justifyContent="space-between" gap="large">
              <s-text>Tax</s-text>
              <s-text>{formatMoney(order.totalTaxSet)}</s-text>
            </s-stack>
            <s-stack direction="inline" justifyContent="space-between" gap="large">
              <s-text type="strong">Total</s-text>
              <s-text type="strong">{formatMoney(order.totalPriceSet)}</s-text>
            </s-stack>
          </s-stack>

        </s-section>
      )}

      {/* ========================= */}
      {/* KYC Documents             */}
      {/* ========================= */}

      <s-section heading="KYC Documents" accessibilityLabel="KYC documents section">

        {docs ? (
          <s-grid columns="3" gap="base">

            {/* Front ID */}
            <s-section heading="Front ID" accessibilityLabel="Front ID document">
              {docs.frontImageUrl ? (
                <s-clickable
                  href={docs.frontImageUrl}
                  target="_blank"
                  border="base"
                  borderRadius="base"
                  overflow="hidden"
                  blockSize="200px"
                >
                  <s-image
                    objectFit="cover"
                    alt="Front ID"
                    src={docs.frontImageUrl}
                  />
                </s-clickable>
              ) : (
                <s-text>Not uploaded</s-text>
              )}
            </s-section>

            {/* Back ID */}
            <s-section heading="Back ID" accessibilityLabel="Back ID document">
              {docs.backImageUrl ? (
                <s-clickable
                  href={docs.backImageUrl}
                  target="_blank"
                  border="base"
                  borderRadius="base"
                  overflow="hidden"
                  blockSize="200px"
                >
                  <s-image
                    objectFit="cover"
                    alt="Back ID"
                    src={docs.backImageUrl}
                  />
                </s-clickable>
              ) : (
                <s-text>Not uploaded</s-text>
              )}
            </s-section>

            {/* Selfie */}
            <s-section heading="Selfie" accessibilityLabel="Selfie document">
              {docs.selfieImageUrl ? (
                <s-clickable
                  href={docs.selfieImageUrl}
                  target="_blank"
                  border="base"
                  borderRadius="full"
                  overflow="hidden"
                  blockSize="200px"
                >
                  <s-image
                    objectFit="cover"
                    alt="Selfie"
                    src={docs.selfieImageUrl}
                  />
                </s-clickable>
              ) : (
                <s-text>Not uploaded</s-text>
              )}
            </s-section>

          </s-grid>
        ) : (
          <s-text>No documents uploaded yet.</s-text>
        )}

      </s-section>

    </s-page>
  );
}
