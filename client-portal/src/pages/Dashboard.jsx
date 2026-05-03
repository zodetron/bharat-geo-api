import { useEffect, useState } from "react";
import api from "../api/client";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

function UsageBar({ percent, plan }) {
  const color = percent > 90 ? "bg-red-500" : percent > 70 ? "bg-yellow-500" : "bg-indigo-500";
  return (
    <div className="mt-1">
      <div className="flex justify-between text-xs text-gray-500 mb-1">
        <span>{plan}</span>
        <span>{percent}% used</span>
      </div>
      <div className="w-full bg-gray-100 rounded-full h-2">
        <div className={`h-2 rounded-full ${color}`} style={{ width: `${percent}%` }} />
      </div>
    </div>
  );
}

export default function Dashboard() {
  const [usage, setUsage]   = useState(null);
  const [daily, setDaily]   = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.get("/client/usage"),
      api.get("/client/usage/daily?days=14"),
    ]).then(([u, d]) => {
      setUsage(u);
      setDaily(d.daily);
    }).finally(() => setLoading(false));
  }, []);

  if (loading) return <p className="text-gray-400 text-sm">Loading…</p>;

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>

      {/* API Key Usage Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {usage?.apiKeys?.length === 0 && (
          <div className="col-span-2 bg-indigo-50 border border-indigo-200 rounded-xl p-6 text-center">
            <p className="text-indigo-700 font-medium">No active API keys</p>
            <p className="text-sm text-indigo-500 mt-1">Go to API Keys to generate your first key.</p>
          </div>
        )}
        {usage?.apiKeys?.map((k) => (
          <div key={k.id} className="bg-white border border-gray-200 rounded-xl p-5">
            <div className="flex items-center justify-between mb-2">
              <code className="text-sm text-gray-700 font-mono">{k.keyPrefix}…</code>
              <span className="text-xs bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-full font-medium">
                {k.plan}
              </span>
            </div>
            <div className="flex justify-between text-sm mt-3">
              <div>
                <p className="text-2xl font-bold text-gray-900">{k.usedToday.toLocaleString()}</p>
                <p className="text-xs text-gray-400">used today</p>
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold text-green-600">{k.remaining.toLocaleString()}</p>
                <p className="text-xs text-gray-400">remaining</p>
              </div>
            </div>
            <UsageBar percent={k.percentUsed} plan={`${k.limit.toLocaleString()} / day`} />
          </div>
        ))}
      </div>

      {/* 14-day usage chart */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h2 className="text-sm font-semibold text-gray-700 mb-4">Your requests — last 14 days</h2>
        {daily.length ? (
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={daily} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="grad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor="#6366f1" stopOpacity={0.2} />
                  <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="date" tick={{ fontSize: 11 }} tickFormatter={(d) => d.slice(5)} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip formatter={(v) => [v.toLocaleString(), "Requests"]} />
              <Area type="monotone" dataKey="requests" stroke="#6366f1" fill="url(#grad)" strokeWidth={2} dot={false} />
            </AreaChart>
          </ResponsiveContainer>
        ) : (
          <p className="text-gray-400 text-sm py-10 text-center">No request data yet.</p>
        )}
      </div>

      {/* Recent requests */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h2 className="text-sm font-semibold text-gray-700 mb-4">Recent Requests</h2>
        <table className="w-full text-sm">
          <thead>
            <tr className="text-xs text-gray-400 uppercase border-b border-gray-100">
              <th className="pb-2 text-left">Endpoint</th>
              <th className="pb-2 text-left">Method</th>
              <th className="pb-2 text-right">Status</th>
              <th className="pb-2 text-right">ms</th>
              <th className="pb-2 text-right">Time</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {usage?.recentLogs?.map((l) => (
              <tr key={String(l.id)} className="text-gray-700">
                <td className="py-2 font-mono text-xs text-gray-600">{l.endpoint}</td>
                <td className="py-2 text-xs text-gray-500">{l.method}</td>
                <td className={`py-2 text-right text-xs font-medium ${l.statusCode < 400 ? "text-green-600" : "text-red-500"}`}>
                  {l.statusCode}
                </td>
                <td className="py-2 text-right text-xs text-gray-400">{l.responseTime}</td>
                <td className="py-2 text-right text-xs text-gray-400">
                  {new Date(l.createdAt).toLocaleTimeString()}
                </td>
              </tr>
            ))}
            {!usage?.recentLogs?.length && (
              <tr><td colSpan={5} className="py-6 text-center text-gray-400 text-xs">No requests yet.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
