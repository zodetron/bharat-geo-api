import { NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const NAV = [
  {
    to: "/", label: "Dashboard",
    icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/></svg>,
  },
  {
    to: "/api-keys", label: "API Keys",
    icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4"><circle cx="7.5" cy="15.5" r="5.5"/><path d="M21 2l-9.6 9.6"/><path d="M15.5 7.5l3 3L22 7l-3-3"/></svg>,
  },
  {
    to: "/docs", label: "Docs",
    icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg>,
  },
];

export default function Layout({ children }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  return (
    <div className="flex min-h-screen" style={{ background: "#080c14" }}>
      <aside className="w-60 flex flex-col border-r" style={{ background: "#05080f", borderColor: "#1e293b" }}>
        <div className="px-5 py-6" style={{ borderBottom: "1px solid #1e293b" }}>
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: "linear-gradient(135deg, #6366f1, #3b82f6)" }}>
              <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
                <circle cx="12" cy="12" r="3"/><path d="M12 2v3m0 14v3M2 12h3m14 0h3"/>
              </svg>
            </div>
            <div>
              <p className="text-sm font-bold leading-none" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", color: "#f1f5f9" }}>Bharat Geo API</p>
              <p className="text-xs mt-0.5" style={{ color: "#475569" }}>Developer Portal</p>
            </div>
          </div>
        </div>

        <nav className="flex-1 px-3 py-4 space-y-0.5">
          {NAV.map(({ to, label, icon }) => (
            <NavLink
              key={to}
              to={to}
              end={to === "/"}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                  isActive ? "text-indigo-300" : "text-slate-500 hover:text-slate-200"
                }`
              }
              style={({ isActive }) => isActive ? { background: "rgba(99,102,241,0.12)" } : {}}
            >
              {icon}
              {label}
            </NavLink>
          ))}
        </nav>

        <div className="px-4 py-4" style={{ borderTop: "1px solid #1e293b" }}>
          <div className="flex items-center gap-3 mb-3">
            <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0" style={{ background: "rgba(99,102,241,0.2)", color: "#a5b4fc" }}>
              {user?.fullName?.[0]?.toUpperCase() || user?.email?.[0]?.toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold truncate" style={{ color: "#cbd5e1" }}>{user?.fullName}</p>
              <p className="text-xs truncate" style={{ color: "#475569" }}>{user?.email}</p>
            </div>
          </div>
          <div className="flex items-center justify-between">
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-semibold"
              style={user?.status === "ACTIVE"
                ? { background: "rgba(16,185,129,0.1)", color: "#6ee7b7" }
                : { background: "rgba(245,158,11,0.1)", color: "#fcd34d" }}>
              <span className="w-1.5 h-1.5 rounded-full" style={{ background: user?.status === "ACTIVE" ? "#10b981" : "#f59e0b" }} />
              {user?.status}
            </span>
            <button
              onClick={() => { logout(); navigate("/login"); }}
              className="text-xs font-medium transition-colors"
              style={{ color: "#475569" }}
              onMouseEnter={e => e.currentTarget.style.color = "#f87171"}
              onMouseLeave={e => e.currentTarget.style.color = "#475569"}>
              Sign out
            </button>
          </div>
        </div>
      </aside>

      <main className="flex-1 overflow-auto">
        <div className="p-8 max-w-5xl">
          {children}
        </div>
      </main>
    </div>
  );
}
