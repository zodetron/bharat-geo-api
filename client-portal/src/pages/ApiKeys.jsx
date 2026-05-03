import { useEffect, useState } from "react";
import api from "../api/client";

export default function ApiKeys() {
  const [keys, setKeys]         = useState([]);
  const [newKey, setNewKey]     = useState(null);
  const [creating, setCreating] = useState(false);
  const [revoking, setRevoking] = useState(null);
  const [copied, setCopied]     = useState(false);
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
      setKeys(ks => ks.filter(k => k.id !== id));
    } catch (e) {
      alert(e.error || "Failed to revoke");
    } finally {
      setRevoking(null);
    }
  }

  function copyKey() {
    navigator.clipboard.writeText(newKey);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  const PLAN_COLOR = { FREE: "#64748b", PREMIUM: "#6366f1", PRO: "#8b5cf6", UNLIMITED: "#f59e0b" };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-extrabold" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", color: "#f1f5f9" }}>API Keys</h1>
        <p className="text-sm mt-1" style={{ color: "#475569" }}>Generate and manage your access keys</p>
      </div>

      {/* New key reveal */}
      {newKey && (
        <div className="rounded-2xl p-5" style={{ background: "rgba(16,185,129,0.08)", border: "1px solid rgba(16,185,129,0.25)" }}>
          <div className="flex items-center gap-2 mb-3">
            <svg viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4"><polyline points="20 6 9 17 4 12"/></svg>
            <p className="text-sm font-semibold" style={{ color: "#6ee7b7" }}>Key generated — copy it now, it won't be shown again</p>
          </div>
          <div className="flex items-center gap-3">
            <code className="flex-1 px-4 py-3 rounded-xl text-xs font-mono break-all" style={{ background: "#0f172a", border: "1px solid #1e293b", color: "#a5b4fc" }}>
              {newKey}
            </code>
            <button onClick={copyKey}
              className="px-4 py-3 rounded-xl text-xs font-semibold whitespace-nowrap transition-all"
              style={{ background: copied ? "rgba(16,185,129,0.2)" : "rgba(16,185,129,0.15)", color: copied ? "#6ee7b7" : "#34d399", border: "1px solid rgba(16,185,129,0.3)" }}>
              {copied ? "Copied!" : "Copy"}
            </button>
          </div>
          <button onClick={() => setNewKey(null)} className="mt-3 text-xs" style={{ color: "#475569" }}>Dismiss</button>
        </div>
      )}

      {/* Generate */}
      <div className="rounded-2xl p-5 flex items-center justify-between gap-4" style={{ background: "#0f172a", border: "1px solid #1e293b" }}>
        <div>
          <p className="text-sm font-semibold" style={{ color: "#cbd5e1" }}>Generate New Key</p>
          <p className="text-xs mt-0.5" style={{ color: "#475569" }}>New keys start on the FREE plan. Contact admin to upgrade.</p>
          {error && <p className="text-xs mt-2" style={{ color: "#f87171" }}>{error}</p>}
        </div>
        <button onClick={create} disabled={creating}
          className="px-5 py-2.5 rounded-xl text-sm font-semibold whitespace-nowrap transition-all disabled:opacity-50"
          style={{ background: "linear-gradient(135deg, #6366f1, #3b82f6)", color: "white" }}>
          {creating ? "Generating…" : "+ Generate Key"}
        </button>
      </div>

      {/* Key list */}
      <div className="rounded-2xl overflow-hidden" style={{ background: "#0f172a", border: "1px solid #1e293b" }}>
        <table className="w-full text-sm">
          <thead>
            <tr style={{ borderBottom: "1px solid #1e293b", background: "rgba(30,41,59,0.5)" }}>
              {["Key Prefix", "Plan", "Status", "Created", "Expires", ""].map(h => (
                <th key={h} className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wider" style={{ color: "#475569" }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {keys.map((k, i) => (
              <tr key={k.id} style={{ borderBottom: i < keys.length - 1 ? "1px solid #1e293b" : "none" }}
                onMouseEnter={e => e.currentTarget.style.background = "rgba(30,41,59,0.4)"}
                onMouseLeave={e => e.currentTarget.style.background = ""}>
                <td className="px-5 py-4 font-mono text-xs" style={{ color: "#94a3b8" }}>{k.keyPrefix}…</td>
                <td className="px-5 py-4">
                  <span className="px-2.5 py-1 rounded-lg text-xs font-bold" style={{ background: `${PLAN_COLOR[k.plan]}15`, color: PLAN_COLOR[k.plan] }}>
                    {k.plan}
                  </span>
                </td>
                <td className="px-5 py-4">
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold"
                    style={k.isActive
                      ? { background: "rgba(16,185,129,0.1)", color: "#6ee7b7", border: "1px solid rgba(16,185,129,0.2)" }
                      : { background: "rgba(100,116,139,0.1)", color: "#64748b", border: "1px solid rgba(100,116,139,0.2)" }}>
                    <span className="w-1.5 h-1.5 rounded-full" style={{ background: k.isActive ? "#10b981" : "#475569" }} />
                    {k.isActive ? "Active" : "Revoked"}
                  </span>
                </td>
                <td className="px-5 py-4 text-xs" style={{ color: "#475569" }}>{new Date(k.createdAt).toLocaleDateString()}</td>
                <td className="px-5 py-4 text-xs" style={{ color: "#475569" }}>{k.expiresAt ? new Date(k.expiresAt).toLocaleDateString() : "Never"}</td>
                <td className="px-5 py-4">
                  {k.isActive && (
                    <button onClick={() => revoke(k.id)} disabled={revoking === k.id}
                      className="text-xs font-semibold transition-colors disabled:opacity-40"
                      style={{ color: "#f87171" }}
                      onMouseEnter={e => e.currentTarget.style.color = "#ef4444"}
                      onMouseLeave={e => e.currentTarget.style.color = "#f87171"}>
                      Revoke
                    </button>
                  )}
                </td>
              </tr>
            ))}
            {keys.length === 0 && (
              <tr><td colSpan={6} className="px-5 py-12 text-center text-sm" style={{ color: "#334155" }}>No API keys yet. Generate one above.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
