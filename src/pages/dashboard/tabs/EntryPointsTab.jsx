import React from "react";

const ENTRY_POINTS = [
  { file: "server.js:1", desc: "Server bootstrap", type: "MAIN" },
  { file: "routes/api.js:12", desc: "REST API router", type: "API" },
  { file: "src/App.jsx:1", desc: "React root", type: "UI" },
];

export default function EntryPointsTab() {
  return (
    <div>
      <div
        style={{
          marginBottom: 12,
          padding: "10px 14px",
          background: "rgba(96,165,250,.07)",
          border: "1px solid rgba(96,165,250,.2)",
          borderRadius: 7,
          fontSize: 11,
          color: "#60A5FA",
        }}
      >
        Entry-point tracing with file-level jump links is planned for v2.
      </div>

      <div className="card">
        {ENTRY_POINTS.map((entry) => (
          <div
            key={entry.file}
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              padding: "8px 0",
              borderBottom: "1px solid #111D2E",
            }}
          >
            <div>
              <div style={{ fontSize: 11, color: "#E2E8F0", fontWeight: 500 }}>
                {entry.file}
              </div>
              <div style={{ fontSize: 10, color: "#334155", marginTop: 2 }}>
                {entry.desc}
              </div>
            </div>
            <span
              className="badge"
              style={{
                background: "rgba(96,165,250,.1)",
                color: "#60A5FA",
                border: "1px solid rgba(96,165,250,.15)",
              }}
            >
              {entry.type}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
