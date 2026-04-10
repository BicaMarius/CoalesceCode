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
  const categoryOrder = {
    language: 100,
    frontend: 96,
    backend: 95,
    database: 94,
    orm: 90,
    auth: 88,
    ai: 87,
    cache: 86,
    queue: 85,
    container: 84,
    storage: 82,
    payment: 81,
    search: 80,
    messaging: 79,
    analytics: 78,
    monitoring: 77,
  };

  const stackEntries = Object.values(detected.stackTechnologies || {})
    .filter((entry) => entry && typeof entry === "object")
    .sort((a, b) => {
      const aCategory = String(a.category || "").toLowerCase();
      const bCategory = String(b.category || "").toLowerCase();
      const priorityDiff =
        (categoryOrder[bCategory] || 0) - (categoryOrder[aCategory] || 0);
      if (priorityDiff !== 0) return priorityDiff;

      const aActive = a.status === "active" ? 1 : 0;
      const bActive = b.status === "active" ? 1 : 0;
      if (aActive !== bActive) return bActive - aActive;

      return Number(b.hits || 0) - Number(a.hits || 0);
    });

  const fallbackEntries = Object.entries(detected)
    .filter(
      ([key, value]) =>
        !["docker", "kubernetes", "technologies", "stackTechnologies"].includes(
          key,
        ) &&
        value &&
        typeof value === "object",
    )
    .map(([category, value]) => ({
      id: String(value?.type || category).toLowerCase(),
      label: value.label || value.type || category,
      category,
      color: value.color || "#60A5FA",
      status: "active",
      usageFiles: [],
      definitionFiles: [],
      statusReason: "Detected by analyzer.",
    }));

  const visibleEntries =
    stackEntries.length > 0 ? stackEntries : fallbackEntries;

  if (
    detected.docker &&
    !visibleEntries.some(
      (entry) => String(entry.id || "").toLowerCase() === "docker",
    )
  ) {
    visibleEntries.push({
      id: "docker",
      label: "Docker",
      category: "container",
      color: "#38BDF8",
      status: "active",
      usageFiles: [],
      definitionFiles: [],
      statusReason: "Container config found.",
    });
  }

  if (
    detected.kubernetes &&
    !visibleEntries.some(
      (entry) => String(entry.id || "").toLowerCase() === "kubernetes",
    )
  ) {
    visibleEntries.push({
      id: "kubernetes",
      label: "Kubernetes",
      category: "container",
      color: "#326CE5",
      status: "active",
      usageFiles: [],
      definitionFiles: [],
      statusReason: "Kubernetes manifests detected.",
    });
  }

  const formatCategory = (category) =>
    String(category || "technology")
      .replace(/[_-]/g, " ")
      .replace(/\b\w/g, (character) => character.toUpperCase());

  return (
    <div
      style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 10 }}
    >
      {visibleEntries.map((technology) => {
        const category = String(
          technology.category || "technology",
        ).toLowerCase();
        const isLanguage = category === "language";
        const isUnused = !isLanguage && technology.status === "declared-only";
        const definitionCount = Array.isArray(technology.definitionFiles)
          ? technology.definitionFiles.length
          : 0;
        const usageCount = Array.isArray(technology.usageFiles)
          ? technology.usageFiles.length
          : 0;

        return (
          <div
            key={`tech-${technology.id || technology.label}`}
            className="card"
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                marginBottom: 8,
              }}
            >
              <div>
                <div
                  style={{
                    fontSize: 13,
                    fontWeight: 700,
                    color: technology.color || "#38BDF8",
                  }}
                >
                  {technology.label || technology.id}
                </div>
                <div
                  style={{
                    fontSize: 10,
                    color: "#64748B",
                    marginTop: 2,
                  }}
                >
                  {formatCategory(technology.category)}
                </div>

                <div
                  style={{
                    fontSize: 10,
                    color: "#475569",
                    marginTop: 6,
                  }}
                >
                  used: {usageCount} | defined: {definitionCount}
                </div>
              </div>
              <span
                className="badge"
                style={{
                  background: isUnused
                    ? "rgba(248,113,113,.1)"
                    : "rgba(52,211,153,.1)",
                  color: isUnused ? "#F87171" : "#34D399",
                  border: isUnused
                    ? "1px solid rgba(248,113,113,.25)"
                    : "1px solid rgba(52,211,153,.2)",
                }}
                title={technology.statusReason || ""}
              >
                {isLanguage ? "core" : isUnused ? "unused" : "active"}
              </span>
            </div>

            {isUnused ? (
              <div style={{ fontSize: 10, color: "#F87171" }}>
                Integrated/declared but no runtime usage detected yet.
              </div>
            ) : null}
          </div>
        );
      })}
    </div>
  );
}
