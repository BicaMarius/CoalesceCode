import React from "react";

export default function NarrativeTab({ isReal, realData }) {
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
        Narrative generation with LLM enrichment is scheduled for v2.
      </div>

      <div className="card">
        <div
          style={{
            fontSize: 11,
            color: "#60A5FA",
            fontWeight: 600,
            marginBottom: 10,
          }}
        >
          Project Summary
        </div>
        <p style={{ color: "#94A3B8", fontSize: 12, lineHeight: 1.8 }}>
          This repository appears to be a full-stack application with separate
          runtime concerns and explicit dependency management.
        </p>

        {isReal && realData.detected.orm ? (
          <p
            style={{
              color: "#94A3B8",
              fontSize: 12,
              lineHeight: 1.8,
              marginTop: 10,
            }}
          >
            ORM detected:{" "}
            <strong style={{ color: "#E2E8F0" }}>
              {realData.detected.orm.label}
            </strong>
          </p>
        ) : null}
      </div>
    </div>
  );
}
