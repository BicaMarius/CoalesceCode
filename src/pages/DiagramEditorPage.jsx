import React from "react";
import DiagramCanvas from "./diagram-editor/DiagramCanvas";
import DiagramInspector from "./diagram-editor/DiagramInspector";

export default function DiagramEditorPage({
  CSS,
  Nav,
  MSModal,
  nodes,
  edges,
  selNode,
  setSelNode,
  setShowMS,
  converting,
  convDone,
  swapAI,
  aiDone,
  curDb,
  doDbSwap,
  curAI,
  doAISwap,
  nodeDetails,
}) {
  return (
    <div
      style={{
        fontFamily: "'JetBrains Mono',monospace",
        background: "#07090F",
        height: "100vh",
        color: "#E2E8F0",
        display: "flex",
        flexDirection: "column",
      }}
    >
      <style>{CSS}</style>
      <Nav />
      <MSModal />

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "minmax(0,1fr) 320px",
          flex: 1,
          overflow: "hidden",
          minHeight: 0,
        }}
      >
        <DiagramCanvas
          nodes={nodes}
          edges={edges}
          selNode={selNode}
          setSelNode={setSelNode}
          setShowMS={setShowMS}
          converting={converting}
          convDone={convDone}
          swapAI={swapAI}
          aiDone={aiDone}
        />

        <DiagramInspector
          selNode={selNode}
          nodes={nodes}
          curDb={curDb}
          doDbSwap={doDbSwap}
          converting={converting}
          convDone={convDone}
          curAI={curAI}
          doAISwap={doAISwap}
          swapAI={swapAI}
          aiDone={aiDone}
          nodeDetails={nodeDetails}
        />
      </div>
    </div>
  );
}
