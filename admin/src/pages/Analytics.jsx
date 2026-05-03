import { useEffect, useState } from "react";
import api from "../api/client";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";

const PIE_COLORS = ["var(--green)", "var(--purple)", "#f59e0b", "#3b82f6"];

export default function Analytics() {
  const [data, setData]   = useState(null);
  const [days, setDays]   = useState(30);
  const [loading, setLoading] = useState(true);

  useEffect(() => { setLoading(true); api.get(`/admin/analytics?days=${days}`).then(setData).finally(() => setLoading(false)); }, [days]);

  const tt = { contentStyle: { background: "var(--tooltip-bg)", border: "1px solid var(--card-border)", borderRadius: 10, color: "var(--text)", fontSize: 12 }, labelStyle: { color: "var(--text-2)" } };
  const sel = { background: "var(--input)", border: "1px solid var(--input-border)", color: "var(--text)", padding: "8px 14px", borderRadius: 10, fontSize: 13, outline: "none", cursor: "pointer" };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 28 }}>
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}>
        <div>
          <h1 style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: 800, fontSize: 30, color: "var(--text)", margin: "0 0 4px" }}>Analytics</h1>
          <p style={{ fontSize: 13, color: "var(--text-muted)", margin: 0 }}>Request volume and endpoint breakdown</p>
        </div>
        <select value={days} onChange={e => setDays(Number(e.target.value))} style={sel}>
          <option value={7}>Last 7 days</option>
          <option value={30}>Last 30 days</option>
          <option value={90}>Last 90 days</option>
        </select>
      </div>

      {loading ? <Spinner /> : (
        <>
          <Card title="Daily Requests">
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={data?.daily || []} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--chart-grid)" />
                <XAxis dataKey="date" tick={{ fontSize: 11, fill: "var(--text-muted)" }} tickFormatter={d => d.slice(5)} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: "var(--text-muted)" }} axisLine={false} tickLine={false} />
                <Tooltip {...tt} formatter={v => [v.toLocaleString(), "Requests"]} />
                <Bar dataKey="requests" fill="var(--green)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </Card>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
            <Card title="Top Endpoints">
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
                <thead>
                  <tr style={{ borderBottom: "1px solid var(--divider)" }}>
                    {["Endpoint","Requests","Avg ms","Errors"].map((h,i) => (
                      <th key={h} style={{ padding: "0 0 10px", textAlign: i === 0 ? "left" : "right", fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", color: "var(--text-muted)" }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {(data?.endpoints || []).map((e, i, arr) => (
                    <tr key={e.endpoint} style={{ borderBottom: i < arr.length - 1 ? "1px solid var(--divider)" : "none" }}>
                      <td style={{ padding: "10px 0", fontFamily: "monospace", fontSize: 11, color: "var(--text-2)", maxWidth: 140, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{e.endpoint}</td>
                      <td style={{ padding: "10px 0", textAlign: "right", color: "var(--text)" }}>{e.total.toLocaleString()}</td>
                      <td style={{ padding: "10px 0", textAlign: "right", color: "var(--text)" }}>{e.avgMs}</td>
                      <td style={{ padding: "10px 0", textAlign: "right", color: e.errors > 0 ? "var(--red-text)" : "var(--text-muted)" }}>{e.errors}</td>
                    </tr>
                  ))}
                  {!data?.endpoints?.length && <tr><td colSpan={4} style={{ padding: "28px 0", textAlign: "center", color: "var(--text-muted)", fontSize: 13 }}>No data</td></tr>}
                </tbody>
              </table>
            </Card>

            <Card title="Keys by Plan">
              {data?.plans?.length ? (
                <ResponsiveContainer width="100%" height={220}>
                  <PieChart>
                    <Pie data={data.plans} dataKey="count" nameKey="plan" cx="50%" cy="50%" outerRadius={80} label={({ plan, percent }) => `${plan} ${(percent * 100).toFixed(0)}%`}>
                      {data.plans.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                    </Pie>
                    <Tooltip {...tt} />
                  </PieChart>
                </ResponsiveContainer>
              ) : <p style={{ textAlign: "center", color: "var(--text-muted)", fontSize: 13, padding: "40px 0" }}>No active keys</p>}
            </Card>
          </div>
        </>
      )}
    </div>
  );
}

function Card({ title, children }) {
  return (
    <div style={{ background: "var(--card)", border: "1px solid var(--card-border)", borderRadius: 18, padding: 24 }}>
      <h2 style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: 700, fontSize: 14, color: "var(--text)", margin: "0 0 18px" }}>{title}</h2>
      {children}
    </div>
  );
}

function Spinner() {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8, color: "var(--text-muted)", fontSize: 13 }}>
      <svg className="animate-spin" style={{ width: 16, height: 16 }} viewBox="0 0 24 24" fill="none">
        <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" strokeOpacity="0.25"/>
        <path d="M12 2a10 10 0 0 1 10 10" stroke="currentColor" strokeWidth="3" strokeLinecap="round"/>
      </svg>Loading…
    </div>
  );
}
