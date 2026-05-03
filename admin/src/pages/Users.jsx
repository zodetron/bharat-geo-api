import { useEffect, useState } from "react";
import api from "../api/client";

const STATUS = {
  ACTIVE:    { bg: "rgba(16,185,129,0.1)",  text: "#6ee7b7",  border: "rgba(16,185,129,0.25)"  },
  PENDING:   { bg: "rgba(245,158,11,0.1)",  text: "#fcd34d",  border: "rgba(245,158,11,0.25)"  },
  SUSPENDED: { bg: "rgba(239,68,68,0.1)",   text: "#fca5a5",  border: "rgba(239,68,68,0.25)"   },
};

function Badge({ status }) {
  const s = STATUS[status] || STATUS.PENDING;
  return (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold" style={{ background: s.bg, color: s.text, border: `1px solid ${s.border}` }}>
      <span className="w-1.5 h-1.5 rounded-full" style={{ background: s.text }} />
      {status}
    </span>
  );
}

export default function Users() {
  const [users, setUsers]       = useState([]);
  const [pagination, setPagination] = useState(null);
  const [filter, setFilter]     = useState("");
  const [page, setPage]         = useState(1);
  const [updating, setUpdating] = useState(null);

  async function load(p = 1) {
    const res = await api.get(`/admin/users?page=${p}&limit=20${filter ? `&status=${filter}` : ""}`);
    setUsers(res.data);
    setPagination(res.pagination);
    setPage(p);
  }

  useEffect(() => { load(1); }, [filter]);

  async function changeStatus(userId, status) {
    setUpdating(userId);
    try {
      await api.patch(`/admin/users/${userId}`, { status });
      setUsers(u => u.map(x => x.id === userId ? { ...x, status } : x));
    } catch (e) {
      alert(e.error || "Failed to update");
    } finally {
      setUpdating(null);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-extrabold" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", color: "#f1f5f9" }}>Users</h1>
          <p className="text-sm mt-1" style={{ color: "#475569" }}>Manage accounts and access</p>
        </div>
        <select
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="px-4 py-2 rounded-xl text-sm font-medium outline-none"
          style={{ background: "#1e293b", border: "1px solid #334155", color: "#cbd5e1" }}
        >
          <option value="">All statuses</option>
          <option value="PENDING">Pending</option>
          <option value="ACTIVE">Active</option>
          <option value="SUSPENDED">Suspended</option>
        </select>
      </div>

      <div className="rounded-2xl overflow-hidden" style={{ background: "#0f172a", border: "1px solid #1e293b" }}>
        <table className="w-full text-sm">
          <thead>
            <tr style={{ borderBottom: "1px solid #1e293b", background: "rgba(30,41,59,0.5)" }}>
              {["Name", "Email", "Company", "Keys", "Status", "Joined", "Actions"].map(h => (
                <th key={h} className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wider" style={{ color: "#475569" }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {users.map((u, i) => (
              <tr key={u.id} style={{ borderBottom: i < users.length - 1 ? "1px solid #1e293b" : "none" }}
                onMouseEnter={e => e.currentTarget.style.background = "rgba(30,41,59,0.4)"}
                onMouseLeave={e => e.currentTarget.style.background = ""}>
                <td className="px-5 py-4 font-semibold text-sm" style={{ color: "#f1f5f9" }}>{u.fullName}</td>
                <td className="px-5 py-4 text-sm" style={{ color: "#94a3b8" }}>{u.email}</td>
                <td className="px-5 py-4 text-sm" style={{ color: "#64748b" }}>{u.company || "—"}</td>
                <td className="px-5 py-4 text-sm font-mono" style={{ color: "#64748b" }}>{u._count.apiKeys}</td>
                <td className="px-5 py-4"><Badge status={u.status} /></td>
                <td className="px-5 py-4 text-xs" style={{ color: "#475569" }}>{new Date(u.createdAt).toLocaleDateString()}</td>
                <td className="px-5 py-4">
                  <div className="flex gap-3">
                    {u.status !== "ACTIVE" && (
                      <button onClick={() => changeStatus(u.id, "ACTIVE")} disabled={updating === u.id}
                        className="text-xs font-semibold transition-colors disabled:opacity-40"
                        style={{ color: "#6ee7b7" }}
                        onMouseEnter={e => e.currentTarget.style.color = "#10b981"}
                        onMouseLeave={e => e.currentTarget.style.color = "#6ee7b7"}>
                        Approve
                      </button>
                    )}
                    {u.status !== "SUSPENDED" && (
                      <button onClick={() => changeStatus(u.id, "SUSPENDED")} disabled={updating === u.id}
                        className="text-xs font-semibold transition-colors disabled:opacity-40"
                        style={{ color: "#f87171" }}
                        onMouseEnter={e => e.currentTarget.style.color = "#ef4444"}
                        onMouseLeave={e => e.currentTarget.style.color = "#f87171"}>
                        Suspend
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
            {users.length === 0 && (
              <tr><td colSpan={7} className="px-5 py-12 text-center text-sm" style={{ color: "#334155" }}>No users found.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {pagination && pagination.totalPages > 1 && (
        <div className="flex items-center gap-3 justify-end">
          <button onClick={() => load(page - 1)} disabled={!pagination.hasPrev}
            className="px-4 py-2 rounded-xl text-xs font-semibold transition-all disabled:opacity-30"
            style={{ background: "#1e293b", border: "1px solid #334155", color: "#94a3b8" }}>
            ← Prev
          </button>
          <span className="text-xs" style={{ color: "#475569" }}>Page {pagination.page} of {pagination.totalPages}</span>
          <button onClick={() => load(page + 1)} disabled={!pagination.hasNext}
            className="px-4 py-2 rounded-xl text-xs font-semibold transition-all disabled:opacity-30"
            style={{ background: "#1e293b", border: "1px solid #334155", color: "#94a3b8" }}>
            Next →
          </button>
        </div>
      )}
    </div>
  );
}
