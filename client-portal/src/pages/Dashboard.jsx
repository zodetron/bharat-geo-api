import { useEffect, useState } from "react";
import api from "../api/client";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

const TOOLTIP_STYLE = { background: "#1e293b", border: "1px solid #334155", borderRadius: "10px", color: "#f1f5f9", fontSize: 12 };

function UsageBar({ percent }) {
  const color = percent > 90 ? "#ef4444" : percent > 70 ? "#f59e0b" : "#6366f1";
  return (
    <div className="mt-3">
      <div className="flex justify-between text-xs mb-1.5" style={{ color: "#475569" }}>
        <span>{percent}% used today</span>
        <span>{100 - percent}% remaining</span>
      </div>
      <div className="w-full rounded-full h-1.5" style={{ background: "#1e293b" }}>
        <div className="h-1.5 rounded-full transition-all" style={{ width: `${Math.min(percent, 100)}%`, background: color }} />
      </div>
    </div>
  );
}

export default function Dashboard() {
  const [usage, setUsage]   = useState(null);
  const [daily, setDaily]   = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([api.get("/client/usage"), api.get("/client/usage/daily?days=14")])
      .then(([u, d]) => { setUsage(u); setDaily(d.daily); })
      .finally(() => setLoading(false));
  }, []);

  if (loading) return (
    <div className="flex items-center gap-2 pt-4" style={{ color: "#475569" }}>
      <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" strokeOpacity="0.25"/><path d="M12 2a10 10 0 0 1 10 10" stroke="currentColor" strokeWidth="3" strokeLinecap="round"/></svg>
      <span className="text-sm">Loading…</span>
    </div>
  );

  const PLAN_COLOR = { FREE: "#64748b", PREMIUM: "#6366f1", PRO: "#8b5cf6", UNLIMITED: "#f59e0b" };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-extrabold" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", color: "#f1f5f9" }}>Dashboard</h1>
        <p className="text-sm mt-1" style={{ color: "#475569" }}>Your usage and API activity</p>
      </div>

      {/* API Key Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {usage?.apiKeys?.length === 0 ? (
          <div className="col-span-2 rounded-2xl p-8 text-center" style={{ background: "#0f172a", border: "1px dashed #1e293b" }}>
            <p className="font-semibold text-sm" style={{ color: "#818cf8" }}>No active API keys</p>
            <p className="text-xs mt-1" style={{ color: "#475569" }}>Go to API Keys to generate your first key.</p>
          </div>
        ) : null}
        {usage?.apiKeys?.map(k => (
          <div key={k.id} className="rounded-2xl p-5" style={{ background: "#0f172a", border: "1px solid #1e293b" }}>
            <div className="flex items-center justify-between mb-4">
              <code className="text-xs font-mono" style={{ color: "#94a3b8" }}>{k.keyPrefix}…</code>
              <span className="px-2.5 py-1 rounded-lg text-xs font-bold" style={{ background: `${PLAN_COLOR[k.plan]}15`, color: PLAN_COLOR[k.plan], border: `1px solid ${PLAN_COLOR[k.plan]}30` }}>
                {k.plan}
              </span>
            </div>
            <div className="flex justify-between items-end">
              <div>
                <p className="text-3xl font-extrabold" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", color: "#f1f5f9" }}>{k.usedToday.toLocaleString()}</p>
                <p className="text-xs mt-0.5" style={{ color: "#475569" }}>requests today</p>
              </div>
              <div className="text-right">
                <p className="text-xl font-bold" style={{ color: "#6ee7b7" }}>{k.remaining.toLocaleString()}</p>
                <p className="text-xs mt-0.5" style={{ color: "#475569" }}>remaining</p>
              </div>
            </div>
            <UsageBar percent={k.percentUsed} />
          </div>
        ))}
      </div>

      {/* Chart */}
      <div className="rounded-2xl p-6" style={{ background: "#0f172a", border: "1px solid #1e293b" }}>
        <h2 className="text-sm font-bold mb-5" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", color: "#cbd5e1" }}>Request History — 14 days</h2>
        {daily.length ? (
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={daily} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="grad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor="#6366f1" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
              <XAxis dataKey="date" tick={{ fontSize: 11, fill: "#475569" }} tickFormatter={d => d.slice(5)} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: "#475569" }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={TOOLTIP_STYLE} labelStyle={{ color: "#94a3b8" }} formatter={v => [v.toLocaleString(), "Requests"]} />
              <Area type="monotone" dataKey="requests" stroke="#6366f1" fill="url(#grad)" strokeWidth={2} dot={false} />
            </AreaChart>
          </ResponsiveContainer>
        ) : (
          <p className="text-sm text-center py-12" style={{ color: "#334155" }}>No request data yet.</p>
        )}
      </div>

      {/* Recent requests */}
      <div className="rounded-2xl" style={{ background: "#0f172a", border: "1px solid #1e293b" }}>
        <div className="px-6 pt-5 pb-4" style={{ borderBottom: "1px solid #1e293b" }}>
          <h2 className="text-sm font-bold" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", color: "#cbd5e1" }}>Recent Requests</h2>
        </div>
        <table className="w-full text-sm">
          <thead>
            <tr style={{ borderBottom: "1px solid #1e293b" }}>
              {["Endpoint", "Method", "Status", "ms", "Time"].map((h, i) => (
                <th key={h} className={`px-6 py-3 text-xs font-semibold uppercase tracking-wide ${i > 1 ? "text-right" : "text-left"}`} style={{ color: "#475569" }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {usage?.recentLogs?.map((l, i) => (
              <tr key={String(l.id)} style={{ borderBottom: i < usage.recentLogs.length - 1 ? "1px solid #1e293b" : "none" }}>
                <td className="px-6 py-3 font-mono text-xs" style={{ color: "#94a3b8" }}>{l.endpoint}</td>
                <td className="px-6 py-3 text-xs font-semibold" style={{ color: "#64748b" }}>{l.method}</td>
                <td className={`px-6 py-3 text-xs font-bold text-right`} style={{ color: l.statusCode < 400 ? "#6ee7b7" : "#f87171" }}>{l.statusCode}</td>
                <td className="px-6 py-3 text-xs text-right" style={{ color: "#475569" }}>{l.responseTime}</td>
                <td className="px-6 py-3 text-xs text-right" style={{ color: "#475569" }}>{new Date(l.createdAt).toLocaleTimeString()}</td>
              </tr>
            ))}
            {!usage?.recentLogs?.length && (
              <tr><td colSpan={5} className="px-6 py-10 text-center text-sm" style={{ color: "#334155" }}>No requests yet.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
