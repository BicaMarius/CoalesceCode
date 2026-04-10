import React from "react";
import Icon from "../../features/ui/Icon";

export default function TabsNav({ tabs, tab, setTab, isReal, debugCount }) {
  return (
    <div
      style={{
        borderBottom: "1px solid #111D2E",
        marginBottom: 16,
        display: "flex",
        gap: 1,
        overflowX: "auto",
      }}
    >
      {tabs.map(([id, label, iconName]) => (
        <button
          key={id}
          className={`tab ${tab === id ? "on" : ""}`}
          onClick={() => setTab(id)}
        >
          <Icon
            name={iconName}
            size={13}
            color={tab === id ? "#60A5FA" : "#334155"}
            strokeWidth={2}
          />
          {label}
          {id === "debug" && isReal ? (
            <span style={{ marginLeft: 4, fontSize: 9, color: "#34D399" }}>
              {debugCount}
            </span>
          ) : null}
        </button>
      ))}
    </div>
  );
}
