import { useEffect, useState } from "react";
import api from "../api/client";

export default function ApiKeys() {
  const [keys, setKeys]         = useState([]);
  const [newKey, setNewKey]     = useState(null);
  const [creating, setCreating] = useState(false);
  const [revoking, setRevoking] = useState(null);
  const [error, setError]       = useState("");

  async function load() {
    const res = await api.get("/api-keys");
    setKeys(res.keys);
  }

  useEffect(() => { load(); }, []);

  async function create() {
    setError("");
    setCreating(true);
    try {
      const res = await api.post("/api-keys", {});
      setNewKey(res.apiKey);
      await load();
    } catch (e) {
      setError(e.error || "Failed to create key");
    } finally {
      setCreating(false);
    }
  }

  async function revoke(id) {
    if (!confirm("Revoke this API key? This cannot be undone.")) return;
    setRevoking(id);
    try {
      await api.delete(`/api-keys/${id}`);
      setKeys((ks) => ks.filter((k) => k.id !== id));
    } catch (e) {
      alert(e.error || "Failed to revoke");
    } finally {
      setRevoking(null);
    }
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">API Keys</h1>

      {/* New key banner — shown once */}
      {newKey && (
        <div className="bg-green-50 border border-green-200 rounded-xl p-5">
          <p className="text-sm font-semibold text-green-800 mb-2">
            API key generated — copy it now, it won't be shown again.
          </p>
          <div className="flex items-center gap-3">
            <code className="flex-1 bg-white border border-green-300 rounded-lg px-3 py-2 text-sm font-mono text-gray-800 break-all">
              {newKey}
            </code>
            <button
              onClick={() => { navigator.clipboard.writeText(newKey); }}
              className="text-xs bg-green-600 text-white px-3 py-2 rounded-lg hover:bg-green-700"
            >
              Copy
            </button>
          </div>
          <button onClick={() => setNewKey(null)} className="mt-3 text-xs text-green-600 hover:underline">
            Dismiss
          </button>
        </div>
      )}

      {/* Create key */}
      <div className="bg-white border border-gray-200 rounded-xl p-5">
        <h2 className="text-sm font-semibold text-gray-700 mb-4">Generate New Key</h2>
        {error && (
          <div className="mb-3 px-3 py-2 bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg">
            {error}
          </div>
        )}
        <div className="flex items-center gap-3">
          <p className="text-xs text-gray-500">New keys start on the FREE plan. Contact admin to upgrade your plan.</p>
          <button
            onClick={create} disabled={creating}
            className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-indigo-700 disabled:opacity-50 transition-colors whitespace-nowrap"
          >
            {creating ? "Generating…" : "Generate Key"}
          </button>
        </div>
      </div>

      {/* Key list */}
      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              {["Key Prefix", "Plan", "Status", "Created", "Expires", ""].map((h) => (
                <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {keys.map((k) => (
              <tr key={k.id} className="hover:bg-gray-50">
                <td className="px-4 py-3 font-mono text-sm text-gray-700">{k.keyPrefix}…</td>
                <td className="px-4 py-3">
                  <span className="px-2 py-0.5 bg-indigo-100 text-indigo-700 text-xs rounded-full font-medium">
                    {k.plan}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <span className={`px-2 py-0.5 text-xs rounded-full font-medium ${
                    k.isActive ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"
                  }`}>
                    {k.isActive ? "Active" : "Revoked"}
                  </span>
                </td>
                <td className="px-4 py-3 text-gray-400 text-xs">
                  {new Date(k.createdAt).toLocaleDateString()}
                </td>
                <td className="px-4 py-3 text-gray-400 text-xs">
                  {k.expiresAt ? new Date(k.expiresAt).toLocaleDateString() : "Never"}
                </td>
                <td className="px-4 py-3">
                  {k.isActive && (
                    <button
                      onClick={() => revoke(k.id)}
                      disabled={revoking === k.id}
                      className="text-xs text-red-500 hover:text-red-700 font-medium disabled:opacity-40"
                    >
                      Revoke
                    </button>
                  )}
                </td>
              </tr>
            ))}
            {keys.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-gray-400 text-sm">
                  No API keys yet. Generate one above.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
