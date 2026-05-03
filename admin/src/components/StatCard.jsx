const ACCENTS = {
  blue:   { border: "#3b82f6", bg: "rgba(59,130,246,0.08)", text: "#93c5fd", dot: "#3b82f6" },
  green:  { border: "#10b981", bg: "rgba(16,185,129,0.08)", text: "#6ee7b7", dot: "#10b981" },
  yellow: { border: "#f59e0b", bg: "rgba(245,158,11,0.08)", text: "#fcd34d", dot: "#f59e0b" },
  purple: { border: "#8b5cf6", bg: "rgba(139,92,246,0.08)", text: "#c4b5fd", dot: "#8b5cf6" },
};

export default function StatCard({ label, value, sub, color = "blue" }) {
  const a = ACCENTS[color] || ACCENTS.blue;
  return (
    <div
      className="rounded-2xl p-5 flex flex-col gap-3"
      style={{ background: "#0f172a", border: `1px solid #1e293b`, borderTop: `2px solid ${a.border}` }}
    >
      <div className="flex items-center gap-2">
        <span className="w-2 h-2 rounded-full" style={{ background: a.dot }} />
        <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: "#64748b" }}>{label}</p>
      </div>
      <p className="text-4xl font-extrabold" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", color: "#f1f5f9" }}>
        {value ?? "—"}
      </p>
      {sub && <p className="text-xs" style={{ color: "#475569" }}>{sub}</p>}
    </div>
  );
}
