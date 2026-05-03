import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import ThemeToggle from "../components/ThemeToggle";

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!document.documentElement.dataset.theme)
      document.documentElement.dataset.theme = localStorage.getItem("theme") || "dark";
  }, []);

  async function handleSubmit(e) {
    e.preventDefault(); setError(""); setLoading(true);
    try { await login(email, password); navigate("/"); }
    catch (err) { setError(err.error || err.message || "Login failed"); }
    finally { setLoading(false); }
  }

  const inp = { width: "100%", padding: "12px 16px", borderRadius: 12, fontSize: 14, outline: "none", background: "var(--input)", border: "1px solid var(--input-border)", color: "var(--text)", transition: "border-color 0.2s", boxSizing: "border-box" };

  return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", padding: 16, background: "var(--bg-glow)" }}>
      <div style={{ position: "fixed", top: 16, right: 16 }}><ThemeToggle /></div>
      <div style={{ width: "100%", maxWidth: 380 }}>
        <div style={{ textAlign: "center", marginBottom: 28 }}>
          <div style={{ width: 52, height: 52, borderRadius: 16, background: "linear-gradient(135deg, var(--purple), var(--green))", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px" }}>
            <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" style={{ width: 26, height: 26 }}>
              <circle cx="12" cy="12" r="3"/><path d="M12 2v3m0 14v3M2 12h3m14 0h3"/>
            </svg>
          </div>
          <h1 style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: 800, fontSize: 26, color: "var(--text)", margin: "0 0 4px" }}>Welcome back</h1>
          <p style={{ fontSize: 13, color: "var(--text-muted)", margin: 0 }}>Sign in to your developer account</p>
        </div>
        <div style={{ background: "var(--card)", border: "1px solid var(--card-border-p)", borderRadius: 20, padding: 28 }}>
          {error && <div style={{ marginBottom: 18, padding: "10px 14px", borderRadius: 10, background: "var(--red-dim)", border: "1px solid var(--red-border)", color: "var(--red-text)", fontSize: 13 }}>{error}</div>}
          <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <div>
              <label style={{ display: "block", fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.07em", color: "var(--text-muted)", marginBottom: 8 }}>Email</label>
              <input type="email" required value={email} placeholder="you@company.com" onChange={e => setEmail(e.target.value)} style={inp}
                onFocus={e => e.target.style.borderColor = "var(--input-focus)"} onBlur={e => e.target.style.borderColor = "var(--input-border)"} />
            </div>
            <div>
              <label style={{ display: "block", fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.07em", color: "var(--text-muted)", marginBottom: 8 }}>Password</label>
              <input type="password" required value={password} placeholder="••••••••" onChange={e => setPassword(e.target.value)} style={inp}
                onFocus={e => e.target.style.borderColor = "var(--input-focus)"} onBlur={e => e.target.style.borderColor = "var(--input-border)"} />
            </div>
            <button type="submit" disabled={loading} style={{ marginTop: 4, width: "100%", padding: 13, borderRadius: 12, fontSize: 14, fontWeight: 700, color: "#000", background: "var(--green)", border: "none", cursor: loading ? "not-allowed" : "pointer", opacity: loading ? 0.6 : 1 }}>
              {loading ? "Signing in…" : "Sign In →"}
            </button>
          </form>
          <p style={{ marginTop: 18, textAlign: "center", fontSize: 13, color: "var(--text-muted)" }}>
            No account? <Link to="/register" style={{ color: "var(--purple-text)", fontWeight: 700, textDecoration: "none" }}>Request access →</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
