import { useEffect, useState } from "react";
import api from "../api/client";
import StatCard from "../components/StatCard";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer,
} from "recharts";

export default function Dashboard() {
  const [stats, setStats]   = useState(null);
  const [daily, setDaily]   = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.get("/admin/stats"),
      api.get("/admin/analytics?days=14"),
    ]).then(([s, a]) => {
      setStats(s);
      setDaily(a.daily);
    }).finally(() => setLoading(false));
  }, []);

  if (loading) return <p className="text-gray-400 text-sm">Loading…</p>;

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Total Users"    value={stats?.totalUsers}    color="blue" />
        <StatCard label="Pending Approval" value={stats?.pendingUsers} color="yellow"
          sub="awaiting activation" />
        <StatCard label="Active API Keys" value={stats?.activeKeys}   color="green" />
        <StatCard label="Requests Today" value={stats?.todayRequests?.toLocaleString()} color="purple" />
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h2 className="text-sm font-semibold text-gray-700 mb-4">Requests — last 14 days</h2>
        <ResponsiveContainer width="100%" height={220}>
          <AreaChart data={daily} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="grad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%"  stopColor="#3b82f6" stopOpacity={0.2} />
                <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis dataKey="date" tick={{ fontSize: 11 }} tickFormatter={(d) => d.slice(5)} />
            <YAxis tick={{ fontSize: 11 }} />
            <Tooltip
              formatter={(v) => [v.toLocaleString(), "Requests"]}
              labelFormatter={(d) => `Date: ${d}`}
            />
            <Area type="monotone" dataKey="requests" stroke="#3b82f6"
              fill="url(#grad)" strokeWidth={2} dot={false} />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
