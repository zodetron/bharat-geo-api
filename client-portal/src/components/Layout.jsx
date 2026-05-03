import { NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import ThemeToggle from "./ThemeToggle";

const NAV = [
  { to: "/",         label: "Dashboard", icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" style={{ width: 15, height: 15 }}><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/></svg> },
  { to: "/api-keys", label: "API Keys",  icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" style={{ width: 15, height: 15 }}><circle cx="7.5" cy="15.5" r="5.5"/><path d="M21 2l-9.6 9.6"/><path d="M15.5 7.5l3 3L22 7l-3-3"/></svg> },
  { to: "/docs",     label: "Docs",      icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" style={{ width: 15, height: 15 }}><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg> },
];

export default function Layout({ children }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: "var(--bg)" }}>
      <aside style={{ width: 232, display: "flex", flexDirection: "column", background: "var(--sidebar)", borderRight: "1px solid var(--card-border)", flexShrink: 0 }}>
        <div style={{ padding: "20px 20px 16px", borderBottom: "1px solid var(--divider)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ width: 30, height: 30, borderRadius: 9, background: "linear-gradient(135deg, var(--purple), var(--green))", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" style={{ width: 15, height: 15 }}>
                <circle cx="12" cy="12" r="3"/><path d="M12 2v3m0 14v3M2 12h3m14 0h3"/>
              </svg>
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: 800, fontSize: 13, color: "var(--text)", margin: 0, lineHeight: 1.2 }}>Bharat Geo API</p>
              <p style={{ fontSize: 11, color: "var(--text-muted)", margin: 0 }}>Developer Portal</p>
            </div>
            <ThemeToggle />
          </div>
        </div>

        <nav style={{ flex: 1, padding: "12px 10px", display: "flex", flexDirection: "column", gap: 2 }}>
          {NAV.map(({ to, label, icon }) => (
            <NavLink key={to} to={to} end={to === "/"}
              style={({ isActive }) => ({
                display: "flex", alignItems: "center", gap: 10, padding: "9px 12px",
                borderRadius: 10, fontSize: 13, fontWeight: 500, textDecoration: "none",
                color: isActive ? "var(--purple-text)" : "var(--text-muted)",
                background: isActive ? "var(--purple-dim)" : "transparent",
                border: isActive ? "1px solid var(--purple-border)" : "1px solid transparent",
                transition: "all 0.15s",
              })}>
              {icon}{label}
            </NavLink>
          ))}
        </nav>

        <div style={{ padding: "12px 14px 16px", borderTop: "1px solid var(--divider)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
            <div style={{ width: 30, height: 30, borderRadius: "50%", background: "var(--purple-dim)", border: "1px solid var(--purple-border)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 700, color: "var(--purple-text)", flexShrink: 0 }}>
              {user?.fullName?.[0]?.toUpperCase() || user?.email?.[0]?.toUpperCase()}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{ fontSize: 12, fontWeight: 600, color: "var(--text-2)", margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{user?.fullName}</p>
              <p style={{ fontSize: 11, color: "var(--text-muted)", margin: 0 }}>{user?.email}</p>
            </div>
          </div>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <span style={{ display: "inline-flex", alignItems: "center", gap: 5, padding: "3px 9px", borderRadius: 7, fontSize: 11, fontWeight: 700, background: user?.status === "ACTIVE" ? "var(--green-dim)" : "var(--yellow-dim)", color: user?.status === "ACTIVE" ? "var(--green-text)" : "var(--yellow-text)" }}>
              <span style={{ width: 5, height: 5, borderRadius: "50%", background: user?.status === "ACTIVE" ? "var(--green)" : "var(--yellow-text)" }} />{user?.status}
            </span>
            <button onClick={() => { logout(); navigate("/login"); }} style={{ fontSize: 12, fontWeight: 600, color: "var(--text-muted)", background: "none", border: "none", cursor: "pointer", padding: 0 }}
              onMouseEnter={e => e.currentTarget.style.color = "var(--red-text)"}
              onMouseLeave={e => e.currentTarget.style.color = "var(--text-muted)"}>
              Sign out
            </button>
          </div>
        </div>
      </aside>

      <main style={{ flex: 1, overflow: "auto", background: "var(--bg-glow)" }}>
        <div style={{ padding: "36px 40px", maxWidth: 960 }}>{children}</div>
      </main>
    </div>
  );
}
