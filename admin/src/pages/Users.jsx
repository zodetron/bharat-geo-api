import { useEffect, useState } from "react";
import api from "../api/client";

function Badge({ status }) {
  const s = {
    ACTIVE:    { bg: "var(--green-dim)",  text: "var(--green-text)",  border: "var(--green-border)"  },
    PENDING:   { bg: "var(--yellow-dim)", text: "var(--yellow-text)", border: "var(--yellow-border)" },
    SUSPENDED: { bg: "var(--red-dim)",    text: "var(--red-text)",    border: "var(--red-border)"    },
  }[status] || {};
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 5, padding: "4px 10px", borderRadius: 8, fontSize: 11, fontWeight: 700, background: s.bg, color: s.text, border: `1px solid ${s.border}` }}>
      <span style={{ width: 6, height: 6, borderRadius: "50%", background: s.text }} />{status}
    </span>
  );
}

export default function Users() {
  const [users, setUsers]           = useState([]);
  const [pagination, setPagination] = useState(null);
  const [filter, setFilter]         = useState("");
  const [page, setPage]             = useState(1);
  const [updating, setUpdating]     = useState(null);

  async function load(p = 1) {
    const res = await api.get(`/admin/users?page=${p}&limit=20${filter ? `&status=${filter}` : ""}`);
    setUsers(res.data); setPagination(res.pagination); setPage(p);
  }
  useEffect(() => { load(1); }, [filter]);

  async function changeStatus(userId, status) {
    setUpdating(userId);
    try { await api.patch(`/admin/users/${userId}`, { status }); setUsers(u => u.map(x => x.id === userId ? { ...x, status } : x)); }
    catch (e) { alert(e.error || "Failed"); }
    finally { setUpdating(null); }
  }

  const sel = { background: "var(--input)", border: "1px solid var(--input-border)", color: "var(--text)", padding: "8px 14px", borderRadius: 10, fontSize: 13, outline: "none" };
  const th = { padding: "12px 18px", textAlign: "left", fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.07em", color: "var(--text-muted)" };
  const td = { padding: "14px 18px", fontSize: 13 };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}>
        <div>
          <h1 style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: 800, fontSize: 30, color: "var(--text)", margin: "0 0 4px" }}>Users</h1>
          <p style={{ fontSize: 13, color: "var(--text-muted)", margin: 0 }}>Manage accounts and access</p>
        </div>
        <select value={filter} onChange={e => setFilter(e.target.value)} style={sel}>
          <option value="">All statuses</option>
          <option value="PENDING">Pending</option>
          <option value="ACTIVE">Active</option>
          <option value="SUSPENDED">Suspended</option>
        </select>
      </div>

      <div style={{ background: "var(--card)", border: "1px solid var(--card-border)", borderRadius: 18, overflow: "hidden" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
          <thead>
            <tr style={{ background: "var(--table-head)", borderBottom: "1px solid var(--divider)" }}>
              {["Name","Email","Company","Keys","Status","Joined","Actions"].map(h => <th key={h} style={th}>{h}</th>)}
            </tr>
          </thead>
          <tbody>
            {users.map((u, i) => (
              <tr key={u.id} style={{ borderBottom: i < users.length - 1 ? "1px solid var(--divider)" : "none", transition: "background 0.1s" }}
                onMouseEnter={e => e.currentTarget.style.background = "var(--row-hover)"}
                onMouseLeave={e => e.currentTarget.style.background = ""}>
                <td style={{ ...td, fontWeight: 600, color: "var(--text)" }}>{u.fullName}</td>
                <td style={{ ...td, color: "var(--text-2)" }}>{u.email}</td>
                <td style={{ ...td, color: "var(--text-muted)" }}>{u.company || "—"}</td>
                <td style={{ ...td, color: "var(--text-muted)", fontFamily: "monospace" }}>{u._count.apiKeys}</td>
                <td style={td}><Badge status={u.status} /></td>
                <td style={{ ...td, color: "var(--text-muted)", fontSize: 12 }}>{new Date(u.createdAt).toLocaleDateString()}</td>
                <td style={td}>
                  <div style={{ display: "flex", gap: 12 }}>
                    {u.status !== "ACTIVE" && <button onClick={() => changeStatus(u.id, "ACTIVE")} disabled={updating === u.id} style={{ fontSize: 12, fontWeight: 700, color: "var(--green-text)", background: "none", border: "none", cursor: "pointer", padding: 0, opacity: updating === u.id ? 0.4 : 1 }}>Approve</button>}
                    {u.status !== "SUSPENDED" && <button onClick={() => changeStatus(u.id, "SUSPENDED")} disabled={updating === u.id} style={{ fontSize: 12, fontWeight: 700, color: "var(--red-text)", background: "none", border: "none", cursor: "pointer", padding: 0, opacity: updating === u.id ? 0.4 : 1 }}>Suspend</button>}
                  </div>
                </td>
              </tr>
            ))}
            {users.length === 0 && <tr><td colSpan={7} style={{ padding: "40px 18px", textAlign: "center", color: "var(--text-muted)", fontSize: 13 }}>No users found.</td></tr>}
          </tbody>
        </table>
      </div>

      {pagination && pagination.totalPages > 1 && (
        <div style={{ display: "flex", alignItems: "center", gap: 12, justifyContent: "flex-end" }}>
          <button onClick={() => load(page - 1)} disabled={!pagination.hasPrev} style={{ padding: "7px 16px", borderRadius: 9, fontSize: 12, fontWeight: 600, background: "var(--input)", border: "1px solid var(--input-border)", color: "var(--text-2)", cursor: "pointer", opacity: !pagination.hasPrev ? 0.35 : 1 }}>← Prev</button>
          <span style={{ fontSize: 12, color: "var(--text-muted)" }}>Page {pagination.page} of {pagination.totalPages}</span>
          <button onClick={() => load(page + 1)} disabled={!pagination.hasNext} style={{ padding: "7px 16px", borderRadius: 9, fontSize: 12, fontWeight: 600, background: "var(--input)", border: "1px solid var(--input-border)", color: "var(--text-2)", cursor: "pointer", opacity: !pagination.hasNext ? 0.35 : 1 }}>Next →</button>
        </div>
      )}
    </div>
  );
}
