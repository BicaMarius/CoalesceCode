import React from "react";
import { S } from "../app/uiData";
import Icon from "../ui/Icon";

export default function NavBar({
  screen,
  setScreen,
  onReset,
  refreshing,
  onRefresh,
}) {
  return (
    <nav
      style={{
        borderBottom: "1px solid #111D2E",
        padding: "0 24px",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        height: 52,
        background: "#07090F",
        flexShrink: 0,
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <div
          style={{
            width: 24,
            height: 24,
            background: "linear-gradient(135deg,#1D4ED8,#60A5FA)",
            borderRadius: 5,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "#E2E8F0",
          }}
        >
          <Icon name="brand" size={14} color="#E2E8F0" strokeWidth={2} />
        </div>
        <span
          style={{
            fontFamily: "'Syne',sans-serif",
            fontWeight: 800,
            fontSize: 14,
            letterSpacing: "-0.5px",
          }}
        >
          CodeLens<span style={{ color: "#60A5FA" }}>AI</span>
        </span>
        <span
          style={{
            fontSize: 9,
            background: "rgba(96,165,250,.12)",
            color: "#60A5FA",
            border: "1px solid rgba(96,165,250,.2)",
            borderRadius: 4,
            padding: "1px 5px",
            marginLeft: 3,
          }}
        >
          BETA
        </span>
      </div>

      <div style={{ display: "flex", gap: 7, alignItems: "center" }}>
        {screen === S.DIAG && (
          <button
            className="bg"
            style={{ display: "flex", alignItems: "center", gap: 5 }}
            onClick={() => setScreen(S.DASH)}
          >
            <Icon name="dashboard" size={12} color="#60A5FA" strokeWidth={2} />
            Dashboard
          </button>
        )}

        {(screen === S.DASH || screen === S.LOAD) && (
          <button
            className="bg"
            style={{ display: "flex", alignItems: "center", gap: 5 }}
            onClick={onReset}
          >
            <Icon
              name="newAnalysis"
              size={12}
              color="#60A5FA"
              strokeWidth={2}
            />
            New Analysis
          </button>
        )}

        {screen === S.DASH && (
          <button
            className="bg"
            style={{ display: "flex", alignItems: "center", gap: 5 }}
            onClick={onRefresh}
          >
            <Icon
              name="sync"
              size={12}
              color={refreshing ? "#34D399" : "#60A5FA"}
              strokeWidth={2}
            />
            {refreshing ? "Syncing..." : "Sync Git"}
          </button>
        )}
      </div>
    </nav>
  );
}
