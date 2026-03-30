import React from "react";
import {
  UF_CODE,
  UF_EDGES,
  UF_NODES,
  ufBottom,
  ufTop,
} from "../../../features/app/uiData";

export default function UserFlowTab() {
  const width = 960;
  const height = 560;

  return (
    <div style={{ display: "grid", gridTemplateColumns: "1fr 320px", gap: 12 }}>
      <div className="card">
        <div
          style={{
            fontSize: 11,
            color: "#60A5FA",
            fontWeight: 600,
            marginBottom: 10,
          }}
        >
          User Journey
        </div>
        <div
          style={{
            maxHeight: 560,
            overflow: "auto",
            border: "1px solid #111D2E",
            borderRadius: 8,
            background: "#07090F",
          }}
        >
          <svg
            width="100%"
            viewBox={`0 0 ${width} ${height}`}
            style={{ minWidth: width }}
          >
            <defs>
              <marker
                id="ufa"
                markerWidth="7"
                markerHeight="7"
                refX="7"
                refY="3"
                orient="auto"
              >
                <path d="M0,0 L0,6 L7,3 z" fill="#2563EB" />
              </marker>
            </defs>

            {UF_EDGES.map((edge) => {
              const source = UF_NODES.find((node) => node.id === edge.f);
              const target = UF_NODES.find((node) => node.id === edge.t);
              if (!source || !target) return null;

              const fromPoint = ufBottom(source);
              const toPoint = ufTop(target);
              const controlY = (fromPoint.y + toPoint.y) / 2;

              return (
                <path
                  key={`${edge.f}-${edge.t}`}
                  d={`M ${fromPoint.x} ${fromPoint.y} C ${fromPoint.x} ${controlY}, ${toPoint.x} ${controlY}, ${toPoint.x} ${toPoint.y}`}
                  stroke={edge.c || "#2563EB"}
                  strokeWidth="2"
                  fill="none"
                  markerEnd="url(#ufa)"
                  opacity="0.9"
                />
              );
            })}

            {UF_NODES.map((node) => (
              <g key={node.id}>
                {node.shape === "circle" ? (
                  <circle
                    cx={node.cx}
                    cy={node.cy}
                    r={node.r}
                    fill="#0B111C"
                    stroke={node.color}
                    strokeWidth="1.5"
                  />
                ) : node.shape === "diamond" ? (
                  <polygon
                    points={`${node.x + node.w / 2},${node.y} ${node.x + node.w},${node.y + node.h / 2} ${node.x + node.w / 2},${node.y + node.h} ${node.x},${node.y + node.h / 2}`}
                    fill="#0B111C"
                    stroke={node.color}
                    strokeWidth="1.5"
                  />
                ) : (
                  <rect
                    x={node.x}
                    y={node.y}
                    width={node.w}
                    height={node.h}
                    rx="9"
                    fill="#0B111C"
                    stroke={node.color}
                    strokeWidth="1.5"
                  />
                )}
                <text
                  x={node.shape === "circle" ? node.cx : node.x + node.w / 2}
                  y={node.shape === "circle" ? node.cy - 2 : node.y + 18}
                  textAnchor="middle"
                  fill={node.color}
                  fontSize="11"
                  fontWeight="600"
                  fontFamily="JetBrains Mono"
                >
                  {node.label}
                </text>
                {node.shape !== "circle" ? (
                  <text
                    x={node.x + node.w / 2}
                    y={node.y + 35}
                    textAnchor="middle"
                    fill="#64748B"
                    fontSize="9"
                    fontFamily="JetBrains Mono"
                  >
                    {node.shape}
                  </text>
                ) : null}
              </g>
            ))}
          </svg>
        </div>
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
          Automation Hook
        </div>
        <pre
          style={{
            margin: 0,
            background: "#07090F",
            border: "1px solid #111D2E",
            borderRadius: 8,
            padding: 10,
            fontSize: 9,
            color: "#94A3B8",
            lineHeight: 1.7,
            whiteSpace: "pre-wrap",
          }}
        >
          {JSON.stringify(UF_CODE, null, 2)}
        </pre>
      </div>
    </div>
  );
}
