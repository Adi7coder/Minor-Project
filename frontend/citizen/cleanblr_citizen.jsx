import { useState, useRef, useCallback, useEffect } from "react";
import { Upload, MapPin, Sun, Cpu, CheckCircle, AlertTriangle, Camera, RefreshCw, ChevronRight, ArrowLeft, Copy, Share2, Zap } from "lucide-react";

// ── Mock API calls (replace with real fetch() to backend) ─────────────────────
const delay = ms => new Promise(r => setTimeout(r, ms));

const mockSolarAuth = async (gps) => {
  await delay(2200);
  return {
    verdict: "verified",
    confidence: 0.941,
    expected_azimuth_deg: 187.3,
    expected_elevation_deg: 78.4,
    derived_shadow_azimuth_deg: 195.1,
    angular_deviation_deg: 7.8,
    solar_noon_utc: "07:02 UTC",
    forensic_notes: [
      `Solar elevation=${78.4}°, azimuth=${187.3}°  (solar noon 07:02 UTC)`,
      "Expected shadow azimuth: 7.30° | Derived: 15.10° | Deviation: 7.80°",
      "VERIFIED — deviation 7.8° within 30° threshold."
    ]
  };
};

const mockYoloDetect = async () => {
  await delay(2800);
  // Simulates borderline confidence to show multi-shot pipeline
  return {
    confidence: 0.76,
    waste_type: "mixed",
    bounding_boxes: [{ x1: 0.05, y1: 0.10, x2: 0.88, y2: 0.92, confidence: 0.76, cls: "mixed" }],
    guidance: {
      instruction: "Waste dump fills 78% of frame. Move back 2.4 metres and re-capture.",
      distance_adjustment_m: 2.4,
      framing_correction: "none",
      reason: "frame_overfill",
      estimated_optimal_distance_m: 4.2
    },
    needs_second_shot: true,
  };
};

const mockFusion = async () => {
  await delay(1800);
  return { fused_confidence: 0.918, final_triage: "auto_approved", waste_types_agree: true };
};

const mockPriority = () => ({
  score: 84, tier: "critical", sla_hours: 4,
  severity_weight: 2.5, spatial_factor: 1.5,
  proximity_multiplier: 1.5, recurrence_multiplier: 1.0,
  nearest_sensitive_zone: "Storm drain (82m)"
});

// ── Design tokens ──────────────────────────────────────────────────────────────
const TIER_COLORS = {
  critical: { bg: "#FEF2F2", text: "#B91C1C", border: "#FECACA", dot: "#DC2626" },
  high:     { bg: "#FFF7ED", text: "#C2410C", border: "#FED7AA", dot: "#EA580C" },
  medium:   { bg: "#FEFCE8", text: "#A16207", border: "#FEF08A", dot: "#CA8A04" },
  low:      { bg: "#F0FDF4", text: "#15803D", border: "#BBF7D0", dot: "#16A34A" },
};

const VERDICT_CONFIG = {
  verified:         { icon: "✅", label: "Authentic",      color: "#065F46", bg: "#ECFDF5", border: "#A7F3D0" },
  review:           { icon: "⚠️", label: "Under Review",  color: "#92400E", bg: "#FFFBEB", border: "#FDE68A" },
  rejected:         { icon: "❌", label: "Fraud Detected", color: "#7F1D1D", bg: "#FEF2F2", border: "#FECACA" },
  insufficient_data:{ icon: "🌙", label: "Night Image",   color: "#1E3A5F", bg: "#EFF6FF", border: "#BFDBFE" },
};

// ── Reusable components ────────────────────────────────────────────────────────
function NovelBadge({ label = "Novel Patent IP" }) {
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: 4,
      background: "linear-gradient(135deg,#4F46E5,#7C3AED)",
      color: "#fff", fontSize: 10, fontWeight: 700, letterSpacing: 0.8,
      padding: "2px 8px", borderRadius: 20, textTransform: "uppercase"
    }}>
      <Zap size={9} /> {label}
    </span>
  );
}

function StepBar({ steps, current }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 0, padding: "0 0 24px" }}>
      {steps.map((s, i) => {
        const done = i < current, active = i === current;
        return (
          <div key={s.id} style={{ display: "flex", alignItems: "center", flex: i < steps.length - 1 ? 1 : 0 }}>
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
              <div style={{
                width: 32, height: 32, borderRadius: "50%", display: "flex",
                alignItems: "center", justifyContent: "center", fontSize: 13,
                fontWeight: 700, transition: "all 0.3s",
                background: done ? "#4F46E5" : active ? "#EEF2FF" : "#F3F4F6",
                color: done ? "#fff" : active ? "#4F46E5" : "#9CA3AF",
                border: active ? "2px solid #4F46E5" : "2px solid transparent",
                boxShadow: active ? "0 0 0 3px #C7D2FE" : "none"
              }}>
                {done ? "✓" : s.icon}
              </div>
              <span style={{ fontSize: 10, fontWeight: 500, color: active ? "#4F46E5" : done ? "#6B7280" : "#D1D5DB", whiteSpace: "nowrap" }}>
                {s.label}
              </span>
            </div>
            {i < steps.length - 1 && (
              <div style={{ flex: 1, height: 2, background: done ? "#4F46E5" : "#E5E7EB", margin: "0 6px", marginBottom: 18, transition: "all 0.3s" }} />
            )}
          </div>
        );
      })}
    </div>
  );
}

