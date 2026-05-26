import { useLoaderData, useNavigate } from "react-router";
import { authenticate } from "../shopify.server";
import prisma from "../db.server";

export const loader = async ({ request }) => {
  const { admin } = await authenticate.admin(request);

  // 1. Fetch all KYC records from DB
  const kycList = await prisma.kycVerification.findMany({
    include: { documents: true },
    orderBy: { createdAt: "desc" },
  });

  if (kycList.length === 0) {
    return { kycList: [] };
  }

  // 2. For each KYC record, query OrderIdentity node to get actual Order data
  // orderIdentityId = "gid://shopify/OrderIdentity/6992651419901"
  // We use nodes() query with OrderIdentity GIDs and spread on OrderIdentity type
  const orderIdentityGids = kycList.map((item) => item.orderIdentityId);

  const query = `
    query getOrdersByIdentity($ids: [ID!]!) {
      nodes(ids: $ids) {
        ... on OrderIdentity {
          id
          order {
            id
            name
            createdAt
            displayFinancialStatus
            displayFulfillmentStatus
            totalPriceSet {
              shopMoney { amount currencyCode }
            }
            customer {
              displayName
              email
              phone
            }
            lineItems(first: 3) {
              edges {
                node {
                  title
                  quantity
                }
              }
            }
          }
        }
      }
    }
  `;

  // Map: orderIdentityGid => shopifyOrder
  let orderMap = {};

  try {
    const response = await admin.graphql(query, {
      variables: { ids: orderIdentityGids },
    });
    const data = await response.json();
    const nodes = data?.data?.nodes || [];

    nodes.forEach((node) => {
      if (node?.id && node?.order) {
        orderMap[node.id] = node.order;
      }
    });
  } catch (err) {
    console.error("Shopify API error:", err);
  }

  // 3. Merge KYC + Shopify order data
  const enrichedList = kycList.map((item) => ({
    ...item,
    shopifyOrder: orderMap[item.orderIdentityId] || null,
  }));

  return { kycList: enrichedList };
};

export default function KycDashboard() {
  const { kycList } = useLoaderData();
  const navigate = useNavigate();

  return (
    <s-page heading="KYC Verifications">

      <s-button slot="primary-action" variant="primary">
        Create Verification
      </s-button>
      <s-button slot="secondary-actions" variant="secondary">
        Export CSV
      </s-button>
      <s-button slot="secondary-actions" variant="secondary">
        Sync Orders
      </s-button>

      {/* ========================= */}
      {/* Empty State               */}
      {/* ========================= */}

      {kycList.length === 0 ? (

        <s-section accessibilityLabel="Empty state section">
          <s-grid gap="base" justifyItems="center" paddingBlock="large-400">
            <s-box maxInlineSize="200px" maxBlockSize="200px">
              <s-image
                aspectRatio="1/0.5"
                src="https://cdn.shopify.com/static/images/polaris/patterns/callout.png"
                alt="KYC empty state illustration"
              />
            </s-box>
            <s-grid justifyItems="center" maxInlineSize="450px" gap="base">
              <s-stack alignItems="center">
                <s-heading>No KYC submissions yet</s-heading>
                <s-paragraph>
                  Start collecting customer identity verifications for Shopify orders.
                </s-paragraph>
              </s-stack>
              <s-button-group>
                <s-button>Learn More</s-button>
                <s-button variant="primary">Create Verification</s-button>
              </s-button-group>
            </s-grid>
          </s-grid>
        </s-section>

      ) : (

        <>
          <s-section padding="none" accessibilityLabel="KYC table section">
            <s-table>

              <s-table-header-row>
                <s-table-header listSlot="primary">Order</s-table-header>
                <s-table-header listSlot="secondary">Customer</s-table-header>
                <s-table-header listSlot="labeled">Email</s-table-header>
                <s-table-header listSlot="labeled">Total</s-table-header>
                <s-table-header listSlot="labeled">Items</s-table-header>
                <s-table-header listSlot="inline">KYC Status</s-table-header>
                <s-table-header listSlot="labeled">Submitted</s-table-header>
              </s-table-header-row>

              <s-table-body>
                {kycList.map((item) => {
                  const order = item.shopifyOrder;

                  const lineItems = order?.lineItems?.edges
                    ?.map((e) => `${e.node.title} ×${e.node.quantity}`)
                    .join(", ") || "-";

                  const total = order?.totalPriceSet?.shopMoney
                    ? `${order.totalPriceSet.shopMoney.currencyCode} ${parseFloat(
                        order.totalPriceSet.shopMoney.amount
                      ).toFixed(2)}`
                    : "-";

                  return (
                    <s-table-row
                      key={item.id}
                      clickDelegate={`order-link-${item.id}`}
                    >
                      {/* Order Name */}
                      <s-table-cell>
                        <s-link
                          id={`order-link-${item.id}`}
                          onClick={() => navigate(`/app/orders/${item.id}`)}
                        >
                          {order?.name || item.orderIdentityId.split("/").pop()}
                        </s-link>
                      </s-table-cell>

                      {/* Customer */}
                      <s-table-cell>
                        {order?.customer?.displayName || "-"}
                      </s-table-cell>

                      {/* Email */}
                      <s-table-cell>
                        {order?.customer?.email || "-"}
                      </s-table-cell>

                      {/* Total */}
                      <s-table-cell>{total}</s-table-cell>

                      {/* Items */}
                      <s-table-cell>{lineItems}</s-table-cell>

                      {/* KYC Status */}
                      <s-table-cell>
                        <s-badge
                          tone={
                            item.status === "APPROVED"
                              ? "success"
                              : item.status === "REJECTED"
                              ? "critical"
                              : item.status === "UNDER_REVIEW"
                              ? "warning"
                              : "neutral"
                          }
                        >
                          {item.status}
                        </s-badge>
                      </s-table-cell>

                      {/* Submitted */}
                      <s-table-cell>
                        {item.submittedAt
                          ? new Date(item.submittedAt).toLocaleDateString()
                          : "-"}
                      </s-table-cell>

                    </s-table-row>
                  );
                })}
              </s-table-body>

            </s-table>
          </s-section>

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
