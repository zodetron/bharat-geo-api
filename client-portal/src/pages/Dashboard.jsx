import { useEffect, useState } from "react";
import api from "../api/client";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

const PLAN_COLORS = { FREE: "var(--text-muted)", PREMIUM: "var(--purple)", PRO: "var(--green)", UNLIMITED: "var(--yellow-text)" };
const PLAN_DIMS   = { FREE: "rgba(85,85,85,0.15)", PREMIUM: "var(--purple-dim)", PRO: "var(--green-dim)", UNLIMITED: "var(--yellow-dim)" };

function UsageBar({ percent }) {
  const color = percent > 90 ? "var(--red-text)" : percent > 70 ? "var(--yellow-text)" : "var(--green)";
  return (
    <div style={{ marginTop: 12 }}>
      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: "var(--text-muted)", marginBottom: 6 }}>
        <span>{percent}% used today</span>
        <span>{100 - percent}% remaining</span>
      </div>
      <div style={{ width: "100%", height: 4, borderRadius: 9, background: "var(--divider)" }}>
        <div style={{ height: 4, borderRadius: 9, width: `${Math.min(percent, 100)}%`, background: color, transition: "width 0.4s" }} />
      </div>
    </div>
  );
}

export default function Dashboard() {
  const [usage, setUsage]     = useState(null);
  const [daily, setDaily]     = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([api.get("/client/usage"), api.get("/client/usage/daily?days=14")])
      .then(([u, d]) => { setUsage(u); setDaily(d.daily); })
      .finally(() => setLoading(false));
  }, []);

  if (loading) return (
    <div style={{ display: "flex", alignItems: "center", gap: 8, color: "var(--text-muted)", fontSize: 13, paddingTop: 16 }}>
      <svg className="animate-spin" style={{ width: 16, height: 16 }} viewBox="0 0 24 24" fill="none">
        <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" strokeOpacity="0.25"/>
        <path d="M12 2a10 10 0 0 1 10 10" stroke="currentColor" strokeWidth="3" strokeLinecap="round"/>
      </svg>
      Loading…
    </div>
  );

  const th = { padding: "12px 18px", textAlign: "left", fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.07em", color: "var(--text-muted)" };
  const td = { padding: "14px 18px", fontSize: 13 };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 28 }}>
      <div>
        <h1 style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: 800, fontSize: 30, color: "var(--text)", margin: "0 0 4px" }}>Dashboard</h1>
        <p style={{ fontSize: 13, color: "var(--text-muted)", margin: 0 }}>Your usage and API activity</p>
      </div>

      {/* API Key Cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 16 }}>
        {usage?.apiKeys?.length === 0 && (
          <div style={{ gridColumn: "1/-1", borderRadius: 18, padding: "36px 24px", textAlign: "center", background: "var(--card)", border: "1px dashed var(--card-border)" }}>
            <p style={{ fontWeight: 600, fontSize: 13, color: "var(--purple-text)", margin: "0 0 4px" }}>No active API keys</p>
            <p style={{ fontSize: 12, color: "var(--text-muted)", margin: 0 }}>Go to API Keys to generate your first key.</p>
          </div>
        )}
        {usage?.apiKeys?.map(k => (
          <div key={k.id} style={{ borderRadius: 18, padding: 20, background: "var(--card)", border: "1px solid var(--card-border-p)" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
              <code style={{ fontSize: 11, fontFamily: "monospace", color: "var(--text-2)" }}>{k.keyPrefix}…</code>
              <span style={{ padding: "3px 10px", borderRadius: 8, fontSize: 11, fontWeight: 700, background: PLAN_DIMS[k.plan], color: PLAN_COLORS[k.plan] }}>{k.plan}</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
              <div>
                <p style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: 800, fontSize: 30, color: "var(--text)", margin: 0 }}>{k.usedToday.toLocaleString()}</p>
                <p style={{ fontSize: 11, color: "var(--text-muted)", margin: "2px 0 0" }}>requests today</p>
              </div>
              <div style={{ textAlign: "right" }}>
                <p style={{ fontWeight: 700, fontSize: 20, color: "var(--green-text)", margin: 0 }}>{k.remaining.toLocaleString()}</p>
                <p style={{ fontSize: 11, color: "var(--text-muted)", margin: "2px 0 0" }}>remaining</p>
              </div>
            </div>
            <UsageBar percent={k.percentUsed} />
          </div>
        ))}
      </div>

      {/* Chart */}
      <div style={{ background: "var(--card)", border: "1px solid var(--card-border)", borderRadius: 18, padding: 24 }}>
        <h2 style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: 700, fontSize: 13, color: "var(--text-2)", margin: "0 0 20px" }}>Request History — 14 days</h2>
        {daily.length ? (
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={daily} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="cpGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor="#00e676" stopOpacity={0.25} />
                  <stop offset="95%" stopColor="#00e676" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--chart-grid)" />
              <XAxis dataKey="date" tick={{ fontSize: 11, fill: "var(--text-muted)" }} tickFormatter={d => d.slice(5)} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: "var(--text-muted)" }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ background: "var(--tooltip-bg)", border: "1px solid var(--card-border)", borderRadius: 10, color: "var(--text)", fontSize: 12 }} labelStyle={{ color: "var(--text-2)" }} formatter={v => [v.toLocaleString(), "Requests"]} />
              <Area type="monotone" dataKey="requests" stroke="var(--green)" fill="url(#cpGrad)" strokeWidth={2} dot={false} />
            </AreaChart>
          </ResponsiveContainer>
        ) : (
          <p style={{ fontSize: 13, textAlign: "center", padding: "40px 0", color: "var(--text-muted)", margin: 0 }}>No request data yet.</p>
        )}
      </div>

      {/* Recent requests */}
      <div style={{ background: "var(--card)", border: "1px solid var(--card-border)", borderRadius: 18, overflow: "hidden" }}>
        <div style={{ padding: "16px 20px", borderBottom: "1px solid var(--divider)" }}>
          <h2 style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: 700, fontSize: 13, color: "var(--text-2)", margin: 0 }}>Recent Requests</h2>
        </div>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ borderBottom: "1px solid var(--divider)", background: "var(--table-head)" }}>
              {["Endpoint", "Method", "Status", "ms", "Time"].map((h, i) => (
                <th key={h} style={{ ...th, textAlign: i > 1 ? "right" : "left" }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {usage?.recentLogs?.map((l, i) => (
              <tr key={String(l.id)} style={{ borderBottom: i < usage.recentLogs.length - 1 ? "1px solid var(--divider)" : "none" }}
                onMouseEnter={e => e.currentTarget.style.background = "var(--row-hover)"}
                onMouseLeave={e => e.currentTarget.style.background = ""}>
                <td style={{ ...td, fontFamily: "monospace", fontSize: 12, color: "var(--text-2)" }}>{l.endpoint}</td>
                <td style={{ ...td, fontSize: 12, fontWeight: 600, color: "var(--text-muted)" }}>{l.method}</td>
                <td style={{ ...td, textAlign: "right", fontSize: 12, fontWeight: 700, color: l.statusCode < 400 ? "var(--green-text)" : "var(--red-text)" }}>{l.statusCode}</td>
                <td style={{ ...td, textAlign: "right", fontSize: 12, color: "var(--text-muted)" }}>{l.responseTime}</td>
                <td style={{ ...td, textAlign: "right", fontSize: 12, color: "var(--text-muted)" }}>{new Date(l.createdAt).toLocaleTimeString()}</td>
              </tr>
            ))}
            {!usage?.recentLogs?.length && (
              <tr><td colSpan={5} style={{ padding: "40px 18px", textAlign: "center", color: "var(--text-muted)", fontSize: 13 }}>No requests yet.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
