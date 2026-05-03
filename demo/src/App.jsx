import { useState, useRef, useEffect } from "react";
import { useVillageAutocomplete } from "./hooks/useVillageAutocomplete";
import "./index.css";

// ── Field component ───────────────────────────────────────────
function Field({ label, value, locked, highlight }) {
  return (
    <div>
      <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">
        {label}
      </label>
      <div className={`w-full px-3 py-2.5 rounded-lg border text-sm transition-all duration-300 ${
        value
          ? highlight
            ? "border-indigo-400 bg-indigo-50 text-indigo-900 font-medium"
            : "border-gray-300 bg-gray-50 text-gray-700"
          : "border-gray-200 bg-gray-50 text-gray-400 italic"
      } ${locked ? "cursor-not-allowed" : ""}`}>
        {value || "Auto-filled"}
      </div>
    </div>
  );
}

// ── Suggestion item ───────────────────────────────────────────
function Suggestion({ item, onSelect, highlighted }) {
  const sd = item.subDistrict;
  const district = sd?.district;
  const state = district?.state;

  return (
    <button
      type="button"
      onClick={() => onSelect(item)}
      className={`w-full text-left px-4 py-3 border-b border-gray-100 last:border-0 transition-colors ${
        highlighted ? "bg-indigo-50" : "hover:bg-gray-50"
      }`}
    >
      <p className="text-sm font-medium text-gray-900">{item.name}</p>
      <p className="text-xs text-gray-400 mt-0.5">
        {[sd?.name, district?.name, state?.name].filter(Boolean).join(" › ")}
      </p>
    </button>
  );
}

