import { useState, useRef, useEffect } from "react";
import { useVillageAutocomplete } from "./hooks/useVillageAutocomplete";
import "./index.css";

function Field({ label, value, highlight }) {
  return (
    <div>
      <label className="block text-xs font-semibold uppercase tracking-wider mb-1.5" style={{ color: "#475569" }}>{label}</label>
      <div className="w-full px-4 py-3 rounded-xl text-sm transition-all"
        style={{
          background: value && highlight ? "rgba(99,102,241,0.08)" : "#1e293b",
          border: `1px solid ${value && highlight ? "rgba(99,102,241,0.4)" : "#334155"}`,
          color: value ? (highlight ? "#a5b4fc" : "#cbd5e1") : "#334155",
          fontStyle: value ? "normal" : "italic",
        }}>
        {value || "Auto-filled"}
      </div>
    </div>
  );
}

function Suggestion({ item, onSelect, highlighted }) {
  const sd = item.subDistrict;
  const district = sd?.district;
  const state = district?.state;
  return (
    <button type="button" onClick={() => onSelect(item)}
      className="w-full text-left px-4 py-3 transition-colors"
      style={{ borderBottom: "1px solid #1e293b", background: highlighted ? "rgba(99,102,241,0.08)" : "transparent" }}
      onMouseEnter={e => !highlighted && (e.currentTarget.style.background = "rgba(30,41,59,0.8)")}
      onMouseLeave={e => !highlighted && (e.currentTarget.style.background = "transparent")}>
      <p className="text-sm font-semibold" style={{ color: "#f1f5f9" }}>{item.name}</p>
      <p className="text-xs mt-0.5" style={{ color: "#475569" }}>
        {[sd?.name, district?.name, state?.name].filter(Boolean).join(" › ")}
      </p>
    </button>
  );
}

