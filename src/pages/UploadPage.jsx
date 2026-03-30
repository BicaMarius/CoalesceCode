import React from "react";
import Icon from "../features/ui/Icon";

export default function UploadPage({
  CSS,
  Nav,
  githubUrl,
  setGithubUrl,
  analyzeErr,
  setAnalyzeErr,
  handleAnalyze,
  fileRef,
  handleZipAnalyze,
}) {
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
        style={{ maxWidth: 620, margin: "0 auto", padding: "64px 24px" }}
      >
        <div style={{ textAlign: "center", marginBottom: 40 }}>
          <div
            style={{
              fontSize: 10,
              letterSpacing: "3px",
              color: "#60A5FA",
              textTransform: "uppercase",
              marginBottom: 12,
              fontWeight: 600,
            }}
          >
            DevTools Innovation Labs 2026
          </div>
          <h1
            style={{
              fontFamily: "'Syne', sans-serif",
              fontSize: 38,
              fontWeight: 800,
              lineHeight: 1.1,
              letterSpacing: "-2px",
              marginBottom: 12,
            }}
          >
            Understand any codebase
            <br />
            <span style={{ color: "#60A5FA" }}>in 60 seconds.</span>
          </h1>
          <p style={{ color: "#64748B", fontSize: 13, lineHeight: 1.7 }}>
            Paste a public GitHub URL to get an automatic architecture diagram,
            dependency analysis and tech stack detection with no setup required.
          </p>
        </div>

        <div
          style={{
            background: "#0B111C",
            border: "1px solid #1A2740",
            borderRadius: 10,
            padding: 20,
            marginBottom: 14,
          }}
        >
          <div
            style={{
              fontSize: 10,
              color: "#60A5FA",
              fontWeight: 600,
              display: "flex",
              alignItems: "center",
              gap: 6,
              marginBottom: 10,
              textTransform: "uppercase",
              letterSpacing: "1px",
            }}
          >
            <Icon name="repo" size={12} color="#60A5FA" strokeWidth={2} />
            GitHub Repository
          </div>

          <div
            style={{
              display: "flex",
              gap: 8,
              marginBottom: analyzeErr ? 10 : 0,
            }}
          >
            <input
              value={githubUrl}
              onChange={(event) => {
                setGithubUrl(event.target.value);
                setAnalyzeErr("");
              }}
              onKeyDown={(event) => {
                if (event.key === "Enter") handleAnalyze();
              }}
              placeholder="https://github.com/owner/repository"
              style={{
                flex: 1,
                background: "#07090F",
                border: `1px solid ${analyzeErr ? "#F87171" : "#1A2740"}`,
                borderRadius: 7,
                padding: "10px 13px",
                color: "#E2E8F0",
                fontFamily: "inherit",
                fontSize: 12,
                outline: "none",
              }}
            />
            <button
              className="bp"
              style={{
                padding: "10px 18px",
                fontSize: 12,
                display: "flex",
                alignItems: "center",
                gap: 6,
              }}
              onClick={handleAnalyze}
            >
              <Icon name="analyze" size={13} color="#FFFFFF" strokeWidth={2} />
              Analyze
            </button>
          </div>

          {analyzeErr && (
            <div style={{ fontSize: 11, color: "#F87171", marginTop: 6 }}>
              {analyzeErr}
            </div>
          )}

          <div style={{ fontSize: 10, color: "#334155", marginTop: 10 }}>
            Supports public repos. Best results for projects with source and
            package/config files.
          </div>
        </div>

        <div
          onClick={() => fileRef.current?.click()}
          onDragOver={(event) => {
            event.preventDefault();
          }}
          onDrop={(event) => {
            event.preventDefault();
            const droppedFile = event.dataTransfer?.files?.[0];
            if (droppedFile) handleZipAnalyze(droppedFile);
          }}
          style={{
            border: "2px dashed #1A2740",
            borderRadius: 10,
            padding: "22px 24px",
            textAlign: "center",
            cursor: "pointer",
            background: "#0B111C",
            marginBottom: 24,
            position: "relative",
          }}
        >
          <input
            ref={fileRef}
            type="file"
            accept=".zip"
            onChange={(event) => {
              const selectedFile = event.target.files?.[0];
              if (selectedFile) handleZipAnalyze(selectedFile);
              event.target.value = "";
            }}
            style={{ display: "none" }}
          />
          <div style={{ marginBottom: 8 }}>
            <Icon name="zip" size={28} color="#60A5FA" strokeWidth={1.9} />
          </div>
          <div style={{ fontWeight: 600, marginBottom: 3, fontSize: 13 }}>
            Drop project ZIP here
          </div>
          <div style={{ fontSize: 10, color: "#334155" }}>
            Parse local archives directly (no cloud upload)
          </div>
          <div
            style={{
              position: "absolute",
              top: 8,
              right: 10,
              fontSize: 9,
              color: "#34D399",
              background: "rgba(52,211,153,.12)",
              border: "1px solid rgba(52,211,153,.25)",
              borderRadius: 4,
              padding: "1px 6px",
            }}
          >
            ACTIVE
          </div>
        </div>

        <div style={{ display: "flex", gap: 20, justifyContent: "center" }}>
          {[
            ["speed", "Speed", "~15-30 sec", "average analysis"],
            ["shield", "Privacy", "Zero storage", "code stays local"],
            ["layers", "Stacks", "JS / TS / Polyglot", "detector-based"],
          ].map(([iconName, label, title, subtitle]) => (
            <div key={label} style={{ textAlign: "center" }}>
              <div
                style={{
                  display: "inline-flex",
                  marginBottom: 4,
                  color: "#60A5FA",
                }}
              >
                <Icon
                  name={iconName}
                  size={14}
                  color="#60A5FA"
                  strokeWidth={2}
                />
              </div>
              <div style={{ fontSize: 11, marginBottom: 2, color: "#60A5FA" }}>
                {label}
              </div>
              <div style={{ fontSize: 11, fontWeight: 600 }}>{title}</div>
              <div style={{ fontSize: 10, color: "#334155" }}>{subtitle}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
