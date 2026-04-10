import React from "react";

export default function LoadingPage({
  CSS,
  Nav,
  githubUrl,
  loadMsg,
  loadPct,
  loadSteps,
}) {
  const activeStep = Math.min(loadSteps.length - 1, Math.floor(loadPct / 17));

  return (
    <div
      style={{
        fontFamily: "'JetBrains Mono', monospace",
        background: "#07090F",
        minHeight: "100vh",
        color: "#E2E8F0",
      }}
    >
      <style>{CSS}</style>
      <Nav />
      <div
        className="fade"
        style={{ maxWidth: 480, margin: "0 auto", padding: "64px 24px" }}
      >
        <div style={{ textAlign: "center", marginBottom: 32 }}>
          <div
            style={{
              fontSize: 10,
              color: "#60A5FA",
              letterSpacing: "2px",
              textTransform: "uppercase",
              marginBottom: 9,
            }}
          >
            Analyzing
          </div>
          <div
            style={{
              fontFamily: "'Syne', sans-serif",
              fontSize: 16,
              fontWeight: 700,
              marginBottom: 5,
              wordBreak: "break-all",
            }}
          >
            {githubUrl.replace("https://github.com/", "")}
          </div>
          <div style={{ color: "#334155", fontSize: 11 }}>{loadMsg}</div>
        </div>

        <div className="card" style={{ overflow: "hidden" }}>
          <div
            style={{
              height: 3,
              background: "#111D2E",
              marginBottom: 18,
              borderRadius: 2,
            }}
          >
            <div
              className="pbar"
              style={{ height: "100%", width: `${loadPct}%` }}
            />
          </div>

          {loadSteps.map((step, index) => (
            <div
              key={step.label}
              style={{
                display: "flex",
                alignItems: "flex-start",
                gap: 12,
                marginBottom: index < loadSteps.length - 1 ? 14 : 0,
                opacity:
                  index < activeStep ? 1 : index === activeStep ? 0.8 : 0.18,
                transition: "opacity .4s",
              }}
            >
              <div
                style={{
                  width: 17,
                  height: 17,
                  borderRadius: "50%",
                  border: `2px solid ${
                    index < activeStep
                      ? "#34D399"
                      : index === activeStep
                        ? "#60A5FA"
                        : "#1E2D40"
                  }`,
                  background: index < activeStep ? "#34D399" : "transparent",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                  marginTop: 1,
                  fontSize: 8,
                }}
              >
                {index < activeStep ? (
                  "OK"
                ) : index === activeStep ? (
                  <span
                    className="spin"
                    style={{
                      width: 6,
                      height: 6,
                      border: "2px solid #60A5FA",
                      borderTopColor: "transparent",
                      borderRadius: "50%",
                    }}
                  />
                ) : (
                  ""
                )}
              </div>
              <div>
                <div
                  style={{
                    fontSize: 12,
                    fontWeight: 600,
                    color: index < activeStep ? "#34D399" : "#E2E8F0",
                  }}
                >
                  {step.label}
                </div>
                <div style={{ fontSize: 10, color: "#334155", marginTop: 2 }}>
                  {step.sub}
                </div>
              </div>
            </div>
          ))}
        </div>

        <div
          style={{
            textAlign: "center",
            fontSize: 10,
            color: "#1E2D40",
            marginTop: 14,
          }}
        >
          {loadPct}% complete
        </div>
      </div>
    </div>
  );
}
