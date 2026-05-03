import { useEffect, useState } from "react";
import api from "../api/client";
import StatCard from "../components/StatCard";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

const TOOLTIP_STYLE = { background: "#1e293b", border: "1px solid #334155", borderRadius: "10px", color: "#f1f5f9", fontSize: 12 };

export default function Dashboard() {
  const [stats, setStats] = useState(null);
  const [daily, setDaily] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([api.get("/admin/stats"), api.get("/admin/analytics?days=14")])
      .then(([s, a]) => { setStats(s); setDaily(a.daily); })
      .finally(() => setLoading(false));
  }, []);

  if (loading) return (
    <div className="flex items-center gap-2 pt-4" style={{ color: "#475569" }}>
      <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" strokeOpacity="0.25"/><path d="M12 2a10 10 0 0 1 10 10" stroke="currentColor" strokeWidth="3" strokeLinecap="round"/></svg>
      <span className="text-sm">Loading…</span>
    </div>
  );

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-extrabold" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", color: "#f1f5f9" }}>Dashboard</h1>
        <p className="text-sm mt-1" style={{ color: "#475569" }}>Platform overview and activity</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Total Users"      value={stats?.totalUsers}                            color="blue" />
        <StatCard label="Pending Approval" value={stats?.pendingUsers} sub="awaiting activation" color="yellow" />
        <StatCard label="Active API Keys"  value={stats?.activeKeys}                            color="green" />
        <StatCard label="Requests Today"   value={stats?.todayRequests?.toLocaleString()}       color="purple" />
      </div>

      <div className="rounded-2xl p-6" style={{ background: "#0f172a", border: "1px solid #1e293b" }}>
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-sm font-bold" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", color: "#cbd5e1" }}>API Requests</h2>
            <p className="text-xs mt-0.5" style={{ color: "#475569" }}>Last 14 days</p>
          </div>
        </div>
        <ResponsiveContainer width="100%" height={220}>
          <AreaChart data={daily} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="grad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%"  stopColor="#8b5cf6" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
            <XAxis dataKey="date" tick={{ fontSize: 11, fill: "#475569" }} tickFormatter={(d) => d.slice(5)} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 11, fill: "#475569" }} axisLine={false} tickLine={false} />
            <Tooltip contentStyle={TOOLTIP_STYLE} labelStyle={{ color: "#94a3b8" }} formatter={(v) => [v.toLocaleString(), "Requests"]} />
            <Area type="monotone" dataKey="requests" stroke="#8b5cf6" fill="url(#grad)" strokeWidth={2} dot={false} />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
