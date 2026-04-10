import React from "react";
import Icon from "../../features/ui/Icon";

export default function MetricsGrid({ isReal, displayStats, realData }) {
  const cards = [
    {
      icon: "architecture",
      label: "Modules",
      value: String(isReal ? displayStats.modules : "8"),
      sub: isReal
        ? displayStats.moduleList.slice(0, 2).join(", ") || "none"
        : "well-separated",
      color: "#34D399",
    },
    {
      icon: "dependencies",
      label: "Dependencies",
      value: String(
        isReal ? displayStats.totalDeps + displayStats.devDeps : "134",
      ),
      sub: isReal
        ? `${displayStats.outdatedDeps} outdated | ${displayStats.unusedDeps || 0} unused`
        : "9 outdated",
      color: "#FBBF24",
    },
    {
      icon: "tests",
      label: "Test Files",
      value: String(isReal ? displayStats.testFiles : "3"),
      sub: isReal
        ? displayStats.testFiles > 0
          ? "detected"
          : "none found"
        : "below target",
      color: isReal
        ? displayStats.testFiles > 0
          ? "#34D399"
          : "#F87171"
        : "#F87171",
    },
    {
      icon: "techStack",
      label: "Stack",
      value: String(
        isReal
          ? Number(
              displayStats.technologyCount ||
                Object.keys(realData?.detected?.technologies || {}).length,
            )
          : "-",
      ),
      sub: isReal
        ? `Docker: ${displayStats.docker ? "Yes" : "No"} | K8s: ${displayStats.kubernetes ? "Yes" : "No"}${
            Number(displayStats.declaredOnlyTechnologyCount || 0) > 0
              ? ` | ! ${displayStats.declaredOnlyTechnologyCount} unused`
              : ""
          }`
        : "analyze a repo",
      color: "#60A5FA",
    },
  ];

  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(4,1fr)",
        gap: 9,
        marginBottom: 16,
      }}
    >
      {cards.map((card) => (
        <div key={card.label} className="card">
          <div
            style={{
              fontSize: 9,
              color: "#334155",
              textTransform: "uppercase",
              letterSpacing: "1px",
              marginBottom: 6,
              display: "flex",
              alignItems: "center",
              gap: 6,
            }}
          >
            <Icon
              name={card.icon}
              size={12}
              color={card.color}
              strokeWidth={2}
            />
            {card.label}
          </div>

          <div
            style={{
              fontSize: 19,
              fontWeight: 700,
              color: card.color,
              fontFamily: "'Syne',sans-serif",
            }}
          >
            {card.value}
          </div>

          <div style={{ fontSize: 10, color: "#64748B", marginTop: 3 }}>
            {card.sub}
          </div>
        </div>
      ))}
    </div>
  );
}
