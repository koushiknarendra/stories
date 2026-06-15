"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import AddModal from "@/components/AddModal";

const SG: React.CSSProperties = { fontFamily: "var(--font-space, 'Space Grotesk', sans-serif)" };

const IconHome    = ({ active }: { active: boolean }) => <svg width={22} height={22} viewBox="0 0 24 24" fill={active ? "currentColor" : "none"} stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round"><path d="M3 9.5L12 3l9 6.5V20a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V9.5z"/><path d="M9 21V12h6v9"/></svg>;
const IconExplore = ({ active }: { active: boolean }) => <svg width={22} height={22} viewBox="0 0 24 24" fill={active ? "currentColor" : "none"} stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round"><circle cx={11} cy={11} r={8}/><path d="m21 21-4.35-4.35"/></svg>;
const IconSpace   = ({ active }: { active: boolean }) => <svg width={22} height={22} viewBox="0 0 24 24" fill={active ? "currentColor" : "none"} stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round"><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/></svg>;
const IconProfile = ({ active }: { active: boolean }) => <svg width={22} height={22} viewBox="0 0 24 24" fill={active ? "currentColor" : "none"} stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx={12} cy={7} r={4}/></svg>;

const NAV_ITEMS = [
  { href: "/foryou",  label: "Today",   Icon: IconHome },
  { href: "/explore", label: "Explore", Icon: IconExplore },
  { href: "/space",   label: "Library", Icon: IconSpace },
  { href: "/profile", label: "Profile", Icon: IconProfile },
];

export default function DesktopNav() {
  const pathname = usePathname();
  const [addOpen, setAddOpen] = useState(false);

  return (
    <>
      <nav className="lp-desktop-nav">
        {/* Logo */}
        <a href="/" style={{ display: "flex", alignItems: "center", gap: 10, padding: "28px 20px 32px", textDecoration: "none", color: "var(--lp-text)" }}>
          <svg width={30} height={30} viewBox="0 0 36 36" fill="none">
            <rect width={36} height={36} rx={10} fill="var(--lp-accent)" />
            <path d="M10 12h16M10 18h11M10 24h14" stroke="#fff" strokeWidth={2.5} strokeLinecap="round" />
          </svg>
          <span style={{ ...SG, fontSize: 22, fontWeight: 800, letterSpacing: "-0.035em" }}>Storis</span>
        </a>

        {/* Nav links */}
        <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 2, padding: "0 8px" }}>
          {NAV_ITEMS.map(({ href, label, Icon }) => {
            const active = pathname === href;
            return (
              <a
                key={href}
                href={href}
                style={{
                  display: "flex", alignItems: "center", gap: 14,
                  padding: "11px 14px", borderRadius: 10, textDecoration: "none",
                  color: active ? "var(--lp-text)" : "var(--lp-text2)",
                  background: active ? "color-mix(in srgb, var(--lp-accent) 8%, transparent)" : "transparent",
                  fontWeight: active ? 700 : 500,
                  transition: "background .12s, color .12s",
                }}
                onMouseEnter={(e) => { if (!active) e.currentTarget.style.background = "color-mix(in srgb, var(--lp-text) 5%, transparent)"; }}
                onMouseLeave={(e) => { if (!active) e.currentTarget.style.background = "transparent"; }}
              >
                <span style={{ color: active ? "var(--lp-accent)" : "inherit", lineHeight: 0, flexShrink: 0 }}>
                  <Icon active={active} />
                </span>
                <span style={{ ...SG, fontSize: 15 }}>{label}</span>
              </a>
            );
          })}
        </div>

        {/* Add story button */}
        <div style={{ padding: "20px 8px 28px" }}>
          <button
            onClick={() => setAddOpen(true)}
            style={{
              width: "100%", padding: "13px 16px", borderRadius: 10, border: "none",
              background: "var(--lp-accent)", color: "#fff",
              display: "flex", alignItems: "center", justifyContent: "center", gap: 10,
              cursor: "pointer", ...SG, fontSize: 15, fontWeight: 700,
              boxShadow: "0 4px 16px -4px rgba(124,92,255,0.5)",
              transition: "opacity .12s",
            }}
            onMouseEnter={(e) => { e.currentTarget.style.opacity = "0.88"; }}
            onMouseLeave={(e) => { e.currentTarget.style.opacity = "1"; }}
          >
            <svg width={17} height={17} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round">
              <path d="M12 5v14M5 12h14" />
            </svg>
            Add story
          </button>
        </div>
      </nav>

      <AddModal open={addOpen} onClose={() => setAddOpen(false)} />
    </>
  );
}
