"use client";

const SG: React.CSSProperties = { fontFamily: "var(--font-space, 'Space Grotesk', sans-serif)" };

export default function DesktopRightPanel() {
  return (
    <aside className="lp-desktop-right">
      <div style={{ padding: "28px 16px", display: "flex", flexDirection: "column", gap: 16 }}>
        <div style={{
          borderRadius: 14, padding: "16px 18px",
          background: "var(--lp-surface)",
          border: "1px solid var(--lp-border)",
        }}>
          <span style={{ fontSize: 9, fontWeight: 600, letterSpacing: ".06em", textTransform: "uppercase", color: "var(--lp-text3)", display: "block", marginBottom: 8 }}>Sponsored</span>
          <p style={{ ...SG, fontSize: 14, fontWeight: 700, color: "var(--lp-text)", margin: "0 0 6px", lineHeight: 1.3, letterSpacing: "-0.01em" }}>TranZact: Become the AI-Run Factory</p>
          <p style={{ fontSize: 12.5, color: "var(--lp-text2)", margin: 0, lineHeight: 1.55 }}>AI runs your Sales, Purchase, Inventory and Production, and your team manage the AI. Run by AI, managed by people, regardless of size.</p>
        </div>
      </div>
    </aside>
  );
}
