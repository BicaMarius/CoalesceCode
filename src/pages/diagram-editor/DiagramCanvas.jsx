import React from "react";
import { getNodeDisplayMeta } from "../../features/app/uiData";

function center(node) {
  return {
    x: node.x + (node.w || 0) / 2,
    y: node.y + (node.h || 0) / 2,
  };
}

export default function DiagramCanvas({
  nodes,
  edges,
  selNode,
  setSelNode,
  setShowMS,
  converting,
  convDone,
  swapAI,
  aiDone,
}) {
  const width = Math.max(
    920,
    Math.max(...nodes.map((node) => node.x + node.w)) + 220,
  );
  const height = Math.max(
    620,
    Math.max(...nodes.map((node) => node.y + node.h)) + 220,
  );

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        minHeight: 0,
        borderRight: "1px solid #111D2E",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "10px 12px",
          borderBottom: "1px solid #111D2E",
          background: "#07090F",
          flexShrink: 0,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ fontSize: 11, color: "#64748B", fontWeight: 600 }}>
            Diagram Editor
          </span>
          <span
            className="badge"
            style={{
              background: "rgba(96,165,250,.1)",
              color: "#60A5FA",
              border: "1px solid rgba(96,165,250,.2)",
            }}
          >
            Scroll enabled
          </span>
        </div>

        <div style={{ display: "flex", gap: 6 }}>
          <button
            className="bg"
            style={{ fontSize: 10 }}
            onClick={() => setShowMS(true)}
          >
            + Microservice
          </button>
        </div>
      </div>

      <div
        style={{
          position: "relative",
          flex: 1,
          minHeight: 0,
          overflow: "auto",
          background: "#07090F",
        }}
      >
        <div style={{ minWidth: width, minHeight: height, padding: 16 }}>
          <svg width={width} height={height}>
            <defs>
              <marker
                id="diag-arr"
                markerWidth="7"
                markerHeight="7"
                refX="7"
                refY="3"
                orient="auto"
              >
                <path d="M0,0 L0,6 L7,3 z" fill="#2D3F55" />
              </marker>
            </defs>

            {edges.map((edge, index) => {
              const fromNode = nodes.find((node) => node.id === edge.from);
              const toNode = nodes.find((node) => node.id === edge.to);
              if (!fromNode || !toNode) return null;
              const from = center(fromNode);
              const to = center(toNode);

              return (
                <line
                  key={`${edge.from}-${edge.to}-${index}`}
                  x1={from.x}
                  y1={from.y}
                  x2={to.x}
                  y2={to.y}
                  stroke="#2D3F55"
                  strokeWidth="1.7"
                  markerEnd="url(#diag-arr)"
                />
              );
            })}

            {nodes.map((node) => {
              const selected = selNode === node.id;
              const { labelLines, typeLine, subtitleLine } =
                getNodeDisplayMeta(node);
              const typeY = node.y + node.h - (subtitleLine ? 14 : 8);
              const subtitleY = node.y + node.h - 5;
              return (
                <g
                  key={node.id}
                  className={selected ? "gsel" : ""}
                  onClick={() => setSelNode(node.id)}
                >
                  <rect
                    x={node.x}
                    y={node.y}
                    width={node.w}
                    height={node.h}
                    rx="8"
                    fill="#0B111C"
                    stroke={selected ? "#60A5FA" : node.color}
                    strokeWidth={selected ? "2" : "1.5"}
                    className="nh"
                  />
                  {labelLines.map((line, index) => (
                    <text
                      key={`${node.id}-label-${index}`}
                      x={node.x + node.w / 2}
                      y={node.y + 16 + index * 10.5}
                      textAnchor="middle"
                      fill={selected ? "#60A5FA" : node.color}
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

      {(converting || swapAI || convDone || aiDone) && (
        <div
          style={{
            borderTop: "1px solid #111D2E",
            padding: "8px 12px",
            display: "flex",
            gap: 8,
            flexWrap: "wrap",
          }}
        >
          {converting && (
            <span
              className="badge"
              style={{ background: "rgba(251,191,36,.1)", color: "#FBBF24" }}
            >
              DB conversion in progress
            </span>
          )}
          {convDone && !converting && (
            <span
              className="badge"
              style={{ background: "rgba(52,211,153,.1)", color: "#34D399" }}
            >
              DB conversion completed
            </span>
          )}
          {swapAI && (
            <span
              className="badge"
              style={{ background: "rgba(96,165,250,.1)", color: "#60A5FA" }}
            >
              AI model migration in progress
            </span>
          )}
          {aiDone && !swapAI && (
            <span
              className="badge"
              style={{ background: "rgba(52,211,153,.1)", color: "#34D399" }}
            >
              AI model migration completed
            </span>
          )}
        </div>
      )}
    </div>
  );
}
