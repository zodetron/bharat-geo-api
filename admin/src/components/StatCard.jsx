const ACCENT = {
  blue:   { top: "var(--purple)",      dim: "var(--purple-dim)",  border: "var(--purple-border)", text: "var(--purple-text)" },
  green:  { top: "var(--green)",       dim: "var(--green-dim)",   border: "var(--green-border)",  text: "var(--green-text)"  },
  yellow: { top: "var(--yellow-text)", dim: "var(--yellow-dim)",  border: "var(--yellow-border)", text: "var(--yellow-text)" },
  purple: { top: "var(--purple)",      dim: "var(--purple-dim)",  border: "var(--purple-border)", text: "var(--purple-text)" },
};

export default function StatCard({ label, value, sub, color = "blue" }) {
  const a = ACCENT[color] || ACCENT.blue;
  return (
    <div style={{ borderRadius: 16, padding: "20px 22px", background: "var(--card)", border: "1px solid var(--card-border)", borderTop: `2px solid ${a.top}`, display: "flex", flexDirection: "column", gap: 10 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <span style={{ width: 7, height: 7, borderRadius: "50%", background: a.top, flexShrink: 0 }} />
        <p style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--text-muted)", margin: 0 }}>{label}</p>
      </div>
      <p style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 38, fontWeight: 800, color: "var(--text)", margin: 0, lineHeight: 1 }}>{value ?? "—"}</p>
      {sub && <p style={{ fontSize: 11, color: "var(--text-muted)", margin: 0 }}>{sub}</p>}
    </div>
  );
}
