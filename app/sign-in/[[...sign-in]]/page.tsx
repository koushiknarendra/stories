import { SignIn } from "@clerk/nextjs";

export default function SignInPage() {
  return (
    <div
      style={{
        minHeight: "100vh",
        background: "var(--lp-bg)",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 28,
        padding: "0 20px",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4 }}>
        <span
          style={{
            display: "inline-flex",
            width: 34,
            height: 34,
            borderRadius: 9,
            background: "#7C5CFF",
            alignItems: "center",
            justifyContent: "center",
            boxShadow: "0 6px 20px -6px rgba(124,92,255,0.7)",
          }}
        >
          <svg width={18} height={18} viewBox="0 0 24 24" fill="none">
            <rect x={6.5} y={4.5} width={11} height={15} rx={2.6} transform="rotate(-9 12 12)" fill="white" opacity={0.5} />
            <rect x={6.5} y={4.5} width={11} height={15} rx={2.6} transform="rotate(7 12 12)" fill="white" />
          </svg>
        </span>
        <span style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fontSize: 21, letterSpacing: "-0.01em", color: "var(--lp-text)" }}>
          Storis
        </span>
      </div>
      <SignIn
        appearance={{
          elements: {
            rootBox: { boxShadow: "none" },
            card: {
              border: "1px solid var(--lp-border)",
              borderRadius: 20,
              background: "var(--lp-surface)",
              boxShadow: "var(--lp-shadow)",
            },
          },
        }}
      />
    </div>
  );
}
