import { useEffect, useState } from "react";
import api from "../api/client";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from "recharts";

const PIE_COLORS = ["#8b5cf6", "#6366f1", "#10b981", "#f59e0b"];
const TOOLTIP_STYLE = { background: "#1e293b", border: "1px solid #334155", borderRadius: "10px", color: "#f1f5f9", fontSize: 12 };

export default function Analytics() {
  const [data, setData]   = useState(null);
  const [days, setDays]   = useState(30);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    api.get(`/admin/analytics?days=${days}`).then(setData).finally(() => setLoading(false));
  }, [days]);

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-extrabold" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", color: "#f1f5f9" }}>Analytics</h1>
          <p className="text-sm mt-1" style={{ color: "#475569" }}>Request volume and endpoint breakdown</p>
        </div>
        <select
          value={days}
          onChange={(e) => setDays(Number(e.target.value))}
          className="px-4 py-2 rounded-xl text-sm font-medium outline-none"
          style={{ background: "#1e293b", border: "1px solid #334155", color: "#cbd5e1" }}
        >
          <option value={7}>Last 7 days</option>
          <option value={30}>Last 30 days</option>
          <option value={90}>Last 90 days</option>
        </select>
      </div>

      {loading ? (
        <div className="flex items-center gap-2" style={{ color: "#475569" }}>
          <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" strokeOpacity="0.25"/><path d="M12 2a10 10 0 0 1 10 10" stroke="currentColor" strokeWidth="3" strokeLinecap="round"/></svg>
          <span className="text-sm">Loading…</span>
        </div>
      ) : (
        <>
          <div className="rounded-2xl p-6" style={{ background: "#0f172a", border: "1px solid #1e293b" }}>
            <h2 className="text-sm font-bold mb-5" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", color: "#cbd5e1" }}>Daily Requests</h2>
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={data?.daily || []} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="date" tick={{ fontSize: 11, fill: "#475569" }} tickFormatter={(d) => d.slice(5)} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: "#475569" }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={TOOLTIP_STYLE} labelStyle={{ color: "#94a3b8" }} formatter={(v) => [v.toLocaleString(), "Requests"]} />
                <Bar dataKey="requests" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="rounded-2xl p-6" style={{ background: "#0f172a", border: "1px solid #1e293b" }}>
              <h2 className="text-sm font-bold mb-5" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", color: "#cbd5e1" }}>Top Endpoints</h2>
              <table className="w-full text-sm">
                <thead>
                  <tr style={{ borderBottom: "1px solid #1e293b" }}>
                    {["Endpoint", "Requests", "Avg ms", "Errors"].map(h => (
                      <th key={h} className={`pb-3 text-xs font-semibold uppercase tracking-wide ${h !== "Endpoint" ? "text-right" : "text-left"}`} style={{ color: "#475569" }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {(data?.endpoints || []).map((e, i) => (
                    <tr key={e.endpoint} style={{ borderBottom: i < data.endpoints.length - 1 ? "1px solid #1e293b" : "none" }}>
                      <td className="py-3 font-mono text-xs truncate max-w-[150px]" style={{ color: "#94a3b8" }}>{e.endpoint}</td>
                      <td className="py-3 text-right text-sm" style={{ color: "#cbd5e1" }}>{e.total.toLocaleString()}</td>
                      <td className="py-3 text-right text-sm" style={{ color: "#cbd5e1" }}>{e.avgMs}</td>
                      <td className="py-3 text-right text-sm font-medium" style={{ color: e.errors > 0 ? "#f87171" : "#475569" }}>{e.errors}</td>
                    </tr>
                  ))}
                  {!data?.endpoints?.length && (
                    <tr><td colSpan={4} className="py-8 text-center text-sm" style={{ color: "#334155" }}>No data for this period</td></tr>
                  )}
                </tbody>
              </table>
            </div>

            <div className="rounded-2xl p-6" style={{ background: "#0f172a", border: "1px solid #1e293b" }}>
              <h2 className="text-sm font-bold mb-5" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", color: "#cbd5e1" }}>Keys by Plan</h2>
              {data?.plans?.length ? (
                <ResponsiveContainer width="100%" height={220}>
                  <PieChart>
                    <Pie data={data.plans} dataKey="count" nameKey="plan" cx="50%" cy="50%" outerRadius={75} label={({ plan, percent }) => `${plan} ${(percent * 100).toFixed(0)}%`} labelLine={{ stroke: "#334155" }}>
                      {data.plans.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                    </Pie>
                    <Tooltip contentStyle={TOOLTIP_STYLE} />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <p className="text-sm text-center py-16" style={{ color: "#334155" }}>No active keys</p>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
