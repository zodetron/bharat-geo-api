import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ fullName: "", email: "", password: "", company: "" });
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  const set = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.value }));

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await register(form);
      setSuccess(true);
    } catch (err) {
      setError(err.error || "Registration failed");
    } finally {
      setLoading(false);
    }
  }

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4" style={{ background: "radial-gradient(ellipse 90% 60% at 50% -10%, rgba(16,185,129,0.15) 0%, #080c14 65%)" }}>
        <div className="rounded-2xl p-10 w-full max-w-sm text-center" style={{ background: "#0f172a", border: "1px solid #1e293b" }}>
          <div className="w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-5" style={{ background: "rgba(16,185,129,0.15)" }}>
            <svg viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-7 h-7">
              <polyline points="20 6 9 17 4 12"/>
            </svg>
          </div>
          <h2 className="text-xl font-extrabold mb-2" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", color: "#f1f5f9" }}>Request Submitted</h2>
          <p className="text-sm leading-relaxed" style={{ color: "#64748b" }}>
            Your account is pending admin approval. You'll receive access once activated.
          </p>
          <Link to="/login"
            className="inline-block mt-6 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all"
            style={{ background: "rgba(99,102,241,0.15)", color: "#818cf8", border: "1px solid rgba(99,102,241,0.3)" }}>
            Back to Sign In
          </Link>
        </div>
      </div>
    );
  }

  const fields = [
    { label: "Full Name",   key: "fullName",  type: "text",     placeholder: "Jane Smith",           required: true },
    { label: "Work Email",  key: "email",     type: "email",    placeholder: "jane@company.com",      required: true },
    { label: "Password",    key: "password",  type: "password", placeholder: "Min. 8 characters",     required: true },
    { label: "Company",     key: "company",   type: "text",     placeholder: "Optional",              required: false },
  ];

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12" style={{ background: "radial-gradient(ellipse 90% 60% at 50% -10%, rgba(99,102,241,0.2) 0%, #080c14 65%)" }}>
      <div className="w-full max-w-sm">
        <div className="flex flex-col items-center mb-8">
          <div className="w-12 h-12 rounded-2xl flex items-center justify-center mb-4" style={{ background: "linear-gradient(135deg, #6366f1, #3b82f6)" }}>
            <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6">
              <circle cx="12" cy="12" r="3"/><path d="M12 2v3m0 14v3M2 12h3m14 0h3"/>
            </svg>
          </div>
          <h1 className="text-2xl font-extrabold" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", color: "#f1f5f9" }}>Request Access</h1>
          <p className="text-sm mt-1" style={{ color: "#64748b" }}>India's village-level geo data API</p>
        </div>

        <div className="rounded-2xl p-7" style={{ background: "#0f172a", border: "1px solid #1e293b" }}>
          {error && (
            <div className="mb-5 px-4 py-3 rounded-xl text-sm" style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.3)", color: "#fca5a5" }}>
              {error}
            </div>
          )}
          <form onSubmit={handleSubmit} className="space-y-4">
            {fields.map(({ label, key, type, placeholder, required }) => (
              <div key={key}>
                <label className="block text-xs font-semibold uppercase tracking-wide mb-2" style={{ color: "#64748b" }}>
                  {label} {required && <span style={{ color: "#f87171" }}>*</span>}
                </label>
                <input
                  type={type} required={required} value={form[key]} placeholder={placeholder}
                  onChange={set(key)}
                  className="w-full px-4 py-3 rounded-xl text-sm outline-none transition-all"
                  style={{ background: "#1e293b", border: "1px solid #334155", color: "#f1f5f9" }}
                  onFocus={e => e.target.style.borderColor = "#6366f1"}
                  onBlur={e => e.target.style.borderColor = "#334155"} />
              </div>
            ))}
            <button type="submit" disabled={loading}
              className="w-full py-3 rounded-xl text-sm font-semibold transition-all mt-2"
              style={{ background: loading ? "#312e81" : "linear-gradient(135deg, #6366f1, #3b82f6)", color: "white", opacity: loading ? 0.7 : 1 }}>
              {loading ? "Submitting…" : "Request Access"}
            </button>
          </form>

          <p className="mt-5 text-center text-sm" style={{ color: "#475569" }}>
            Already have an account?{" "}
            <Link to="/login" className="font-semibold" style={{ color: "#818cf8" }}>Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
