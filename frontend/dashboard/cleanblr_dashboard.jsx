import { useState, useMemo } from "react";
import { BarChart, Bar, AreaChart, Area, PieChart, Pie, Cell, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { MapPin, FileText, BarChart2, Settings, LogOut, Bell, Search, ChevronDown, X, Shield, Zap, Clock, TrendingUp, CheckCircle, AlertTriangle, XCircle, Users, Filter, Download, RefreshCw } from "lucide-react";

// ── Mock data ─────────────────────────────────────────────────────────────────
const REPORTS = [
  { id:"GD-20260607-001", zone:"Koramangala", address:"80 Feet Rd, near KFC", lat:12.9279, lng:77.6271, priority:91, tier:"critical", auth:"verified", auth_deviation:8.2,  auth_conf:0.941, ai_conf:0.935, waste:"hazardous",    status:"pending",     multiShot:false, sla_hours:4,  submitted:"2026-06-07T06:12:00", assigned:null,          recurrence:3 },
  { id:"GD-20260607-002", zone:"BTM Layout",  address:"Dairy Circle flyover",  lat:12.9166, lng:77.6101, priority:87, tier:"critical", auth:"verified", auth_deviation:14.1, auth_conf:0.912, ai_conf:0.880, waste:"construction", status:"pending",     multiShot:true,  sla_hours:4,  submitted:"2026-06-07T07:44:00", assigned:null,          recurrence:2 },
  { id:"GD-20260607-003", zone:"Marathahalli", address:"Outer Ring Road",      lat:12.9591, lng:77.7001, priority:83, tier:"critical", auth:"verified", auth_deviation:5.4,  auth_conf:0.963, ai_conf:0.960, waste:"plastic",      status:"pending",     multiShot:true,  sla_hours:4,  submitted:"2026-06-07T08:03:00", assigned:null,          recurrence:1 },
  { id:"GD-20260607-004", zone:"Indiranagar",  address:"100 Feet Rd",         lat:12.9719, lng:77.6412, priority:74, tier:"high",     auth:"verified", auth_deviation:22.7, auth_conf:0.831, ai_conf:0.912, waste:"plastic",      status:"in_progress", multiShot:false, sla_hours:12, submitted:"2026-06-07T05:30:00", assigned:"Kumar R.",   recurrence:0 },
  { id:"GD-20260607-005", zone:"Whitefield",   address:"ITPL Main Gate",       lat:12.9698, lng:77.7499, priority:68, tier:"high",     auth:"review",   auth_deviation:41.3, auth_conf:0.612, ai_conf:0.820, waste:"mixed",        status:"pending",     multiShot:false, sla_hours:12, submitted:"2026-06-07T09:11:00", assigned:null,          recurrence:0 },
  { id:"GD-20260607-006", zone:"Electronic City", address:"Phase 1, Hosur Rd", lat:12.8399, lng:77.6770, priority:61, tier:"high",     auth:"verified", auth_deviation:18.9, auth_conf:0.874, ai_conf:0.873, waste:"construction", status:"in_progress", multiShot:false, sla_hours:12, submitted:"2026-06-07T04:18:00", assigned:"Priya M.",  recurrence:1 },
  { id:"GD-20260607-007", zone:"HSR Layout",   address:"27th Main, Sector 2",  lat:12.9116, lng:77.6370, priority:0,  tier:"rejected", auth:"rejected", auth_deviation:78.9, auth_conf:0.121, ai_conf:0.910, waste:"plastic",      status:"rejected",    multiShot:false, sla_hours:0,  submitted:"2026-06-07T10:02:00", assigned:null,          recurrence:0 },
  { id:"GD-20260607-008", zone:"Jayanagar",    address:"11th Block, 4th T Blk",lat:12.9308, lng:77.5931, priority:34, tier:"low",      auth:"verified", auth_deviation:11.2, auth_conf:0.925, ai_conf:0.931, waste:"organic",      status:"resolved",    multiShot:false, sla_hours:168,submitted:"2026-06-06T15:44:00", assigned:"Rajesh P.", recurrence:0 },
];

const TREND_DATA = [
  { date:"Jun 1", submitted:12, verified:10, resolved:8  },
  { date:"Jun 2", submitted:18, verified:15, resolved:12 },
  { date:"Jun 3", submitted:9,  verified:8,  resolved:7  },
  { date:"Jun 4", submitted:24, verified:20, resolved:14 },
  { date:"Jun 5", submitted:31, verified:26, resolved:19 },
  { date:"Jun 6", submitted:27, verified:23, resolved:20 },
  { date:"Jun 7", submitted:8,  verified:7,  resolved:2  },
];

const ZONE_DATA = [
  { zone:"Koramangala", count:18 }, { zone:"Indiranagar", count:14 },
  { zone:"BTM Layout",  count:11 }, { zone:"HSR Layout",  count:9  },
  { zone:"Whitefield",  count:8  }, { zone:"Marathahalli",count:7  },
  { zone:"Electronic City",count:5},{ zone:"Jayanagar",   count:4  },
];

const WASTE_DATA = [
  { name:"Plastic",      value:38, color:"#3B82F6" },
  { name:"Construction", value:24, color:"#F59E0B" },
  { name:"Mixed",        value:21, color:"#8B5CF6" },
  { name:"Organic",      value:12, color:"#10B981" },
  { name:"Hazardous",    value:5,  color:"#EF4444" },
];

const PRIORITY_DIST = [
  { tier:"Critical", count:3, color:"#DC2626" },
  { tier:"High",     count:3, color:"#EA580C" },
  { tier:"Medium",   count:0, color:"#D97706" },
  { tier:"Low",      count:1, color:"#16A34A" },
  { tier:"Rejected", count:1, color:"#9CA3AF" },
];

// ── Design helpers ────────────────────────────────────────────────────────────
const TIER = {
  critical: { bg:"#FEF2F2", text:"#B91C1C", border:"#FECACA", dot:"#DC2626", label:"CRITICAL" },
  high:     { bg:"#FFF7ED", text:"#C2410C", border:"#FED7AA", dot:"#EA580C", label:"HIGH" },
  medium:   { bg:"#FEFCE8", text:"#A16207", border:"#FEF08A", dot:"#CA8A04", label:"MEDIUM" },
  low:      { bg:"#F0FDF4", text:"#15803D", border:"#BBF7D0", dot:"#16A34A", label:"LOW" },
  rejected: { bg:"#F9FAFB", text:"#6B7280", border:"#E5E7EB", dot:"#9CA3AF", label:"REJECTED" },
};

const AUTH = {
  verified: { icon:"✅", label:"Verified",       color:"#065F46", bg:"#ECFDF5" },
  review:   { icon:"⚠️",  label:"Review",         color:"#92400E", bg:"#FFFBEB" },
  rejected: { icon:"❌", label:"Fraud Detected",  color:"#7F1D1D", bg:"#FEF2F2" },
};

const STATUS_COLOR = {
  pending:     { bg:"#EFF6FF", text:"#1D4ED8" },
  in_progress: { bg:"#FFF7ED", text:"#C2410C" },
  resolved:    { bg:"#F0FDF4", text:"#15803D" },
  rejected:    { bg:"#F9FAFB", text:"#6B7280" },
};

const WASTE_COLOR = {
  hazardous:"#EF4444", construction:"#F59E0B", plastic:"#3B82F6",
  mixed:"#8B5CF6", organic:"#10B981",
};

function Badge({ label, bg, color }) {
  return <span style={{ background:bg, color, fontSize:11, fontWeight:700, padding:"2px 8px", borderRadius:10, textTransform:"uppercase", letterSpacing:0.6 }}>{label}</span>;
}

function NovelTag() {
  return <span style={{ display:"inline-flex", alignItems:"center", gap:3, background:"linear-gradient(135deg,#4F46E5,#7C3AED)", color:"#fff", fontSize:9, fontWeight:700, padding:"1px 6px", borderRadius:10, textTransform:"uppercase", letterSpacing:0.8 }}><Zap size={7} />Novel IP</span>;
}

function KpiCard({ icon, label, value, sub, color="#4F46E5" }) {
  return (
    <div style={{ background:"#fff", borderRadius:12, padding:"16px 18px", boxShadow:"0 1px 4px rgba(0,0,0,0.06)", border:"1px solid #F3F4F6" }}>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:10 }}>
        <div style={{ fontSize:11, fontWeight:600, color:"#9CA3AF", textTransform:"uppercase", letterSpacing:0.8 }}>{label}</div>
        <div style={{ background:color+"18", padding:6, borderRadius:8 }}>{icon}</div>
      </div>
      <div style={{ fontSize:28, fontWeight:900, color:"#111827", fontFamily:"monospace", lineHeight:1 }}>{value}</div>
      {sub && <div style={{ fontSize:11, color:"#9CA3AF", marginTop:4 }}>{sub}</div>}
    </div>
  );
}

