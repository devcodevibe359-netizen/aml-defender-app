import '@shopify/ui-extensions/preact';
import {render} from 'preact';
import {useState, useEffect} from 'preact/hooks';
import { QRgenerated } from "./services/QRgenerated";

function Extension() {
  const [qrUrl, setQrUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [content, setContent] = useState<string | null>(null);

                  




  
  useEffect(() => {
    async function fetchQr() {
      try {
        setLoading(true);
        setError(null);
        const token = await shopify.sessionToken.get();
        //const orderId = shopify.orderConfirmation.value?.id ?? null;
        const orderNumber = shopify.orderConfirmation.value?.number ?? null;

        
        const data = await QRgenerated({ token , orderNumber });
        console.log("this data is recvied ", data);
        setQrUrl(data.qrUrl);
        setContent(data); 
      } catch (err) {
        console.error(err);
        setError('Failed to load QR code. Please try again.');
      } finally {
        setLoading(false);
      }
    }
    fetchQr();
  }, []);

  return (
    <s-section heading="Identity Verification Required">
      abcdefgh
      {content && (
        <s-text>
          {content} asdbhabdhbhjs
        </s-text>
      )}

      {/* ── Warning Banner — full width ── */}
      <s-grid gridTemplateColumns="repeat(12, 1fr)" gap="small">
        <s-grid-item gridColumn="span 12">
          <s-banner tone="warning">
            ⚠️ Your order is on hold — complete KYC verification to proceed.
          </s-banner>
        </s-grid-item>
      </s-grid>

      {/* ── Main Two-Column Layout ── */}
      <s-grid gridTemplateColumns="repeat(12, 1fr)" gap="base">

        {/* LEFT — Steps (7 cols) */}
        <s-grid-item gridColumn="span 7" gridRow="span 1">
          <s-section heading="How it works">
            <s-stack gap="small-200">

              <s-paragraph>
                <s-text type="strong">Your order is incomplete.</s-text>
              </s-paragraph>

              <s-paragraph color="subdued">
                Scan the QR code with your mobile phone and complete a quick identity check. Your order ships automatically once approved.
              </s-paragraph>

              <s-divider />

              <s-stack gap="small-100">
                <s-paragraph>
                  📱 <s-text type="strong">Step 1</s-text> — Open your phone camera.
                </s-paragraph>
                <s-paragraph>
                  🔍 <s-text type="strong">Step 2</s-text> — Point it at the QR code.
                </s-paragraph>
                <s-paragraph>
                  🪪 <s-text type="strong">Step 3</s-text> — Upload front &amp; back of your ID.
                </s-paragraph>
                <s-paragraph>
                  🤳 <s-text type="strong">Step 4</s-text> — Take a live selfie.
                </s-paragraph>
                <s-paragraph>
                  ✅ <s-text type="strong">Step 5</s-text> — Done! Your order is fulfilled.
                </s-paragraph>
              </s-stack>

              <s-divider />

              <s-paragraph color="subdued">
                🔒 256-bit encrypted · GDPR compliant · One-time only
              </s-paragraph>

            </s-stack>
          </s-section>
        </s-grid-item>

        {/* RIGHT — QR Code (5 cols) */}
        <s-grid-item gridColumn="span 5" gridRow="span 1">
          <s-section heading="Scan QR Code">
            <s-stack alignItems="center" gap="small-200" paddingBlock="base">

              {loading && (
                <s-spinner accessibilityLabel="Loading QR code" />
              )}
              {error && (
                <s-banner tone="critical">
                  {error}
                </s-banner>
              )}
              {!loading && !error && qrUrl && (
                <>
                  <s-box
                    inlineSize="160px"
                    border="base"
                    borderRadius="base"
                    padding="small"
                  >
                    <s-image
                      src={qrUrl}
                      alt="KYC Verification QR Code"
                      aspectRatio="1/1"
                      objectFit="contain"
                      inlineSize="fill"
                      borderRadius="base"
                    />
                  </s-box>
                  <s-paragraph color="subdued">
                    👆 Point your camera here
                  </s-paragraph>
                  <s-paragraph color="subdued">
                    Verify yourself in under 2 minutes.
                  </s-paragraph>
                </>
              )}
            </s-stack>
          </s-section>
        </s-grid-item>
      </s-grid>
      {/* ── Footer — full width ── */}
      <s-grid gridTemplateColumns="repeat(12, 1fr)" gap="small">
        <s-grid-item gridColumn="span 12">
          <s-paragraph color="subdued">
            Having trouble? Contact our support team for manual verification assistance.
          </s-paragraph>
        </s-grid-item>
      </s-grid>

    </s-section>
  );
}
export default async () => {
  render(<Extension />, document.body);
};