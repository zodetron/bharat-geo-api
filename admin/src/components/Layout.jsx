import { NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import ThemeToggle from "./ThemeToggle";

const NAV = [
  { to: "/",          label: "Dashboard", icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/></svg> },
  { to: "/users",     label: "Users",     icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg> },
  { to: "/analytics", label: "Analytics", icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/><line x1="2" y1="20" x2="22" y2="20"/></svg> },
  { to: "/api-keys",  label: "API Keys",  icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4"><circle cx="7.5" cy="15.5" r="5.5"/><path d="M21 2l-9.6 9.6"/><path d="M15.5 7.5l3 3L22 7l-3-3"/></svg> },
];

export default function Layout({ children }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: "var(--bg)" }}>
      <aside style={{ width: 232, display: "flex", flexDirection: "column", background: "var(--sidebar)", borderRight: "1px solid var(--card-border)", flexShrink: 0 }}>
        {/* Logo */}
        <div style={{ padding: "20px 20px 16px", borderBottom: "1px solid var(--divider)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ width: 30, height: 30, borderRadius: 9, background: "linear-gradient(135deg, var(--green), var(--purple))", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" style={{ width: 15, height: 15 }}>
                <circle cx="12" cy="12" r="3"/><path d="M12 2v3m0 14v3M2 12h3m14 0h3"/>
              </svg>
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: 800, fontSize: 13, color: "var(--text)", margin: 0, lineHeight: 1.2 }}>Bharat Geo API</p>
              <p style={{ fontSize: 11, color: "var(--text-muted)", margin: 0 }}>Admin Portal</p>
            </div>
            <ThemeToggle />
          </div>
        </div>

        {/* Nav */}
        <nav style={{ flex: 1, padding: "12px 10px", display: "flex", flexDirection: "column", gap: 2 }}>
          {NAV.map(({ to, label, icon }) => (
            <NavLink key={to} to={to} end={to === "/"}
              style={({ isActive }) => ({
                display: "flex", alignItems: "center", gap: 10, padding: "9px 12px",
                borderRadius: 10, fontSize: 13, fontWeight: 500, textDecoration: "none",
                color: isActive ? "var(--green)" : "var(--text-muted)",
                background: isActive ? "var(--green-dim)" : "transparent",
                border: isActive ? "1px solid var(--green-border)" : "1px solid transparent",
                transition: "all 0.15s",
              })}>
              {icon}{label}
            </NavLink>
          ))}
        </nav>

        {/* User */}
        <div style={{ padding: "12px 14px 16px", borderTop: "1px solid var(--divider)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
            <div style={{ width: 30, height: 30, borderRadius: "50%", background: "var(--green-dim)", border: "1px solid var(--green-border)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 700, color: "var(--green)", flexShrink: 0 }}>
              {user?.email?.[0]?.toUpperCase()}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{ fontSize: 11, fontWeight: 600, color: "var(--text-2)", margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{user?.email}</p>
              <p style={{ fontSize: 10, color: "var(--text-muted)", margin: 0 }}>Administrator</p>
            </div>
          </div>
          <button onClick={() => { logout(); navigate("/login"); }}
            style={{ width: "100%", padding: "7px 12px", borderRadius: 8, fontSize: 12, fontWeight: 600, color: "var(--red-text)", background: "var(--red-dim)", border: "1px solid var(--red-border)", cursor: "pointer", textAlign: "left", transition: "opacity 0.15s" }}>
            Sign out
          </button>
        </div>
      </aside>

      <main style={{ flex: 1, overflow: "auto", background: "var(--bg-glow)" }}>
        <div style={{ padding: "36px 40px", maxWidth: 1200 }}>{children}</div>
      </main>
    </div>
  );
}
