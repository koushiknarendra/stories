"use client";

import { usePathname } from "next/navigation";

const SG: React.CSSProperties = { fontFamily: "'Space Grotesk', sans-serif" };

const IconForYou = ({ active }: { active: boolean }) => (
  <svg width={22} height={22} viewBox="0 0 24 24" fill={active ? "currentColor" : "none"} stroke="currentColor" strokeWidth={active ? 0 : 1.8} strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 14H9V8h2v8zm4 0h-2V8h2v8z" style={{ display: active ? "block" : "none" }} />
    <path d="M12 3c-4.97 0-9 4.03-9 9s4.03 9 9 9 9-4.03 9-9-4.03-9-9-9zm0 16c-3.86 0-7-3.14-7-7s3.14-7 7-7 7 3.14 7 7-3.14 7-7 7zm-1-11H9v6h2v-6zm4 0h-2v6h2v-6z" style={{ display: active ? "none" : "block" }} />
  </svg>
);

const IconHome = ({ active }: { active: boolean }) => (
  <svg width={22} height={22} viewBox="0 0 24 24" fill={active ? "currentColor" : "none"} stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 9.5L12 3l9 6.5V20a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V9.5z" />
    <path d="M9 21V12h6v9" />
  </svg>
);

const IconExplore = ({ active }: { active: boolean }) => (
  <svg width={22} height={22} viewBox="0 0 24 24" fill={active ? "currentColor" : "none"} stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
    <circle cx={11} cy={11} r={8} />
    <path d="m21 21-4.35-4.35" />
  </svg>
);

const IconSpace = ({ active }: { active: boolean }) => (
  <svg width={22} height={22} viewBox="0 0 24 24" fill={active ? "currentColor" : "none"} stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
    <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
  </svg>
);

const IconProfile = ({ active }: { active: boolean }) => (
  <svg width={22} height={22} viewBox="0 0 24 24" fill={active ? "currentColor" : "none"} stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
    <circle cx={12} cy={7} r={4} />
  </svg>
);

const NAV_ITEMS = [
  { href: "/foryou",  label: "For You",  Icon: IconHome },
  { href: "/explore", label: "Explore",  Icon: IconExplore },
  { href: "/space",   label: "My Space", Icon: IconSpace },
  { href: "/profile", label: "Profile",  Icon: IconProfile },
];

export default function BottomNav({ fixed = true }: { fixed?: boolean }) {
  const pathname = usePathname();

  const navStyle: React.CSSProperties = fixed
    ? {
        position: "fixed",
        bottom: "calc(env(safe-area-inset-bottom, 0px) + 10px)",
        left: 12,
        right: 12,
        zIndex: 50,
        borderRadius: 999,
        height: 60,
        boxSizing: "border-box",
        display: "flex",
        alignItems: "center",
        background: "var(--lp-glass-nav)",
        backdropFilter: "var(--lp-glass-blur)",
        WebkitBackdropFilter: "var(--lp-glass-blur)",
        border: "1px solid var(--lp-glass-border)",
        boxShadow: "0 8px 40px -8px rgba(0,0,0,0.28), inset 0 1px 0 rgba(255,255,255,0.5)",
      }
    : {
        flexShrink: 0,
        margin: "0 12px",
        borderRadius: 999,
        height: 60,
        boxSizing: "border-box",
        display: "flex",
        alignItems: "center",
        background: "var(--lp-glass-nav)",
        backdropFilter: "var(--lp-glass-blur)",
        WebkitBackdropFilter: "var(--lp-glass-blur)",
        border: "1px solid var(--lp-glass-border)",
        boxShadow: "0 8px 40px -8px rgba(0,0,0,0.28), inset 0 1px 0 rgba(255,255,255,0.5)",
      };

  return (
    <nav style={navStyle}>
      {NAV_ITEMS.map(({ href, label, Icon }) => {
        const active = pathname === href;
        return (
          <a
            key={href}
            href={href}
            style={{
              flex: 1,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              height: "100%",
              gap: 3,
              color: active ? "var(--lp-accent)" : "var(--lp-text3)",
              textDecoration: "none",
              transition: "color .15s",
            }}
          >
            <Icon active={active} />
            <span style={{ ...SG, fontSize: 9.5, fontWeight: active ? 700 : 500, letterSpacing: ".04em" }}>
              {label}
            </span>
          </a>
        );
      })}
    </nav>
  );
}
