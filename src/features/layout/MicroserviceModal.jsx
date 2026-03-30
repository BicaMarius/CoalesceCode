import React from "react";
import Icon from "../ui/Icon";

export default function MicroserviceModal({
  show,
  onClose,
  msTypes,
  msType,
  setMsType,
  msName,
  setMsName,
  onAdd,
}) {
  if (!show) return null;

  const selectedType = msTypes.find((item) => item.id === msType);

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,.75)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 200,
      }}
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div
        className="fade card"
        style={{ width: 400, border: "1px solid #2563EB" }}
      >
        <div
          style={{
            fontFamily: "'Syne',sans-serif",
            fontSize: 14,
            fontWeight: 700,
            marginBottom: 3,
          }}
        >
          Add Microservice
        </div>
        <div style={{ fontSize: 10, color: "#64748B", marginBottom: 14 }}>
          New node will be connected to API and marked as containerized.
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: 6,
            marginBottom: 12,
          }}
        >
          {msTypes.map((type) => (
            <div
              key={type.id}
              className={`mso ${msType === type.id ? "sel" : ""}`}
              onClick={() => setMsType(type.id)}
            >
              <Icon
                name={type.icon}
                size={14}
                color={type.color}
                strokeWidth={2}
              />
              <span
                style={{
                  fontSize: 10,
                  color: msType === type.id ? type.color : "#94A3B8",
                  fontWeight: 600,
                }}
              >
                {type.label}
              </span>
            </div>
          ))}
        </div>

        <input
          value={msName}
          onChange={(event) => setMsName(event.target.value)}
          placeholder="example: notification-service"
          style={{
            width: "100%",
            background: "#07090F",
            border: "1px solid #1A2740",
            borderRadius: 7,
            padding: "8px 10px",
            color: "#E2E8F0",
            fontFamily: "inherit",
            fontSize: 11,
            marginBottom: 10,
            outline: "none",
          }}
        />

        {selectedType && (
          <div className="codediff" style={{ marginBottom: 10 }}>
            <span style={{ color: "#60A5FA" }}>TYPE</span>{" "}
            <span style={{ color: selectedType.color }}>
              {selectedType.label}
            </span>
            <br />
            <span style={{ color: "#60A5FA" }}>ROUTE</span>{" "}
            <span style={{ color: "#E2E8F0" }}>/api/{msName || "service"}</span>
          </div>
        )}

        <div style={{ display: "flex", gap: 7 }}>
          <button
            className="bp"
            style={{ flex: 1, padding: "8px", fontSize: 11 }}
            onClick={onAdd}
          >
            Add to Architecture
          </button>
          <button
            className="bg"
            style={{ padding: "8px 12px", fontSize: 11 }}
            onClick={onClose}
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
