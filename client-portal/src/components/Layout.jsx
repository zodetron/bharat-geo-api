import { NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const links = [
  { to: "/",        label: "Dashboard" },
  { to: "/api-keys", label: "API Keys" },
  { to: "/docs",    label: "Docs" },
];

export default function Layout({ children }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  return (
    <div className="flex min-h-screen bg-gray-50">
      <aside className="w-56 bg-white border-r border-gray-200 flex flex-col">
        <div className="px-6 py-5 border-b border-gray-200">
          <span className="text-lg font-bold text-indigo-600">Bharat Geo API</span>
          <p className="text-xs text-gray-400 mt-0.5">Developer Portal</p>
        </div>

        <nav className="flex-1 px-3 py-4 space-y-1">
          {links.map(({ to, label }) => (
            <NavLink
              key={to}
              to={to}
              end={to === "/"}
              className={({ isActive }) =>
                `block px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  isActive
                    ? "bg-indigo-50 text-indigo-700"
                    : "text-gray-600 hover:bg-gray-100"
                }`
              }
            >
              {label}
            </NavLink>
          ))}
        </nav>

        <div className="px-4 py-4 border-t border-gray-200">
          <p className="text-xs font-medium text-gray-700 truncate">{user?.fullName}</p>
          <p className="text-xs text-gray-400 truncate">{user?.email}</p>
          <span className={`inline-block mt-1 px-2 py-0.5 text-xs rounded-full font-medium ${
            user?.status === "ACTIVE" ? "bg-green-100 text-green-700" : "bg-yellow-100 text-yellow-700"
          }`}>
            {user?.status}
          </span>
          <button
            onClick={() => { logout(); navigate("/login"); }}
            className="block mt-2 text-xs text-red-400 hover:text-red-600"
          >
            Logout
          </button>
        </div>
      </aside>

      <main className="flex-1 p-8 overflow-auto">{children}</main>
    </div>
  );
}