// ── MAP component (SVG-based, no external API needed) ──────────────────────────
function BangaloreMap({ reports, onSelect, selected }) {
  // Bangalore viewport: lat 12.84–13.00, lng 77.55–77.76
  const LAT_MIN=12.83, LAT_MAX=13.02, LNG_MIN=77.54, LNG_MAX=77.77;
  const W=480, H=360;
  const toXY = (lat, lng) => ({
    x: ((lng - LNG_MIN) / (LNG_MAX - LNG_MIN)) * W,
    y: H - ((lat - LAT_MIN) / (LAT_MAX - LAT_MIN)) * H,
  });
  return (
    <div style={{ position:"relative", background:"#F8FAFC", borderRadius:12, overflow:"hidden", border:"1px solid #E5E7EB" }}>
      <svg width="100%" viewBox={`0 0 ${W} ${H}`} style={{ display:"block" }}>
        {/* Grid lines */}
        {[0.25,0.5,0.75].map(f => (
          <g key={f}>
            <line x1={W*f} y1={0} x2={W*f} y2={H} stroke="#E5E7EB" strokeWidth={0.5} />
            <line x1={0} y1={H*f} x2={W} y2={H*f} stroke="#E5E7EB" strokeWidth={0.5} />
          </g>
        ))}
        {/* City label */}
        <text x={W/2} y={H/2} textAnchor="middle" fontSize={13} fill="#D1D5DB" fontWeight={700} opacity={0.5}>BANGALORE</text>
        {/* Report markers */}
        {reports.filter(r => r.tier !== "rejected").map(r => {
          const { x, y } = toXY(r.lat, r.lng);
          const tc = TIER[r.tier] || TIER.low;
          const isSelected = selected?.id === r.id;
          return (
            <g key={r.id} onClick={() => onSelect(r)} style={{ cursor:"pointer" }}>
              <circle cx={x} cy={y} r={isSelected ? 16 : 10} fill={tc.dot} opacity={0.15}
                style={{ transition:"r 0.2s" }} />
              <circle cx={x} cy={y} r={isSelected ? 9 : 6} fill={tc.dot}
                stroke="#fff" strokeWidth={isSelected ? 2.5 : 1.5}
                style={{ transition:"all 0.2s", filter:isSelected?"drop-shadow(0 0 4px "+tc.dot+")":"none" }} />
              {isSelected && <text x={x} y={y-16} textAnchor="middle" fontSize={9} fill={tc.text} fontWeight={700}>{r.id.slice(-5)}</text>}
            </g>
          );
        })}
      </svg>
      {/* Legend */}
      <div style={{ position:"absolute", bottom:10, left:10, display:"flex", gap:8, flexWrap:"wrap" }}>
        {["critical","high","low"].map(t => (
          <div key={t} style={{ display:"flex", alignItems:"center", gap:4, background:"rgba(255,255,255,0.9)", padding:"3px 8px", borderRadius:8, fontSize:10, fontWeight:600 }}>
            <div style={{ width:8, height:8, borderRadius:"50%", background:TIER[t].dot }} />
            {TIER[t].label}
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Forensic Panel ────────────────────────────────────────────────────────────
function ReportPanel({ report, onClose }) {
  const [tab, setTab] = useState("overview");
  if (!report) return null;
  const tc = TIER[report.tier] || TIER.low;
  const ac = AUTH[report.auth] || AUTH.verified;
  const sc = STATUS_COLOR[report.status] || STATUS_COLOR.pending;

  return (
    <div style={{ background:"#fff", borderRadius:14, border:"1px solid #E5E7EB", boxShadow:"0 8px 24px rgba(0,0,0,0.10)", overflow:"hidden", height:"100%" }}>
      {/* Header */}
      <div style={{ background:"#0F172A", padding:"14px 16px", display:"flex", justifyContent:"space-between", alignItems:"center" }}>
        <div>
          <div style={{ fontFamily:"monospace", fontSize:13, fontWeight:700, color:"#C7D2FE" }}>{report.id}</div>
          <div style={{ fontSize:11, color:"#64748B", marginTop:2 }}>{report.address}, {report.zone}</div>
        </div>
        <button onClick={onClose} style={{ background:"rgba(255,255,255,0.1)", border:"none", color:"#94A3B8", cursor:"pointer", borderRadius:8, padding:"6px 8px", display:"flex" }}>
          <X size={16} />
        </button>
      </div>

      {/* Priority score bar — NOVEL */}
      <div style={{ background:tc.bg, borderBottom:`1.5px solid ${tc.border}`, padding:"10px 16px", display:"flex", justifyContent:"space-between", alignItems:"center" }}>
        <div style={{ display:"flex", alignItems:"center", gap:8 }}>
          <div style={{ width:10, height:10, borderRadius:"50%", background:tc.dot }} />
          <span style={{ fontWeight:800, color:tc.text, fontSize:14 }}>{tc.label}</span>
          <NovelTag />
        </div>
        <div style={{ display:"flex", alignItems:"center", gap:4 }}>
          <span style={{ fontFamily:"monospace", fontSize:26, fontWeight:900, color:tc.dot }}>{report.priority}</span>
          <span style={{ fontSize:11, color:tc.text }}>/100</span>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display:"flex", borderBottom:"1px solid #F3F4F6" }}>
        {["overview","forensic","priority"].map(t => (
          <button key={t} onClick={() => setTab(t)} style={{ flex:1, padding:"9px 4px", background:"none", border:"none", cursor:"pointer", fontSize:12, fontWeight:tab===t?700:500, color:tab===t?"#4F46E5":"#9CA3AF", borderBottom:tab===t?"2.5px solid #4F46E5":"2.5px solid transparent", textTransform:"capitalize", transition:"all 0.15s" }}>
            {t === "forensic" ? "🌞 Forensic" : t === "priority" ? "📊 Priority" : "Overview"}
          </button>
        ))}
      </div>

      <div style={{ padding:"14px 16px", overflow:"auto", maxHeight:420 }}>

        {/* ── OVERVIEW tab ── */}
        {tab === "overview" && (
          <div>
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:8, marginBottom:14 }}>
              <div style={{ background:"#F9FAFB", borderRadius:8, padding:"10px 12px" }}>
                <div style={{ fontSize:10, color:"#9CA3AF", marginBottom:3 }}>AI Confidence</div>
                <div style={{ fontFamily:"monospace", fontWeight:800, fontSize:18, color:"#111827" }}>{(report.ai_conf*100).toFixed(1)}%</div>
                <div style={{ height:4, background:"#E5E7EB", borderRadius:2, marginTop:6 }}>
                  <div style={{ height:"100%", width:`${report.ai_conf*100}%`, background:`linear-gradient(90deg,${report.ai_conf>=0.9?"#10B981":report.ai_conf>=0.7?"#F59E0B":"#EF4444"},${report.ai_conf>=0.9?"#059669":"#D97706"})`, borderRadius:2 }} />
                </div>
              </div>
              <div style={{ background:"#F9FAFB", borderRadius:8, padding:"10px 12px" }}>
                <div style={{ fontSize:10, color:"#9CA3AF", marginBottom:3 }}>Waste Type</div>
                <div style={{ display:"flex", alignItems:"center", gap:6, marginTop:4 }}>
                  <div style={{ width:10, height:10, borderRadius:"50%", background:WASTE_COLOR[report.waste]||"#6B7280" }} />
                  <span style={{ fontWeight:700, fontSize:14, color:"#111827", textTransform:"capitalize" }}>{report.waste}</span>
                </div>
              </div>
              <div style={{ background:"#F9FAFB", borderRadius:8, padding:"10px 12px" }}>
                <div style={{ fontSize:10, color:"#9CA3AF", marginBottom:3 }}>Status</div>
                <Badge label={report.status.replace("_"," ")} bg={sc.bg} color={sc.text} />
              </div>
              <div style={{ background:"#F9FAFB", borderRadius:8, padding:"10px 12px" }}>
                <div style={{ fontSize:10, color:"#9CA3AF", marginBottom:3 }}>SLA</div>
                <div style={{ fontWeight:700, fontSize:13, color:"#111827" }}>
                  {report.sla_hours === 0 ? "N/A" : report.sla_hours < 24 ? `${report.sla_hours}h` : `${report.sla_hours/24}d`}
                </div>
              </div>
            </div>
            {[["GPS", `${report.lat.toFixed(5)}, ${report.lng.toFixed(5)}`], ["Zone", report.zone], ["Assigned", report.assigned||"Unassigned"], ["Multi-Shot", report.multiShot?"✅ Yes":"No"], ["Submitted", new Date(report.submitted).toLocaleString("en-IN")], ["Recurrence (7d)", report.recurrence > 0 ? `${report.recurrence} previous reports` : "First report"]].map(([k,v]) => (
              <div key={k} style={{ display:"flex", justifyContent:"space-between", padding:"7px 0", borderBottom:"1px solid #F3F4F6", fontSize:12 }}>
                <span style={{ color:"#6B7280" }}>{k}</span>
                <span style={{ fontWeight:600, color:"#111827", fontFamily:k==="GPS"?"monospace":"inherit" }}>{v}</span>
              </div>
            ))}
            <div style={{ display:"flex", gap:8, marginTop:14 }}>
              <a href={`https://www.google.com/maps?q=${report.lat},${report.lng}`} target="_blank" rel="noreferrer"
                style={{ flex:1, padding:"10px", borderRadius:8, background:"#4F46E5", color:"#fff", border:"none", fontWeight:700, fontSize:13, cursor:"pointer", textDecoration:"none", textAlign:"center" }}>
                🗺 Open in Maps
              </a>
            </div>
          </div>
        )}

        {/* ── FORENSIC tab — NOVEL IP #1 ── */}
        {tab === "forensic" && (
          <div>
            <div style={{ display:"flex", alignItems:"center", gap:6, marginBottom:12 }}>
              <span style={{ fontWeight:700, fontSize:14, color:"#111827" }}>Solar Cross-Validation</span>
              <NovelTag />
            </div>
            <div style={{ background:ac.bg, border:`1px solid ${report.auth==="verified"?"#A7F3D0":report.auth==="review"?"#FDE68A":"#FECACA"}`, borderRadius:10, padding:"12px 14px", marginBottom:14 }}>
              <div style={{ display:"flex", alignItems:"center", gap:6, marginBottom:8 }}>
                <span style={{ fontSize:18 }}>{ac.icon}</span>
                <span style={{ fontWeight:800, color:ac.color, fontSize:14 }}>{ac.label}</span>
                <span style={{ marginLeft:"auto", fontFamily:"monospace", fontWeight:700, fontSize:12, color:ac.color }}>{(report.auth_conf*100).toFixed(1)}%</span>
              </div>
              {[
                ["Angular deviation", `${report.auth_deviation}°`, report.auth_deviation < 30 ? "#065F46" : report.auth_deviation < 60 ? "#92400E" : "#7F1D1D"],
                ["Threshold (verified)", "< 30°", "#6B7280"],
                ["Threshold (review)",   "30–60°","#6B7280"],
                ["Threshold (rejected)", "> 60°", "#6B7280"],
              ].map(([k,v,c]) => (
                <div key={k} style={{ display:"flex", justifyContent:"space-between", padding:"5px 0", borderBottom:`1px solid ${report.auth==="verified"?"#D1FAE5":"#FDE68A"}`, fontSize:12 }}>
                  <span style={{ color:ac.color, opacity:0.8 }}>{k}</span>
                  <span style={{ fontFamily:"monospace", fontWeight:700, color:c||ac.color }}>{v}</span>
                </div>
              ))}
            </div>
            {report.auth === "rejected" && (
              <div style={{ background:"#FEF2F2", border:"1px solid #FECACA", borderRadius:8, padding:"10px 12px", fontSize:12, color:"#B91C1C" }}>
                ⚠️ This report was flagged as potentially fraudulent. The shadow direction in the submitted image deviates {report.auth_deviation.toFixed(1)}° from the expected solar shadow for the claimed GPS coordinates and timestamp. Automatic rejection applied.
              </div>
            )}
            {report.auth === "review" && (
              <div style={{ background:"#FFFBEB", border:"1px solid #FDE68A", borderRadius:8, padding:"10px 12px", fontSize:12, color:"#92400E" }}>
                ⚠️ Shadow deviation ({report.auth_deviation}°) is in the ambiguous range (30–60°). Manual review recommended before dispatching a cleanup team.
              </div>
            )}
            {report.multiShot && (
              <div style={{ background:"#EFF6FF", border:"1px solid #BFDBFE", borderRadius:8, padding:"10px 12px", marginTop:10, fontSize:12, color:"#1D4ED8" }}>
                📸 Multi-shot pipeline used. Two images captured and fused using recency-weighted scheme (w₁=0.35, w₂=0.65).
              </div>
            )}
          </div>
        )}

        {/* ── PRIORITY tab — NOVEL IP #2 ── */}
        {tab === "priority" && (
          <div>
            <div style={{ display:"flex", alignItems:"center", gap:6, marginBottom:12 }}>
              <span style={{ fontWeight:700, fontSize:14, color:"#111827" }}>Priority Score Breakdown</span>
              <NovelTag />
            </div>
            {/* Score visual */}
            <div style={{ background:tc.bg, border:`1.5px solid ${tc.border}`, borderRadius:12, padding:"16px", marginBottom:14, textAlign:"center" }}>
              <div style={{ fontFamily:"monospace", fontSize:48, fontWeight:900, color:tc.dot, lineHeight:1 }}>{report.priority}</div>
              <div style={{ fontSize:12, color:tc.text, marginTop:4 }}>out of 100  ·  {tc.label} tier</div>
              <div style={{ height:8, background:tc.border, borderRadius:4, marginTop:10, overflow:"hidden" }}>
                <div style={{ height:"100%", width:`${report.priority}%`, background:`linear-gradient(90deg,${tc.dot}AA,${tc.dot})`, borderRadius:4, transition:"width 1s ease" }} />
              </div>
            </div>
            {/* Factor breakdown */}
            {[
              { label:"AI Confidence",     value: report.ai_conf,   display:`${(report.ai_conf*100).toFixed(0)}%`,  desc:"Base reliability score from YOLOv8" },
              { label:"Severity Weight",   value: [2.5,5,3,2,2.5,3.5,1][["mixed","hazardous","construction","plastic","mixed","electronic","organic"].indexOf(report.waste)]||1.5, display:`${[2.5,5,3,2,2.5,3.5,1][["mixed","hazardous","construction","plastic","mixed","electronic","organic"].indexOf(report.waste)]||1.5}×`, desc:`Waste type: ${report.waste}` },
              { label:"Spatial Factor",    value: 1.5, display:"1.5×", desc:"Dump occupies 35–50% of frame" },
              { label:"Proximity Factor",  value: 1.5, display:"1.5×", desc:"Within 500m of sensitive zone" },
              { label:"Recurrence",        value: report.recurrence>2?3:report.recurrence>0?2:1, display:`${report.recurrence>2?3:report.recurrence>0?2:1}×`, desc:`${report.recurrence} prior unresolved reports here` },
            ].map((f, i) => (
              <div key={f.label} style={{ marginBottom:10 }}>
                <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:4 }}>
                  <div>
                    <span style={{ fontWeight:600, fontSize:13, color:"#111827" }}>{f.label}</span>
                    <div style={{ fontSize:10, color:"#9CA3AF" }}>{f.desc}</div>
                  </div>
                  <span style={{ fontFamily:"monospace", fontWeight:800, fontSize:15, color:tc.dot }}>{f.display}</span>
                </div>
                <div style={{ height:4, background:"#F3F4F6", borderRadius:2 }}>
                  <div style={{ height:"100%", width:`${Math.min(100,(typeof f.value==="number"?f.value/5*100:50))}%`, background:`linear-gradient(90deg,#4F46E5,${tc.dot})`, borderRadius:2 }} />
                </div>
              </div>
            ))}
            <div style={{ background:"#F5F3FF", borderRadius:8, padding:"10px 12px", fontSize:12, color:"#4F46E5", marginTop:8 }}>
              <b>Formula:</b> score = min(100, round(confidence × severity × spatial × proximity × recurrence / 0.60))
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ── LOGIN ─────────────────────────────────────────────────────────────────────
function Login({ onLogin }) {
  const [u,setU]=useState(""); const [p,setP]=useState(""); const [loading,setLoading]=useState(false);
  const submit = async () => { setLoading(true); await new Promise(r=>setTimeout(r,1200)); onLogin({ username:u||"admin", role:"admin" }); };
  return (
    <div style={{ minHeight:"100vh", background:"linear-gradient(160deg,#0F172A 0%,#1E1B4B 100%)", display:"flex", alignItems:"center", justifyContent:"center", fontFamily:"'Inter',system-ui,sans-serif", padding:20 }}>
      <div style={{ width:"100%", maxWidth:380 }}>
        <div style={{ textAlign:"center", marginBottom:28 }}>
          <div style={{ fontSize:40, marginBottom:8 }}>🏛️</div>
          <h1 style={{ color:"#fff", fontWeight:900, fontSize:24, margin:0 }}>CleanBLR Admin</h1>
          <p style={{ color:"#64748B", fontSize:13, margin:"6px 0 0" }}>BBMP Municipal Management Portal</p>
        </div>
        <div style={{ background:"#fff", borderRadius:16, padding:28, boxShadow:"0 20px 60px rgba(0,0,0,0.3)" }}>
          <h2 style={{ margin:"0 0 20px", fontSize:18, fontWeight:700, color:"#111827" }}>Sign In</h2>
          {[["Username","text",u,setU,"admin@bbmp.gov.in"],["Password","password",p,setP,"••••••••"]].map(([l,t,v,s,ph]) => (
            <div key={l} style={{ marginBottom:14 }}>
              <label style={{ fontSize:12, fontWeight:600, color:"#374151", display:"block", marginBottom:6 }}>{l}</label>
              <input type={t} value={v} onChange={e=>s(e.target.value)} placeholder={ph}
                style={{ width:"100%", padding:"10px 12px", borderRadius:8, border:"1.5px solid #E5E7EB", fontSize:14, outline:"none", boxSizing:"border-box", fontFamily:"inherit" }}
                onFocus={e=>e.target.style.borderColor="#4F46E5"} onBlur={e=>e.target.style.borderColor="#E5E7EB"} />
            </div>
          ))}
          <button onClick={submit} disabled={loading} style={{ width:"100%", padding:"12px", borderRadius:10, background:"linear-gradient(135deg,#4F46E5,#7C3AED)", color:"#fff", border:"none", fontWeight:700, fontSize:15, cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", gap:8, marginTop:6, boxShadow:"0 4px 14px rgba(79,70,229,0.35)" }}>
            {loading ? <div style={{ width:18, height:18, border:"2px solid rgba(255,255,255,0.3)", borderTop:"2px solid #fff", borderRadius:"50%", animation:"spin 0.8s linear infinite" }} /> : "Sign In →"}
          </button>
          <p style={{ fontSize:11, color:"#9CA3AF", textAlign:"center", marginTop:12 }}>Any credentials accepted in demo mode</p>
        </div>
      </div>
    </div>
  );
}

// ── MAIN DASHBOARD ────────────────────────────────────────────────────────────
export default function Dashboard() {
  const [user, setUser] = useState(null);
  const [page, setPage] = useState("reports");
  const [selected, setSelected] = useState(null);
  const [statusFilter, setStatusFilter] = useState("all");
  const [tierFilter, setTierFilter] = useState("all");
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    return REPORTS.filter(r => {
      if (statusFilter !== "all" && r.status !== statusFilter) return false;
      if (tierFilter !== "all" && r.tier !== tierFilter) return false;
      if (search && !r.id.toLowerCase().includes(search.toLowerCase()) && !r.zone.toLowerCase().includes(search.toLowerCase()) && !r.address.toLowerCase().includes(search.toLowerCase())) return false;
      return true;
    });
  }, [statusFilter, tierFilter, search]);

  if (!user) return <Login onLogin={setUser} />;

  const stats = {
    total: REPORTS.length,
    critical: REPORTS.filter(r=>r.tier==="critical").length,
    pending: REPORTS.filter(r=>r.status==="pending").length,
    fraud: REPORTS.filter(r=>r.auth==="rejected").length,
    multiShot: REPORTS.filter(r=>r.multiShot).length,
    resolved: REPORTS.filter(r=>r.status==="resolved").length,
  };

  const NAV = [
    { id:"dashboard", label:"Dashboard", icon:<BarChart2 size={17}/> },
    { id:"reports",   label:"Reports",   icon:<FileText size={17}/> },
    { id:"map",       label:"Map View",  icon:<MapPin size={17}/> },
    { id:"analytics", label:"Analytics", icon:<TrendingUp size={17}/> },
    { id:"settings",  label:"Settings",  icon:<Settings size={17}/> },
  ];

  return (
    <div style={{ display:"flex", minHeight:"100vh", fontFamily:"'Inter',system-ui,sans-serif", background:"#F8FAFC" }}>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}} @keyframes fadeIn{from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:translateY(0)}} * { box-sizing:border-box; }`}</style>

      {/* ── Sidebar ── */}
      <div style={{ width:220, background:"#0F172A", display:"flex", flexDirection:"column", flexShrink:0 }}>
        <div style={{ padding:"20px 16px", borderBottom:"1px solid #1E293B" }}>
          <div style={{ fontSize:18, fontWeight:900, color:"#fff", letterSpacing:-0.5 }}>🗑️ CleanBLR</div>
          <div style={{ fontSize:10, color:"#475569", marginTop:2, textTransform:"uppercase", letterSpacing:1 }}>Municipal Portal</div>
        </div>
        <nav style={{ flex:1, padding:"12px 8px" }}>
          {NAV.map(n => (
            <button key={n.id} onClick={() => setPage(n.id)} style={{
              width:"100%", display:"flex", alignItems:"center", gap:10, padding:"10px 12px",
              borderRadius:8, border:"none", background:page===n.id?"#1E3A5F":"transparent",
              color:page===n.id?"#60A5FA":"#64748B", fontWeight:page===n.id?700:500,
              fontSize:13, cursor:"pointer", marginBottom:2, transition:"all 0.15s", textAlign:"left"
            }}>
              {n.icon} {n.label}
            </button>
          ))}
        </nav>
        <div style={{ padding:"14px 16px", borderTop:"1px solid #1E293B" }}>
          <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:10 }}>
            <div style={{ width:28, height:28, borderRadius:"50%", background:"#1E3A5F", display:"flex", alignItems:"center", justifyContent:"center", fontSize:12, color:"#60A5FA", fontWeight:700 }}>
              {user.username[0].toUpperCase()}
            </div>
            <div>
              <div style={{ fontSize:12, fontWeight:600, color:"#CBD5E1" }}>{user.username}</div>
              <div style={{ fontSize:10, color:"#475569", textTransform:"uppercase" }}>{user.role}</div>
            </div>
          </div>
          <button onClick={() => setUser(null)} style={{ width:"100%", display:"flex", alignItems:"center", gap:6, padding:"8px 10px", borderRadius:6, border:"none", background:"transparent", color:"#475569", cursor:"pointer", fontSize:12 }}>
            <LogOut size={13}/> Sign Out
          </button>
        </div>
      </div>

      {/* ── Main ── */}
      <div style={{ flex:1, display:"flex", flexDirection:"column", overflow:"hidden" }}>
        {/* Topbar */}
        <div style={{ background:"#fff", borderBottom:"1px solid #E5E7EB", padding:"12px 24px", display:"flex", alignItems:"center", gap:12 }}>
          <div style={{ fontWeight:700, fontSize:16, color:"#111827", flex:1, textTransform:"capitalize" }}>
            {page === "dashboard" ? "Overview" : page === "map" ? "Map View" : page === "analytics" ? "Analytics" : page === "reports" ? "Reports" : "Settings"}
          </div>
          <div style={{ display:"flex", alignItems:"center", gap:8, background:"#F9FAFB", border:"1px solid #E5E7EB", borderRadius:8, padding:"6px 12px" }}>
            <Search size={14} color="#9CA3AF"/>
            <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search reports…" style={{ border:"none", background:"transparent", fontSize:13, outline:"none", width:180 }} />
          </div>
          <button style={{ position:"relative", background:"none", border:"1px solid #E5E7EB", borderRadius:8, padding:"7px 9px", cursor:"pointer", display:"flex" }}>
            <Bell size={16} color="#6B7280"/>
            <span style={{ position:"absolute", top:3, right:3, width:7, height:7, borderRadius:"50%", background:"#EF4444", border:"2px solid #fff" }} />
          </button>
        </div>

        {/* Content */}
        <div style={{ flex:1, overflow:"auto", padding:24 }}>

          {/* ── DASHBOARD PAGE ── */}
          {page === "dashboard" && (
            <div style={{ animation:"fadeIn 0.3s" }}>
              <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:14, marginBottom:22 }}>
                <KpiCard icon={<FileText size={16} color="#4F46E5"/>} label="Total Reports" value={stats.total} sub="All time" color="#4F46E5"/>
                <KpiCard icon={<AlertTriangle size={16} color="#DC2626"/>} label="Critical Priority" value={stats.critical} sub={`${stats.pending} pending dispatch`} color="#DC2626"/>
                <KpiCard icon={<Shield size={16} color="#0891B2"/>} label="Fraud Detected" value={stats.fraud} sub="Solar auth rejected" color="#0891B2"/>
                <KpiCard icon={<RefreshCw size={16} color="#7C3AED"/>} label="Multi-Shot Used" value={stats.multiShot} sub="Adaptive re-verification" color="#7C3AED"/>
              </div>
              <div style={{ display:"grid", gridTemplateColumns:"2fr 1fr", gap:18, marginBottom:22 }}>
                <div style={{ background:"#fff", borderRadius:12, padding:"18px", border:"1px solid #F3F4F6" }}>
                  <div style={{ fontWeight:700, fontSize:14, color:"#111827", marginBottom:14 }}>Reports Trend — Last 7 Days</div>
                  <ResponsiveContainer width="100%" height={200}>
                    <AreaChart data={TREND_DATA}>
                      <defs>
                        {[["s","#4F46E5"],["v","#10B981"],["r","#0891B2"]].map(([id,c])=>(
                          <linearGradient key={id} id={id} x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor={c} stopOpacity={0.2}/>
                            <stop offset="95%" stopColor={c} stopOpacity={0}/>
                          </linearGradient>
                        ))}
                      </defs>
                      <XAxis dataKey="date" tick={{fontSize:10}} />
                      <YAxis tick={{fontSize:10}} />
                      <Tooltip />
                      <Legend iconSize={8} iconType="circle" wrapperStyle={{fontSize:11}}/>
                      <Area type="monotone" dataKey="submitted" name="Submitted" stroke="#4F46E5" fill="url(#s)" strokeWidth={2}/>
                      <Area type="monotone" dataKey="verified"  name="Verified"  stroke="#10B981" fill="url(#v)" strokeWidth={2}/>
                      <Area type="monotone" dataKey="resolved"  name="Resolved"  stroke="#0891B2" fill="url(#r)" strokeWidth={2}/>
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
                <div style={{ background:"#fff", borderRadius:12, padding:"18px", border:"1px solid #F3F4F6" }}>
                  <div style={{ display:"flex", alignItems:"center", gap:6, marginBottom:14 }}>
                    <span style={{ fontWeight:700, fontSize:14, color:"#111827" }}>Priority Distribution</span>
                    <NovelTag />
                  </div>
                  <ResponsiveContainer width="100%" height={160}>
                    <PieChart>
                      <Pie data={PRIORITY_DIST} dataKey="count" nameKey="tier" cx="50%" cy="50%" innerRadius={40} outerRadius={65} paddingAngle={3}>
                        {PRIORITY_DIST.map(d => <Cell key={d.tier} fill={d.color} />)}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                  <div style={{ display:"flex", flexWrap:"wrap", gap:6, justifyContent:"center" }}>
                    {PRIORITY_DIST.map(d => (
                      <div key={d.tier} style={{ display:"flex", alignItems:"center", gap:4, fontSize:10, fontWeight:600, color:"#6B7280" }}>
                        <div style={{ width:8, height:8, borderRadius:"50%", background:d.color }}/>{d.tier} ({d.count})
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              {/* Top priority reports */}
              <div style={{ background:"#fff", borderRadius:12, padding:"18px", border:"1px solid #F3F4F6" }}>
                <div style={{ display:"flex", alignItems:"center", gap:6, marginBottom:14 }}>
                  <span style={{ fontWeight:700, fontSize:14, color:"#111827" }}>Priority Queue</span>
                  <NovelTag />
                  <span style={{ marginLeft:"auto", fontSize:12, color:"#9CA3AF" }}>Sorted by composite score</span>
                </div>
                {REPORTS.filter(r=>r.tier==="critical"||r.tier==="high").slice(0,5).sort((a,b)=>b.priority-a.priority).map(r => {
                  const tc=TIER[r.tier]; const ac=AUTH[r.auth];
                  return (
                    <div key={r.id} onClick={() => { setPage("reports"); setSelected(r); }} style={{ display:"flex", alignItems:"center", gap:12, padding:"10px 12px", borderRadius:8, marginBottom:4, cursor:"pointer", background:"#F9FAFB", transition:"background 0.15s" }}
                      onMouseEnter={e=>e.currentTarget.style.background="#F0F4FF"} onMouseLeave={e=>e.currentTarget.style.background="#F9FAFB"}>
                      <div style={{ fontFamily:"monospace", fontWeight:900, fontSize:20, color:tc.dot, width:36, textAlign:"center" }}>{r.priority}</div>
                      <div style={{ flex:1 }}>
                        <div style={{ fontWeight:700, fontSize:12, color:"#111827" }}>{r.address}, {r.zone}</div>
                        <div style={{ fontSize:10, color:"#9CA3AF" }}>{r.id}</div>
                      </div>
                      <span style={{ fontSize:10 }}>{ac.icon}</span>
                      <Badge label={r.tier} bg={tc.bg} color={tc.text}/>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* ── REPORTS PAGE ── */}
          {page === "reports" && (
            <div style={{ display:"flex", gap:18, animation:"fadeIn 0.3s", height:"calc(100vh - 120px)" }}>
              {/* Table */}
              <div style={{ flex:1, display:"flex", flexDirection:"column", minWidth:0 }}>
                {/* Filters */}
                <div style={{ display:"flex", gap:8, marginBottom:14, flexWrap:"wrap" }}>
                  {[["all","All"], ["pending","Pending"], ["in_progress","In Progress"], ["resolved","Resolved"], ["rejected","Rejected"]].map(([v,l]) => (
                    <button key={v} onClick={() => setStatusFilter(v)} style={{ padding:"6px 12px", borderRadius:8, border:"1.5px solid", borderColor:statusFilter===v?"#4F46E5":"#E5E7EB", background:statusFilter===v?"#EEF2FF":"#fff", color:statusFilter===v?"#4F46E5":"#6B7280", fontWeight:statusFilter===v?700:500, fontSize:12, cursor:"pointer" }}>
                      {l}
                    </button>
                  ))}
                  <div style={{ display:"flex", gap:4, marginLeft:"auto" }}>
                    <select value={tierFilter} onChange={e=>setTierFilter(e.target.value)} style={{ padding:"6px 10px", borderRadius:8, border:"1px solid #E5E7EB", fontSize:12, color:"#374151", background:"#fff", cursor:"pointer" }}>
                      <option value="all">All Tiers</option>
                      {["critical","high","medium","low","rejected"].map(t=><option key={t} value={t}>{t}</option>)}
                    </select>
                    <button style={{ padding:"6px 10px", borderRadius:8, border:"1px solid #E5E7EB", background:"#fff", color:"#6B7280", fontSize:12, cursor:"pointer", display:"flex", alignItems:"center", gap:4 }}>
                      <Download size={13}/> Export
                    </button>
                  </div>
                </div>
                {/* Table */}
                <div style={{ background:"#fff", borderRadius:12, border:"1px solid #E5E7EB", overflow:"auto", flex:1 }}>
                  <table style={{ width:"100%", borderCollapse:"collapse", fontSize:12 }}>
                    <thead>
                      <tr style={{ background:"#F9FAFB", borderBottom:"1px solid #E5E7EB" }}>
                        {[["Priority Score ▼","Novel IP","#7C3AED"],["Report ID","",""],["Location","",""],["Waste","",""],["Auth","Novel IP","#7C3AED"],["Status","",""],["Assigned","",""]].map(([h,tag,c]) => (
                          <th key={h} style={{ padding:"10px 12px", textAlign:"left", fontWeight:700, color:"#374151", whiteSpace:"nowrap" }}>
                            {h} {tag && <NovelTag/>}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {filtered.sort((a,b)=>b.priority-a.priority).map(r => {
                        const tc=TIER[r.tier]||TIER.low; const ac=AUTH[r.auth]; const sc=STATUS_COLOR[r.status];
                        const isActive = selected?.id===r.id;
                        return (
                          <tr key={r.id} onClick={() => setSelected(isActive ? null : r)} style={{ borderBottom:"1px solid #F3F4F6", cursor:"pointer", background:isActive?"#EEF2FF":"transparent", transition:"background 0.1s" }}
                            onMouseEnter={e=>{ if(!isActive) e.currentTarget.style.background="#F9FAFB"; }}
                            onMouseLeave={e=>{ if(!isActive) e.currentTarget.style.background="transparent"; }}>
                            <td style={{ padding:"10px 12px" }}>
                              <div style={{ display:"flex", alignItems:"center", gap:6 }}>
                                <div style={{ width:7, height:7, borderRadius:"50%", background:tc.dot, flexShrink:0 }}/>
                                <span style={{ fontFamily:"monospace", fontWeight:900, fontSize:16, color:tc.dot }}>{r.priority}</span>
                              </div>
                            </td>
                            <td style={{ padding:"10px 12px" }}>
                              <div style={{ fontFamily:"monospace", fontSize:11, color:"#4F46E5", fontWeight:600 }}>{r.id}</div>
                              {r.multiShot && <div style={{ fontSize:9, color:"#7C3AED", marginTop:1 }}>📸 multi-shot</div>}
                            </td>
                            <td style={{ padding:"10px 12px" }}>
                              <div style={{ fontWeight:600, color:"#111827" }}>{r.zone}</div>
                              <div style={{ color:"#9CA3AF", fontSize:11 }}>{r.address.slice(0,22)}{r.address.length>22?"…":""}</div>
                            </td>
                            <td style={{ padding:"10px 12px" }}>
                              <div style={{ display:"flex", alignItems:"center", gap:5 }}>
                                <div style={{ width:8, height:8, borderRadius:"50%", background:WASTE_COLOR[r.waste]||"#6B7280" }}/>
                                <span style={{ textTransform:"capitalize", color:"#374151" }}>{r.waste}</span>
                              </div>
                            </td>
                            <td style={{ padding:"10px 12px" }}>
                              <span style={{ background:ac.bg, color:ac.color, padding:"3px 7px", borderRadius:8, fontSize:11, fontWeight:700, display:"flex", alignItems:"center", gap:3, width:"fit-content" }}>
                                {ac.icon} {ac.label}
                              </span>
                              <div style={{ fontSize:9, color:"#9CA3AF", marginTop:2 }}>{r.auth_deviation}° dev</div>
                            </td>
                            <td style={{ padding:"10px 12px" }}>
                              <Badge label={r.status.replace("_"," ")} bg={sc.bg} color={sc.text}/>
                            </td>
                            <td style={{ padding:"10px 12px", color:"#6B7280", fontSize:11 }}>
                              {r.assigned || <span style={{ color:"#D1D5DB" }}>Unassigned</span>}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                  {filtered.length === 0 && (
                    <div style={{ padding:40, textAlign:"center", color:"#9CA3AF", fontSize:13 }}>No reports match the current filters.</div>
                  )}
                </div>
              </div>
              {/* Detail panel */}
              {selected && (
                <div style={{ width:340, flexShrink:0, animation:"fadeIn 0.2s" }}>
                  <ReportPanel report={selected} onClose={() => setSelected(null)} />
                </div>
              )}
            </div>
          )}

          {/* ── MAP PAGE ── */}
          {page === "map" && (
            <div style={{ animation:"fadeIn 0.3s" }}>
              <div style={{ display:"grid", gridTemplateColumns:"2fr 1fr", gap:18, height:"calc(100vh-140px)" }}>
                <div>
                  <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:12 }}>
                    <h2 style={{ margin:0, fontSize:15, fontWeight:700, color:"#111827" }}>Bangalore — Active Dumps</h2>
                    <NovelTag />
                    <span style={{ fontSize:12, color:"#9CA3AF" }}>Colored by priority score</span>
                  </div>
                  <BangaloreMap reports={REPORTS} onSelect={setSelected} selected={selected} />
                </div>
                <div>
                  {selected ? <ReportPanel report={selected} onClose={() => setSelected(null)} /> : (
                    <div style={{ background:"#fff", borderRadius:12, border:"1px solid #E5E7EB", padding:"20px", height:"100%", display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", color:"#9CA3AF" }}>
                      <MapPin size={40} color="#E5E7EB"/>
                      <div style={{ marginTop:12, fontSize:13, textAlign:"center" }}>Click a marker on the map to view forensic details</div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* ── ANALYTICS PAGE ── */}
          {page === "analytics" && (
            <div style={{ animation:"fadeIn 0.3s" }}>
              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:14, marginBottom:22 }}>
                <KpiCard icon={<Shield size={16} color="#0891B2"/>}     label="Auth Verified Rate" value={`${Math.round(REPORTS.filter(r=>r.auth==="verified").length/REPORTS.length*100)}%`} sub="Solar cross-validation" color="#0891B2"/>
                <KpiCard icon={<AlertTriangle size={16} color="#DC2626"/>} label="Fraud Blocked" value={stats.fraud} sub="GPS spoof attempts detected" color="#DC2626"/>
                <KpiCard icon={<RefreshCw size={16} color="#7C3AED"/>} label="Multi-Shot Rate" value={`${Math.round(stats.multiShot/REPORTS.length*100)}%`} sub="Borderline confidence cases" color="#7C3AED"/>
              </div>
              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:18 }}>
                <div style={{ background:"#fff", borderRadius:12, padding:"18px", border:"1px solid #F3F4F6" }}>
                  <div style={{ fontWeight:700, fontSize:14, color:"#111827", marginBottom:14 }}>Reports by Zone</div>
                  <ResponsiveContainer width="100%" height={220}>
                    <BarChart data={ZONE_DATA} layout="vertical">
                      <XAxis type="number" tick={{fontSize:10}}/>
                      <YAxis dataKey="zone" type="category" tick={{fontSize:10}} width={90}/>
                      <Tooltip/>
                      <Bar dataKey="count" fill="#4F46E5" radius={[0,4,4,0]}/>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
                <div style={{ background:"#fff", borderRadius:12, padding:"18px", border:"1px solid #F3F4F6" }}>
                  <div style={{ fontWeight:700, fontSize:14, color:"#111827", marginBottom:14 }}>Waste Type Distribution</div>
                  <ResponsiveContainer width="100%" height={180}>
                    <PieChart>
                      <Pie data={WASTE_DATA} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={75} label={({name,percent})=>`${name} ${(percent*100).toFixed(0)}%`} labelLine={false}>
                        {WASTE_DATA.map(d=><Cell key={d.name} fill={d.color}/>)}
                      </Pie>
                      <Tooltip/>
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div style={{ background:"#fff", borderRadius:12, padding:"18px", border:"1px solid #F3F4F6", gridColumn:"1/-1" }}>
                  <div style={{ display:"flex", alignItems:"center", gap:6, marginBottom:14 }}>
                    <span style={{ fontWeight:700, fontSize:14, color:"#111827" }}>Authentication Outcome Breakdown</span>
                    <NovelTag />
                  </div>
                  <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:12 }}>
                    {[
                      { label:"✅ Verified",       count:REPORTS.filter(r=>r.auth==="verified").length, color:"#065F46", bg:"#ECFDF5", desc:"Shadow deviation < 30°" },
                      { label:"⚠️ Under Review",   count:REPORTS.filter(r=>r.auth==="review").length,   color:"#92400E", bg:"#FFFBEB", desc:"Shadow deviation 30–60°" },
                      { label:"❌ Fraud Detected", count:REPORTS.filter(r=>r.auth==="rejected").length, color:"#7F1D1D", bg:"#FEF2F2", desc:"Shadow deviation > 60°" },
                    ].map(s => (
                      <div key={s.label} style={{ background:s.bg, borderRadius:10, padding:"16px 14px", textAlign:"center" }}>
                        <div style={{ fontWeight:800, fontSize:28, color:s.color, fontFamily:"monospace" }}>{s.count}</div>
                        <div style={{ fontWeight:700, fontSize:13, color:s.color, margin:"4px 0 2px" }}>{s.label}</div>
                        <div style={{ fontSize:11, color:s.color, opacity:0.7 }}>{s.desc}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {page === "settings" && (
            <div style={{ animation:"fadeIn 0.3s", background:"#fff", borderRadius:12, padding:24, border:"1px solid #E5E7EB", maxWidth:500 }}>
              <h2 style={{ margin:"0 0 20px", fontSize:16, fontWeight:700, color:"#111827" }}>Algorithm Configuration</h2>
              {[
                { label:"Solar Auth — Verified Threshold", val:"30°", desc:"Max shadow deviation for auto-verification", novel:true },
                { label:"Solar Auth — Review Threshold",   val:"60°", desc:"Above this: auto-reject", novel:true },
                { label:"Multi-Shot Weight (Shot 1)",      val:"0.35", desc:"Recency-weighted fusion", novel:true },
                { label:"Multi-Shot Weight (Shot 2)",      val:"0.65", desc:"Shot 2 weighted more (citizen followed guidance)", novel:true },
                { label:"Deduplication Radius",           val:"50 m",  desc:"Spatial gate for duplicate reports" },
                { label:"AI Auto-Approve Threshold",      val:"90%",   desc:"Confidence above this → immediate approval" },
                { label:"AI Manual Review Threshold",     val:"70%",   desc:"Below this → auto-reject" },
              ].map(s => (
                <div key={s.label} style={{ display:"flex", justifyContent:"space-between", alignItems:"center", padding:"12px 0", borderBottom:"1px solid #F3F4F6" }}>
                  <div>
                    <div style={{ fontWeight:600, fontSize:13, color:"#111827", display:"flex", alignItems:"center", gap:6 }}>
                      {s.label} {s.novel && <NovelTag/>}
                    </div>
                    <div style={{ fontSize:11, color:"#9CA3AF", marginTop:2 }}>{s.desc}</div>
                  </div>
                  <span style={{ fontFamily:"monospace", fontWeight:800, color:"#4F46E5", fontSize:14 }}>{s.val}</span>
                </div>
              ))}
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
