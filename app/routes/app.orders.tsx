import { useLoaderData } from "react-router";
import { authenticate } from "../shopify.server";
import prisma from "../db.server";

export const loader = async ({ request }) => {
  await authenticate.admin(request);

  const kycList = await prisma.kycVerification.findMany({
    include: {
      documents: true,
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  return {
    kycList,
  };
};

export default function KycDashboard() {
  const { kycList } = useLoaderData();

  return (
    <s-page heading="KYC Verifications">

      {/* Primary Action */}
      <s-button
        slot="primary-action"
        variant="primary"
      >
        Create Verification
      </s-button>

      {/* Secondary Actions */}
      <s-button
        slot="secondary-actions"
        variant="secondary"
      >
        Export CSV
      </s-button>

      <s-button
        slot="secondary-actions"
        variant="secondary"
      >
        Sync Orders
      </s-button>

      {/* ========================= */}
      {/* Empty State */}
      {/* ========================= */}

      {kycList.length === 0 ? (

        <s-section accessibilityLabel="Empty state section">

          <s-grid
            gap="base"
            justifyItems="center"
            paddingBlock="large-400"
          >

            <s-box
              maxInlineSize="200px"
              maxBlockSize="200px"
            >
              <s-image
                aspectRatio="1/0.5"
                src="https://cdn.shopify.com/static/images/polaris/patterns/callout.png"
                alt="KYC empty state illustration"
              />
            </s-box>

            <s-grid
              justifyItems="center"
              maxInlineSize="450px"
              gap="base"
            >

              <s-stack alignItems="center">

                <s-heading>
                  No KYC submissions yet
                </s-heading>

                <s-paragraph>
                  Start collecting customer identity
                  verifications for Shopify orders.
                </s-paragraph>

              </s-stack>

              {/* ✅ Fix: Removed wrong slot attrs from buttons inside s-button-group */}
              <s-button-group>

                <s-button>
                  Learn More
                </s-button>

                <s-button variant="primary">
                  Create Verification
                </s-button>

              </s-button-group>

            </s-grid>

          </s-grid>

        </s-section>

      ) : (

        <>
          {/* ========================= */}
          {/* Table */}
          {/* ========================= */}

          <s-section
            padding="none"
            accessibilityLabel="KYC table section"
          >

            <s-table>

              <s-table-header-row>

                {/* ✅ Fix: Added listSlot to all headers for mobile list layout */}
                <s-table-header listSlot="primary">
                  Order ID
                </s-table-header>

                <s-table-header listSlot="inline">
                  Status
                </s-table-header>

                <s-table-header listSlot="labeled">
                  Submitted
                </s-table-header>

                <s-table-header listSlot="labeled">
                  Front ID
                </s-table-header>

                <s-table-header listSlot="labeled">
                  Back ID
                </s-table-header>

                <s-table-header listSlot="labeled">
                  Selfie
                </s-table-header>

              </s-table-header-row>

              <s-table-body>

                {kycList.map((item) => (

                  <s-table-row key={item.id}>

                    {/* Order ID */}
                    <s-table-cell>
                      {item.orderIdentityId}
                    </s-table-cell>

                    {/* Status */}
                    {/* ✅ Fix: Removed invalid color="base" prop from s-badge */}
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
                        ? new Date(
                            item.submittedAt
                          ).toLocaleDateString()
                        : "-"}
                    </s-table-cell>

                    {/* Front ID */}
                    <s-table-cell>

                      {item.documents?.frontImageUrl && (

                        <s-clickable
                          href={item.documents.frontImageUrl}
                          target="_blank"
                          border="base"
                          borderRadius="base"
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

                      )}

                    </s-table-cell>

                    {/* Back ID */}
                    <s-table-cell>

                      {item.documents?.backImageUrl && (

                        <s-clickable
                          href={item.documents.backImageUrl}
                          target="_blank"
                          border="base"
                          borderRadius="base"
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

                      )}

                    </s-table-cell>

                    {/* Selfie */}
                    <s-table-cell>

                      {item.documents?.selfieImageUrl && (

                        <s-clickable
                          href={item.documents.selfieImageUrl}
                          target="_blank"
                          border="base"
                          borderRadius="full"
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

                      )}

                    </s-table-cell>

                  </s-table-row>

                ))}

              </s-table-body>

            </s-table>

          </s-section>

          {/* Footer Help */}

          <s-stack
            alignItems="center"
            paddingBlock="large"
          >

            <s-text>

              Learn more about{" "}

              <s-link
                href="https://help.shopify.com"
                target="_blank"
              >
                identity sdsd  verification
              </s-link>

            </s-text>

          </s-stack>

        </>

      )}

    </s-page>
  );
}