export const runtime = "nodejs";
export const alt = "Story cards on Storis";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

import { ImageResponse } from "next/og";
import { loadStorySet } from "@/lib/db";

const ACCENT = "#7c5cfc";
const BG = "#0d0d14";

function clamp(text: string, max: number) {
  return text.length > max ? text.slice(0, max - 1) + "…" : text;
}

function titleSize(len: number) {
  if (len < 35) return 68;
  if (len < 55) return 56;
  if (len < 75) return 46;
  return 38;
}

export default async function OGImage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const set = await loadStorySet(id);

  if (!set) {
    return new ImageResponse(
      (
        <div
          style={{
            width: 1200,
            height: 630,
            background: BG,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <span style={{ color: "white", fontSize: 52, fontWeight: 800 }}>Storis</span>
        </div>
      ),
      { width: 1200, height: 630 }
    );
  }

  const headline = clamp(set.cards[0]?.headline ?? "", 130);
  const title = clamp(set.title, 90);
  const cardCount = set.cards.length;

  return new ImageResponse(
    (
      <div
        style={{
          width: 1200,
          height: 630,
          background: `linear-gradient(135deg, #0d0d14 0%, #130d20 55%, #0d1420 100%)`,
          display: "flex",
          flexDirection: "column",
          padding: "56px 72px",
          position: "relative",
          overflow: "hidden",
        }}
      >
        {/* Cover image background — blurred & dimmed */}
        {set.coverImageUrl && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={set.coverImageUrl}
            alt=""
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              width: "100%",
              height: "100%",
              objectFit: "cover",
              opacity: 0.12,
            }}
          />
        )}

        {/* Gradient overlay on top of image */}
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background:
              "linear-gradient(160deg, rgba(13,13,20,0.8) 0%, rgba(19,13,32,0.88) 60%, rgba(13,20,32,0.92) 100%)",
            display: "flex",
          }}
        />

        {/* Decorative right glow */}
        <div
          style={{
            position: "absolute",
            top: -120,
            right: -120,
            width: 480,
            height: 480,
            borderRadius: "50%",
            background: `radial-gradient(circle, rgba(124,92,252,0.18) 0%, transparent 70%)`,
            display: "flex",
          }}
        />

        {/* Content */}
        <div
          style={{
            position: "relative",
            display: "flex",
            flexDirection: "column",
            height: "100%",
          }}
        >
          {/* Top row: brand + category */}
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: 44,
            }}
          >
            {/* Logo */}
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <div
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: 11,
                  background: ACCENT,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  boxShadow: "0 6px 20px rgba(124,92,252,0.5)",
                }}
              >
                {/* Stacked card icon */}
                <svg
                  width={22}
                  height={22}
                  viewBox="0 0 24 24"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <rect
                    x={6.5}
                    y={4.5}
                    width={11}
                    height={15}
                    rx={2.6}
                    transform="rotate(-9 12 12)"
                    fill="white"
                    fillOpacity={0.5}
                  />
                  <rect
                    x={6.5}
                    y={4.5}
                    width={11}
                    height={15}
                    rx={2.6}
                    transform="rotate(7 12 12)"
                    fill="white"
                  />
                </svg>
              </div>
              <span
                style={{
                  color: "rgba(255,255,255,0.95)",
                  fontSize: 24,
                  fontWeight: 800,
                  letterSpacing: "-0.02em",
                }}
              >
                Storis
              </span>
            </div>

            {/* Category chip */}
            {set.category && (
              <div
                style={{
                  background: "rgba(124,92,252,0.18)",
                  border: "1.5px solid rgba(124,92,252,0.45)",
                  borderRadius: 999,
                  padding: "7px 20px",
                  color: "#c4b5fd",
                  fontSize: 15,
                  fontWeight: 700,
                  letterSpacing: "0.06em",
                  textTransform: "uppercase",
                  display: "flex",
                }}
              >
                {set.category}
              </div>
            )}
          </div>

          {/* Title + headline */}
          <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "center" }}>
            <div
              style={{
                color: "#ffffff",
                fontSize: titleSize(title.length),
                fontWeight: 800,
                lineHeight: 1.08,
                letterSpacing: "-0.03em",
                marginBottom: 20,
              }}
            >
              {title}
            </div>
            {headline && (
              <div
                style={{
                  color: "rgba(255,255,255,0.5)",
                  fontSize: 22,
                  fontWeight: 400,
                  lineHeight: 1.5,
                }}
              >
                {headline}
              </div>
            )}
          </div>

          {/* Bottom: source + cards + visual */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              marginTop: 28,
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
              <div
                style={{
                  width: 6,
                  height: 6,
                  borderRadius: "50%",
                  background: ACCENT,
                  display: "flex",
                }}
              />
              <span
                style={{
                  color: "rgba(255,255,255,0.55)",
                  fontSize: 20,
                  fontWeight: 500,
                }}
              >
                {set.source}
              </span>
              <span style={{ color: "rgba(255,255,255,0.2)", fontSize: 20 }}>·</span>
              <span
                style={{
                  color: "rgba(255,255,255,0.55)",
                  fontSize: 20,
                  fontWeight: 500,
                }}
              >
                {cardCount} cards
              </span>
            </div>

            {/* Card stack visual */}
            <div style={{ display: "flex", alignItems: "center", gap: 0 }}>
              {[
                { rotate: "-8deg", opacity: 0.35, x: 12 },
                { rotate: "-3deg", opacity: 0.6, x: 6 },
                { rotate: "2deg", opacity: 1, x: 0 },
              ].map((s, i) => (
                <div
                  key={i}
                  style={{
                    width: 48,
                    height: 68,
                    borderRadius: 10,
                    background: `linear-gradient(145deg, ${ACCENT}, #5b3fd4)`,
                    opacity: s.opacity,
                    transform: `rotate(${s.rotate}) translateX(${s.x}px)`,
                    boxShadow: "0 4px 16px rgba(0,0,0,0.5)",
                    position: "absolute",
                    display: "flex",
                  }}
                />
              ))}
              <div style={{ width: 80, height: 68, display: "flex" }} />
            </div>
          </div>
        </div>
      </div>
    ),
    { width: 1200, height: 630 }
  );
}
