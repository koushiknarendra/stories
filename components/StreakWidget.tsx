"use client";

const SG: React.CSSProperties = { fontFamily: "'Space Grotesk', sans-serif" };
const DAILY_GOAL = 3;

interface Props {
  currentStreak: number;
  longestStreak: number;
  todayCount: number;
}

export default function StreakWidget({ currentStreak, longestStreak, todayCount }: Props) {
  const progress = Math.min(todayCount / DAILY_GOAL, 1);
  const done = todayCount >= DAILY_GOAL;
  const hasStreak = currentStreak > 0;

  return (
    <div style={{
      margin: "16px 16px 0",
      padding: "14px 16px",
      borderRadius: 16,
      background: "var(--lp-surface)",
      border: "1px solid var(--lp-border)",
      display: "flex",
      gap: 14,
      alignItems: "center",
    }}>
      {/* Streak count */}
      <div style={{ textAlign: "center", minWidth: 52 }}>
        <div style={{ fontSize: 28, lineHeight: 1 }}>
          {hasStreak ? "🔥" : "✨"}
        </div>
        <div style={{ ...SG, fontSize: 18, fontWeight: 800, color: hasStreak ? "#f97316" : "var(--lp-text)", lineHeight: 1.2, marginTop: 2 }}>
          {currentStreak}
        </div>
        <div style={{ fontSize: 10, color: "var(--lp-text3)", ...SG }}>
          day{currentStreak !== 1 ? "s" : ""}
        </div>
      </div>

      {/* Divider */}
      <div style={{ width: 1, alignSelf: "stretch", background: "var(--lp-border)" }} />

      {/* Progress */}
      <div style={{ flex: 1 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 6 }}>
          <span style={{ ...SG, fontSize: 13, fontWeight: 600, color: "var(--lp-text)" }}>
            {done ? "Goal reached!" : "Today's goal"}
          </span>
          <span style={{ fontSize: 11, color: "var(--lp-text3)" }}>
            {todayCount}/{DAILY_GOAL} stories
          </span>
        </div>
        <div style={{ height: 6, borderRadius: 999, background: "var(--lp-border)", overflow: "hidden" }}>
          <div style={{
            height: "100%",
            borderRadius: 999,
            width: `${progress * 100}%`,
            background: done ? "#22c55e" : "var(--lp-accent)",
            transition: "width 0.4s ease",
          }} />
        </div>
        {longestStreak > 1 && (
          <div style={{ fontSize: 10, color: "var(--lp-text3)", marginTop: 5 }}>
            Best: {longestStreak} day{longestStreak !== 1 ? "s" : ""}
          </div>
        )}
      </div>
    </div>
  );
}
