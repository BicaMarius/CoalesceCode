import React from "react";

export default function TechStackTab({ isReal, realData }) {
  if (!isReal) {
    return (
      <div
        style={{
          textAlign: "center",
          padding: 40,
          color: "#334155",
          fontSize: 12,
        }}
      >
        Analyze a repository to see tech stack detection.
      </div>
    );
  }

  const detected = realData?.detected || {};

  const detectedEntries = Object.entries(detected).filter(
    ([key, value]) =>
      !["docker", "typescript"].includes(key) &&
      value &&
      typeof value === "object",
  );

  return (
    <div
      style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 10 }}
    >
      {detectedEntries.map(([category, value]) => {
        const label = value.label || value.type || category;
        const color = value.color || "#60A5FA";
        return (
          <div key={category} className="card">
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                marginBottom: 8,
              }}
            >
              <div>
                <div style={{ fontSize: 13, fontWeight: 700, color }}>
                  {label}
                </div>
                <div
                  style={{
                    fontSize: 10,
                    color: "#64748B",
                    marginTop: 2,
                    textTransform: "capitalize",
                  }}
                >
                  {category.replace("_", " ")}
                </div>
              </div>
              <span
                className="badge"
                style={{
                  background: "rgba(52,211,153,.1)",
                  color: "#34D399",
                  border: "1px solid rgba(52,211,153,.2)",
                }}
              >
                detected
              </span>
            </div>
          </div>
        );
      })}

      {detected.docker ? (
        <div className="card">
          <div style={{ fontSize: 13, fontWeight: 700, color: "#60A5FA" }}>
            Docker
          </div>
          <div style={{ fontSize: 10, color: "#64748B", marginTop: 4 }}>
            Container config found
          </div>
        </div>
      ) : null}

      {detected.typescript ? (
        <div className="card">
          <div style={{ fontSize: 13, fontWeight: 700, color: "#3178C6" }}>
            TypeScript
          </div>
          <div style={{ fontSize: 10, color: "#64748B", marginTop: 4 }}>
            tsconfig.json detected
          </div>
        </div>
      ) : null}
    </div>
  );
}