export default function App() {
  const [apiKey, setApiKey]   = useState("");
  const [keyInput, setKeyInput] = useState("");
  const [selected, setSelected] = useState(null);
  const [highlight, setHighlight] = useState(false);
  const [highlightIdx, setHighlightIdx] = useState(-1);
  const inputRef = useRef(null);
  const dropdownRef = useRef(null);

  const { query, setQuery, suggestions, loading, error, open, setOpen, clear } = useVillageAutocomplete(apiKey);

  useEffect(() => {
    if (selected) {
      setHighlight(true);
      const t = setTimeout(() => setHighlight(false), 1500);
      return () => clearTimeout(t);
    }
  }, [selected]);

  useEffect(() => {
    function handler(e) {
      if (!dropdownRef.current?.contains(e.target) && e.target !== inputRef.current) setOpen(false);
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [setOpen]);

  function handleSelect(item) {
    setSelected(item);
    setQuery(item.name);
    setOpen(false);
    setHighlightIdx(-1);
  }

  function handleKeyDown(e) {
    if (!open || !suggestions.length) return;
    if (e.key === "ArrowDown") { e.preventDefault(); setHighlightIdx(i => Math.min(i + 1, suggestions.length - 1)); }
    else if (e.key === "ArrowUp") { e.preventDefault(); setHighlightIdx(i => Math.max(i - 1, 0)); }
    else if (e.key === "Enter" && highlightIdx >= 0) { e.preventDefault(); handleSelect(suggestions[highlightIdx]); }
    else if (e.key === "Escape") setOpen(false);
  }

  const filled = selected?.subDistrict;

  return (
    <div className="min-h-screen" style={{ background: "radial-gradient(ellipse 100% 50% at 50% -5%, rgba(99,102,241,0.15) 0%, #080c14 55%)" }}>
      <div className="max-w-xl mx-auto px-4 py-16">

        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl mb-5" style={{ background: "linear-gradient(135deg, #6366f1, #3b82f6)" }}>
            <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-7 h-7">
              <circle cx="12" cy="12" r="3"/><path d="M12 2v3m0 14v3M2 12h3m14 0h3"/>
            </svg>
          </div>
          <h1 className="text-4xl font-extrabold mb-2" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", color: "#f1f5f9" }}>Bharat Geo API</h1>
          <p className="text-base" style={{ color: "#64748b" }}>Village-level address autocomplete · 619,500+ villages · Census 2011</p>
        </div>

        {/* API Key Input */}
        {!apiKey && (
          <div className="rounded-2xl p-6 mb-5" style={{ background: "#0f172a", border: "1px solid #1e293b" }}>
            <p className="text-sm font-semibold mb-1" style={{ color: "#cbd5e1" }}>Enter your API key to start</p>
            <p className="text-xs mb-4" style={{ color: "#475569" }}>
              No key?{" "}
              <a href={`${import.meta.env.VITE_CLIENT_PORTAL_URL || "http://localhost:5175"}/register`}
                className="transition-colors" style={{ color: "#818cf8" }}>Request access →</a>
            </p>
            <div className="flex gap-2">
              <input
                type="text" placeholder="bsk_xxxxxx.yyyyyy…"
                value={keyInput} onChange={e => setKeyInput(e.target.value)}
                onKeyDown={e => e.key === "Enter" && keyInput && setApiKey(keyInput.trim())}
                className="flex-1 px-4 py-3 rounded-xl text-sm font-mono outline-none transition-all"
                style={{ background: "#1e293b", border: "1px solid #334155", color: "#f1f5f9" }}
                onFocus={e => e.target.style.borderColor = "#6366f1"}
                onBlur={e => e.target.style.borderColor = "#334155"} />
              <button
                onClick={() => keyInput && setApiKey(keyInput.trim())}
                className="px-5 py-3 rounded-xl text-sm font-semibold transition-all"
                style={{ background: "linear-gradient(135deg, #6366f1, #3b82f6)", color: "white" }}>
                Connect
              </button>
            </div>
          </div>
        )}

        {/* Demo Form */}
        <div className="rounded-2xl p-6 transition-opacity" style={{ background: "#0f172a", border: "1px solid #1e293b", opacity: !apiKey ? 0.4 : 1, pointerEvents: !apiKey ? "none" : "all" }}>
          {apiKey && (
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-sm font-bold" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", color: "#cbd5e1" }}>Address Form</h2>
              <button onClick={() => { setApiKey(""); setKeyInput(""); clear(); setSelected(null); }}
                className="text-xs transition-colors" style={{ color: "#475569" }}
                onMouseEnter={e => e.currentTarget.style.color = "#94a3b8"}
                onMouseLeave={e => e.currentTarget.style.color = "#475569"}>
                Change key
              </button>
            </div>
          )}

          {/* Search */}
          <div className="mb-6">
            <label className="block text-xs font-semibold uppercase tracking-wider mb-1.5" style={{ color: "#475569" }}>Village / Town</label>
            <div className="relative">
              <input
                ref={inputRef} type="text" value={query}
                onChange={e => { setQuery(e.target.value); setSelected(null); setHighlightIdx(-1); }}
                onKeyDown={handleKeyDown}
                onFocus={() => suggestions.length && setOpen(true)}
                placeholder="Type a village name…"
                className="w-full px-4 py-3 pr-10 rounded-xl text-sm outline-none transition-all"
                style={{ background: "#1e293b", border: `1px solid ${open ? "#6366f1" : "#334155"}`, color: "#f1f5f9" }}
              />

              <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-2">
                {loading && (
                  <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none" style={{ color: "#6366f1" }}>
                    <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" strokeOpacity="0.25"/>
                    <path d="M12 2a10 10 0 0 1 10 10" stroke="currentColor" strokeWidth="3" strokeLinecap="round"/>
                  </svg>
                )}
                {query && (
                  <button onClick={() => { clear(); setSelected(null); }} className="text-lg leading-none transition-colors" style={{ color: "#475569" }}
                    onMouseEnter={e => e.currentTarget.style.color = "#94a3b8"}
                    onMouseLeave={e => e.currentTarget.style.color = "#475569"}>×</button>
                )}
              </div>

              {/* Dropdown */}
              {open && suggestions.length > 0 && (
                <div ref={dropdownRef} className="absolute z-20 mt-1.5 w-full rounded-2xl overflow-hidden max-h-64 overflow-y-auto"
                  style={{ background: "#0f172a", border: "1px solid #1e293b", boxShadow: "0 20px 40px rgba(0,0,0,0.5)" }}>
                  {suggestions.map((s, i) => (
                    <Suggestion key={s.id} item={s} onSelect={handleSelect} highlighted={i === highlightIdx} />
                  ))}
                </div>
              )}

              {open && !loading && query.length >= 2 && suggestions.length === 0 && (
                <div className="absolute z-20 mt-1.5 w-full rounded-2xl px-4 py-4 text-sm"
                  style={{ background: "#0f172a", border: "1px solid #1e293b", color: "#334155" }}>
                  No villages found for "{query}"
                </div>
              )}
            </div>
            {error && <p className="text-xs mt-1.5" style={{ color: "#f87171" }}>{error}</p>}
          </div>

          {/* Auto-filled fields */}
          <div className="space-y-4">
            <Field label="Sub-District" value={filled?.name} highlight={highlight} />
            <div className="grid grid-cols-2 gap-4">
              <Field label="District" value={filled?.district?.name} highlight={highlight} />
              <Field label="State" value={filled?.district?.state?.name} highlight={highlight} />
            </div>
          </div>

          {/* Census codes */}
          {selected && (
            <div className="mt-5 pt-5 flex flex-wrap gap-3" style={{ borderTop: "1px solid #1e293b" }}>
              {[
                { label: "Village Code", value: selected.censusCode },
                { label: "Sub-District", value: filled?.censusCode },
                { label: "District", value: filled?.district?.censusCode },
              ].filter(x => x.value).map(({ label, value }) => (
                <div key={label} className="flex items-center gap-1.5">
                  <span className="text-xs" style={{ color: "#475569" }}>{label}:</span>
                  <code className="text-xs px-2 py-0.5 rounded-lg font-mono" style={{ background: "#1e293b", color: "#a5b4fc" }}>{value}</code>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* How it works */}
        <div className="mt-5 rounded-2xl p-6" style={{ background: "#0f172a", border: "1px solid #1e293b" }}>
          <p className="text-xs font-bold uppercase tracking-widest mb-4" style={{ color: "#334155" }}>How it works</p>
          <ol className="space-y-3">
            {[
              ["1", "User types a village name — results appear instantly"],
              ["2", "API returns full hierarchy (state, district, sub-district) in one request"],
              ["3", "Selecting a village auto-fills all address fields"],
              ["4", "619,500+ villages from Census 2011, all 30 states covered"],
            ].map(([num, text]) => (
              <li key={num} className="flex items-start gap-3 text-sm" style={{ color: "#64748b" }}>
                <span className="w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5" style={{ background: "rgba(99,102,241,0.15)", color: "#818cf8" }}>{num}</span>
                {text}
              </li>
            ))}
          </ol>
          <div className="mt-5 rounded-xl p-4 overflow-x-auto" style={{ background: "#080c14", border: "1px solid #1e293b" }}>
            <code className="text-xs font-mono" style={{ color: "#6ee7b7" }}>
              GET /api/v1/autocomplete?q=pangi&type=village<br />
              X-API-Key: bsk_yourkey.yoursecret
            </code>
          </div>
        </div>

        <p className="text-center text-xs mt-6" style={{ color: "#334155" }}>
          Powered by Bharat Geo API · Census 2011 data
        </p>
      </div>
    </div>
  );
}
