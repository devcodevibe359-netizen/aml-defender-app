import Webcam from "react-webcam";
import { useSearchParams } from "react-router";
import { useRef, useState } from "react";
import type { CSSProperties } from "react";

type StepKey = "front" | "back" | "selfie" | "review";

interface StepMeta {
  label: string;
  icon: string;
  title: string;
  hint: string;
  capture: "environment" | "user" | null;
}

interface IdDocument {
  file: File;
  preview: string;
}

const STEPS: StepKey[] = ["front", "back", "selfie", "review"];

const stepMeta: Record<StepKey, StepMeta> = {
  front: {
    label: "Front of ID",
    icon: "🪪",
    title: "Upload Front Side",
    hint: "Place your ID flat, ensure all corners are visible",
    capture: "environment",
  },
  back: {
    label: "Back of ID",
    icon: "🔄",
    title: "Upload Back Side",
    hint: "Flip your ID and capture the back clearly",
    capture: "environment",
  },
  selfie: {
    label: "Live Selfie",
    icon: "🤳",
    title: "Take a Selfie",
    hint: "Look straight at camera in good lighting",
    capture: "user",
  },
  review: {
    label: "Review",
    icon: "✅",
    title: "Review & Submit",
    hint: "Check all documents before submitting",
    capture: null,
  },
};

