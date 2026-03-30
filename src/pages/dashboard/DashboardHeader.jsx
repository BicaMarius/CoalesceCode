import React from "react";
import Icon from "../../features/ui/Icon";

export default function DashboardHeader({ displayStats, isReal, refreshing }) {
  return (
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "flex-start",
        marginBottom: 16,
      }}
    >
      <div>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            marginBottom: 4,
          }}
        >
          <Icon name="repo" size={14} color="#60A5FA" strokeWidth={2} />
          <span
            style={{
              fontFamily: "'Syne',sans-serif",
              fontSize: 19,
              fontWeight: 800,
            }}
          >
            {displayStats.repoName || "demo-project"}
          </span>

          {isReal && (
            <span
              className="badge"
              style={{
                background: "rgba(52,211,153,.1)",
                color: "#34D399",
                border: "1px solid rgba(52,211,153,.2)",
              }}
            >
              {displayStats.language}
              {displayStats.typescript ? " | TS" : ""}
            </span>
          )}

          {isReal && displayStats.stars > 0 && (
            <span
              className="badge"
              style={{
                background: "rgba(251,191,36,.1)",
                color: "#FBBF24",
                border: "1px solid rgba(251,191,36,.2)",
              }}
            >
              Stars: {displayStats.stars}
            </span>
          )}

          {isReal && displayStats.llmUsed && (
            <span
              className="badge"
              style={{
                background: "rgba(246,173,85,.1)",
                color: "#FBBF24",
                border: "1px solid rgba(246,173,85,.2)",
              }}
            >
              Gemini fallback
              {typeof displayStats.fallbackCostUSD === "number" &&
              displayStats.fallbackCostUSD > 0
                ? ` | $${displayStats.fallbackCostUSD.toFixed(5)}`
                : ""}
            </span>
          )}

          {!isReal && (
            <span
              className="badge"
              style={{
                background: "rgba(96,165,250,.1)",
                color: "#60A5FA",
                border: "1px solid rgba(96,165,250,.2)",
              }}
            >
              Demo Mode
            </span>
          )}
        </div>

        <div style={{ color: "#334155", fontSize: 11 }}>
          {isReal
            ? `${displayStats.totalFiles} files | ${displayStats.srcFiles} src | ${
                displayStats.totalDeps + displayStats.devDeps
              } deps | ${refreshing ? "syncing" : "analyzed"}`
            : "Paste a GitHub URL to analyze"}
        </div>
      </div>

      <button className="bg" style={{ fontSize: 10 }}>
        <span style={{ display: "inline-flex", alignItems: "center", gap: 5 }}>
          <Icon name="narrative" size={12} color="#60A5FA" strokeWidth={2} />
          Export PDF
        </span>
      </button>
    </div>
  );
}
