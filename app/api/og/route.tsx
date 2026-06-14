export const runtime = "nodejs";

import { ImageResponse } from "next/og";
import { NextRequest } from "next/server";
import { loadStorySet } from "@/lib/db";

const ACCENT = "#7c5cfc";

function clamp(text: string, max: number) {
  return text.length > max ? text.slice(0, max - 1) + "…" : text;
}

function titleSize(len: number) {
  if (len < 35) return 68;
  if (len < 55) return 56;
  if (len < 75) return 46;
  return 38;
}

export async function GET(request: NextRequest) {
  const id = request.nextUrl.searchParams.get("id");

  if (!id) {
    return new Response("Missing id", { status: 400 });
  }

  const set = await loadStorySet(id).catch(() => null);

  if (!set) {
    return new ImageResponse(
      (
        <div
          style={{
            width: 1200,
            height: 630,
            background: "#0d0d14",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 16,
          }}
        >
          <div
            style={{
              width: 44,
              height: 44,
              borderRadius: 12,
              background: ACCENT,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <span style={{ color: "white", fontSize: 22, fontWeight: 900 }}>S</span>
          </div>
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
          background: "linear-gradient(135deg, #0d0d14 0%, #130d20 55%, #0d1420 100%)",
          display: "flex",
          flexDirection: "column",
          padding: "56px 72px",
          position: "relative",
          overflow: "hidden",
        }}
      >
        {/* Cover image background */}
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

        {/* Gradient overlay */}
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background:
              "linear-gradient(160deg, rgba(13,13,20,0.82) 0%, rgba(19,13,32,0.9) 60%, rgba(13,20,32,0.93) 100%)",
            display: "flex",
          }}
        />

        {/* Decorative glow */}
        <div
          style={{
            position: "absolute",
            top: -120,
            right: -120,
            width: 480,
            height: 480,
            borderRadius: "50%",
            background: "radial-gradient(circle, rgba(124,92,252,0.2) 0%, transparent 70%)",
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
          {/* Top: brand + category */}
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: 44,
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
              <div
                style={{
                  width: 42,
                  height: 42,
                  borderRadius: 11,
                  background: ACCENT,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  boxShadow: "0 6px 20px rgba(124,92,252,0.5)",
                }}
              >
                <span style={{ color: "white", fontSize: 22, fontWeight: 900 }}>S</span>
              </div>
              <span
                style={{
                  color: "rgba(255,255,255,0.95)",
                  fontSize: 26,
                  fontWeight: 800,
                  letterSpacing: "-0.02em",
                }}
              >
                Storis
              </span>
            </div>

            {set.category && (
              <div
                style={{
                  background: "rgba(124,92,252,0.18)",
                  border: "1.5px solid rgba(124,92,252,0.45)",
                  borderRadius: 999,
                  padding: "7px 22px",
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
          <div
            style={{
              flex: 1,
              display: "flex",
              flexDirection: "column",
              justifyContent: "center",
            }}
          >
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

          {/* Bottom: source + cards */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 14,
              marginTop: 28,
            }}
          >
            <div
              style={{
                width: 7,
                height: 7,
                borderRadius: "50%",
                background: ACCENT,
                display: "flex",
              }}
            />
            <span style={{ color: "rgba(255,255,255,0.55)", fontSize: 20, fontWeight: 500 }}>
              {set.source}
            </span>
            <span style={{ color: "rgba(255,255,255,0.2)", fontSize: 20 }}>·</span>
            <span style={{ color: "rgba(255,255,255,0.55)", fontSize: 20, fontWeight: 500 }}>
              {cardCount} cards
            </span>
          </div>
        </div>
      </div>
    ),
    { width: 1200, height: 630 }
  );
}
