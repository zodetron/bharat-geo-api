import { useEffect, useState } from "react";
import api from "../api/client";

const PLANS = ["FREE", "PREMIUM", "PRO", "UNLIMITED"];
const PLAN_COLOR = { FREE: "#64748b", PREMIUM: "#6366f1", PRO: "#8b5cf6", UNLIMITED: "#f59e0b" };

export default function ApiKeys() {
  const [keys, setKeys]     = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(null);
  const [error, setError]   = useState("");

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
      setKeys(ks => ks.map(k => k.id === id ? { ...k, plan } : k));
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
      setKeys(ks => ks.map(k => k.id === id ? { ...k, isActive: !isActive } : k));
    } catch (e) {
      alert(e.error || "Failed to update key");
    } finally {
      setSaving(null);
    }
  }

  if (loading) return (
    <div className="flex items-center gap-2 pt-4" style={{ color: "#475569" }}>
      <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" strokeOpacity="0.25"/><path d="M12 2a10 10 0 0 1 10 10" stroke="currentColor" strokeWidth="3" strokeLinecap="round"/></svg>
      <span className="text-sm">Loading…</span>
    </div>
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-extrabold" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", color: "#f1f5f9" }}>API Keys</h1>
        <p className="text-sm mt-1" style={{ color: "#475569" }}>Manage plans and key status</p>
      </div>

      {error && (
        <div className="px-4 py-3 rounded-xl text-sm" style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.3)", color: "#fca5a5" }}>{error}</div>
      )}

      <div className="rounded-2xl overflow-hidden" style={{ background: "#0f172a", border: "1px solid #1e293b" }}>
        <table className="w-full text-sm">
          <thead>
            <tr style={{ borderBottom: "1px solid #1e293b", background: "rgba(30,41,59,0.5)" }}>
              {["User", "Key Prefix", "Plan", "Status", "Created", "Action"].map(h => (
                <th key={h} className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wider" style={{ color: "#475569" }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {keys.map((k, i) => (
              <tr key={k.id} style={{ borderBottom: i < keys.length - 1 ? "1px solid #1e293b" : "none" }}
                onMouseEnter={e => e.currentTarget.style.background = "rgba(30,41,59,0.4)"}
                onMouseLeave={e => e.currentTarget.style.background = ""}>
                <td className="px-5 py-4">
                  <p className="font-semibold text-sm" style={{ color: "#f1f5f9" }}>{k.user?.fullName || "—"}</p>
                  <p className="text-xs mt-0.5" style={{ color: "#475569" }}>{k.user?.email}</p>
                </td>
                <td className="px-5 py-4 font-mono text-xs" style={{ color: "#94a3b8" }}>{k.keyPrefix}…</td>
                <td className="px-5 py-4">
                  <select
                    value={k.plan}
                    disabled={saving === k.id}
                    onChange={(e) => changePlan(k.id, e.target.value)}
                    className="px-3 py-1.5 rounded-lg text-xs font-semibold outline-none disabled:opacity-50"
                    style={{ background: "rgba(30,41,59,0.8)", border: `1px solid ${PLAN_COLOR[k.plan]}33`, color: PLAN_COLOR[k.plan] }}
                  >
                    {PLANS.map(p => <option key={p} value={p}>{p}</option>)}
                  </select>
                </td>
                <td className="px-5 py-4">
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold"
                    style={k.isActive
                      ? { background: "rgba(16,185,129,0.1)", color: "#6ee7b7", border: "1px solid rgba(16,185,129,0.25)" }
                      : { background: "rgba(100,116,139,0.1)", color: "#64748b", border: "1px solid rgba(100,116,139,0.25)" }}>
                    <span className="w-1.5 h-1.5 rounded-full" style={{ background: k.isActive ? "#10b981" : "#475569" }} />
                    {k.isActive ? "Active" : "Revoked"}
                  </span>
                </td>
                <td className="px-5 py-4 text-xs" style={{ color: "#475569" }}>{new Date(k.createdAt).toLocaleDateString()}</td>
                <td className="px-5 py-4">
                  <button
                    onClick={() => toggleActive(k.id, k.isActive)}
                    disabled={saving === k.id}
                    className="text-xs font-semibold transition-colors disabled:opacity-40"
                    style={{ color: k.isActive ? "#f87171" : "#6ee7b7" }}>
                    {saving === k.id ? "…" : k.isActive ? "Revoke" : "Reinstate"}
                  </button>
                </td>
              </tr>
            ))}
            {keys.length === 0 && (
              <tr><td colSpan={6} className="px-5 py-12 text-center text-sm" style={{ color: "#334155" }}>No API keys yet.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
