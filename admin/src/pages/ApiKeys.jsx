import { useEffect, useState } from "react";
import api from "../api/client";

const PLANS = ["FREE","PREMIUM","PRO","UNLIMITED"];
const PLAN_COLORS = { FREE: "var(--text-muted)", PREMIUM: "var(--purple)", PRO: "var(--green)", UNLIMITED: "var(--yellow-text)" };

export default function ApiKeys() {
  const [keys, setKeys]     = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(null);
  const [error, setError]   = useState("");

  async function load() {
    try { const res = await api.get("/admin/api-keys"); setKeys(res.keys); }
    catch { setError("Failed to load API keys"); }
    finally { setLoading(false); }
  }
  useEffect(() => { load(); }, []);

  async function changePlan(id, plan) {
    setSaving(id);
    try { await api.patch(`/admin/api-keys/${id}`, { plan }); setKeys(ks => ks.map(k => k.id === id ? { ...k, plan } : k)); }
    catch (e) { alert(e.error || "Failed"); }
    finally { setSaving(null); }
  }

  async function toggleActive(id, isActive) {
    setSaving(id);
    try { await api.patch(`/admin/api-keys/${id}`, { isActive: !isActive }); setKeys(ks => ks.map(k => k.id === id ? { ...k, isActive: !isActive } : k)); }
    catch (e) { alert(e.error || "Failed"); }
    finally { setSaving(null); }
  }

  const th = { padding: "12px 18px", textAlign: "left", fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.07em", color: "var(--text-muted)" };
  const td = { padding: "14px 18px", fontSize: 13 };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
      <div>
        <h1 style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: 800, fontSize: 30, color: "var(--text)", margin: "0 0 4px" }}>API Keys</h1>
        <p style={{ fontSize: 13, color: "var(--text-muted)", margin: 0 }}>Manage plans and revoke access</p>
      </div>

      {error && <div style={{ padding: "10px 14px", borderRadius: 10, background: "var(--red-dim)", border: "1px solid var(--red-border)", color: "var(--red-text)", fontSize: 13 }}>{error}</div>}

      {loading ? <Spinner /> : (
        <div style={{ background: "var(--card)", border: "1px solid var(--card-border)", borderRadius: 18, overflow: "hidden" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ background: "var(--table-head)", borderBottom: "1px solid var(--divider)" }}>
                {["User","Key Prefix","Plan","Status","Created","Action"].map(h => <th key={h} style={th}>{h}</th>)}
              </tr>
            </thead>
            <tbody>
              {keys.map((k, i) => (
                <tr key={k.id} style={{ borderBottom: i < keys.length - 1 ? "1px solid var(--divider)" : "none" }}
                  onMouseEnter={e => e.currentTarget.style.background = "var(--row-hover)"}
                  onMouseLeave={e => e.currentTarget.style.background = ""}>
                  <td style={td}>
                    <p style={{ fontWeight: 600, color: "var(--text)", margin: 0, fontSize: 13 }}>{k.user?.fullName || "—"}</p>
                    <p style={{ color: "var(--text-muted)", margin: 0, fontSize: 11 }}>{k.user?.email}</p>
                  </td>
                  <td style={{ ...td, fontFamily: "monospace", fontSize: 12, color: "var(--text-2)" }}>{k.keyPrefix}…</td>
                  <td style={td}>
                    <select value={k.plan} disabled={saving === k.id} onChange={e => changePlan(k.id, e.target.value)}
                      style={{ background: "var(--input)", border: `1px solid ${PLAN_COLORS[k.plan]}44`, color: PLAN_COLORS[k.plan], padding: "5px 10px", borderRadius: 8, fontSize: 12, fontWeight: 700, outline: "none", cursor: "pointer", opacity: saving === k.id ? 0.5 : 1 }}>
                      {PLANS.map(p => <option key={p} value={p}>{p}</option>)}
                    </select>
                  </td>
                  <td style={td}>
                    <span style={{ display: "inline-flex", alignItems: "center", gap: 5, padding: "4px 10px", borderRadius: 8, fontSize: 11, fontWeight: 700, background: k.isActive ? "var(--green-dim)" : "transparent", color: k.isActive ? "var(--green-text)" : "var(--text-muted)", border: `1px solid ${k.isActive ? "var(--green-border)" : "var(--divider)"}` }}>
                      <span style={{ width: 6, height: 6, borderRadius: "50%", background: k.isActive ? "var(--green)" : "var(--text-muted)" }} />
                      {k.isActive ? "Active" : "Revoked"}
                    </span>
                  </td>
                  <td style={{ ...td, color: "var(--text-muted)", fontSize: 12 }}>{new Date(k.createdAt).toLocaleDateString()}</td>
                  <td style={td}>
                    <button onClick={() => toggleActive(k.id, k.isActive)} disabled={saving === k.id}
                      style={{ fontSize: 12, fontWeight: 700, color: k.isActive ? "var(--red-text)" : "var(--green-text)", background: "none", border: "none", cursor: "pointer", padding: 0, opacity: saving === k.id ? 0.4 : 1 }}>
                      {saving === k.id ? "…" : k.isActive ? "Revoke" : "Reinstate"}
                    </button>
                  </td>
                </tr>
              ))}
              {keys.length === 0 && <tr><td colSpan={6} style={{ padding: "40px 18px", textAlign: "center", color: "var(--text-muted)", fontSize: 13 }}>No API keys yet.</td></tr>}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function Spinner() {
  return <div style={{ display: "flex", alignItems: "center", gap: 8, color: "var(--text-muted)", fontSize: 13 }}>
    <svg className="animate-spin" style={{ width: 16, height: 16 }} viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" strokeOpacity="0.25"/><path d="M12 2a10 10 0 0 1 10 10" stroke="currentColor" strokeWidth="3" strokeLinecap="round"/></svg>Loading…</div>;
}