export default function KycVerification(): JSX.Element {
  const webcamRef = useRef<Webcam>(null);
  const frontInputRef = useRef<HTMLInputElement>(null);
  const backInputRef = useRef<HTMLInputElement>(null);
  const [step, setStep] = useState<number>(0);
  const [frontId, setFrontId] = useState<IdDocument | null>(null);
  const [backId, setBackId] = useState<IdDocument | null>(null);
  const [selfie, setSelfie] = useState<string | null>(null);
  const [selfieMode, setSelfieMode] = useState<boolean>(false);
  const [submitted, setSubmitted] = useState<boolean>(false);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const currentStep: StepKey = STEPS[step];
  
  const handleFileChange = (
    e: React.ChangeEvent<HTMLInputElement>,
    side: "front" | "back"
  ): void => {
    const file = e.target.files?.[0];
    if (!file) return;
    const preview = URL.createObjectURL(file);
    if (side === "front") setFrontId({ file, preview });
    else setBackId({ file, preview });
  };

  const captureSelfie = (): void => {
    const screenshot = webcamRef.current?.getScreenshot();
    if (screenshot) {
      setSelfie(screenshot);
      setSelfieMode(false);
    }
  };

  const handleSubmit = async (): Promise<void> => {
    if (!frontId || !backId || !selfie) return;
    setSubmitting(true);
    await new Promise<void>((r) => setTimeout(r, 2200));
    setSubmitting(false);
    setSubmitted(true);
  };

  const canProceed = (): boolean => {
    if (currentStep === "front") return !!frontId;
    if (currentStep === "back") return !!backId;
    if (currentStep === "selfie") return !!selfie;
    return true;
  };

  if (submitted) {
    return (
      <div style={styles.page}>
        <div style={styles.successCard}>
          <div style={styles.successIcon}>✓</div>
          <h2 style={styles.successTitle}>Verification Submitted</h2>
          <p style={styles.successSub}>
            We're reviewing your documents. You'll be notified within 24 hours.
          </p>
          <div style={styles.successBadge}>Under Review</div>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.page}>
      {/* Header */}
      <div style={styles.header}>
        <div style={styles.headerTop}>
          <span style={styles.logo}>KYC</span>
          <span style={styles.stepCounter}>
            {step + 1} / {STEPS.length}
          </span>
        </div>
        <h1 style={styles.headerTitle}>Identity Verification</h1>
        <p style={styles.headerSub}>Secure · Encrypted · Compliant</p>
      </div>

      {/* Progress Bar */}
      <div style={styles.progressTrack}>
        {STEPS.map((s, i) => (
          <div
            key={s}
            style={{
              flex: 1,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 4,
            }}
          >
            <div
              style={{
                ...styles.progressDot,
                background:
                  i <= step ? "#00d4aa" : "rgba(255,255,255,0.15)",
                transform: i === step ? "scale(1.3)" : "scale(1)",
                boxShadow: i === step ? "0 0 12px #00d4aa" : "none",
              }}
            />
            <span
              style={{
                ...styles.progressLabel,
                color:
                  i <= step ? "#00d4aa" : "rgba(255,255,255,0.3)",
              }}
            >
              {stepMeta[s].label}
            </span>
          </div>
        ))}
        <div style={styles.progressLine}>
          <div
            style={{
              ...styles.progressFill,
              width: `${(step / (STEPS.length - 1)) * 100}%`,
            }}
          />
        </div>
      </div>

      {/* Card */}
      <div style={styles.card}>
        <div style={styles.cardIcon}>{stepMeta[currentStep].icon}</div>
        <h2 style={styles.cardTitle}>{stepMeta[currentStep].title}</h2>
        <p style={styles.cardHint}>{stepMeta[currentStep].hint}</p>

        {/* FRONT / BACK UPLOAD */}
        {(currentStep === "front" || currentStep === "back") && (
          <div>
            <input
              ref={currentStep === "front" ? frontInputRef : backInputRef}
              type="file"
              accept="image/*"
              capture="environment"
              style={{ display: "none" }}
              onChange={(e) => handleFileChange(e, currentStep)}
            />
            {(currentStep === "front" ? frontId : backId) ? (
              <div style={styles.previewBox}>
                <img
                  src={(currentStep === "front" ? frontId : backId)!.preview}
                  alt="ID Preview"
                  style={styles.previewImg}
                />
                <button
                  style={styles.retakeBtn}
                  onClick={() => {
                    if (currentStep === "front") {
                      setFrontId(null);
                      frontInputRef.current?.click();
                    } else {
                      setBackId(null);
                      backInputRef.current?.click();
                    }
                  }}
                >
                  Retake Photo
                </button>
              </div>
            ) : (
              <div
                style={styles.uploadZone}
                onClick={() =>
                  (currentStep === "front"
                    ? frontInputRef
                    : backInputRef
                  ).current?.click()
                }
              >
                <div style={styles.uploadIcon}>📷</div>
                <div style={styles.uploadText}>Tap to open camera</div>
                <div style={styles.uploadSub}>or choose from gallery</div>
              </div>
            )}
          </div>
        )}

        {/* SELFIE */}
        {currentStep === "selfie" && (
          <div>
            {selfie ? (
              <div style={styles.previewBox}>
                <img
                  src={selfie}
                  alt="Selfie"
                  style={{ ...styles.previewImg, borderRadius: "50%" }}
                />
                <button
                  style={styles.retakeBtn}
                  onClick={() => {
                    setSelfie(null);
                    setSelfieMode(true);
                  }}
                >
                  Retake Selfie
                </button>
              </div>
            ) : selfieMode ? (
              <div>
                <div style={styles.webcamWrapper}>
                  <div style={styles.faceGuide} />
                  <Webcam
                    ref={webcamRef}
                    audio={false}
                    screenshotFormat="image/jpeg"
                    videoConstraints={{ facingMode: "user" }}
                    style={{
                      width: "100%",
                      borderRadius: 20,
                      display: "block",
                    }}
                  />
                </div>
                <button style={styles.captureBtn} onClick={captureSelfie}>
                  <span style={styles.captureRing} />
                  Capture
                </button>
              </div>
            ) : (
              <div
                style={styles.uploadZone}
                onClick={() => setSelfieMode(true)}
              >
                <div style={styles.uploadIcon}>🤳</div>
                <div style={styles.uploadText}>Open front camera</div>
                <div style={styles.uploadSub}>
                  Take a live selfie for verification
                </div>
              </div>
            )}
          </div>
        )}

        {/* REVIEW */}
        {currentStep === "review" && (
          <div style={styles.reviewGrid}>
            <div style={styles.reviewItem}>
              <div style={styles.reviewLabel}>🪪 Front ID</div>
              {frontId && (
                <img
                  src={frontId.preview}
                  alt="Front"
                  style={styles.reviewImg}
                />
              )}
            </div>
            <div style={styles.reviewItem}>
              <div style={styles.reviewLabel}>🔄 Back ID</div>
              {backId && (
                <img
                  src={backId.preview}
                  alt="Back"
                  style={styles.reviewImg}
                />
              )}
            </div>
            <div style={{ ...styles.reviewItem, gridColumn: "1 / -1" }}>
              <div style={styles.reviewLabel}>🤳 Selfie</div>
              {selfie && (
                <img
                  src={selfie}
                  alt="Selfie"
                  style={{
                    ...styles.reviewImg,
                    borderRadius: "50%",
                    width: 100,
                    margin: "0 auto",
                    display: "block",
                  }}
                />
              )}
            </div>
          </div>
        )}
      </div>

      {/* Navigation */}
      <div style={styles.navRow}>
        {step > 0 && (
          <button
            style={styles.backBtn}
            onClick={() => setStep((s) => s - 1)}
          >
            ← Back
          </button>
        )}
        {currentStep !== "review" ? (
          <button
            style={{ ...styles.nextBtn, opacity: canProceed() ? 1 : 0.4 }}
            disabled={!canProceed()}
            onClick={() => setStep((s) => s + 1)}
          >
            Continue →
          </button>
        ) : (
          <button
            style={{
              ...styles.nextBtn,
              background: submitting ? "#555" : "#00d4aa",
              color: "#000",
            }}
            onClick={handleSubmit}
            disabled={submitting}
          >
            {submitting ? "Submitting…" : "Submit KYC ✓"}
          </button>
        )}
      </div>

      {/* Security note */}
      <p style={styles.securityNote}>
        🔒 256-bit encrypted · Data never sold · GDPR compliant
      </p>
    </div>
  );
}

