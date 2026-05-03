import { useState, useRef, useEffect } from "react";
import { useVillageAutocomplete } from "./hooks/useVillageAutocomplete";
import ThemeToggle from "./components/ThemeToggle";
import "./index.css";

function Field({ label, value, highlight }) {
  return (
    <div>
      <label style={{ display: "block", fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.07em", color: "var(--text-muted)", marginBottom: 7 }}>{label}</label>
      <div style={{
        padding: "12px 16px", borderRadius: 12, fontSize: 13, transition: "all 0.2s",
        background: value && highlight ? "var(--purple-dim)" : "var(--input)",
        border: `1px solid ${value && highlight ? "var(--purple-border)" : "var(--input-border)"}`,
        color: value ? (highlight ? "var(--purple-text)" : "var(--text)") : "var(--text-muted)",
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
      style={{ width: "100%", textAlign: "left", padding: "12px 16px", transition: "background 0.1s", borderBottom: "1px solid var(--divider)", background: highlighted ? "var(--purple-dim)" : "transparent", border: "none", cursor: "pointer" }}
      onMouseEnter={e => !highlighted && (e.currentTarget.style.background = "var(--row-hover)")}
      onMouseLeave={e => !highlighted && (e.currentTarget.style.background = "transparent")}>
      <p style={{ fontSize: 13, fontWeight: 600, color: "var(--text)", margin: 0 }}>{item.name}</p>
      <p style={{ fontSize: 11, color: "var(--text-muted)", margin: "2px 0 0" }}>
        {[sd?.name, district?.name, state?.name].filter(Boolean).join(" › ")}
      </p>
    </button>
  );
}

export default function App() {
  const [apiKey, setApiKey]       = useState("");
  const [keyInput, setKeyInput]   = useState("");
  const [selected, setSelected]   = useState(null);
  const [highlight, setHighlight] = useState(false);
  const [highlightIdx, setHighlightIdx] = useState(-1);
  const inputRef   = useRef(null);
  const dropdownRef = useRef(null);

  const { query, setQuery, suggestions, loading, error, open, setOpen, clear } = useVillageAutocomplete(apiKey);

  useEffect(() => {
    if (!document.documentElement.dataset.theme)
      document.documentElement.dataset.theme = localStorage.getItem("theme") || "dark";
  }, []);

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
    setSelected(item); setQuery(item.name); setOpen(false); setHighlightIdx(-1);
  }

  function handleKeyDown(e) {
    if (!open || !suggestions.length) return;
    if (e.key === "ArrowDown")      { e.preventDefault(); setHighlightIdx(i => Math.min(i + 1, suggestions.length - 1)); }
    else if (e.key === "ArrowUp")   { e.preventDefault(); setHighlightIdx(i => Math.max(i - 1, 0)); }
    else if (e.key === "Enter" && highlightIdx >= 0) { e.preventDefault(); handleSelect(suggestions[highlightIdx]); }
    else if (e.key === "Escape")    setOpen(false);
  }

  const filled = selected?.subDistrict;
  const inp = { width: "100%", padding: "12px 16px", borderRadius: 12, fontSize: 14, outline: "none", background: "var(--input)", border: "1px solid var(--input-border)", color: "var(--text)", transition: "border-color 0.2s", boxSizing: "border-box" };

  return (
    <div style={{ minHeight: "100vh", background: "var(--bg-glow)" }}>
      <div style={{ position: "fixed", top: 16, right: 16 }}><ThemeToggle /></div>
      <div style={{ maxWidth: 520, margin: "0 auto", padding: "64px 16px 48px" }}>

        {/* Header */}
        <div style={{ textAlign: "center", marginBottom: 40 }}>
          <div style={{ width: 56, height: 56, borderRadius: 18, background: "linear-gradient(135deg, var(--purple), var(--green))", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 18px" }}>
            <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" style={{ width: 28, height: 28 }}>
              <circle cx="12" cy="12" r="3"/><path d="M12 2v3m0 14v3M2 12h3m14 0h3"/>
            </svg>
          </div>
          <h1 style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: 800, fontSize: 34, color: "var(--text)", margin: "0 0 8px" }}>Bharat Geo API</h1>
          <p style={{ fontSize: 14, color: "var(--text-muted)", margin: 0 }}>Village-level address autocomplete · 619,500+ villages · Census 2011</p>
        </div>

        {/* API Key Input */}
        {!apiKey && (
          <div style={{ borderRadius: 20, padding: 24, marginBottom: 16, background: "var(--card)", border: "1px solid var(--card-border-p)" }}>
            <p style={{ fontSize: 13, fontWeight: 600, color: "var(--text)", margin: "0 0 4px" }}>Enter your API key to start</p>
            <p style={{ fontSize: 12, color: "var(--text-muted)", margin: "0 0 16px" }}>
              No key?{" "}
              <a href={`${import.meta.env.VITE_CLIENT_PORTAL_URL || "/client"}/register`}
                style={{ color: "var(--purple-text)", fontWeight: 600, textDecoration: "none" }}>Request access →</a>
            </p>
            <div style={{ display: "flex", gap: 10 }}>
              <input type="text" placeholder="bsk_xxxxxx.yyyyyy…" value={keyInput}
                onChange={e => setKeyInput(e.target.value)}
                onKeyDown={e => e.key === "Enter" && keyInput && setApiKey(keyInput.trim())}
                style={{ ...inp, flex: 1 }}
                onFocus={e => e.target.style.borderColor = "var(--input-focus)"}
                onBlur={e => e.target.style.borderColor = "var(--input-border)"} />
              <button onClick={() => keyInput && setApiKey(keyInput.trim())}
                style={{ padding: "12px 20px", borderRadius: 12, fontSize: 13, fontWeight: 700, background: "var(--green)", color: "#000", border: "none", cursor: "pointer", whiteSpace: "nowrap" }}>
                Connect
              </button>
            </div>
          </div>
        )}

        {/* Demo Form */}
        <div style={{ borderRadius: 20, padding: 24, background: "var(--card)", border: "1px solid var(--card-border)", transition: "opacity 0.2s", opacity: !apiKey ? 0.45 : 1, pointerEvents: !apiKey ? "none" : "all" }}>
          {apiKey && (
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
              <h2 style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: 700, fontSize: 14, color: "var(--text)", margin: 0 }}>Address Form</h2>
              <button onClick={() => { setApiKey(""); setKeyInput(""); clear(); setSelected(null); }}
                style={{ fontSize: 12, color: "var(--text-muted)", background: "none", border: "none", cursor: "pointer", padding: 0 }}
                onMouseEnter={e => e.currentTarget.style.color = "var(--text)"}
                onMouseLeave={e => e.currentTarget.style.color = "var(--text-muted)"}>
                Change key
              </button>
            </div>
          )}

          {/* Search */}
          <div style={{ marginBottom: 20 }}>
            <label style={{ display: "block", fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.07em", color: "var(--text-muted)", marginBottom: 7 }}>Village / Town</label>
            <div style={{ position: "relative" }}>
              <input ref={inputRef} type="text" value={query}
                onChange={e => { setQuery(e.target.value); setSelected(null); setHighlightIdx(-1); }}
                onKeyDown={handleKeyDown}
                onFocus={() => suggestions.length && setOpen(true)}
                placeholder="Type a village name…"
                style={{ ...inp, paddingRight: 44, borderColor: open ? "var(--input-focus)" : "var(--input-border)" }}
              />

              <div style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", display: "flex", alignItems: "center", gap: 6 }}>
                {loading && (
                  <svg className="animate-spin" style={{ width: 16, height: 16, color: "var(--purple)" }} viewBox="0 0 24 24" fill="none">
                    <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" strokeOpacity="0.25"/>
                    <path d="M12 2a10 10 0 0 1 10 10" stroke="currentColor" strokeWidth="3" strokeLinecap="round"/>
                  </svg>
                )}
                {query && (
                  <button onClick={() => { clear(); setSelected(null); }}
                    style={{ fontSize: 18, lineHeight: 1, color: "var(--text-muted)", background: "none", border: "none", cursor: "pointer", padding: 0 }}
                    onMouseEnter={e => e.currentTarget.style.color = "var(--text)"}
                    onMouseLeave={e => e.currentTarget.style.color = "var(--text-muted)"}>×</button>
                )}
              </div>

              {open && suggestions.length > 0 && (
                <div ref={dropdownRef} style={{ position: "absolute", zIndex: 20, marginTop: 6, width: "100%", borderRadius: 16, overflow: "hidden", maxHeight: 260, overflowY: "auto", background: "var(--card)", border: "1px solid var(--card-border)", boxShadow: "0 20px 40px rgba(0,0,0,0.5)" }}>
                  {suggestions.map((s, i) => (
                    <Suggestion key={s.id} item={s} onSelect={handleSelect} highlighted={i === highlightIdx} />
                  ))}
                </div>
              )}

              {open && !loading && query.length >= 2 && suggestions.length === 0 && (
                <div style={{ position: "absolute", zIndex: 20, marginTop: 6, width: "100%", borderRadius: 16, padding: "14px 16px", fontSize: 13, background: "var(--card)", border: "1px solid var(--card-border)", color: "var(--text-muted)" }}>
                  No villages found for "{query}"
                </div>
              )}
            </div>
            {error && <p style={{ fontSize: 12, marginTop: 6, color: "var(--red-text)" }}>{error}</p>}
          </div>

          {/* Auto-filled fields */}
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <Field label="Sub-District" value={filled?.name} highlight={highlight} />
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <Field label="District" value={filled?.district?.name} highlight={highlight} />
              <Field label="State" value={filled?.district?.state?.name} highlight={highlight} />
            </div>
          </div>

          {/* Census codes */}
          {selected && (
            <div style={{ marginTop: 18, paddingTop: 18, display: "flex", flexWrap: "wrap", gap: 10, borderTop: "1px solid var(--divider)" }}>
              {[
                { label: "Village Code", value: selected.censusCode },
                { label: "Sub-District", value: filled?.censusCode },
                { label: "District",     value: filled?.district?.censusCode },
              ].filter(x => x.value).map(({ label, value }) => (
                <div key={label} style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <span style={{ fontSize: 11, color: "var(--text-muted)" }}>{label}:</span>
                  <code style={{ fontSize: 11, padding: "2px 8px", borderRadius: 7, fontFamily: "monospace", background: "var(--purple-dim)", color: "var(--purple-text)", border: "1px solid var(--purple-border)" }}>{value}</code>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* How it works */}
        <div style={{ marginTop: 16, borderRadius: 20, padding: 24, background: "var(--card)", border: "1px solid var(--card-border)" }}>
          <p style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", color: "var(--text-muted)", margin: "0 0 16px" }}>How it works</p>
          <ol style={{ margin: 0, padding: 0, listStyle: "none", display: "flex", flexDirection: "column", gap: 10 }}>
            {[
              ["1", "User types a village name — results appear instantly"],
              ["2", "API returns full hierarchy (state, district, sub-district) in one request"],
              ["3", "Selecting a village auto-fills all address fields"],
              ["4", "619,500+ villages from Census 2011, all 30 states covered"],
            ].map(([num, text]) => (
              <li key={num} style={{ display: "flex", alignItems: "flex-start", gap: 12, fontSize: 13, color: "var(--text-2)" }}>
                <span style={{ width: 22, height: 22, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 700, flexShrink: 0, marginTop: 1, background: "var(--purple-dim)", color: "var(--purple-text)", border: "1px solid var(--purple-border)" }}>{num}</span>
                {text}
              </li>
            ))}
          </ol>
          <div style={{ marginTop: 18, borderRadius: 12, padding: 16, overflowX: "auto", background: "var(--input)", border: "1px solid var(--card-border)" }}>
            <code style={{ fontSize: 12, fontFamily: "monospace", color: "var(--green-text)" }}>
              GET /api/v1/autocomplete?q=pangi&type=village<br />
              X-API-Key: bsk_yourkey.yoursecret
            </code>
          </div>
        </div>

        <p style={{ textAlign: "center", fontSize: 12, marginTop: 20, color: "var(--text-muted)" }}>
          Powered by Bharat Geo API · Census 2011 data
        </p>
      </div>
    </div>
  );
}
