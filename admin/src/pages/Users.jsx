import { useEffect, useState } from "react";
import api from "../api/client";

const STATUS_COLORS = {
  ACTIVE:    "bg-green-100 text-green-700",
  PENDING:   "bg-yellow-100 text-yellow-700",
  SUSPENDED: "bg-red-100 text-red-700",
};

export default function Users() {
  const [users, setUsers]     = useState([]);
  const [pagination, setPagination] = useState(null);
  const [filter, setFilter]   = useState("");
  const [page, setPage]       = useState(1);
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
      setUsers((u) => u.map((x) => x.id === userId ? { ...x, status } : x));
    } catch (e) {
      alert(e.error || "Failed to update");
    } finally {
      setUpdating(null);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Users</h1>
        <select
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">All statuses</option>
          <option value="PENDING">Pending</option>
          <option value="ACTIVE">Active</option>
          <option value="SUSPENDED">Suspended</option>
        </select>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              {["Name", "Email", "Company", "Keys", "Status", "Joined", "Actions"].map((h) => (
                <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {users.map((u) => (
              <tr key={u.id} className="hover:bg-gray-50">
                <td className="px-4 py-3 font-medium text-gray-900">{u.fullName}</td>
                <td className="px-4 py-3 text-gray-600">{u.email}</td>
                <td className="px-4 py-3 text-gray-500">{u.company || "—"}</td>
                <td className="px-4 py-3 text-gray-500">{u._count.apiKeys}</td>
                <td className="px-4 py-3">
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_COLORS[u.status]}`}>
                    {u.status}
                  </span>
                </td>
                <td className="px-4 py-3 text-gray-400 text-xs">
                  {new Date(u.createdAt).toLocaleDateString()}
                </td>
                <td className="px-4 py-3">
                  <div className="flex gap-2">
                    {u.status !== "ACTIVE" && (
                      <button
                        onClick={() => changeStatus(u.id, "ACTIVE")}
                        disabled={updating === u.id}
                        className="text-xs text-green-600 hover:text-green-800 font-medium disabled:opacity-40"
                      >
                        Approve
                      </button>
                    )}
                    {u.status !== "SUSPENDED" && (
                      <button
                        onClick={() => changeStatus(u.id, "SUSPENDED")}
                        disabled={updating === u.id}
                        className="text-xs text-red-500 hover:text-red-700 font-medium disabled:opacity-40"
                      >
                        Suspend
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
            {users.length === 0 && (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-gray-400 text-sm">
                  No users found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {pagination && pagination.totalPages > 1 && (
        <div className="flex items-center gap-3 justify-end text-sm">
          <button
            onClick={() => load(page - 1)} disabled={!pagination.hasPrev}
            className="px-3 py-1 rounded border border-gray-300 text-gray-600 hover:bg-gray-50 disabled:opacity-40"
          >
            Prev
          </button>
          <span className="text-gray-500">
            Page {pagination.page} of {pagination.totalPages}
          </span>
          <button
            onClick={() => load(page + 1)} disabled={!pagination.hasNext}
            className="px-3 py-1 rounded border border-gray-300 text-gray-600 hover:bg-gray-50 disabled:opacity-40"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}
