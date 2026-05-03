import { useEffect, useState } from "react";
import api from "../api/client";

const PLAN_COLORS = { FREE: "var(--text-muted)", PREMIUM: "var(--purple)", PRO: "var(--green)", UNLIMITED: "var(--yellow-text)" };

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
    setError(""); setCreating(true);
    try { const res = await api.post("/api-keys", {}); setNewKey(res.apiKey); await load(); }
    catch (e) { setError(e.error || "Failed to create key"); }
    finally { setCreating(false); }
  }

  async function revoke(id) {
    if (!confirm("Revoke this API key? This cannot be undone.")) return;
    setRevoking(id);
    try { await api.delete(`/api-keys/${id}`); setKeys(ks => ks.filter(k => k.id !== id)); }
    catch (e) { alert(e.error || "Failed to revoke"); }
    finally { setRevoking(null); }
  }

  function copyKey() {
    navigator.clipboard.writeText(newKey);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  const th = { padding: "12px 18px", textAlign: "left", fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.07em", color: "var(--text-muted)" };
  const td = { padding: "14px 18px", fontSize: 13 };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
      <div>
        <h1 style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: 800, fontSize: 30, color: "var(--text)", margin: "0 0 4px" }}>API Keys</h1>
        <p style={{ fontSize: 13, color: "var(--text-muted)", margin: 0 }}>Generate and manage your access keys</p>
      </div>

      {/* New key reveal */}
      {newKey && (
        <div style={{ borderRadius: 16, padding: 20, background: "var(--green-dim)", border: "1px solid var(--green-border)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
            <svg viewBox="0 0 24 24" fill="none" stroke="var(--green)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ width: 16, height: 16 }}><polyline points="20 6 9 17 4 12"/></svg>
            <p style={{ fontSize: 13, fontWeight: 600, color: "var(--green-text)", margin: 0 }}>Key generated — copy it now, it won't be shown again</p>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <code style={{ flex: 1, padding: "12px 16px", borderRadius: 12, fontSize: 12, fontFamily: "monospace", wordBreak: "break-all", background: "var(--input)", border: "1px solid var(--card-border)", color: "var(--purple-text)" }}>
              {newKey}
            </code>
            <button onClick={copyKey} style={{ padding: "12px 18px", borderRadius: 12, fontSize: 12, fontWeight: 700, whiteSpace: "nowrap", background: copied ? "var(--green-dim)" : "var(--green-dim)", color: copied ? "var(--green-text)" : "var(--green-text)", border: "1px solid var(--green-border)", cursor: "pointer" }}>
              {copied ? "Copied!" : "Copy"}
            </button>
          </div>
          <button onClick={() => setNewKey(null)} style={{ marginTop: 10, fontSize: 12, color: "var(--text-muted)", background: "none", border: "none", cursor: "pointer", padding: 0 }}>Dismiss</button>
        </div>
      )}

      {/* Generate */}
      <div style={{ borderRadius: 16, padding: 20, display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16, background: "var(--card)", border: "1px solid var(--card-border)" }}>
        <div>
          <p style={{ fontSize: 13, fontWeight: 600, color: "var(--text)", margin: "0 0 4px" }}>Generate New Key</p>
          <p style={{ fontSize: 12, color: "var(--text-muted)", margin: 0 }}>New keys start on the FREE plan. Contact admin to upgrade.</p>
          {error && <p style={{ fontSize: 12, color: "var(--red-text)", margin: "8px 0 0" }}>{error}</p>}
        </div>
        <button onClick={create} disabled={creating}
          style={{ padding: "10px 20px", borderRadius: 12, fontSize: 13, fontWeight: 700, whiteSpace: "nowrap", background: "var(--green)", color: "#000", border: "none", cursor: creating ? "not-allowed" : "pointer", opacity: creating ? 0.6 : 1 }}>
          {creating ? "Generating…" : "+ Generate Key"}
        </button>
      </div>

      {/* Key list */}
      <div style={{ background: "var(--card)", border: "1px solid var(--card-border)", borderRadius: 18, overflow: "hidden" }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ background: "var(--table-head)", borderBottom: "1px solid var(--divider)" }}>
              {["Key Prefix", "Plan", "Status", "Created", "Expires", ""].map(h => <th key={h} style={th}>{h}</th>)}
            </tr>
          </thead>
          <tbody>
            {keys.map((k, i) => (
              <tr key={k.id} style={{ borderBottom: i < keys.length - 1 ? "1px solid var(--divider)" : "none" }}
                onMouseEnter={e => e.currentTarget.style.background = "var(--row-hover)"}
                onMouseLeave={e => e.currentTarget.style.background = ""}>
                <td style={{ ...td, fontFamily: "monospace", fontSize: 12, color: "var(--text-2)" }}>{k.keyPrefix}…</td>
                <td style={td}>
                  <span style={{ padding: "3px 10px", borderRadius: 8, fontSize: 11, fontWeight: 700, color: PLAN_COLORS[k.plan] }}>{k.plan}</span>
                </td>
                <td style={td}>
                  <span style={{ display: "inline-flex", alignItems: "center", gap: 5, padding: "4px 10px", borderRadius: 8, fontSize: 11, fontWeight: 700, background: k.isActive ? "var(--green-dim)" : "transparent", color: k.isActive ? "var(--green-text)" : "var(--text-muted)", border: `1px solid ${k.isActive ? "var(--green-border)" : "var(--divider)"}` }}>
                    <span style={{ width: 6, height: 6, borderRadius: "50%", background: k.isActive ? "var(--green)" : "var(--text-muted)" }} />
                    {k.isActive ? "Active" : "Revoked"}
                  </span>
                </td>
                <td style={{ ...td, color: "var(--text-muted)", fontSize: 12 }}>{new Date(k.createdAt).toLocaleDateString()}</td>
                <td style={{ ...td, color: "var(--text-muted)", fontSize: 12 }}>{k.expiresAt ? new Date(k.expiresAt).toLocaleDateString() : "Never"}</td>
                <td style={td}>
                  {k.isActive && (
                    <button onClick={() => revoke(k.id)} disabled={revoking === k.id}
                      style={{ fontSize: 12, fontWeight: 700, color: "var(--red-text)", background: "none", border: "none", cursor: "pointer", padding: 0, opacity: revoking === k.id ? 0.4 : 1 }}>
                      {revoking === k.id ? "…" : "Revoke"}
                    </button>
                  )}
                </td>
              </tr>
            ))}
            {keys.length === 0 && (
              <tr><td colSpan={6} style={{ padding: "40px 18px", textAlign: "center", color: "var(--text-muted)", fontSize: 13 }}>No API keys yet. Generate one above.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
