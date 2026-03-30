import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  gc,
  getNodeDisplayMeta,
  renderGroups,
  S,
} from "../../../features/app/uiData";
import Icon from "../../../features/ui/Icon";

export default function ArchitectureTab({
  nodes,
  edges,
  isReal,
  displayStats,
  setShowMS,
  setScreen,
  setTab,
}) {
  const diagramHostRef = useRef(null);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const handleFullscreenChange = useCallback(() => {
    setIsFullscreen(document.fullscreenElement === diagramHostRef.current);
  }, []);

  useEffect(() => {
    document.addEventListener("fullscreenchange", handleFullscreenChange);
    return () => {
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
    };
  }, [handleFullscreenChange]);

  const toggleFullscreen = async () => {
    if (!diagramHostRef.current) return;
    try {
      if (document.fullscreenElement === diagramHostRef.current) {
        await document.exitFullscreen();
      } else {
        await diagramHostRef.current.requestFullscreen();
      }
    } catch {
      setIsFullscreen(false);
    }
  };

  const svgHeight = Math.max(
    420,
    Math.max(...nodes.map((node) => node.y + node.h)) + 70,
  );
  const svgWidth = Math.max(
    640,
    Math.max(...nodes.map((node) => node.x + node.w)) + 90,
  );
  const groups = renderGroups(nodes);

  return (
    <div style={{ display: "grid", gridTemplateColumns: "1fr 270px", gap: 12 }}>
      <div className="card" style={{ minHeight: 360 }}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 12,
          }}
        >
          <span style={{ fontSize: 11, fontWeight: 600, color: "#64748B" }}>
            System Architecture{" "}
            {isReal ? (
              <span style={{ color: "#34D399", fontSize: 9 }}>| REAL DATA</span>
            ) : null}
          </span>
          <button
            className="bg"
            style={{ fontSize: 10 }}
            onClick={() => setShowMS(true)}
          >
            + Microservice
          </button>
        </div>

        {nodes.length === 0 ? (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              height: 260,
              color: "#334155",
              fontSize: 12,
            }}
          >
            No nodes detected. Check Analysis Log.
          </div>
        ) : (
          <div
            ref={diagramHostRef}
            style={{
              position: "relative",
              maxHeight: isFullscreen ? "100vh" : 560,
              border: "1px solid #111D2E",
              borderRadius: 8,
              background: "#07090F",
            }}
          >
            <button
              className="bg"
              style={{
                position: "absolute",
                top: 8,
                right: 8,
                zIndex: 2,
                padding: "5px 7px",
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
                fontSize: 10,
              }}
              onClick={toggleFullscreen}
              title={isFullscreen ? "Exit fullscreen" : "Open fullscreen"}
            >
              <Icon
                name={isFullscreen ? "fullscreenExit" : "fullscreen"}
                size={12}
                color="#94A3B8"
              />
              {isFullscreen ? "Exit" : "Full"}
            </button>

            <div
              style={{
                maxHeight: isFullscreen ? "calc(100vh - 18px)" : 560,
                overflow: "auto",
                paddingTop: 2,
              }}
            >
              <svg
                width="100%"
                viewBox={`0 0 ${svgWidth} ${svgHeight}`}
                style={{ minWidth: svgWidth }}
              >
                <defs>
                  <marker
                    id="arr"
                    markerWidth="7"
                    markerHeight="7"
                    refX="7"
                    refY="3"
                    orient="auto"
                  >
                    <path d="M0,0 L0,6 L7,3 z" fill="#2D3F55" />
                  </marker>
                </defs>

                {groups.map((group) => (
                  <g key={group.id}>
                    <rect
                      x={group.minX}
                      y={group.minY}
                      width={group.maxX - group.minX}
                      height={group.maxY - group.minY}
                      rx="10"
                      fill={group.color}
                      fillOpacity="0.05"
                      stroke={group.color}
                      strokeOpacity="0.2"
                      strokeWidth="1"
                      strokeDasharray="5,4"
                    />
                    <text
                      x={group.minX + 9}
                      y={group.minY + 11}
                      fill={group.color}
                      fillOpacity="0.6"
                      fontSize="7.5"
                      fontWeight="700"
                      fontFamily="JetBrains Mono"
                      letterSpacing="0.8"
                    >
                      {group.label.toUpperCase()}
                    </text>
                  </g>
                ))}

                {edges.map((edge, index) => {
                  const fromNode = nodes.find((node) => node.id === edge.from);
                  const toNode = nodes.find((node) => node.id === edge.to);
                  if (!fromNode || !toNode) return null;
                  const from = gc(fromNode);
                  const to = gc(toNode);
                  return (
                    <line
                      key={`${edge.from}-${edge.to}-${index}`}
                      x1={from.x}
                      y1={from.y}
                      x2={to.x}
                      y2={to.y}
                      stroke="#2D3F55"
                      strokeWidth="1.5"
                      markerEnd="url(#arr)"
                    />
                  );
                })}

                {nodes.map((node) => {
                  const { labelLines, typeLine, subtitleLine } =
                    getNodeDisplayMeta(node);
                  const typeY = node.y + node.h - (subtitleLine ? 14 : 8);
                  const subtitleY = node.y + node.h - 5;

                  return (
                    <g
                      key={node.id}
                      className="nh"
                      onClick={() => setScreen(S.DIAG)}
                    >
                      <rect
                        x={node.x}
                        y={node.y}
                        width={node.w}
                        height={node.h}
                        rx="7"
                        fill="#0B111C"
                        stroke={node.color}
                        strokeWidth="1.5"
                      />

                      {labelLines.map((line, index) => (
                        <text
                          key={`${node.id}-label-${index}`}
                          x={node.x + node.w / 2}
                          y={node.y + 16 + index * 10.5}
                          textAnchor="middle"
                          fill={node.color}
                          fontSize="9.6"
                          fontWeight="600"
                          fontFamily="JetBrains Mono"
                        >
                          {line}
                        </text>
                      ))}

                      <text
                        x={node.x + node.w / 2}
                        y={typeY}
                        textAnchor="middle"
                        fill="#334155"
                        fontSize="8.5"
                        fontFamily="JetBrains Mono"
                      >
                        {typeLine}
                      </text>

                      {subtitleLine ? (
                        <text
                          x={node.x + node.w / 2}
                          y={subtitleY}
                          textAnchor="middle"
                          fill="#60A5FA"
                          fontSize="8.1"
                          fontFamily="JetBrains Mono"
                        >
                          {subtitleLine}
                        </text>
                      ) : null}
                    </g>
                  );
                })}
              </svg>
            </div>
          </div>
        )}

        <div
          style={{
            fontSize: 9,
            color: "#1E2D40",
            textAlign: "center",
            marginTop: 6,
          }}
        >
          Click any node to open Diagram Editor.
        </div>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 9 }}>
        <div className="card">
          <div
            style={{
              fontSize: 9,
              color: "#334155",
              textTransform: "uppercase",
              letterSpacing: "1px",
              marginBottom: 9,
            }}
          >
            Legend
          </div>
          {[
            ["Frontend", "#61DAFB"],
            ["Backend", "#34D399"],
            ["Service", "#FBBF24"],
            ["Database", "#336791"],
            ["Cache", "#D82C20"],
            ["AI", "#74AA9C"],
          ].map(([name, color]) => (
            <div
              key={name}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 6,
                marginBottom: 6,
              }}
            >
              <div
                style={{
                  width: 8,
                  height: 8,
                  borderRadius: 2,
                  background: color,
                  flexShrink: 0,
                }}
              />
              <span style={{ fontSize: 11, color: "#94A3B8" }}>{name}</span>
            </div>
          ))}
        </div>

        {isReal && displayStats.moduleList.length > 0 ? (
          <div className="card">
            <div
              style={{
                fontSize: 9,
                color: "#334155",
                textTransform: "uppercase",
                letterSpacing: "1px",
                marginBottom: 9,
              }}
            >
              Modules ({displayStats.modules})
            </div>
            <div style={{ maxHeight: 220, overflowY: "auto" }}>
              {displayStats.moduleList.map((moduleName) => (
                <div
                  key={moduleName}
                  style={{
                    fontSize: 10,
                    color: "#94A3B8",
                    marginBottom: 5,
                    paddingLeft: 8,
                    borderLeft: "2px solid #1A2740",
                  }}
                >
                  {moduleName}/
                </div>
              ))}
            </div>
          </div>
        ) : null}

        <div className="card">
          <div
            style={{
              fontSize: 9,
              color: "#334155",
              textTransform: "uppercase",
              letterSpacing: "1px",
              marginBottom: 9,
            }}
          >
            Quick Actions
          </div>
          <button
            className="bg"
            style={{
              width: "100%",
              textAlign: "left",
              fontSize: 10,
              padding: "7px 10px",
              marginBottom: 6,
            }}
            onClick={() => setShowMS(true)}
          >
            Add Microservice
          </button>
          <button
            className="bg"
            style={{
              width: "100%",
              textAlign: "left",
              fontSize: 10,
              padding: "7px 10px",
              marginBottom: 6,
            }}
            onClick={() => setScreen(S.DIAG)}
          >
            Open Diagram Editor
          </button>
          <button
            className="bg"
            style={{
              width: "100%",
              textAlign: "left",
              fontSize: 10,
              padding: "7px 10px",
            }}
            onClick={() => setTab("dependencies")}
          >
            View Dependencies
          </button>
        </div>
      </div>
    </div>
  );
}
