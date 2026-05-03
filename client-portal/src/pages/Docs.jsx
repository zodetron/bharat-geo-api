const BASE = "https://your-api.vercel.app/api/v1";

const endpoints = [
  {
    method: "GET", path: "/states",
    desc: "List all states with pagination.",
    params: "?page=1&limit=20",
    sample: `{ "success": true, "data": [{ "id": 1, "name": "Himachal Pradesh", "censusCode": "02" }], "pagination": { ... } }`,
  },
  {
    method: "GET", path: "/states/:id/districts",
    desc: "List districts in a state.",
    params: "?page=1&limit=20",
    sample: `{ "success": true, "state": { ... }, "data": [...], "pagination": { ... } }`,
  },
  {
    method: "GET", path: "/districts/:id/subdistricts",
    desc: "List sub-districts in a district.",
    params: "?page=1&limit=20",
    sample: `{ "success": true, "district": { ... }, "data": [...] }`,
  },
  {
    method: "GET", path: "/subdistricts/:id/villages",
    desc: "List villages in a sub-district.",
    params: "?page=1&limit=20",
    sample: `{ "success": true, "subDistrict": { ... }, "data": [...] }`,
  },
  {
    method: "GET", path: "/search",
    desc: "Search across all geo levels.",
    params: "?q=mumbai&type=all",
    sample: `{ "success": true, "results": { "states": {...}, "districts": {...}, "villages": {...} } }`,
  },
  {
    method: "GET", path: "/autocomplete",
    desc: "Fast village autocomplete for address forms.",
    params: "?q=pangi&type=village",
    sample: `{ "success": true, "suggestions": [{ "id": 1, "name": "Pangi", "subDistrict": {...} }] }`,
  },
];

const methodColor = { GET: "bg-green-100 text-green-700" };

export default function Docs() {
  return (
    <div className="space-y-8 max-w-3xl">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">API Reference</h1>
        <p className="text-sm text-gray-500 mt-1">
          All requests require your API key in the <code className="bg-gray-100 px-1 rounded">X-API-Key</code> header.
        </p>
      </div>

      {/* Auth */}
      <div className="bg-gray-900 rounded-xl p-5 text-sm">
        <p className="text-gray-400 text-xs mb-2 uppercase tracking-wide">Authentication</p>
        <code className="text-green-400">
          curl {BASE}/states \<br />
          &nbsp;&nbsp;-H "X-API-Key: bsk_yourkey.yoursecret"
        </code>
      </div>

      {/* Rate limits */}
      <div className="bg-white border border-gray-200 rounded-xl p-5">
        <h2 className="text-sm font-semibold text-gray-700 mb-3">Rate Limits</h2>
        <table className="w-full text-sm">
          <thead>
            <tr className="text-xs text-gray-400 uppercase border-b border-gray-100">
              <th className="pb-2 text-left">Plan</th>
              <th className="pb-2 text-right">Requests / Day</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {[["FREE","5,000"],["PREMIUM","50,000"],["PRO","300,000"],["UNLIMITED","1,000,000"]].map(([p, l]) => (
              <tr key={p}>
                <td className="py-2 font-medium text-gray-700">{p}</td>
                <td className="py-2 text-right text-gray-500">{l}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Endpoints */}
      <div className="space-y-4">
        <h2 className="text-sm font-semibold text-gray-700">Endpoints</h2>
        {endpoints.map((ep) => (
          <div key={ep.path} className="bg-white border border-gray-200 rounded-xl overflow-hidden">
            <div className="px-5 py-4 flex items-start gap-3">
              <span className={`text-xs font-bold px-2 py-0.5 rounded ${methodColor[ep.method] || "bg-blue-100 text-blue-700"}`}>
                {ep.method}
              </span>
              <div className="flex-1">
                <code className="text-sm font-mono text-gray-800">{ep.path}</code>
                {ep.params && (
                  <code className="text-xs text-gray-400 ml-1">{ep.params}</code>
                )}
                <p className="text-sm text-gray-500 mt-1">{ep.desc}</p>
              </div>
            </div>
            <div className="bg-gray-900 px-5 py-3">
              <code className="text-xs text-green-400 whitespace-pre-wrap">{ep.sample}</code>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