const styles: Record<string, CSSProperties> = {
  page: {
    minHeight: "100vh",
    background:
      "linear-gradient(160deg, #0d0d12 0%, #12151f 60%, #0a1628 100%)",
    padding: "0 0 40px",
    fontFamily: "'DM Sans', 'Segoe UI', sans-serif",
    color: "#fff",
    maxWidth: 480,
    margin: "0 auto",
  },
  header: {
    padding: "52px 24px 20px",
  },
  headerTop: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  logo: {
    background: "#00d4aa",
    color: "#000",
    fontWeight: 800,
    fontSize: 13,
    padding: "4px 10px",
    borderRadius: 6,
    letterSpacing: 2,
  },
  stepCounter: {
    fontSize: 13,
    color: "rgba(255,255,255,0.4)",
    fontWeight: 600,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 800,
    margin: "0 0 6px",
    letterSpacing: -0.5,
  },
  headerSub: {
    fontSize: 13,
    color: "rgba(255,255,255,0.35)",
    margin: 0,
    letterSpacing: 1,
  },
  progressTrack: {
    display: "flex",
    alignItems: "flex-start",
    padding: "0 24px 28px",
    position: "relative",
  },
  progressLine: {
    position: "absolute",
    top: 8,
    left: 40,
    right: 40,
    height: 2,
    background: "rgba(255,255,255,0.08)",
    borderRadius: 2,
    zIndex: 0,
  },
  progressFill: {
    height: "100%",
    background: "#00d4aa",
    borderRadius: 2,
    transition: "width 0.4s ease",
  },
  progressDot: {
    width: 16,
    height: 16,
    borderRadius: "50%",
    zIndex: 1,
    transition: "all 0.3s ease",
  },
  progressLabel: {
    fontSize: 10,
    fontWeight: 600,
    letterSpacing: 0.3,
    textAlign: "center",
  },
  card: {
    margin: "0 16px 20px",
    background: "rgba(255,255,255,0.05)",
    border: "1px solid rgba(255,255,255,0.09)",
    borderRadius: 24,
    padding: "28px 20px",
    backdropFilter: "blur(20px)",
  },
  cardIcon: {
    fontSize: 40,
    marginBottom: 12,
    display: "block",
    textAlign: "center",
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: 700,
    textAlign: "center",
    margin: "0 0 8px",
  },
  cardHint: {
    fontSize: 13,
    color: "rgba(255,255,255,0.45)",
    textAlign: "center",
    margin: "0 0 24px",
    lineHeight: 1.5,
  },
  uploadZone: {
    border: "2px dashed rgba(0,212,170,0.35)",
    borderRadius: 16,
    padding: "36px 20px",
    textAlign: "center",
    cursor: "pointer",
    transition: "border-color 0.2s",
    background: "rgba(0,212,170,0.03)",
  },
  uploadIcon: {
    fontSize: 36,
    marginBottom: 10,
  },
  uploadText: {
    fontWeight: 700,
    fontSize: 15,
    marginBottom: 4,
  },
  uploadSub: {
    fontSize: 12,
    color: "rgba(255,255,255,0.35)",
  },
  previewBox: {
    textAlign: "center",
  },
  previewImg: {
    width: "100%",
    borderRadius: 14,
    border: "2px solid rgba(0,212,170,0.4)",
    display: "block",
    marginBottom: 14,
  },
  retakeBtn: {
    background: "rgba(255,255,255,0.08)",
    color: "#fff",
    border: "1px solid rgba(255,255,255,0.15)",
    borderRadius: 10,
    padding: "10px 24px",
    fontSize: 13,
    fontWeight: 600,
    cursor: "pointer",
  },
  webcamWrapper: {
    position: "relative",
    borderRadius: 20,
    overflow: "hidden",
    marginBottom: 16,
    border: "2px solid rgba(0,212,170,0.4)",
  },
  faceGuide: {
    position: "absolute",
    top: "50%",
    left: "50%",
    transform: "translate(-50%, -50%)",
    width: 160,
    height: 200,
    border: "2px dashed rgba(0,212,170,0.6)",
    borderRadius: "50%",
    zIndex: 10,
    pointerEvents: "none",
  },
  captureBtn: {
    width: "100%",
    padding: "16px",
    background: "#00d4aa",
    color: "#000",
    border: "none",
    borderRadius: 14,
    fontSize: 15,
    fontWeight: 800,
    cursor: "pointer",
    letterSpacing: 0.5,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  captureRing: {
    display: "inline-block",
    width: 18,
    height: 18,
    border: "3px solid #000",
    borderRadius: "50%",
  },
  reviewGrid: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: 12,
  },
  reviewItem: {
    background: "rgba(255,255,255,0.04)",
    borderRadius: 14,
    padding: 12,
    border: "1px solid rgba(255,255,255,0.07)",
  },
  reviewLabel: {
    fontSize: 11,
    fontWeight: 700,
    color: "rgba(255,255,255,0.5)",
    letterSpacing: 0.5,
    marginBottom: 10,
    textTransform: "uppercase",
  },
  reviewImg: {
    width: "100%",
    borderRadius: 10,
    display: "block",
  },
  navRow: {
    display: "flex",
    gap: 10,
    padding: "0 16px",
    marginBottom: 16,
  },
  backBtn: {
    flex: 1,
    padding: "16px",
    background: "rgba(255,255,255,0.07)",
    color: "#fff",
    border: "1px solid rgba(255,255,255,0.1)",
    borderRadius: 14,
    fontSize: 15,
    fontWeight: 700,
    cursor: "pointer",
  },
  nextBtn: {
    flex: 2,
    padding: "16px",
    background: "#fff",
    color: "#000",
    border: "none",
    borderRadius: 14,
    fontSize: 15,
    fontWeight: 800,
    cursor: "pointer",
    transition: "opacity 0.2s",
  },
  securityNote: {
    textAlign: "center",
    fontSize: 11,
    color: "rgba(255,255,255,0.25)",
    margin: 0,
    padding: "0 16px",
    letterSpacing: 0.3,
  },
  successCard: {
    margin: "80px 24px 0",
    background: "rgba(0,212,170,0.08)",
    border: "1px solid rgba(0,212,170,0.25)",
    borderRadius: 28,
    padding: "48px 24px",
    textAlign: "center",
  },
  successIcon: {
    width: 72,
    height: 72,
    background: "#00d4aa",
    color: "#000",
    borderRadius: "50%",
    fontSize: 36,
    fontWeight: 900,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    margin: "0 auto 24px",
  },
  successTitle: {
    fontSize: 24,
    fontWeight: 800,
    margin: "0 0 12px",
  },
  successSub: {
    fontSize: 14,
    color: "rgba(255,255,255,0.5)",
    lineHeight: 1.6,
    margin: "0 0 24px",
  },
  successBadge: {
    display: "inline-block",
    background: "rgba(255,200,0,0.12)",
    color: "#ffc800",
    border: "1px solid rgba(255,200,0,0.3)",
    padding: "8px 20px",
    borderRadius: 30,
    fontSize: 13,
    fontWeight: 700,
    letterSpacing: 0.5,
  },
};