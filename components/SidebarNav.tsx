"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import { useTheme } from "@/components/ThemeProvider";
import { SignOutButton } from "@clerk/nextjs";
import AddModal from "@/components/AddModal";

const SG: React.CSSProperties = { fontFamily: "'Space Grotesk', sans-serif" };

const IconSun  = () => <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round"><circle cx={12} cy={12} r={4.2}/><path d="M12 2.5v2.4M12 19.1v2.4M4.2 4.2l1.7 1.7M18.1 18.1l1.7 1.7M2.5 12h2.4M19.1 12h2.4M4.2 19.8l1.7-1.7M18.1 5.9l1.7-1.7"/></svg>;
const IconMoon = () => <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round"><path d="M20 14.5A8 8 0 0 1 9.5 4a8 8 0 1 0 10.5 10.5z"/></svg>;

const NAV_ITEMS = [
  {
    href: "/foryou", label: "Today",
    icon: (a: boolean) => <svg width={20} height={20} viewBox="0 0 24 24" fill={a ? "currentColor" : "none"} stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round"><path d="M3 9.5L12 3l9 6.5V20a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V9.5z"/><path d="M9 21V12h6v9"/></svg>,
  },
  {
    href: "/explore", label: "Explore",
    icon: (a: boolean) => <svg width={20} height={20} viewBox="0 0 24 24" fill={a ? "currentColor" : "none"} stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round"><circle cx={11} cy={11} r={8}/><path d="m21 21-4.35-4.35"/></svg>,
  },
  {
    href: "/space", label: "Library",
    icon: (a: boolean) => <svg width={20} height={20} viewBox="0 0 24 24" fill={a ? "currentColor" : "none"} stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round"><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/></svg>,
  },
  {
    href: "/profile", label: "Profile",
    icon: (a: boolean) => <svg width={20} height={20} viewBox="0 0 24 24" fill={a ? "currentColor" : "none"} stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx={12} cy={7} r={4}/></svg>,
  },
];

export default function SidebarNav() {
  const pathname = usePathname();
  const { theme, toggle } = useTheme();
  const [addOpen, setAddOpen] = useState(false);

  return (
    <>
      <aside
        className="lp-sidebar"
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          width: 220,
          height: "100vh",
          flexDirection: "column",
          background: "var(--lp-glass-nav)",
          backdropFilter: "var(--lp-glass-blur)",
          WebkitBackdropFilter: "var(--lp-glass-blur)",
          borderRight: "1px solid var(--lp-glass-border)",
          zIndex: 50,
          padding: "28px 16px 24px",
          boxSizing: "border-box",
          boxShadow: "4px 0 32px -8px rgba(0,0,0,0.08)",
        }}
      >
        {/* Logo */}
        <a href="/" style={{ display: "flex", alignItems: "center", gap: 9, textDecoration: "none", marginBottom: 32 }}>
          <span style={{ display: "inline-flex", width: 32, height: 32, borderRadius: 9, background: "var(--lp-accent)", alignItems: "center", justifyContent: "center", boxShadow: "0 4px 14px -4px rgba(124,92,255,0.6)", flexShrink: 0 }}>
            <svg width={17} height={17} viewBox="0 0 24 24" fill="none">
              <rect x={6.5} y={4.5} width={11} height={15} rx={2.6} transform="rotate(-9 12 12)" fill="white" opacity={0.5} />
              <rect x={6.5} y={4.5} width={11} height={15} rx={2.6} transform="rotate(7 12 12)" fill="white" />
            </svg>
          </span>
          <span style={{ ...SG, fontWeight: 800, fontSize: 18, letterSpacing: "-0.025em", color: "var(--lp-text)" }}>Storis</span>
        </a>

        {/* Nav links */}
        <nav style={{ display: "flex", flexDirection: "column", gap: 2 }}>
          {NAV_ITEMS.map(({ href, label, icon }) => {
            const active = pathname === href;
            return (
              <a
                key={href}
                href={href}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 11,
                  padding: "10px 12px",
                  borderRadius: 12,
                  textDecoration: "none",
                  color: active ? "var(--lp-accent)" : "var(--lp-text2)",
                  background: active ? "color-mix(in srgb, var(--lp-accent) 10%, transparent)" : "transparent",
                  fontWeight: active ? 700 : 500,
                  fontSize: 14,
                  ...SG,
                  transition: "all .15s",
                  border: active ? "1px solid color-mix(in srgb, var(--lp-accent) 18%, transparent)" : "1px solid transparent",
                }}
                onMouseEnter={(e) => { if (!active) { e.currentTarget.style.background = "var(--lp-surface)"; e.currentTarget.style.color = "var(--lp-text)"; } }}
                onMouseLeave={(e) => { if (!active) { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "var(--lp-text2)"; } }}
              >
                {icon(active)}
                {label}
              </a>
            );
          })}
        </nav>

        {/* Divider */}
        <div style={{ height: 1, background: "var(--lp-glass-border)", margin: "16px 0" }} />

        {/* Add button */}
        <button
          onClick={() => setAddOpen(true)}
          style={{ ...SG, display: "flex", alignItems: "center", gap: 9, width: "100%", padding: "11px 14px", borderRadius: 12, border: "none", background: "var(--lp-accent)", color: "#fff", fontWeight: 700, fontSize: 14, cursor: "pointer", boxShadow: "0 4px 16px -4px rgba(124,92,255,0.5)", transition: "transform .15s, box-shadow .15s" }}
          onMouseEnter={(e) => { e.currentTarget.style.transform = "scale(1.02)"; e.currentTarget.style.boxShadow = "0 6px 22px -4px rgba(124,92,255,0.65)"; }}
          onMouseLeave={(e) => { e.currentTarget.style.transform = "scale(1)"; e.currentTarget.style.boxShadow = "0 4px 16px -4px rgba(124,92,255,0.5)"; }}
        >
          <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round">
            <path d="M12 5v14M5 12h14" />
          </svg>
          Add to Library
        </button>

        {/* Spacer */}
        <div style={{ flex: 1 }} />

        {/* Bottom: theme + sign out */}
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <button
            onClick={toggle}
            aria-label="Toggle theme"
            style={{ width: 36, height: 36, borderRadius: 9, border: "1px solid var(--lp-glass-border)", background: "var(--lp-glass-surface)", color: "var(--lp-text2)", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", flexShrink: 0, transition: "color .15s" }}
            onMouseEnter={(e) => (e.currentTarget.style.color = "var(--lp-text)")}
            onMouseLeave={(e) => (e.currentTarget.style.color = "var(--lp-text2)")}
          >
            {theme === "dark" ? <IconSun /> : <IconMoon />}
          </button>
          <SignOutButton>
            <button style={{ ...SG, flex: 1, padding: "8px 12px", borderRadius: 9, border: "1px solid var(--lp-glass-border)", background: "var(--lp-glass-surface)", color: "var(--lp-text2)", fontWeight: 600, fontSize: 12, cursor: "pointer", transition: "color .15s" }}
              onMouseEnter={(e) => (e.currentTarget.style.color = "var(--lp-text)")}
              onMouseLeave={(e) => (e.currentTarget.style.color = "var(--lp-text2)")}
            >
              Sign out
            </button>
          </SignOutButton>
        </div>
      </aside>

      <AddModal open={addOpen} onClose={() => setAddOpen(false)} />
    </>
  );
}
