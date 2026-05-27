import { useLoaderData } from "react-router";
import { authenticate } from "../shopify.server";
import prisma from "../db.server";

// Helper to fetch order details for the KYC records
async function fetchOrderDetails(admin, kycList) {
  const orderIds = kycList
    .map((k) => k.orderIdentityId)
    .filter((id) => typeof id === "string" && id.startsWith("gid://"));

  if (orderIds.length === 0) return {};

  const response = await admin.graphql(
    `#graphql
    query KycOrders($ids: [ID!]!) {
      nodes(ids: $ids) {
        ... on Order {
          id
          name
          customer {
            displayName
            email
          }
          currentTotalPriceSet {
            shopMoney {
              amount
              currencyCode
            }
          }
        }
      }
    }
  `,
    {
      variables: { ids: orderIds },
    }
  );

  const json = await response.json();
  const nodes = json?.data?.nodes || [];

  const byId: Record<string, any> = {};
  for (const node of nodes) {
    if (!node || !node.id) continue;
    byId[node.id] = {
      name: node.name,
      customerName: node.customer?.displayName || "Unknown customer",
      customerEmail: node.customer?.email || "",
      totalAmount: node.currentTotalPriceSet?.shopMoney?.amount || null,
      currencyCode: node.currentTotalPriceSet?.shopMoney?.currencyCode || null,
    };
  }

  return byId;
}

