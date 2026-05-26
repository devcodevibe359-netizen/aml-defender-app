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

      <s-section>
        <s-box borderWidth="base" borderRadius="base" overflow="hidden">

          <table
            style={{
              width: "100%",
              borderCollapse: "collapse",
            }}
          >

            <thead style={{ background: "#f6f6f7" }}>
              <tr>
                <th style={thStyle}>Order ID</th>
                <th style={thStyle}>Status</th>
                <th style={thStyle}>Submitted</th>
                <th style={thStyle}>Front ID</th>
                <th style={thStyle}>Back ID</th>
                <th style={thStyle}>Selfie</th>
              </tr>
            </thead>

            <tbody>

              {kycList.length === 0 ? (
                <tr>
                  <td
                    colSpan={6}
                    style={{
                      padding: "40px",
                      textAlign: "center",
                    }}
                  >
                    No KYC submissions
                  </td>
                </tr>
              ) : (
                kycList.map((item) => (
                  <tr key={item.id}>

                    <td style={tdStyle}>
                      {item.orderIdentityId}
                    </td>

                    <td style={tdStyle}>
                      <span style={badgeStyle(item.status)}>
                        {item.status}
                      </span>
                    </td>

                    <td style={tdStyle}>
                      {item.submittedAt
                        ? new Date(
                            item.submittedAt
                          ).toLocaleDateString()
                        : "-"}
                    </td>

                    <td style={tdStyle}>
                      {item.documents?.frontImageUrl && (
                        <img
                          src={item.documents.frontImageUrl}
                          alt="Front"
                          width="80"
                          style={{
                            borderRadius: 8,
                          }}
                        />
                      )}
                    </td>

                    <td style={tdStyle}>
                      {item.documents?.backImageUrl && (
                        <img
                          src={item.documents.backImageUrl}
                          alt="Back"
                          width="80"
                          style={{
                            borderRadius: 8,
                          }}
                        />
                      )}
                    </td>

                    <td style={tdStyle}>
                      {item.documents?.selfieImageUrl && (
                        <img
                          src={item.documents.selfieImageUrl}
                          alt="Selfie"
                          width="80"
                          style={{
                            borderRadius: "50%",
                          }}
                        />
                      )}
                    </td>

                  </tr>
                ))
              )}

            </tbody>
          </table>

        </s-box>
      </s-section>

    </s-page>
  );
}

const thStyle = {
  padding: "12px",
  textAlign: "left",
  borderBottom: "1px solid #ddd",
  fontSize: "13px",
  fontWeight: "600",
};

const tdStyle = {
  padding: "12px",
  borderBottom: "1px solid #f1f1f1",
};

const badgeStyle = (status) => {
  const colors = {
    PENDING: "#fff4e5",
    UNDER_REVIEW: "#e3f1df",
    APPROVED: "#d1fadf",
    REJECTED: "#fdecea",
  };

  return {
    padding: "6px 10px",
    borderRadius: "6px",
    fontSize: "12px",
    background: colors[status] || "#eee",
    fontWeight: "600",
  };
};