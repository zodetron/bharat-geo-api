const BASE = import.meta.env.VITE_API_URL?.replace("/api/v1", "") || "https://api.yourdomain.com";

const endpoints = [
  { method: "GET", path: "/states",                    params: "?page=1&limit=20",        desc: "List all states with pagination.", sample: `{ "success": true, "data": [{ "id": 1, "name": "Himachal Pradesh", "censusCode": "02" }], "pagination": { "total": 30, "page": 1 } }` },
  { method: "GET", path: "/states/:id/districts",      params: "?page=1&limit=20",        desc: "List districts in a state.",       sample: `{ "success": true, "state": { "id": 1, "name": "..." }, "data": [...], "pagination": {...} }` },
  { method: "GET", path: "/districts/:id/subdistricts",params: "?page=1&limit=20",        desc: "List sub-districts in a district.", sample: `{ "success": true, "district": { ... }, "data": [...] }` },
  { method: "GET", path: "/subdistricts/:id/villages", params: "?page=1&limit=20",        desc: "List villages in a sub-district.", sample: `{ "success": true, "subDistrict": { ... }, "data": [...] }` },
  { method: "GET", path: "/search",                    params: "?q=mumbai&type=all",      desc: "Full-text search across all geo levels.", sample: `{ "success": true, "results": { "states": {...}, "districts": {...}, "villages": {...} } }` },
  { method: "GET", path: "/autocomplete",              params: "?q=pangi&type=village",   desc: "Fast village autocomplete for address forms.", sample: `{ "success": true, "suggestions": [{ "id": 1, "name": "Pangi", "subDistrict": {...} }] }` },
];

const RATE_LIMITS = [["FREE", "5,000", "#64748b"], ["PREMIUM", "50,000", "#6366f1"], ["PRO", "300,000", "#8b5cf6"], ["UNLIMITED", "1,000,000", "#f59e0b"]];

export default function Docs() {
  return (
    <div className="space-y-8 max-w-3xl">
      <div>
        <h1 className="text-3xl font-extrabold" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", color: "#f1f5f9" }}>API Reference</h1>
        <p className="text-sm mt-2" style={{ color: "#64748b" }}>
          All requests require your API key in the{" "}
          <code className="px-1.5 py-0.5 rounded text-xs font-mono" style={{ background: "#1e293b", color: "#a5b4fc" }}>X-API-Key</code>
          {" "}header.
        </p>
      </div>

      {/* Auth example */}
      <div className="rounded-2xl overflow-hidden" style={{ border: "1px solid #1e293b" }}>
        <div className="px-5 py-3 flex items-center justify-between" style={{ background: "#1e293b" }}>
          <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: "#475569" }}>Authentication</span>
          <span className="text-xs px-2 py-0.5 rounded font-mono" style={{ background: "#0f172a", color: "#6ee7b7" }}>curl</span>
        </div>
        <div className="px-5 py-4" style={{ background: "#080c14" }}>
          <code className="text-xs font-mono leading-relaxed" style={{ color: "#e2e8f0" }}>
            curl {BASE}/api/v1/states \<br />
            &nbsp;&nbsp;-H <span style={{ color: "#86efac" }}>"X-API-Key: bsk_yourkey.yoursecret"</span>
          </code>
        </div>
      </div>

      {/* Rate limits */}
      <div className="rounded-2xl overflow-hidden" style={{ background: "#0f172a", border: "1px solid #1e293b" }}>
        <div className="px-6 py-4" style={{ borderBottom: "1px solid #1e293b" }}>
          <h2 className="text-sm font-bold" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", color: "#cbd5e1" }}>Rate Limits</h2>
        </div>
        <table className="w-full text-sm">
          <thead>
            <tr style={{ borderBottom: "1px solid #1e293b" }}>
              <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide" style={{ color: "#475569" }}>Plan</th>
              <th className="px-6 py-3 text-right text-xs font-semibold uppercase tracking-wide" style={{ color: "#475569" }}>Requests / Day</th>
            </tr>
          </thead>
          <tbody>
            {RATE_LIMITS.map(([plan, limit, color], i) => (
              <tr key={plan} style={{ borderBottom: i < RATE_LIMITS.length - 1 ? "1px solid #1e293b" : "none" }}>
                <td className="px-6 py-3">
                  <span className="px-2.5 py-1 rounded-lg text-xs font-bold" style={{ background: `${color}15`, color }}>{plan}</span>
                </td>
                <td className="px-6 py-3 text-right text-sm font-semibold" style={{ color: "#94a3b8" }}>{limit}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Endpoints */}
      <div className="space-y-3">
        <h2 className="text-sm font-bold" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", color: "#cbd5e1" }}>Endpoints</h2>
        {endpoints.map(ep => (
          <div key={ep.path} className="rounded-2xl overflow-hidden" style={{ border: "1px solid #1e293b" }}>
            <div className="px-5 py-4 flex items-start gap-3" style={{ background: "#0f172a" }}>
              <span className="mt-0.5 px-2 py-0.5 rounded text-xs font-bold flex-shrink-0" style={{ background: "rgba(16,185,129,0.1)", color: "#6ee7b7", border: "1px solid rgba(16,185,129,0.2)" }}>
                {ep.method}
              </span>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <code className="text-sm font-mono font-semibold" style={{ color: "#e2e8f0" }}>{ep.path}</code>
                  {ep.params && <code className="text-xs font-mono" style={{ color: "#475569" }}>{ep.params}</code>}
                </div>
                <p className="text-xs mt-1" style={{ color: "#64748b" }}>{ep.desc}</p>
              </div>
            </div>
            <div className="px-5 py-4" style={{ background: "#080c14", borderTop: "1px solid #1e293b" }}>
              <code className="text-xs font-mono leading-relaxed whitespace-pre-wrap" style={{ color: "#86efac" }}>{ep.sample}</code>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