export const loader = async ({ request }) => {
  const { admin } = await authenticate.admin(request);

  const kycList = await prisma.kycVerification.findMany({
    include: {
      documents: true, // make sure documents is either a single object or adjust if it's an array
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  const ordersById = await fetchOrderDetails(admin, kycList);

  return {
    kycList,
    ordersById,
  };
};

export default function KycDashboard() {
  const { kycList, ordersById } = useLoaderData();

  return (
    <s-page heading="KYC verifications">
      {kycList.length === 0 ? (
        // Empty state composition
        <s-section accessibilityLabel="KYC empty state">
          <s-grid gap="base" justifyItems="center" paddingBlock="large-400">
            <s-box maxInlineSize="200px" maxBlockSize="200px">
              <s-image
                aspectRatio="1/0.5"
                src="https://cdn.shopify.com/static/images/polaris/patterns/callout.png"
                alt="KYC empty state illustration"
              />
            </s-box>

            <s-grid justifyItems="center" maxInlineSize="450px" gap="base">
              <s-stack alignItems="center" gap="small-200">
                <s-heading>No KYC submissions yet</s-heading>
                <s-paragraph>
                  Start collecting customer identity verifications for Shopify
                  orders.
                </s-paragraph>
              </s-stack>

              <s-button-group>
                <s-button href="https://help.shopify.com" target="_blank">
                  Learn more
                </s-button>
                <s-button variant="primary" href="/app/kyc/new">
                  Create verification
                </s-button>
              </s-button-group>
            </s-grid>
          </s-grid>
        </s-section>
      ) : (
        <>
          {/* Index table-style composition */}
          <s-section padding="none" accessibilityLabel="KYC table section">
            <s-table variant="auto">
              <s-table-header-row>
                <s-table-header listSlot="primary">Order</s-table-header>
                <s-table-header listSlot="inline">Status</s-table-header>
                <s-table-header listSlot="labeled">Customer</s-table-header>
                <s-table-header listSlot="labeled">Total</s-table-header>
                <s-table-header listSlot="labeled">Submitted</s-table-header>
                <s-table-header listSlot="labeled">Front ID</s-table-header>
                <s-table-header listSlot="labeled">Back ID</s-table-header>
                <s-table-header listSlot="labeled">Selfie</s-table-header>
              </s-table-header-row>

              <s-table-body>
                {kycList.map((item) => {
                  const order = item.orderIdentityId
                    ? ordersById?.[item.orderIdentityId]
                    : null;

                  // Your app’s internal KYC detail page
                  const detailPath = `/app/kyc/${item.id}`;

                  return (
                    <s-table-row
                      key={item.id}
                      clickDelegate={`kyc-row-link-${item.id}`}
                    >
                      {/* Order + internal details link */}
                      <s-table-cell>
                        <s-link id={`kyc-row-link-${item.id}`} href={detailPath}>
                          {order?.name || item.orderIdentityId || "Unknown order"}
                        </s-link>
                      </s-table-cell>

                      {/* Status */}
                      <s-table-cell>
                        <s-badge
                          tone={
                            item.status === "APPROVED"
                              ? "success"
                              : item.status === "REJECTED"
                              ? "critical"
                              : item.status === "UNDER_REVIEW"
                              ? "warning"
                              : "info"
                          }
                        >
                          {item.status}
                        </s-badge>
                      </s-table-cell>

                      {/* Customer */}
                      <s-table-cell>
                        <s-text type="strong">
                          {order?.customerName || "Unknown customer"}
                        </s-text>
                        {order?.customerEmail && (
                          <s-text accessibilityVisibility="exclusive">
                            {order.customerEmail}
                          </s-text>
                        )}
                      </s-table-cell>

                      {/* Total */}
                      <s-table-cell>
                        {order?.totalAmount ? (
                          <s-text>
                            {order.totalAmount} {order.currencyCode}
                          </s-text>
                        ) : (
                          <s-text color="subdued">—</s-text>
                        )}
                      </s-table-cell>

                      {/* Submitted */}
                      <s-table-cell>
                        {item.submittedAt ? (
                          new Date(item.submittedAt).toLocaleDateString()
                        ) : (
                          <s-text color="subdued">Not submitted</s-text>
                        )}
                      </s-table-cell>

                      {/* Front ID */}
                      <s-table-cell>
                        {item.documents?.frontImageUrl ? (
                          <s-clickable
                            href={item.documents.frontImageUrl}
                            target="_blank"
                            border="base"
                            borderRadius="large-100"
                            overflow="hidden"
                            inlineSize="80px"
                            blockSize="80px"
                          >
                            <s-image
                              objectFit="cover"
                              alt="Front ID"
                              src={item.documents.frontImageUrl}
                            />
                          </s-clickable>
                        ) : (
                          <s-text color="subdued">Not uploaded</s-text>
                        )}
                      </s-table-cell>

                      {/* Back ID */}
                      <s-table-cell>
                        {item.documents?.backImageUrl ? (
                          <s-clickable
                            href={item.documents.backImageUrl}
                            target="_blank"
                            border="base"
                            borderRadius="large-100"
                            overflow="hidden"
                            inlineSize="80px"
                            blockSize="80px"
                          >
                            <s-image
                              objectFit="cover"
                              alt="Back ID"
                              src={item.documents.backImageUrl}
                            />
                          </s-clickable>
                        ) : (
                          <s-text color="subdued">Not uploaded</s-text>
                        )}
                      </s-table-cell>

                      {/* Selfie */}
                      <s-table-cell>
                        {item.documents?.selfieImageUrl ? (
                          <s-clickable
                            href={item.documents.selfieImageUrl}
                            target="_blank"
                            border="base"
                            borderRadius="large-100"
                            overflow="hidden"
                            inlineSize="80px"
                            blockSize="80px"
                          >
                            <s-image
                              objectFit="cover"
                              alt="Selfie"
                              src={item.documents.selfieImageUrl}
                            />
                          </s-clickable>
                        ) : (
                          <s-text color="subdued">Not uploaded</s-text>
                        )}
                      </s-table-cell>
                    </s-table-row>
                  );
                })}
              </s-table-body>
            </s-table>
          </s-section>

          {/* Footer help composition */}
          <s-stack alignItems="center" paddingBlock="large">
            <s-text>
              Learn more about{" "}
              <s-link href="https://help.shopify.com" target="_blank">
                identity verification
              </s-link>
            </s-text>
          </s-stack>
        </>
      )}
    </s-page>
  );
}