function Card({ children, style = {} }) {
  return (
    <div style={{
      background: "#fff", borderRadius: 16, padding: "24px",
      boxShadow: "0 1px 3px rgba(0,0,0,0.07), 0 4px 12px rgba(0,0,0,0.04)",
      ...style
    }}>
      {children}
    </div>
  );
}

function PrimaryBtn({ onClick, children, disabled, loading }) {
  return (
    <button onClick={onClick} disabled={disabled || loading} style={{
      width: "100%", padding: "14px", borderRadius: 12, border: "none",
      background: disabled ? "#E5E7EB" : "linear-gradient(135deg,#4F46E5,#7C3AED)",
      color: disabled ? "#9CA3AF" : "#fff", fontWeight: 700, fontSize: 15,
      cursor: disabled ? "not-allowed" : "pointer", display: "flex",
      alignItems: "center", justifyContent: "center", gap: 8,
      transition: "all 0.2s",
      boxShadow: disabled ? "none" : "0 4px 14px rgba(79,70,229,0.35)"
    }}>
      {loading ? <div style={{ width: 18, height: 18, border: "2px solid rgba(255,255,255,0.3)", borderTop: "2px solid #fff", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} /> : children}
    </button>
  );
}

// ── Solar Diagram SVG ──────────────────────────────────────────────────────────
function SolarDiagram({ solarResult, animating }) {
  const cx = 120, cy = 100, r = 70;
  const solarAz = solarResult?.expected_azimuth_deg ?? 187;
  const shadowAz = solarResult?.derived_shadow_azimuth_deg ?? 15;
  const toXY = (az, radius) => {
    const a = (az - 90) * Math.PI / 180;
    return { x: cx + radius * Math.cos(a), y: cy + radius * Math.sin(a) };
  };
  const sun = toXY(solarAz, r - 10);
  const shadow = toXY(shadowAz, r - 10);

  return (
    <div style={{ display: "flex", justifyContent: "center", padding: "8px 0" }}>
      <svg width={240} height={200} viewBox="0 0 240 200">
        <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
        {/* Horizon circle */}
        <circle cx={cx} cy={cy} r={r} fill="#F0FDF4" stroke="#D1FAE5" strokeWidth={1.5} />
        <text x={cx} y={cy - r - 6} textAnchor="middle" fontSize={9} fill="#6B7280">N</text>
        <text x={cx + r + 6} y={cy + 4} textAnchor="start" fontSize={9} fill="#6B7280">E</text>
        <text x={cx} y={cy + r + 14} textAnchor="middle" fontSize={9} fill="#6B7280">S</text>
        <text x={cx - r - 6} y={cy + 4} textAnchor="end" fontSize={9} fill="#6B7280">W</text>
        {/* Cardinal lines */}
        {[0,90,180,270].map(a => {
          const p1 = toXY(a, r - 8), p2 = toXY(a, r + 2);
          return <line key={a} x1={p1.x} y1={p1.y} x2={p2.x} y2={p2.y} stroke="#D1FAE5" strokeWidth={1} />;
        })}
        {/* Expected shadow direction */}
        {!animating && (
          <line x1={cx} y1={cy} x2={shadow.x} y2={shadow.y}
            stroke="#D1FAE5" strokeWidth={2} strokeDasharray="4 3" />
        )}
        {/* Sun ray (from sun to centre) */}
        {!animating && (
          <line x1={sun.x} y1={sun.y} x2={cx} y2={cy}
            stroke="#FDE68A" strokeWidth={1.5} strokeDasharray="3 2" />
        )}
        {/* Sun */}
        {animating ? (
          <circle cx={cx} cy={cy - r + 15} r={8} fill="#FCD34D"
            style={{ transformOrigin: `${cx}px ${cy}px`, animation: `spin 3s linear infinite` }} />
        ) : (
          <>
            <circle cx={sun.x} cy={sun.y} r={9} fill="#FBBF24" opacity={0.9} />
            <circle cx={sun.x} cy={sun.y} r={5} fill="#FDE68A" />
            <text x={sun.x} y={sun.y + 19} textAnchor="middle" fontSize={8} fill="#B45309">☀ {solarAz.toFixed(0)}°</text>
          </>
        )}
        {/* Derived shadow point */}
        {!animating && (
          <>
            <circle cx={shadow.x} cy={shadow.y} r={6} fill="#6EE7B7" />
            <text x={shadow.x} y={shadow.y + 17} textAnchor="middle" fontSize={8} fill="#047857">shadow {shadowAz?.toFixed(0)}°</text>
          </>
        )}
        {/* Centre cross */}
        <circle cx={cx} cy={cy} r={3} fill="#4F46E5" />
      </svg>
    </div>
  );
}

// ── MAIN APP ───────────────────────────────────────────────────────────────────
const STEPS = [
  { id: "upload",   label: "Upload",    icon: "📸" },
  { id: "gps",      label: "Location",  icon: "📍" },
  { id: "solar",    label: "Verify",    icon: "🌞", novel: true },
  { id: "ai",       label: "AI Detect", icon: "🤖" },
  { id: "review",   label: "Review",    icon: "✓" },
];

export default function CitizenPortal() {
  const [step, setStep] = useState(0);
  const [image, setImage] = useState(null);
  const [gps, setGps] = useState(null);
  const [gpsStatus, setGpsStatus] = useState("idle");
  const [solarResult, setSolarResult] = useState(null);
  const [solarStatus, setSolarStatus] = useState("idle");
  const [aiResult, setAiResult] = useState(null);
  const [aiStatus, setAiStatus] = useState("idle");
  const [multiShotDone, setMultiShotDone] = useState(false);
  const [secondImage, setSecondImage] = useState(null);
  const [fusionResult, setFusionResult] = useState(null);
  const [submitted, setSubmitted] = useState(false);
  const [priority, setPriority] = useState(null);
  const [trackingCode, setTrackingCode] = useState("");
  const [copied, setCopied] = useState(false);
  const fileRef = useRef();
  const file2Ref = useRef();

  // Mock GPS
  const captureGPS = async () => {
    setGpsStatus("loading");
    await delay(1500);
    setGps({ latitude: 12.9279, longitude: 77.6271, accuracy: 8.4, timestamp: new Date().toISOString() });
    setGpsStatus("done");
  };

  // Mock solar
  const runSolarAuth = async () => {
    setSolarStatus("loading");
    const res = await mockSolarAuth(gps);
    setSolarResult(res);
    setSolarStatus("done");
  };

  useEffect(() => {
    if (step === 2 && solarStatus === "idle") runSolarAuth();
  }, [step]);

  // Mock AI
  const runAI = async () => {
    setAiStatus("loading");
    const res = await mockYoloDetect();
    setAiResult(res);
    setAiStatus(res.needs_second_shot ? "multi_shot" : "done");
  };

  useEffect(() => {
    if (step === 3 && aiStatus === "idle") runAI();
  }, [step]);

  const runFusion = async () => {
    setAiStatus("fusing");
    const res = await mockFusion();
    setFusionResult(res);
    setAiStatus("done");
    setMultiShotDone(true);
  };

  const handleSubmit = async () => {
    await delay(1000);
    const p = mockPriority();
    setPriority(p);
    setTrackingCode(`GD-${new Date().toISOString().slice(0,10).replace(/-/g,"")}-${Math.floor(Math.random()*90000+10000)}`);
    setSubmitted(true);
  };

  const handleCopy = () => {
    navigator.clipboard?.writeText(trackingCode).catch(()=>{});
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // ── CONFIRMED ──────────────────────────────────────────────────────────────
  if (submitted && priority) {
    const tc = TIER_COLORS[priority.tier] || TIER_COLORS.medium;
    return (
      <div style={{ minHeight: "100vh", background: "linear-gradient(160deg,#0F172A 0%,#1E1B4B 50%,#0F172A 100%)", display: "flex", alignItems: "center", justifyContent: "center", padding: 20, fontFamily: "'Inter',system-ui,sans-serif" }}>
        <style>{`@keyframes pulse{0%,100%{opacity:1}50%{opacity:.5}} @keyframes spin{to{transform:rotate(360deg)}} @keyframes pop{0%{transform:scale(0.7);opacity:0}80%{transform:scale(1.05)}100%{transform:scale(1);opacity:1}}`}</style>
        <div style={{ maxWidth: 400, width: "100%", animation: "pop 0.5s ease-out" }}>
          <Card>
            <div style={{ textAlign: "center", marginBottom: 20 }}>
              <div style={{ fontSize: 52, marginBottom: 8 }}>✅</div>
              <h2 style={{ margin: 0, fontSize: 22, fontWeight: 800, color: "#111827" }}>Report Submitted</h2>
              <p style={{ color: "#6B7280", fontSize: 14, margin: "6px 0 0" }}>Verified & sent to BBMP municipality</p>
            </div>

            {/* Tracking code */}
            <div style={{ background: "#F5F3FF", border: "1.5px solid #C4B5FD", borderRadius: 12, padding: "14px 16px", marginBottom: 16 }}>
              <div style={{ fontSize: 11, color: "#7C3AED", fontWeight: 600, textTransform: "uppercase", letterSpacing: 0.8, marginBottom: 4 }}>Tracking Code</div>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <span style={{ fontFamily: "monospace", fontSize: 16, fontWeight: 700, color: "#4F46E5" }}>{trackingCode}</span>
                <button onClick={handleCopy} style={{ background: "none", border: "none", cursor: "pointer", color: "#7C3AED", display: "flex", alignItems: "center", gap: 4, fontSize: 13 }}>
                  <Copy size={14} /> {copied ? "Copied!" : "Copy"}
                </button>
              </div>
            </div>

            {/* Priority badge — NOVEL IP #2 */}
            <div style={{ background: tc.bg, border: `1.5px solid ${tc.border}`, borderRadius: 12, padding: "14px 16px", marginBottom: 16 }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <div style={{ width: 10, height: 10, borderRadius: "50%", background: tc.dot, boxShadow: `0 0 0 3px ${tc.border}` }} />
                  <span style={{ fontWeight: 800, fontSize: 16, color: tc.text, textTransform: "uppercase" }}>{priority.tier}</span>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <span style={{ fontSize: 28, fontWeight: 900, color: tc.dot, fontFamily: "monospace" }}>{priority.score}</span>
                  <span style={{ fontSize: 11, color: tc.text }}>/100</span>
                </div>
              </div>
              <div style={{ fontSize: 11, color: tc.text, marginBottom: 8 }}>Response SLA: <b>{priority.sla_hours} hours</b></div>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 6 }}>
                <NovelBadge label="Priority Score — Novel IP" />
              </div>
              {/* Score breakdown */}
              <div style={{ background: "rgba(255,255,255,0.6)", borderRadius: 8, padding: "10px 12px", fontSize: 12 }}>
                {[
                  ["Severity weight", `${priority.severity_weight}×`, "Waste type: mixed"],
                  ["Spatial factor",  `${priority.spatial_factor}×`,  "Dump size estimate"],
                  ["Proximity",       `${priority.proximity_multiplier}×`, priority.nearest_sensitive_zone],
                  ["Recurrence",      `${priority.recurrence_multiplier}×`, "First report here"],
                ].map(([k, v, note]) => (
                  <div key={k} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "4px 0", borderBottom: "1px solid rgba(0,0,0,0.05)" }}>
                    <div>
                      <div style={{ fontWeight: 600, color: "#374151" }}>{k}</div>
                      <div style={{ color: "#9CA3AF", fontSize: 10 }}>{note}</div>
                    </div>
                    <span style={{ fontWeight: 800, color: tc.text, fontFamily: "monospace" }}>{v}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Solar auth badge */}
            {solarResult && (
              <div style={{ background: "#ECFDF5", border: "1px solid #A7F3D0", borderRadius: 10, padding: "10px 14px", marginBottom: 14, fontSize: 12 }}>
                <div style={{ fontWeight: 700, color: "#065F46", marginBottom: 2 }}>🌞 Photo Authenticated</div>
                <div style={{ color: "#047857" }}>Shadow deviation {solarResult.angular_deviation_deg}° — within 30° threshold</div>
              </div>
            )}

            {/* Multi-shot badge */}
            {multiShotDone && (
              <div style={{ background: "#EFF6FF", border: "1px solid #BFDBFE", borderRadius: 10, padding: "10px 14px", marginBottom: 14, fontSize: 12 }}>
                <div style={{ fontWeight: 700, color: "#1D4ED8", marginBottom: 2 }}>📸 Multi-Shot Verified</div>
                <div style={{ color: "#1E40AF" }}>Fused confidence: {(fusionResult?.fused_confidence * 100).toFixed(1)}% (two-shot pipeline)</div>
              </div>
            )}

            <button onClick={() => { setStep(0); setImage(null); setGps(null); setGpsStatus("idle"); setSolarResult(null); setSolarStatus("idle"); setAiResult(null); setAiStatus("idle"); setMultiShotDone(false); setSecondImage(null); setFusionResult(null); setSubmitted(false); setPriority(null); }}
              style={{ width: "100%", padding: "12px", borderRadius: 10, background: "#F3F4F6", border: "none", fontWeight: 600, fontSize: 14, cursor: "pointer", color: "#374151" }}>
              Submit Another Report
            </button>
          </Card>
        </div>
      </div>
    );
  }

  // ── MAIN FLOW ──────────────────────────────────────────────────────────────
  return (
    <div style={{ minHeight: "100vh", background: "linear-gradient(160deg,#0F172A 0%,#1E1B4B 50%,#0F172A 100%)", display: "flex", alignItems: "center", justifyContent: "center", padding: 20, fontFamily: "'Inter',system-ui,sans-serif" }}>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}} @keyframes pulse{0%,100%{opacity:1}50%{opacity:0.4}} @keyframes fadeIn{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:translateY(0)}}`}</style>

      <div style={{ maxWidth: 420, width: "100%", animation: "fadeIn 0.4s ease-out" }}>
        {/* Header */}
        <div style={{ textAlign: "center", marginBottom: 24 }}>
          <div style={{ fontSize: 28, marginBottom: 4 }}>🗑️</div>
          <h1 style={{ color: "#fff", fontWeight: 900, fontSize: 22, margin: 0, letterSpacing: -0.5 }}>CleanBLR</h1>
          <p style={{ color: "#94A3B8", fontSize: 13, margin: "4px 0 0" }}>Report illegal garbage dumps</p>
        </div>

        <Card>
          <StepBar steps={STEPS} current={step} />

          {/* ── STEP 0: Upload ─────────────────────────────────────────────── */}
          {step === 0 && (
            <div style={{ animation: "fadeIn 0.3s" }}>
              <h3 style={{ margin: "0 0 16px", fontSize: 17, fontWeight: 700, color: "#111827" }}>Upload Photo</h3>
              <input ref={fileRef} type="file" accept="image/*" style={{ display: "none" }} onChange={e => { const f = e.target.files[0]; if (f) setImage({ file: f, preview: URL.createObjectURL(f), name: f.name, size: (f.size/1024).toFixed(0) + " KB" }); }} />

              {!image ? (
                <div onClick={() => fileRef.current.click()} style={{ border: "2px dashed #C7D2FE", borderRadius: 12, padding: "36px 20px", textAlign: "center", cursor: "pointer", transition: "all 0.2s", background: "#FAFAFA" }}
                  onMouseEnter={e => e.currentTarget.style.borderColor = "#4F46E5"}
                  onMouseLeave={e => e.currentTarget.style.borderColor = "#C7D2FE"}>
                  <Camera size={36} color="#C7D2FE" />
                  <div style={{ fontWeight: 600, color: "#374151", marginTop: 10, fontSize: 15 }}>Take or upload photo</div>
                  <div style={{ color: "#9CA3AF", fontSize: 12, marginTop: 4 }}>JPG, PNG — max 10 MB</div>
                </div>
              ) : (
                <div style={{ animation: "fadeIn 0.3s" }}>
                  <div style={{ borderRadius: 10, overflow: "hidden", marginBottom: 10, position: "relative" }}>
                    <img src={image.preview} alt="preview" style={{ width: "100%", height: 200, objectFit: "cover" }} />
                    <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to top,rgba(0,0,0,0.4),transparent)" }} />
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
                    <div style={{ fontSize: 13, color: "#374151" }}>{image.name}</div>
                    <div style={{ fontSize: 12, color: "#6B7280" }}>{image.size}</div>
                  </div>
                  <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
                    <button onClick={() => setImage(null)} style={{ flex: 1, padding: "10px", borderRadius: 8, background: "#F3F4F6", border: "none", fontWeight: 600, cursor: "pointer", color: "#6B7280", fontSize: 13 }}>Change</button>
                    <PrimaryBtn onClick={() => setStep(1)}>Next <ChevronRight size={16} /></PrimaryBtn>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ── STEP 1: GPS ────────────────────────────────────────────────── */}
          {step === 1 && (
            <div style={{ animation: "fadeIn 0.3s" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
                <h3 style={{ margin: 0, fontSize: 17, fontWeight: 700, color: "#111827" }}>Capture Location</h3>
              </div>
              {gpsStatus === "idle" && (
                <div style={{ textAlign: "center", padding: "20px 0" }}>
                  <MapPin size={48} color="#C7D2FE" />
                  <p style={{ color: "#6B7280", fontSize: 14, margin: "10px 0 20px" }}>GPS coordinates will be captured automatically from your device.</p>
                  <PrimaryBtn onClick={captureGPS}><MapPin size={16} /> Get Current Location</PrimaryBtn>
                </div>
              )}
              {gpsStatus === "loading" && (
                <div style={{ textAlign: "center", padding: "32px 0" }}>
                  <div style={{ width: 40, height: 40, borderRadius: "50%", border: "3px solid #E5E7EB", borderTop: "3px solid #4F46E5", animation: "spin 0.8s linear infinite", margin: "0 auto 16px" }} />
                  <div style={{ color: "#6B7280", fontSize: 14 }}>Acquiring GPS signal…</div>
                </div>
              )}
              {gpsStatus === "done" && gps && (
                <div style={{ animation: "fadeIn 0.3s" }}>
                  <div style={{ background: "#ECFDF5", border: "1px solid #A7F3D0", borderRadius: 12, padding: "16px", marginBottom: 16 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 12 }}>
                      <CheckCircle size={16} color="#059669" />
                      <span style={{ fontWeight: 700, color: "#065F46", fontSize: 14 }}>Location Captured</span>
                      <span style={{ marginLeft: "auto", background: "#D1FAE5", color: "#047857", fontSize: 11, fontWeight: 700, padding: "2px 8px", borderRadius: 10 }}>±{gps.accuracy} m</span>
                    </div>
                    {[["Latitude", gps.latitude.toFixed(6)], ["Longitude", gps.longitude.toFixed(6)], ["Accuracy", `±${gps.accuracy} metres`]].map(([k,v]) => (
                      <div key={k} style={{ display: "flex", justifyContent: "space-between", padding: "5px 0", borderBottom: "1px solid #D1FAE5", fontSize: 13 }}>
                        <span style={{ color: "#047857" }}>{k}</span>
                        <span style={{ fontFamily: "monospace", fontWeight: 600, color: "#065F46" }}>{v}</span>
                      </div>
                    ))}
                  </div>
                  <PrimaryBtn onClick={() => setStep(2)}>Next <ChevronRight size={16} /></PrimaryBtn>
                </div>
              )}
              <button onClick={() => setStep(0)} style={{ marginTop: 10, width: "100%", padding: "10px", background: "none", border: "none", color: "#9CA3AF", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 4, fontSize: 13 }}>
                <ArrowLeft size={14} /> Back
              </button>
            </div>
          )}

          {/* ── STEP 2: Solar Authentication — NOVEL IP #1 ─────────────────── */}
          {step === 2 && (
            <div style={{ animation: "fadeIn 0.3s" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                <h3 style={{ margin: 0, fontSize: 17, fontWeight: 700, color: "#111827" }}>Photo Authentication</h3>
              </div>
              <div style={{ marginBottom: 14 }}><NovelBadge label="Solar Cross-Validation — Novel Patent IP" /></div>
              <p style={{ color: "#6B7280", fontSize: 12, margin: "0 0 16px", lineHeight: 1.5 }}>
                Verifying shadow direction in your photo matches the sun's computed position for this GPS location and time.
              </p>

              {solarStatus === "loading" && (
                <div>
                  <SolarDiagram solarResult={null} animating={true} />
                  <div style={{ textAlign: "center", color: "#6B7280", fontSize: 13, display: "flex", alignItems: "center", justifyContent: "center", gap: 8, marginTop: 8 }}>
                    <div style={{ width: 14, height: 14, borderRadius: "50%", border: "2px solid #E5E7EB", borderTop: "2px solid #4F46E5", animation: "spin 0.8s linear infinite" }} />
                    Analysing solar position…
                  </div>
                </div>
              )}

              {solarStatus === "done" && solarResult && (() => {
                const vc = VERDICT_CONFIG[solarResult.verdict];
                return (
                  <div style={{ animation: "fadeIn 0.4s" }}>
                    <SolarDiagram solarResult={solarResult} animating={false} />
                    <div style={{ background: vc.bg, border: `1.5px solid ${vc.border}`, borderRadius: 12, padding: "14px 16px", marginTop: 12 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 8 }}>
                        <span style={{ fontSize: 18 }}>{vc.icon}</span>
                        <span style={{ fontWeight: 800, color: vc.color, fontSize: 15 }}>{vc.label}</span>
                        <span style={{ marginLeft: "auto", fontFamily: "monospace", fontWeight: 700, color: vc.color }}>{(solarResult.confidence * 100).toFixed(0)}%</span>
                      </div>
                      {[
                        ["Expected shadow", `${solarResult.expected_azimuth_deg ? ((solarResult.expected_azimuth_deg + 180) % 360).toFixed(1) : "--"}°`],
                        ["Derived shadow",  `${solarResult.derived_shadow_azimuth_deg?.toFixed(1)}°`],
                        ["Deviation",       `${solarResult.angular_deviation_deg?.toFixed(1)}° (limit: 30°)`],
                        ["Solar elevation", `${solarResult.expected_elevation_deg?.toFixed(1)}°`],
                      ].map(([k,v]) => (
                        <div key={k} style={{ display: "flex", justifyContent: "space-between", padding: "4px 0", fontSize: 12, borderBottom: `1px solid ${vc.border}` }}>
                          <span style={{ color: vc.color, opacity: 0.8 }}>{k}</span>
                          <span style={{ fontFamily: "monospace", fontWeight: 600, color: vc.color }}>{v}</span>
                        </div>
                      ))}
                    </div>
                    {solarResult.verdict !== "rejected" ? (
                      <div style={{ marginTop: 16 }}><PrimaryBtn onClick={() => setStep(3)}>Continue to AI Detection <ChevronRight size={16} /></PrimaryBtn></div>
                    ) : (
                      <div style={{ background: "#FEF2F2", border: "1px solid #FECACA", borderRadius: 10, padding: "12px 14px", marginTop: 12, fontSize: 13, color: "#B91C1C" }}>
                        ❌ Photo rejected due to GPS/time inconsistency. Please take a new photo at the actual dump location.
                        <button onClick={() => { setStep(0); setImage(null); setSolarResult(null); setSolarStatus("idle"); }} style={{ display: "block", marginTop: 8, background: "none", border: "1px solid #FECACA", borderRadius: 8, padding: "8px 14px", color: "#B91C1C", cursor: "pointer", fontWeight: 600, width: "100%" }}>
                          Start Over
                        </button>
                      </div>
                    )}
                  </div>
                );
              })()}
            </div>
          )}

          {/* ── STEP 3: AI Detection + Multi-Shot — NOVEL IP #1 & #3 ──────── */}
          {step === 3 && (
            <div style={{ animation: "fadeIn 0.3s" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                <h3 style={{ margin: 0, fontSize: 17, fontWeight: 700, color: "#111827" }}>AI Detection</h3>
              </div>
              <div style={{ marginBottom: 14 }}><NovelBadge label="YOLOv8 + Adaptive Multi-Shot — Novel IP" /></div>

              {(aiStatus === "loading" || aiStatus === "fusing") && (
                <div style={{ textAlign: "center", padding: "32px 0" }}>
                  <div style={{ width: 48, height: 48, borderRadius: "50%", border: "3px solid #E5E7EB", borderTop: "3px solid #7C3AED", animation: "spin 0.9s linear infinite", margin: "0 auto 16px" }} />
                  <div style={{ fontWeight: 600, color: "#374151", fontSize: 15 }}>{aiStatus === "fusing" ? "Fusing confidence scores…" : "Running YOLOv8 inference…"}</div>
                  <div style={{ color: "#9CA3AF", fontSize: 12, marginTop: 4 }}>{aiStatus === "fusing" ? "Weighted fusion of both shots" : "Analysing waste type and coverage"}</div>
                </div>
              )}

              {aiStatus === "multi_shot" && aiResult && (
                <div style={{ animation: "fadeIn 0.4s" }}>
                  {/* Confidence bar */}
                  <div style={{ background: "#FFFBEB", border: "1px solid #FDE68A", borderRadius: 12, padding: "14px 16px", marginBottom: 14 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                      <span style={{ fontWeight: 600, fontSize: 13, color: "#92400E" }}>⚠ AI Confidence: Borderline</span>
                      <span style={{ fontFamily: "monospace", fontWeight: 800, fontSize: 16, color: "#B45309" }}>{(aiResult.confidence * 100).toFixed(0)}%</span>
                    </div>
                    <div style={{ background: "#FEF3C7", borderRadius: 6, height: 8, overflow: "hidden" }}>
                      <div style={{ height: "100%", width: `${aiResult.confidence * 100}%`, background: "linear-gradient(90deg,#F59E0B,#D97706)", borderRadius: 6 }} />
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between", marginTop: 4, fontSize: 10, color: "#B45309" }}>
                      <span>70% threshold</span><span>90% auto-approve</span>
                    </div>
                  </div>

                  {/* Multi-shot guidance */}
                  <div style={{ background: "#EFF6FF", border: "1.5px solid #BFDBFE", borderRadius: 12, padding: "16px", marginBottom: 14 }}>
                    <div style={{ fontWeight: 800, color: "#1D4ED8", fontSize: 14, marginBottom: 8 }}>📸 Second Photo Required</div>
                    <div style={{ background: "#DBEAFE", borderRadius: 8, padding: "12px", marginBottom: 10, fontSize: 13, color: "#1E40AF", lineHeight: 1.5 }}>
                      <b>Instruction:</b> {aiResult.guidance.instruction}
                    </div>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, fontSize: 12 }}>
                      <div style={{ background: "rgba(255,255,255,0.7)", borderRadius: 8, padding: "8px 10px" }}>
                        <div style={{ color: "#6B7280" }}>Reason</div>
                        <div style={{ fontWeight: 600, color: "#1D4ED8" }}>{aiResult.guidance.reason.replace(/_/g," ")}</div>
                      </div>
                      <div style={{ background: "rgba(255,255,255,0.7)", borderRadius: 8, padding: "8px 10px" }}>
                        <div style={{ color: "#6B7280" }}>Move back</div>
                        <div style={{ fontWeight: 600, color: "#1D4ED8" }}>{aiResult.guidance.distance_adjustment_m} metres</div>
                      </div>
                    </div>
                  </div>

                  <input ref={file2Ref} type="file" accept="image/*" style={{ display: "none" }} onChange={e => { const f = e.target.files[0]; if (f) setSecondImage({ preview: URL.createObjectURL(f) }); }} />
                  {!secondImage ? (
                    <button onClick={() => file2Ref.current.click()} style={{ width: "100%", padding: "14px", borderRadius: 12, background: "#EFF6FF", border: "2px dashed #93C5FD", fontWeight: 700, fontSize: 14, cursor: "pointer", color: "#1D4ED8", display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
                      <Camera size={18} /> Upload Second Photo
                    </button>
                  ) : (
                    <div>
                      <img src={secondImage.preview} alt="shot 2" style={{ width: "100%", height: 120, objectFit: "cover", borderRadius: 10, marginBottom: 12 }} />
                      <PrimaryBtn onClick={runFusion}>Analyse Second Photo</PrimaryBtn>
                    </div>
                  )}
                </div>
              )}

              {aiStatus === "done" && (
                <div style={{ animation: "fadeIn 0.4s" }}>
                  <div style={{ background: "#ECFDF5", border: "1px solid #A7F3D0", borderRadius: 12, padding: "14px 16px", marginBottom: 14 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 10 }}>
                      <CheckCircle size={16} color="#059669" />
                      <span style={{ fontWeight: 700, color: "#065F46", fontSize: 14 }}>Garbage Detected</span>
                      <span style={{ marginLeft: "auto", fontFamily: "monospace", fontWeight: 800, color: "#059669", fontSize: 16 }}>
                        {fusionResult ? (fusionResult.fused_confidence * 100).toFixed(1) : (aiResult?.confidence * 100).toFixed(1)}%
                      </span>
                    </div>
                    {fusionResult && (
                      <div style={{ background: "#D1FAE5", borderRadius: 8, padding: "8px 10px", fontSize: 12, color: "#047857", marginBottom: 8 }}>
                        🔀 Multi-shot fused: {(aiResult.confidence * 100).toFixed(0)}% + {(fusionResult.fused_confidence * 100).toFixed(0)}% → {(fusionResult.fused_confidence * 100).toFixed(1)}%
                      </div>
                    )}
                    <div style={{ fontSize: 13, color: "#047857" }}>Waste type: <b>{aiResult?.waste_type}</b></div>
                  </div>
                  <PrimaryBtn onClick={() => setStep(4)}>Review & Submit <ChevronRight size={16} /></PrimaryBtn>
                </div>
              )}
            </div>
          )}

          {/* ── STEP 4: Review ────────────────────────────────────────────── */}
          {step === 4 && (
            <div style={{ animation: "fadeIn 0.3s" }}>
              <h3 style={{ margin: "0 0 16px", fontSize: 17, fontWeight: 700, color: "#111827" }}>Review & Submit</h3>
              {image && <img src={image.preview} alt="review" style={{ width: "100%", height: 140, objectFit: "cover", borderRadius: 10, marginBottom: 14 }} />}
              <div style={{ background: "#F9FAFB", borderRadius: 10, padding: "12px", marginBottom: 16 }}>
                {[
                  ["Location", `${gps?.latitude.toFixed(5)}, ${gps?.longitude.toFixed(5)}`],
                  ["Accuracy", `±${gps?.accuracy} m`],
                  ["Authentication", solarResult?.verdict === "verified" ? "✅ Authentic" : "⚠️ Review"],
                  ["AI Detection", aiResult ? `${aiResult.waste_type} (${fusionResult ? (fusionResult.fused_confidence*100).toFixed(0) : (aiResult.confidence*100).toFixed(0)}%)` : "—"],
                  ["Multi-shot", multiShotDone ? "✅ Yes" : "Not needed"],
                ].map(([k,v]) => (
                  <div key={k} style={{ display: "flex", justifyContent: "space-between", padding: "6px 0", borderBottom: "1px solid #E5E7EB", fontSize: 13 }}>
                    <span style={{ color: "#6B7280" }}>{k}</span>
                    <span style={{ fontWeight: 600, color: "#111827" }}>{v}</span>
                  </div>
                ))}
              </div>
              <PrimaryBtn onClick={handleSubmit}>Submit to Municipality 🚀</PrimaryBtn>
              <button onClick={() => setStep(3)} style={{ marginTop: 10, width: "100%", padding: "10px", background: "none", border: "none", color: "#9CA3AF", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 4, fontSize: 13 }}>
                <ArrowLeft size={14} /> Back
              </button>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
