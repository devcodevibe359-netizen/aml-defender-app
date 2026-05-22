import Webcam from "react-webcam";
import { useRef, useState } from "react";

// ─── Types ────────────────────────────────────────────────────────────────────

type StepKey = "front" | "back" | "selfie" | "review";

interface StepMeta {
  label: string;
  icon: string;
  title: string;
  hint: string;
}

interface IdDocument {
  file: File;
  preview: string;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const STEPS: StepKey[] = ["front", "back", "selfie", "review"];

const STEP_META: Record<StepKey, StepMeta> = {
  front: {
    label: "Front of ID",
    icon: "🪪",
    title: "Upload Front Side",
    hint: "Place your ID flat, ensure all corners are visible",
  },
  back: {
    label: "Back of ID",
    icon: "🔄",
    title: "Upload Back Side",
    hint: "Flip your ID and capture the back clearly",
  },
  selfie: {
    label: "Live Selfie",
    icon: "🤳",
    title: "Take a Selfie",
    hint: "Look straight at camera in good lighting",
  },
  review: {
    label: "Review",
    icon: "✅",
    title: "Review & Submit",
    hint: "Check all documents before submitting",
  },
};

// ─── Sub-components ───────────────────────────────────────────────────────────

/** Reusable "tap to upload" zone */
function UploadZone({ icon, text, sub, onClick }: {
  icon: string;
  text: string;
  sub: string;
  onClick: () => void;
}) {
  return (
    <div
      onClick={onClick}
      className="border-2 border-dashed border-teal-500/30 rounded-2xl p-9 text-center cursor-pointer bg-teal-500/5 hover:border-teal-400/60 transition-colors"
    >
      <div className="text-4xl mb-2">{icon}</div>
      <p className="font-bold text-base mb-1">{text}</p>
      <p className="text-xs text-white/35">{sub}</p>
    </div>
  );
}

/** Preview an already-captured image with a retake button */
function ImagePreview({ src, alt, round, onRetake }: {
  src: string;
  alt: string;
  round?: boolean;
  onRetake: () => void;
}) {
  return (
    <div className="text-center">
      <img
        src={src}
        alt={alt}
        className={`w-full border-2 border-teal-400/40 mb-3 block ${round ? "rounded-full" : "rounded-2xl"}`}
      />
      <button
        onClick={onRetake}
        className="bg-white/8 text-white border border-white/15 rounded-xl px-6 py-2.5 text-sm font-semibold cursor-pointer hover:bg-white/15 transition-colors"
      >
        Retake Photo
      </button>
    </div>
  );
}

// ─── Step Views ───────────────────────────────────────────────────────────────

/** Front or back ID upload step */
function IdUploadStep({ side, doc, onCapture }: {
  side: "front" | "back";
  doc: IdDocument | null;
  onCapture: (file: File) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) onCapture(file);
  };

  if (doc) {
    return (
      <ImagePreview
        src={doc.preview}
        alt="ID Preview"
        onRetake={() => inputRef.current?.click()}
      />
    );
  }

  return (
    <>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={handleChange}
      />
      <UploadZone
        icon="📷"
        text="Tap to open camera"
        sub="or choose from gallery"
        onClick={() => inputRef.current?.click()}
      />
    </>
  );
}

/** Selfie capture step */
function SelfieStep({ selfie, onCapture }: {
  selfie: string | null;
  onCapture: (dataUrl: string) => void;
}) {
  const webcamRef = useRef<Webcam>(null);
  const [cameraOpen, setCameraOpen] = useState(false);

  const capture = () => {
    const screenshot = webcamRef.current?.getScreenshot();
    if (screenshot) {
      onCapture(screenshot);
      setCameraOpen(false);
    }
  };

  if (selfie) {
    return (
      <ImagePreview
        src={selfie}
        alt="Selfie"
        round
        onRetake={() => setCameraOpen(true)}
      />
    );
  }

  if (cameraOpen) {
    return (
      <div>
        {/* Webcam with face guide overlay */}
        <div className="relative rounded-2xl overflow-hidden mb-4 border-2 border-teal-400/40">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-40 h-48 border-2 border-dashed border-teal-400/60 rounded-full z-10 pointer-events-none" />
          <Webcam
            ref={webcamRef}
            audio={false}
            screenshotFormat="image/jpeg"
            videoConstraints={{ facingMode: "user" }}
            className="w-full block rounded-2xl"
          />
        </div>
        <button
          onClick={capture}
          className="w-full py-4 bg-teal-400 text-black rounded-2xl text-base font-extrabold cursor-pointer flex items-center justify-center gap-2 hover:bg-teal-300 transition-colors"
        >
          <span className="inline-block w-4 h-4 border-3 border-black rounded-full" />
          Capture
        </button>
      </div>
    );
  }

  return (
    <UploadZone
      icon="🤳"
      text="Open front camera"
      sub="Take a live selfie for verification"
      onClick={() => setCameraOpen(true)}
    />
  );
}

