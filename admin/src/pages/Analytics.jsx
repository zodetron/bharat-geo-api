import { useEffect, useState } from "react";
import api from "../api/client";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
} from "recharts";

const PIE_COLORS = ["#3b82f6", "#8b5cf6", "#10b981", "#f59e0b"];

export default function Analytics() {
  const [data, setData]     = useState(null);
  const [days, setDays]     = useState(30);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    api.get(`/admin/analytics?days=${days}`)
      .then(setData)
      .finally(() => setLoading(false));
  }, [days]);

  if (loading) return <p className="text-gray-400 text-sm">Loading…</p>;

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Analytics</h1>
        <select
          value={days}
          onChange={(e) => setDays(Number(e.target.value))}
          className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value={7}>Last 7 days</option>
          <option value={30}>Last 30 days</option>
          <option value={90}>Last 90 days</option>
        </select>
      </div>

      {/* Daily bar chart */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h2 className="text-sm font-semibold text-gray-700 mb-4">Daily Requests</h2>
        <ResponsiveContainer width="100%" height={240}>
          <BarChart data={data?.daily || []} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis dataKey="date" tick={{ fontSize: 11 }} tickFormatter={(d) => d.slice(5)} />
            <YAxis tick={{ fontSize: 11 }} />
            <Tooltip formatter={(v) => [v.toLocaleString(), "Requests"]} />
            <Bar dataKey="requests" fill="#3b82f6" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top endpoints */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="text-sm font-semibold text-gray-700 mb-4">Top Endpoints</h2>
          <table className="w-full text-sm">
            <thead>
              <tr className="text-xs text-gray-400 uppercase border-b border-gray-100">
                <th className="pb-2 text-left">Endpoint</th>
                <th className="pb-2 text-right">Requests</th>
                <th className="pb-2 text-right">Avg ms</th>
                <th className="pb-2 text-right">Errors</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {(data?.endpoints || []).map((e) => (
                <tr key={e.endpoint} className="text-gray-700">
                  <td className="py-2 font-mono text-xs text-gray-600 truncate max-w-[160px]">{e.endpoint}</td>
                  <td className="py-2 text-right">{e.total.toLocaleString()}</td>
                  <td className="py-2 text-right">{e.avgMs}</td>
                  <td className="py-2 text-right text-red-500">{e.errors}</td>
                </tr>
              ))}
              {!data?.endpoints?.length && (
                <tr><td colSpan={4} className="py-6 text-center text-gray-400 text-xs">No data</td></tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Plan distribution pie */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="text-sm font-semibold text-gray-700 mb-4">Active Keys by Plan</h2>
          {data?.plans?.length ? (
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie
                  data={data.plans} dataKey="count" nameKey="plan"
                  cx="50%" cy="50%" outerRadius={80} label={({ plan, percent }) =>
                    `${plan} ${(percent * 100).toFixed(0)}%`
                  }
                >
                  {data.plans.map((_, i) => (
                    <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                  ))}
                </Pie>
                <Legend />
                <Tooltip formatter={(v, name) => [v, name]} />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-gray-400 text-sm text-center py-16">No active keys</p>
          )}
        </div>
      </div>
    </div>
  );
}
