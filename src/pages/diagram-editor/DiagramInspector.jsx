import React from "react";
import { AI_MODELS, DB_OPT, NODE_INFO } from "../../features/app/uiData";
import Icon from "../../features/ui/Icon";

export default function DiagramInspector({
  selNode,
  nodes,
  curDb,
  doDbSwap,
  converting,
  convDone,
  curAI,
  doAISwap,
  swapAI,
  aiDone,
  nodeDetails,
}) {
  const selectedNode = nodes.find((node) => node.id === selNode);
  const selectedDetails = selectedNode
    ? nodeDetails?.[selectedNode.id] || NODE_INFO[selectedNode.id] || null
    : null;
  const showDbTools = selectedNode?.id === "db";
  const showAiTools = selectedNode?.id === "ai";

  return (
    <aside
      style={{
        background: "#0B111C",
        display: "flex",
        flexDirection: "column",
        minHeight: 0,
      }}
    >
      <div style={{ padding: "12px 14px", borderBottom: "1px solid #111D2E" }}>
        <div style={{ fontSize: 11, color: "#64748B", fontWeight: 600 }}>
          Inspector
        </div>
      </div>

      <div style={{ flex: 1, overflowY: "auto", padding: 12 }}>
        <div className="card" style={{ marginBottom: 10 }}>
          <div
            style={{
              fontSize: 10,
              color: "#334155",
              textTransform: "uppercase",
              letterSpacing: "1px",
              marginBottom: 7,
            }}
          >
            Selected Node
          </div>

          {selectedNode ? (
            <>
              <div
                style={{
                  fontSize: 13,
                  fontWeight: 700,
                  color: selectedNode.color,
                  marginBottom: 4,
                }}
              >
                {selectedNode.label}
              </div>
              <div style={{ fontSize: 10, color: "#64748B", marginBottom: 8 }}>
                {selectedNode.type}
              </div>

              {(selectedDetails?.stats || []).map(([key, value]) => (
                <div
                  key={`${selectedNode.id}-${key}`}
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    fontSize: 10,
                    marginBottom: 5,
                  }}
                >
                  <span style={{ color: "#64748B" }}>{key}</span>
                  <span style={{ color: "#E2E8F0" }}>{value}</span>
                </div>
              ))}

              {selectedDetails?.modules?.length ? (
                <div
                  style={{
                    marginTop: 8,
                    borderTop: "1px solid #111D2E",
                    paddingTop: 8,
                  }}
                >
                  <div
                    style={{
                      fontSize: 9,
                      color: "#334155",
                      textTransform: "uppercase",
                      letterSpacing: "0.8px",
                      marginBottom: 5,
                    }}
                  >
                    Relevant Modules
                  </div>

                  {selectedDetails.modules.slice(0, 6).map((moduleName) => (
                    <div
                      key={`${selectedNode.id}-module-${moduleName}`}
                      style={{
                        fontSize: 10,
                        color: "#94A3B8",
                        marginBottom: 3,
                      }}
                    >
                      {moduleName}
                    </div>
                  ))}
                </div>
              ) : null}

              {selectedDetails?.files?.length ? (
                <div
                  style={{
                    marginTop: 8,
                    borderTop: "1px solid #111D2E",
                    paddingTop: 8,
                  }}
                >
                  <div
                    style={{
                      fontSize: 9,
                      color: "#334155",
                      textTransform: "uppercase",
                      letterSpacing: "0.8px",
                      marginBottom: 5,
                    }}
                  >
                    Evidence Files
                  </div>

                  {selectedDetails.files.map((filePath) => (
                    <div
                      key={filePath}
                      style={{
                        fontSize: 10,
                        color: "#94A3B8",
                        marginBottom: 3,
                      }}
                    >
                      {filePath}
                    </div>
                  ))}
                </div>
              ) : null}

              {!selectedDetails?.stats?.length &&
              !selectedDetails?.files?.length &&
              !selectedDetails?.modules?.length ? (
                <div style={{ fontSize: 11, color: "#334155", marginTop: 8 }}>
                  No enriched details available yet for this node.
                </div>
              ) : null}
            </>
          ) : (
            <div style={{ fontSize: 11, color: "#334155" }}>
              Click a node on the canvas.
            </div>
          )}
        </div>

        {showDbTools ? (
          <div className="card" style={{ marginBottom: 10 }}>
            <div
              style={{
                fontSize: 10,
                color: "#334155",
                textTransform: "uppercase",
                letterSpacing: "1px",
                marginBottom: 8,
              }}
            >
              Database Conversion
            </div>

            {DB_OPT.map((db) => (
              <div
                key={db.id}
                className={`dbo ${curDb === db.id ? "sel" : ""}`}
                onClick={() => doDbSwap(db.id)}
                style={{ marginBottom: 6 }}
              >
                <Icon
                  name={db.icon}
                  size={14}
                  color={db.color}
                  strokeWidth={2}
                />
                <div style={{ display: "flex", flexDirection: "column" }}>
                  <span
                    style={{
                      fontSize: 11,
                      color: curDb === db.id ? db.color : "#94A3B8",
                      fontWeight: 600,
                    }}
                  >
                    {db.label}
                  </span>
                  <span style={{ fontSize: 9, color: "#334155" }}>
                    {curDb === db.id
                      ? "current"
                      : DB_OPT.find((item) => item.id === curDb)?.compat?.[
                          db.id
                        ] || "compatible"}
                  </span>
                </div>
              </div>
            ))}

            {converting ? (
              <div style={{ fontSize: 10, color: "#FBBF24", marginTop: 4 }}>
                Converting database abstraction...
              </div>
            ) : null}
            {convDone ? (
              <div style={{ fontSize: 10, color: "#34D399", marginTop: 4 }}>
                Conversion completed.
              </div>
            ) : null}
          </div>
        ) : null}

        {showAiTools ? (
          <div className="card" style={{ marginBottom: 10 }}>
            <div
              style={{
                fontSize: 10,
                color: "#334155",
                textTransform: "uppercase",
                letterSpacing: "1px",
                marginBottom: 8,
              }}
            >
              AI Provider Swap
            </div>

            {AI_MODELS.map((model) => (
              <div
                key={model.id}
                className={`dbo ${curAI === model.id ? "sel" : ""}`}
                onClick={() => doAISwap(model.id)}
                style={{ marginBottom: 6 }}
              >
                <div
                  style={{
                    width: 10,
                    height: 10,
                    borderRadius: "50%",
                    background: model.color,
                    marginTop: 2,
                  }}
                />
                <div style={{ display: "flex", flexDirection: "column" }}>
                  <span
                    style={{
                      fontSize: 11,
                      color: curAI === model.id ? model.color : "#94A3B8",
                      fontWeight: 600,
                    }}
                  >
                    {model.label}
                  </span>
                  <span style={{ fontSize: 9, color: "#334155" }}>
                    {model.provider} | {model.acc}% accuracy
                  </span>
                </div>
              </div>
            ))}

            {swapAI ? (
              <div style={{ fontSize: 10, color: "#60A5FA", marginTop: 4 }}>
                Migrating AI integration layer...
              </div>
            ) : null}
            {aiDone ? (
              <div style={{ fontSize: 10, color: "#34D399", marginTop: 4 }}>
                Migration completed.
              </div>
            ) : null}
          </div>
        ) : null}
      </div>
    </aside>
  );
}