/** Review step — shows thumbnails of all uploaded docs */
function ReviewStep({ frontId, backId, selfie }: {
  frontId: IdDocument | null;
  backId: IdDocument | null;
  selfie: string | null;
}) {
  return (
    <div className="grid grid-cols-2 gap-3">
      {/* Front ID */}
      <div className="bg-white/4 rounded-2xl p-3 border border-white/7">
        <p className="text-xs font-bold text-white/50 uppercase tracking-wide mb-2">🪪 Front ID</p>
        {frontId && <img src={frontId.preview} alt="Front" className="w-full rounded-xl block" />}
      </div>

      {/* Back ID */}
      <div className="bg-white/4 rounded-2xl p-3 border border-white/7">
        <p className="text-xs font-bold text-white/50 uppercase tracking-wide mb-2">🔄 Back ID</p>
        {backId && <img src={backId.preview} alt="Back" className="w-full rounded-xl block" />}
      </div>

      {/* Selfie – full width */}
      <div className="col-span-2 bg-white/4 rounded-2xl p-3 border border-white/7">
        <p className="text-xs font-bold text-white/50 uppercase tracking-wide mb-2">🤳 Selfie</p>
        {selfie && (
          <img src={selfie} alt="Selfie" className="w-24 rounded-full mx-auto block" />
        )}
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function KycVerification() {
  const [step, setStep] = useState(0);
  const [frontId, setFrontId] = useState<IdDocument | null>(null);
  const [backId, setBackId] = useState<IdDocument | null>(null);
  const [selfie, setSelfie] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const currentStep = STEPS[step];
  const meta = STEP_META[currentStep];

  // Helper: make an IdDocument from a File
  const makeDoc = (file: File): IdDocument => ({
    file,
    preview: URL.createObjectURL(file),
  });

  // Can the user move to the next step?
  const canProceed =
    (currentStep === "front" && !!frontId) ||
    (currentStep === "back" && !!backId) ||
    (currentStep === "selfie" && !!selfie) ||
    currentStep === "review";

  const handleSubmit = async () => {
    if (!frontId || !backId || !selfie) return;
    setSubmitting(true);
    await new Promise<void>((r) => setTimeout(r, 2200));
    setSubmitting(false);
    setSubmitted(true);
  };

  // ── Success screen ──────────────────────────────────────────────────────────
  if (submitted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#0d0d12] via-[#12151f] to-[#0a1628] flex items-start justify-center font-sans text-white max-w-lg mx-auto">
        <div className="mt-20 mx-6 bg-teal-400/8 border border-teal-400/25 rounded-3xl p-12 text-center">
          <div className="w-18 h-18 bg-teal-400 text-black rounded-full text-4xl font-black flex items-center justify-center mx-auto mb-6">✓</div>
          <h2 className="text-2xl font-extrabold mb-3">Verification Submitted</h2>
          <p className="text-sm text-white/50 leading-relaxed mb-6">
            We're reviewing your documents. You'll be notified within 24 hours.
          </p>
          <span className="inline-block bg-yellow-400/12 text-yellow-400 border border-yellow-400/30 px-5 py-2 rounded-full text-sm font-bold tracking-wide">
            Under Review
          </span>
        </div>
      </div>
    );
  }

  // ── Main flow ───────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0d0d12] via-[#12151f] to-[#0a1628] pb-10 font-sans text-white max-w-lg mx-auto">

      {/* Header */}
      <div className="px-6 pt-13 pb-5">
        <div className="flex justify-between items-center mb-4">
          <span className="bg-teal-400 text-black font-extrabold text-xs px-2.5 py-1 rounded-md tracking-widest">KYC</span>
          <span className="text-xs text-white/40 font-semibold">{step + 1} / {STEPS.length}</span>
        </div>
        <h1 className="text-3xl font-extrabold tracking-tight mb-1.5">Identity Verification</h1>
        <p className="text-xs text-white/35 tracking-widest">Secure · Encrypted · Compliant</p>
      </div>

      {/* Progress bar */}
      <div className="relative flex items-start px-6 pb-7">
        {/* Background line */}
        <div className="absolute top-2 left-10 right-10 h-0.5 bg-white/8 rounded-full" />
        {/* Filled line */}
        <div
          className="absolute top-2 left-10 h-0.5 bg-teal-400 rounded-full transition-all duration-400"
          style={{ width: `calc(${(step / (STEPS.length - 1)) * 100}% - 2.5rem)` }}
        />
        {/* Dots + labels */}
        {STEPS.map((s, i) => (
          <div key={s} className="flex-1 flex flex-col items-center gap-1 z-10">
            <div
              className="w-4 h-4 rounded-full transition-all duration-300"
              style={{
                background: i <= step ? "#00d4aa" : "rgba(255,255,255,0.15)",
                transform: i === step ? "scale(1.3)" : "scale(1)",
                boxShadow: i === step ? "0 0 12px #00d4aa" : "none",
              }}
            />
            <span
              className="text-[10px] font-semibold text-center leading-tight"
              style={{ color: i <= step ? "#00d4aa" : "rgba(255,255,255,0.3)" }}
            >
              {STEP_META[s].label}
            </span>
          </div>
        ))}
      </div>

      {/* Card */}
      <div className="mx-4 mb-5 bg-white/5 border border-white/9 rounded-3xl px-5 py-7 backdrop-blur-xl">
        <div className="text-4xl text-center mb-3">{meta.icon}</div>
        <h2 className="text-xl font-bold text-center mb-2">{meta.title}</h2>
        <p className="text-sm text-white/45 text-center mb-6 leading-relaxed">{meta.hint}</p>

        {currentStep === "front" && (
          <IdUploadStep side="front" doc={frontId} onCapture={(f) => setFrontId(makeDoc(f))} />
        )}
        {currentStep === "back" && (
          <IdUploadStep side="back" doc={backId} onCapture={(f) => setBackId(makeDoc(f))} />
        )}
        {currentStep === "selfie" && (
          <SelfieStep selfie={selfie} onCapture={setSelfie} />
        )}
        {currentStep === "review" && (
          <ReviewStep frontId={frontId} backId={backId} selfie={selfie} />
        )}
      </div>

      {/* Navigation */}
      <div className="flex gap-2.5 px-4 mb-4">
        {step > 0 && (
          <button
            onClick={() => setStep((s) => s - 1)}
            className="flex-1 py-4 bg-white/7 text-white border border-white/10 rounded-2xl text-base font-bold cursor-pointer hover:bg-white/15 transition-colors"
          >
            ← Back
          </button>
        )}

        {currentStep !== "review" ? (
          <button
            onClick={() => setStep((s) => s + 1)}
            disabled={!canProceed}
            className="flex-[2] py-4 bg-white text-black rounded-2xl text-base font-extrabold cursor-pointer transition-opacity disabled:opacity-40 hover:bg-gray-100"
          >
            Continue →
          </button>
        ) : (
          <button
            onClick={handleSubmit}
            disabled={submitting}
            className="flex-[2] py-4 bg-teal-400 text-black rounded-2xl text-base font-extrabold cursor-pointer disabled:bg-gray-600 disabled:text-white hover:bg-teal-300 transition-colors"
          >
            {submitting ? "Submitting…" : "Submit KYC ✓"}
          </button>
        )}
      </div>

      {/* Security note */}
      <p className="text-center text-[11px] text-white/25 tracking-wide px-4">
        🔒 256-bit encrypted · Data never sold · GDPR compliant
      </p>
    </div>
  );
}