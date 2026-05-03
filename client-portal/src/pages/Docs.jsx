const BASE = import.meta.env.VITE_API_URL?.replace("/api/v1", "") || "https://api.yourdomain.com";

const endpoints = [
  { method: "GET", path: "/states",                     params: "?page=1&limit=20",       desc: "List all states with pagination.",          sample: `{ "success": true, "data": [{ "id": 1, "name": "Himachal Pradesh", "censusCode": "02" }], "pagination": { "total": 30, "page": 1 } }` },
  { method: "GET", path: "/states/:id/districts",       params: "?page=1&limit=20",       desc: "List districts in a state.",                sample: `{ "success": true, "state": { "id": 1, "name": "..." }, "data": [...], "pagination": {...} }` },
  { method: "GET", path: "/districts/:id/subdistricts", params: "?page=1&limit=20",       desc: "List sub-districts in a district.",          sample: `{ "success": true, "district": { ... }, "data": [...] }` },
  { method: "GET", path: "/subdistricts/:id/villages",  params: "?page=1&limit=20",       desc: "List villages in a sub-district.",           sample: `{ "success": true, "subDistrict": { ... }, "data": [...] }` },
  { method: "GET", path: "/search",                     params: "?q=mumbai&type=all",     desc: "Full-text search across all geo levels.",    sample: `{ "success": true, "results": { "states": {...}, "districts": {...}, "villages": {...} } }` },
  { method: "GET", path: "/autocomplete",               params: "?q=pangi&type=village",  desc: "Fast village autocomplete for address forms.", sample: `{ "success": true, "suggestions": [{ "id": 1, "name": "Pangi", "subDistrict": {...} }] }` },
];

const RATE_LIMITS = [
  ["FREE",      "5,000",     "var(--text-muted)"],
  ["PREMIUM",   "50,000",    "var(--purple)"],
  ["PRO",       "300,000",   "var(--green)"],
  ["UNLIMITED", "1,000,000", "var(--yellow-text)"],
];

export default function Docs() {
  const th = { padding: "12px 18px", textAlign: "left", fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.07em", color: "var(--text-muted)" };
  const td = { padding: "12px 18px", fontSize: 13 };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 28, maxWidth: 760 }}>
      <div>
        <h1 style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: 800, fontSize: 30, color: "var(--text)", margin: "0 0 8px" }}>API Reference</h1>
        <p style={{ fontSize: 13, color: "var(--text-muted)", margin: 0 }}>
          All requests require your API key in the{" "}
          <code style={{ padding: "2px 6px", borderRadius: 6, fontSize: 12, fontFamily: "monospace", background: "var(--input)", color: "var(--purple-text)" }}>X-API-Key</code>
          {" "}header.
        </p>
      </div>

      {/* Auth example */}
      <div style={{ borderRadius: 16, overflow: "hidden", border: "1px solid var(--card-border)" }}>
        <div style={{ padding: "10px 18px", display: "flex", alignItems: "center", justifyContent: "space-between", background: "var(--table-head)", borderBottom: "1px solid var(--divider)" }}>
          <span style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.07em", color: "var(--text-muted)" }}>Authentication</span>
          <span style={{ fontSize: 11, padding: "2px 8px", borderRadius: 6, fontFamily: "monospace", background: "var(--input)", color: "var(--green-text)" }}>curl</span>
        </div>
        <div style={{ padding: "16px 20px", background: "var(--card)" }}>
          <code style={{ fontSize: 12, fontFamily: "monospace", lineHeight: 1.8, color: "var(--text)" }}>
            curl {BASE}/api/v1/states \<br />
            &nbsp;&nbsp;-H <span style={{ color: "var(--green-text)" }}>"X-API-Key: bsk_yourkey.yoursecret"</span>
          </code>
        </div>
      </div>

      {/* Rate limits */}
      <div style={{ background: "var(--card)", border: "1px solid var(--card-border)", borderRadius: 18, overflow: "hidden" }}>
        <div style={{ padding: "14px 20px", borderBottom: "1px solid var(--divider)" }}>
          <h2 style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: 700, fontSize: 13, color: "var(--text-2)", margin: 0 }}>Rate Limits</h2>
        </div>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ borderBottom: "1px solid var(--divider)", background: "var(--table-head)" }}>
              <th style={th}>Plan</th>
              <th style={{ ...th, textAlign: "right" }}>Requests / Day</th>
            </tr>
          </thead>
          <tbody>
            {RATE_LIMITS.map(([plan, limit, color], i) => (
              <tr key={plan} style={{ borderBottom: i < RATE_LIMITS.length - 1 ? "1px solid var(--divider)" : "none" }}>
                <td style={td}>
                  <span style={{ padding: "3px 10px", borderRadius: 8, fontSize: 11, fontWeight: 700, color }}>{plan}</span>
                </td>
                <td style={{ ...td, textAlign: "right", fontWeight: 600, color: "var(--text-2)" }}>{limit}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Endpoints */}
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        <h2 style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: 700, fontSize: 13, color: "var(--text-2)", margin: 0 }}>Endpoints</h2>
        {endpoints.map(ep => (
          <div key={ep.path} style={{ borderRadius: 16, overflow: "hidden", border: "1px solid var(--card-border)" }}>
            <div style={{ padding: "14px 18px", display: "flex", alignItems: "flex-start", gap: 12, background: "var(--card)" }}>
              <span style={{ marginTop: 1, padding: "3px 8px", borderRadius: 7, fontSize: 11, fontWeight: 700, flexShrink: 0, background: "var(--green-dim)", color: "var(--green-text)", border: "1px solid var(--green-border)" }}>
                {ep.method}
              </span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                  <code style={{ fontSize: 13, fontFamily: "monospace", fontWeight: 600, color: "var(--text)" }}>{ep.path}</code>
                  {ep.params && <code style={{ fontSize: 11, fontFamily: "monospace", color: "var(--text-muted)" }}>{ep.params}</code>}
                </div>
                <p style={{ fontSize: 12, color: "var(--text-muted)", margin: "4px 0 0" }}>{ep.desc}</p>
              </div>
            </div>
            <div style={{ padding: "14px 18px", background: "var(--input)", borderTop: "1px solid var(--divider)" }}>
              <code style={{ fontSize: 11, fontFamily: "monospace", lineHeight: 1.7, whiteSpace: "pre-wrap", color: "var(--green-text)" }}>{ep.sample}</code>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
