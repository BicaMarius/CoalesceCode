import React from "react";
import { TESTS_MOCK } from "../../../features/app/uiData";

export default function TestsTab() {
  return (
    <div
      style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 10 }}
    >
      {TESTS_MOCK.map((test) => (
        <div key={test.file} className="card">
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              marginBottom: 8,
            }}
          >
            <span style={{ fontSize: 11, color: "#E2E8F0", fontWeight: 600 }}>
              {test.module}
            </span>
            <span
              className="badge"
              style={{
                background:
                  test.miss.length === 0
                    ? "rgba(52,211,153,.1)"
                    : "rgba(251,191,36,.1)",
                color: test.miss.length === 0 ? "#34D399" : "#FBBF24",
                border:
                  test.miss.length === 0
                    ? "1px solid rgba(52,211,153,.2)"
                    : "1px solid rgba(251,191,36,.2)",
              }}
            >
              {test.miss.length === 0 ? "PASS" : "PARTIAL"}
            </span>
          </div>

          <div style={{ fontSize: 10, color: "#64748B", marginBottom: 8 }}>
            {test.file}
          </div>

          <div style={{ marginBottom: 8 }}>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                marginBottom: 4,
              }}
            >
              <span style={{ fontSize: 10, color: "#64748B" }}>Coverage</span>
              <span style={{ fontSize: 10, color: "#60A5FA", fontWeight: 700 }}>
                {test.cov}%
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
                  width: `${test.cov}%`,
                  height: "100%",
                  background: "#60A5FA",
                }}
              />
            </div>
          </div>

          <div style={{ fontSize: 10, color: "#334155", lineHeight: 1.8 }}>
            <div>
              Passed:{" "}
              <span style={{ color: "#34D399" }}>{test.pass.length}</span>
            </div>
            <div>
              Missing:{" "}
              <span style={{ color: "#FBBF24" }}>{test.miss.length}</span>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
