import React from "react";
import { HEALTH_MOCK } from "../../../features/app/uiData";

export default function CodeHealthTab() {
  const modules = HEALTH_MOCK.map((item) => {
    const score = Math.max(20, 100 - item.cyc * 3 - item.depth * 2);
    return {
      file: item.file,
      score,
      risk: item.risk,
      lines: item.lines,
      issues: item.issues,
    };
  });

  const totalScore = Math.round(
    modules.reduce((accumulator, item) => accumulator + item.score, 0) /
      modules.length,
  );

  return (
    <div style={{ display: "grid", gridTemplateColumns: "1fr 260px", gap: 12 }}>
      <div className="card">
        <div
          style={{
            fontSize: 11,
            color: "#60A5FA",
            fontWeight: 600,
            marginBottom: 12,
          }}
        >
          Module Health
        </div>
        {modules.map((item) => (
          <div
            key={item.file}
            style={{
              marginBottom: 10,
              paddingBottom: 10,
              borderBottom: "1px solid #111D2E",
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                marginBottom: 5,
              }}
            >
              <span style={{ fontSize: 11, color: "#E2E8F0" }}>
                {item.file}
              </span>
              <span
                style={{
                  fontSize: 11,
                  fontWeight: 700,
                  color:
                    item.score >= 80
                      ? "#34D399"
                      : item.score >= 60
                        ? "#FBBF24"
                        : "#F87171",
                }}
              >
                {item.score}
              </span>
            </div>
            <div
              style={{
                height: 6,
                background: "#0B111C",
                borderRadius: 99,
                overflow: "hidden",
              }}
            >
              <div
                style={{
                  width: `${item.score}%`,
                  height: "100%",
                  background:
                    item.score >= 80
                      ? "#34D399"
                      : item.score >= 60
                        ? "#FBBF24"
                        : "#F87171",
                }}
              />
            </div>
            <div style={{ fontSize: 10, color: "#334155", marginTop: 4 }}>
              {item.lines} LOC | {item.risk} risk
            </div>
            {item.issues.length > 0 ? (
              <div style={{ fontSize: 9, color: "#64748B", marginTop: 3 }}>
                {item.issues[0]}
              </div>
            ) : null}
          </div>
        ))}
      </div>

      <div className="card" style={{ height: "fit-content" }}>
        <div
          style={{
            fontSize: 10,
            color: "#334155",
            textTransform: "uppercase",
            letterSpacing: "1px",
          }}
        >
          Health Index
        </div>
        <div
          style={{
            fontSize: 40,
            fontWeight: 800,
            color: "#60A5FA",
            margin: "6px 0 4px",
          }}
        >
          {totalScore}
        </div>
        <div style={{ fontSize: 11, color: "#64748B", marginBottom: 10 }}>
          {totalScore >= 80
            ? "Strong"
            : totalScore >= 60
              ? "Moderate"
              : "At Risk"}
        </div>
        <div style={{ fontSize: 10, color: "#334155", lineHeight: 1.8 }}>
          Metrics include complexity, coupling indicators, and module-level
          coverage snapshots.
        </div>
      </div>
    </div>
  );
}
