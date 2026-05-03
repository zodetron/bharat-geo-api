import { useEffect, useState } from "react";
import api from "../api/client";

const PLANS = ["FREE", "PREMIUM", "PRO", "UNLIMITED"];

export default function ApiKeys() {
  const [keys, setKeys]       = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving]   = useState(null);
  const [error, setError]     = useState("");

  async function load() {
    try {
      const res = await api.get("/admin/api-keys");
      setKeys(res.keys);
    } catch {
      setError("Failed to load API keys");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  async function changePlan(id, plan) {
    setSaving(id);
    try {
      await api.patch(`/admin/api-keys/${id}`, { plan });
      setKeys((ks) => ks.map((k) => k.id === id ? { ...k, plan } : k));
    } catch (e) {
      alert(e.error || "Failed to update plan");
    } finally {
      setSaving(null);
    }
  }

  async function toggleActive(id, isActive) {
    setSaving(id);
    try {
      await api.patch(`/admin/api-keys/${id}`, { isActive: !isActive });
      setKeys((ks) => ks.map((k) => k.id === id ? { ...k, isActive: !isActive } : k));
    } catch (e) {
      alert(e.error || "Failed to update key");
    } finally {
      setSaving(null);
    }
  }

  if (loading) return <p className="text-gray-400 text-sm">Loading…</p>;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">API Keys</h1>

      {error && (
        <div className="px-4 py-3 bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl">{error}</div>
      )}

      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              {["User", "Key Prefix", "Plan", "Status", "Created", "Actions"].map((h) => (
                <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {keys.map((k) => (
              <tr key={k.id} className="hover:bg-gray-50">
                <td className="px-4 py-3">
                  <p className="text-sm text-gray-800 font-medium">{k.user?.fullName || "—"}</p>
                  <p className="text-xs text-gray-400">{k.user?.email}</p>
                </td>
                <td className="px-4 py-3 font-mono text-xs text-gray-600">{k.keyPrefix}…</td>
                <td className="px-4 py-3">
                  <select
                    value={k.plan}
                    disabled={saving === k.id}
                    onChange={(e) => changePlan(k.id, e.target.value)}
                    className="border border-gray-300 rounded-lg px-2 py-1 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-50"
                  >
                    {PLANS.map((p) => <option key={p} value={p}>{p}</option>)}
                  </select>
                </td>
                <td className="px-4 py-3">
                  <span className={`px-2 py-0.5 text-xs rounded-full font-medium ${
                    k.isActive ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"
                  }`}>
                    {k.isActive ? "Active" : "Revoked"}
                  </span>
                </td>
                <td className="px-4 py-3 text-xs text-gray-400">
                  {new Date(k.createdAt).toLocaleDateString()}
                </td>
                <td className="px-4 py-3">
                  <button
                    onClick={() => toggleActive(k.id, k.isActive)}
                    disabled={saving === k.id}
                    className={`text-xs font-medium disabled:opacity-40 ${
                      k.isActive ? "text-red-500 hover:text-red-700" : "text-green-600 hover:text-green-800"
                    }`}
                  >
                    {saving === k.id ? "…" : k.isActive ? "Revoke" : "Reinstate"}
                  </button>
                </td>
              </tr>
            ))}
            {keys.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-gray-400 text-sm">No API keys yet.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