// ── Main App ──────────────────────────────────────────────────
export default function App() {
  const [apiKey, setApiKey]       = useState("");
  const [keyInput, setKeyInput]   = useState("");
  const [selected, setSelected]   = useState(null);
  const [highlight, setHighlight] = useState(false);
  const [highlightIdx, setHighlightIdx] = useState(-1);
  const inputRef = useRef(null);
  const dropdownRef = useRef(null);

  const {
    query, setQuery, suggestions, loading, error, open, setOpen, clear,
  } = useVillageAutocomplete(apiKey);

  // Flash highlight on selection
  useEffect(() => {
    if (selected) {
      setHighlight(true);
      const t = setTimeout(() => setHighlight(false), 1200);
      return () => clearTimeout(t);
    }
  }, [selected]);

  // Close dropdown on outside click
  useEffect(() => {
    function handler(e) {
      if (!dropdownRef.current?.contains(e.target) && e.target !== inputRef.current) {
        setOpen(false);
      }
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
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setHighlightIdx((i) => Math.min(i + 1, suggestions.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setHighlightIdx((i) => Math.max(i - 1, 0));
    } else if (e.key === "Enter" && highlightIdx >= 0) {
      e.preventDefault();
      handleSelect(suggestions[highlightIdx]);
    } else if (e.key === "Escape") {
      setOpen(false);
    }
  }

  function handleClear() {
    clear();
    setSelected(null);
    inputRef.current?.focus();
  }

  const filled = selected?.subDistrict;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-100 to-indigo-50 flex items-center justify-center p-4">
      <div className="w-full max-w-lg">

        {/* Header */}
        <div className="text-center mb-8">
          <span className="text-3xl font-bold text-indigo-700">Bharat Geo API</span>
          <p className="text-sm text-gray-500 mt-1">Village-level address autocomplete — live demo</p>
        </div>

        {/* API Key input */}
        {!apiKey && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-5 mb-4">
            <p className="text-sm font-medium text-gray-700 mb-2">Enter your API key to start</p>
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="bsk_xxxxxx.yyyyyy…"
                value={keyInput}
                onChange={(e) => setKeyInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && keyInput && setApiKey(keyInput.trim())}
                className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
              <button
                onClick={() => keyInput && setApiKey(keyInput.trim())}
                className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors"
              >
                Connect
              </button>
            </div>
            <p className="text-xs text-gray-400 mt-2">
              No key? <a href={`${import.meta.env.VITE_CLIENT_PORTAL_URL || "http://localhost:5175"}/register`} className="text-indigo-500 hover:underline">Request access</a>
            </p>
          </div>
        )}

        {/* Demo form */}
        <div className={`bg-white rounded-2xl shadow-sm border border-gray-200 p-6 transition-opacity ${!apiKey ? "opacity-40 pointer-events-none" : ""}`}>
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-base font-semibold text-gray-900">Address Form</h2>
            {apiKey && (
              <button
                onClick={() => { setApiKey(""); setKeyInput(""); handleClear(); }}
                className="text-xs text-gray-400 hover:text-gray-600"
              >
                Change key
              </button>
            )}
          </div>

          {/* Village search */}
          <div className="mb-5">
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">
              Village / Town
            </label>
            <div className="relative">
              <input
                ref={inputRef}
                type="text"
                value={query}
                onChange={(e) => { setQuery(e.target.value); setSelected(null); setHighlightIdx(-1); }}
                onKeyDown={handleKeyDown}
                onFocus={() => suggestions.length && setOpen(true)}
                placeholder="Type a village name…"
                className="w-full border border-gray-300 rounded-lg px-3 py-2.5 pr-20 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />

              <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-2">
                {loading && (
                  <svg className="animate-spin h-4 w-4 text-indigo-400" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                  </svg>
                )}
                {query && (
                  <button onClick={handleClear} className="text-gray-400 hover:text-gray-600 text-lg leading-none">
                    ×
                  </button>
                )}
              </div>

              {/* Dropdown */}
              {open && suggestions.length > 0 && (
                <div
                  ref={dropdownRef}
                  className="absolute z-20 mt-1 w-full bg-white border border-gray-200 rounded-xl shadow-lg overflow-hidden max-h-64 overflow-y-auto"
                >
                  {suggestions.map((s, i) => (
                    <Suggestion
                      key={s.id}
                      item={s}
                      onSelect={handleSelect}
                      highlighted={i === highlightIdx}
                    />
                  ))}
                </div>
              )}

              {/* No results */}
              {open && !loading && query.length >= 2 && suggestions.length === 0 && (
                <div className="absolute z-20 mt-1 w-full bg-white border border-gray-200 rounded-xl shadow-lg px-4 py-3 text-sm text-gray-400">
                  No villages found for "{query}"
                </div>
              )}
            </div>

            {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
          </div>

          {/* Auto-filled hierarchy */}
          <div className="grid grid-cols-1 gap-4">
            <Field
              label="Sub-District"
              value={filled?.name}
              highlight={highlight}
            />
            <div className="grid grid-cols-2 gap-4">
              <Field
                label="District"
                value={filled?.district?.name}
                highlight={highlight}
              />
              <Field
                label="State"
                value={filled?.district?.state?.name}
                highlight={highlight}
              />
            </div>
          </div>

          {/* Census code badge */}
          {selected && (
            <div className="mt-5 pt-4 border-t border-gray-100 flex items-center gap-3 flex-wrap">
              {[
                { label: "Village Code", value: selected.censusCode },
                { label: "SubDistrict Code", value: filled?.censusCode },
                { label: "District Code", value: filled?.district?.censusCode },
                { label: "State Code", value: filled?.district?.state && "—" },
              ].filter(x => x.value).map(({ label, value }) => (
                <div key={label} className="text-xs">
                  <span className="text-gray-400">{label}: </span>
                  <code className="bg-gray-100 px-1.5 py-0.5 rounded text-gray-700">{value}</code>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* How it works */}
        <div className="mt-6 bg-white rounded-2xl border border-gray-200 p-5">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">How it works</p>
          <ol className="space-y-2 text-sm text-gray-600">
            <li className="flex gap-2"><span className="text-indigo-500 font-bold">1.</span> User types a village name</li>
            <li className="flex gap-2"><span className="text-indigo-500 font-bold">2.</span> API returns matches with full hierarchy in one request</li>
            <li className="flex gap-2"><span className="text-indigo-500 font-bold">3.</span> Selecting a village auto-fills State, District, Sub-District</li>
            <li className="flex gap-2"><span className="text-indigo-500 font-bold">4.</span> 619,500+ villages from Census 2011, all 30 states covered</li>
          </ol>
          <div className="mt-4 bg-gray-900 rounded-lg p-3">
            <code className="text-xs text-green-400">
              GET /api/v1/autocomplete?q=pangi&type=village<br />
              X-API-Key: bsk_yourkey.yoursecret
            </code>
          </div>
        </div>

        <p className="text-center text-xs text-gray-400 mt-4">
          Powered by Bharat Geo API · Census 2011 data
        </p>
      </div>
    </div>
  );
}
