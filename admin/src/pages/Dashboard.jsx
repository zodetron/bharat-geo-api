import { useEffect, useState } from "react";
import api from "../api/client";
import StatCard from "../components/StatCard";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

export default function Dashboard() {
  const [stats, setStats] = useState(null);
  const [daily, setDaily] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([api.get("/admin/stats"), api.get("/admin/analytics?days=14")])
      .then(([s, a]) => { setStats(s); setDaily(a.daily); })
      .finally(() => setLoading(false));
  }, []);

  const tt = { contentStyle: { background: "var(--tooltip-bg)", border: "1px solid var(--card-border)", borderRadius: 10, color: "var(--text)", fontSize: 12 }, labelStyle: { color: "var(--text-2)" } };

  if (loading) return <Spinner />;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 28 }}>
      <div>
        <h1 style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: 800, fontSize: 30, color: "var(--text)", margin: "0 0 4px" }}>Dashboard</h1>
        <p style={{ fontSize: 13, color: "var(--text-muted)", margin: 0 }}>Platform overview and activity</p>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 14 }}>
        <StatCard label="Total Users"      value={stats?.totalUsers}                            color="blue" />
        <StatCard label="Pending Approval" value={stats?.pendingUsers} sub="awaiting activation" color="yellow" />
        <StatCard label="Active API Keys"  value={stats?.activeKeys}                            color="green" />
        <StatCard label="Requests Today"   value={stats?.todayRequests?.toLocaleString()}       color="purple" />
      </div>

      <div style={{ background: "var(--card)", border: "1px solid var(--card-border)", borderRadius: 18, padding: 24 }}>
        <div style={{ marginBottom: 20 }}>
          <h2 style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: 700, fontSize: 14, color: "var(--text)", margin: "0 0 2px" }}>API Requests</h2>
          <p style={{ fontSize: 12, color: "var(--text-muted)", margin: 0 }}>Last 14 days</p>
        </div>
        <ResponsiveContainer width="100%" height={220}>
          <AreaChart data={daily} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="gradA" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%"  stopColor="var(--green)" stopOpacity={0.25} />
                <stop offset="95%" stopColor="var(--green)" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--chart-grid)" />
            <XAxis dataKey="date" tick={{ fontSize: 11, fill: "var(--text-muted)" }} tickFormatter={d => d.slice(5)} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 11, fill: "var(--text-muted)" }} axisLine={false} tickLine={false} />
            <Tooltip {...tt} formatter={v => [v.toLocaleString(), "Requests"]} />
            <Area type="monotone" dataKey="requests" stroke="var(--green)" fill="url(#gradA)" strokeWidth={2} dot={false} />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

function Spinner() {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8, paddingTop: 16, color: "var(--text-muted)", fontSize: 13 }}>
      <svg className="animate-spin" style={{ width: 16, height: 16 }} viewBox="0 0 24 24" fill="none">
        <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" strokeOpacity="0.25"/>
        <path d="M12 2a10 10 0 0 1 10 10" stroke="currentColor" strokeWidth="3" strokeLinecap="round"/>
      </svg>
      Loading…
    </div>
  );
}
