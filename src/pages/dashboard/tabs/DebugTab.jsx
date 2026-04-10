import React from "react";
import { LOG_COLORS, normalizeLogMessage } from "../../../features/app/uiData";

export default function DebugTab({ logs, setLogs }) {
  const rows = logs.map((entry) => {
    if (entry && typeof entry === "object") {
      const type = String(entry.type || "info").toLowerCase();
      const msg = normalizeLogMessage(entry.msg || "");
      return { type, msg };
    }
    return { type: "info", msg: normalizeLogMessage(entry) };
  });

  return (
    <div className="card" style={{ minHeight: 450 }}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 12,
        }}
      >
        <span style={{ fontSize: 11, color: "#64748B", fontWeight: 600 }}>
          Analysis Log
        </span>
        <button
          className="bg"
          style={{ fontSize: 10 }}
          onClick={() => setLogs([])}
        >
          Clear
        </button>
      </div>

      <div
        style={{
          background: "#07090F",
          border: "1px solid #111D2E",
          borderRadius: 8,
          padding: "10px 12px",
          maxHeight: 520,
          overflowY: "auto",
        }}
      >
        {logs.length === 0 ? (
          <div style={{ fontSize: 11, color: "#334155" }}>No logs yet.</div>
        ) : (
          rows.map((row, index) => {
            const color = LOG_COLORS[row.type] || "#94A3B8";
            return (
              <div
                key={`log-${index}`}
                style={{
                  display: "grid",
                  gridTemplateColumns: "30px 64px 1fr",
                  gap: 8,
                  fontSize: 11,
                  fontFamily: "JetBrains Mono",
                  lineHeight: 1.8,
                  whiteSpace: "pre-wrap",
                  borderBottom: "1px solid #0B111C",
                  paddingBottom: 2,
                  marginBottom: 2,
                }}
              >
                <span style={{ color: "#334155", textAlign: "right" }}>
                  {index + 1}
                </span>
                <span style={{ color: "#2D3F55" }}>[{row.type}]</span>
                <span style={{ color }}>{row.msg}</span>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
