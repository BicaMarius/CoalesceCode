import React from "react";

export default function DependenciesTab({
  filtDeps,
  isReal,
  displayDeps,
  depFilter,
  setDepFilter,
  selDep,
  setSelDep,
}) {
  return (
    <div style={{ display: "grid", gridTemplateColumns: "1fr 270px", gap: 12 }}>
      <div className="card">
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 12,
          }}
        >
          <div style={{ fontSize: 11, color: "#60A5FA", fontWeight: 600 }}>
            {filtDeps.length} packages{" "}
            {isReal ? (
              <span style={{ color: "#34D399", fontSize: 9 }}>| REAL</span>
            ) : null}
          </div>

          <div style={{ display: "flex", gap: 5, flexWrap: "wrap" }}>
            {["all", "outdated", "security", "dev", "runtime"].map((filter) => (
              <button
                key={filter}
                className="bg"
                style={{
                  fontSize: 9,
                  padding: "3px 8px",
                  borderColor: depFilter === filter ? "#2563EB" : undefined,
                  color: depFilter === filter ? "#60A5FA" : undefined,
                }}
                onClick={() => setDepFilter(filter)}
              >
                {filter}
              </button>
            ))}
          </div>
        </div>

        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr>
                {["Package", "Current", "Latest", "Type", "Risk"].map(
                  (header) => (
                    <th
                      key={header}
                      style={{
                        fontSize: 9,
                        color: "#334155",
                        padding: "5px 8px 8px 0",
                        borderBottom: "1px solid #111D2E",
                        textAlign: "left",
                        fontWeight: 600,
                      }}
                    >
                      {header}
                    </th>
                  ),
                )}
              </tr>
            </thead>
            <tbody>
              {filtDeps.map((dep) => (
                <tr
                  key={dep.name}
                  style={{ cursor: "pointer" }}
                  onClick={() =>
                    setSelDep(selDep === dep.name ? null : dep.name)
                  }
                >
                  <td
                    style={{
                      fontSize: 11,
                      color: dep.old ? "#FBBF24" : "#94A3B8",
                      padding: "6px 8px 6px 0",
                      borderBottom: "1px solid #0B111C",
                      fontWeight: dep.old ? 600 : 400,
                    }}
                  >
                    {dep.name}
                  </td>
                  <td
                    style={{
                      fontSize: 10,
                      color: "#64748B",
                      padding: "6px 8px 6px 0",
                      borderBottom: "1px solid #0B111C",
                    }}
                  >
                    {dep.cur}
                  </td>
                  <td
                    style={{
                      fontSize: 10,
                      color: dep.old ? "#34D399" : "#64748B",
                      padding: "6px 8px 6px 0",
                      borderBottom: "1px solid #0B111C",
                    }}
                  >
                    {dep.lat}
                  </td>
                  <td
                    style={{
                      padding: "6px 8px 6px 0",
                      borderBottom: "1px solid #0B111C",
                    }}
                  >
                    <span
                      className="badge"
                      style={{
                        background: "rgba(96,165,250,.08)",
                        color: "#60A5FA",
                        border: "1px solid rgba(96,165,250,.15)",
                      }}
                    >
                      {dep.type}
                    </span>
                  </td>
                  <td
                    style={{
                      padding: "6px 0",
                      borderBottom: "1px solid #0B111C",
                    }}
                  >
                    {dep.risk !== "none" ? (
                      <span
                        className="badge"
                        style={{
                          background:
                            dep.risk === "high"
                              ? "rgba(248,113,113,.1)"
                              : "rgba(251,191,36,.1)",
                          color: dep.risk === "high" ? "#F87171" : "#FBBF24",
                          border:
                            dep.risk === "high"
                              ? "1px solid rgba(248,113,113,.25)"
                              : "1px solid rgba(251,191,36,.25)",
                        }}
                      >
                        {dep.risk}
                      </span>
                    ) : null}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="card" style={{ height: "fit-content" }}>
        <div
          style={{
            fontSize: 11,
            color: "#60A5FA",
            fontWeight: 600,
            marginBottom: 10,
          }}
        >
          Summary
        </div>
        {[
          {
            label: "Runtime",
            value: displayDeps.filter((dep) => dep.type === "runtime").length,
            color: "#E2E8F0",
          },
          {
            label: "Dev",
            value: displayDeps.filter((dep) => dep.type === "dev").length,
            color: "#64748B",
          },
          {
            label: "Security",
            value: displayDeps.filter((dep) => dep.type === "security").length,
            color: "#34D399",
          },
          {
            label: "Outdated",
            value: displayDeps.filter((dep) => dep.old).length,
            color: "#FBBF24",
          },
        ].map((item) => (
          <div
            key={item.label}
            style={{
              display: "flex",
              justifyContent: "space-between",
              marginBottom: 9,
            }}
          >
            <span style={{ fontSize: 11, color: "#64748B" }}>{item.label}</span>
            <span style={{ fontSize: 12, fontWeight: 700, color: item.color }}>
              {item.value}
            </span>
          </div>
        ))}

        {selDep
          ? (() => {
              const dep = displayDeps.find((item) => item.name === selDep);
              if (!dep) return null;
              return (
                <div
                  style={{
                    borderTop: "1px solid #111D2E",
                    paddingTop: 10,
                    marginTop: 4,
                  }}
                >
                  <div
                    style={{
                      fontSize: 11,
                      color: "#60A5FA",
                      fontWeight: 600,
                      marginBottom: 6,
                    }}
                  >
                    {dep.name}
                  </div>
                  <div
                    style={{ fontSize: 10, color: "#64748B", lineHeight: 1.8 }}
                  >
                    <div>
                      Installed:{" "}
                      <span style={{ color: "#E2E8F0" }}>{dep.cur}</span>
                    </div>
                    <div>
                      Latest:{" "}
                      <span style={{ color: "#34D399" }}>{dep.lat}</span>
                    </div>
                    <div>
                      Type: <span style={{ color: "#E2E8F0" }}>{dep.type}</span>
                    </div>
                  </div>
                  {dep.old ? (
                    <div
                      style={{
                        marginTop: 8,
                        padding: "7px 9px",
                        background: "rgba(251,191,36,.07)",
                        borderRadius: 5,
                        fontSize: 10,
                        color: "#FBBF24",
                        fontFamily: "monospace",
                      }}
                    >
                      npm i {dep.name}@{dep.lat}
                    </div>
                  ) : null}
                </div>
              );
            })()
          : null}
      </div>
    </div>
  );
}
