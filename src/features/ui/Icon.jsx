import React from "react";

const ICONS = {
  brand: () => (
    <>
      <path d="M12 3l7 4v10l-7 4-7-4V7z" />
      <path d="M8.5 9.5h7v5h-7z" />
      <circle cx="12" cy="12" r="1.4" fill="currentColor" stroke="none" />
    </>
  ),
  dashboard: () => (
    <>
      <path d="M3 11.5L12 4l9 7.5" />
      <path d="M6.5 10.5V20h11V10.5" />
      <path d="M10.25 20v-5h3.5v5" />
    </>
  ),
  newAnalysis: () => (
    <>
      <path d="M12 5v14" />
      <path d="M5 12h14" />
      <circle cx="12" cy="12" r="9" />
    </>
  ),
  sync: () => (
    <>
      <path d="M20 7v5h-5" />
      <path d="M4 17v-5h5" />
      <path d="M7.5 8a7 7 0 0 1 11 2" />
      <path d="M16.5 16a7 7 0 0 1-11-2" />
    </>
  ),
  repo: () => (
    <>
      <path d="M5 5.5A2.5 2.5 0 0 1 7.5 3h11v16H7.5A2.5 2.5 0 0 0 5 21z" />
      <path d="M7.5 3v16" />
      <path d="M10 7.5h6" />
      <path d="M10 11h6" />
    </>
  ),
  analyze: () => (
    <>
      <path d="M14 3l-6 9h4l-2 9 8-11h-4l0-7z" />
    </>
  ),
  zip: () => (
    <>
      <path d="M6 4h9l3 3v13H6z" />
      <path d="M15 4v3h3" />
      <path d="M11 8.5h2" />
      <path d="M11 11h2" />
      <path d="M11 13.5h2" />
      <path d="M11 16h2" />
    </>
  ),
  speed: () => (
    <>
      <path d="M12 3l-4 8h4l-2 10 8-11h-4l2-7z" />
    </>
  ),
  shield: () => (
    <>
      <path d="M12 3l7 3v6c0 4.5-2.8 7.4-7 9-4.2-1.6-7-4.5-7-9V6z" />
      <path d="M9 12l2 2 4-4" />
    </>
  ),
  layers: () => (
    <>
      <path d="M12 4l8 4-8 4-8-4z" />
      <path d="M4 12l8 4 8-4" />
      <path d="M4 16l8 4 8-4" />
    </>
  ),
  architecture: () => (
    <>
      <rect x="3" y="4" width="7" height="5" rx="1" />
      <rect x="14" y="4" width="7" height="5" rx="1" />
      <rect x="8.5" y="15" width="7" height="5" rx="1" />
      <path d="M10 6.5h4" />
      <path d="M12 9v6" />
    </>
  ),
  narrative: () => (
    <>
      <path d="M6 3h9l3 3v15H6z" />
      <path d="M15 3v3h3" />
      <path d="M9 10h6" />
      <path d="M9 13h6" />
      <path d="M9 16h4" />
    </>
  ),
  entryPoints: () => (
    <>
      <path d="M10 4H5v16h5" />
      <path d="M14 8l5 4-5 4" />
      <path d="M8 12h11" />
    </>
  ),
  techStack: () => (
    <>
      <rect x="5" y="5" width="14" height="14" rx="2" />
      <path d="M9 1v4" />
      <path d="M15 1v4" />
      <path d="M9 19v4" />
      <path d="M15 19v4" />
      <path d="M1 9h4" />
      <path d="M1 15h4" />
      <path d="M19 9h4" />
      <path d="M19 15h4" />
    </>
  ),
  dependencies: () => (
    <>
      <path d="M10.5 7.5l3-3a3 3 0 1 1 4.2 4.2l-3 3" />
      <path d="M13.5 16.5l-3 3a3 3 0 1 1-4.2-4.2l3-3" />
      <path d="M9 15l6-6" />
    </>
  ),
  tests: () => (
    <>
      <path d="M6 4h12" />
      <path d="M10 4v4l-4 7a2 2 0 0 0 1.8 3h8.4a2 2 0 0 0 1.8-3l-4-7V4" />
      <path d="M10 14l2 2 3-3" />
    </>
  ),
  userFlow: () => (
    <>
      <circle cx="5" cy="8" r="2" />
      <circle cx="19" cy="8" r="2" />
      <circle cx="12" cy="18" r="2" />
      <path d="M7 8h10" />
      <path d="M6.5 9.5l4.2 6" />
      <path d="M17.5 9.5l-4.2 6" />
    </>
  ),
  codeHealth: () => (
    <>
      <path d="M3 13h4l2-4 3 8 2-4h7" />
      <path d="M4 6h16" />
    </>
  ),
  debug: () => (
    <>
      <path d="M9 4h6" />
      <path d="M8 8h8a4 4 0 0 1 4 4v5H4v-5a4 4 0 0 1 4-4z" />
      <path d="M8 17l-1.2 3" />
      <path d="M16 17l1.2 3" />
      <path d="M4 11H2" />
      <path d="M22 11h-2" />
      <circle cx="10" cy="12" r="0.9" fill="currentColor" stroke="none" />
      <circle cx="14" cy="12" r="0.9" fill="currentColor" stroke="none" />
    </>
  ),
  postgresql: () => (
    <>
      <ellipse cx="12" cy="6" rx="6.5" ry="2.5" />
      <path d="M5.5 6v7c0 1.4 2.9 2.5 6.5 2.5s6.5-1.1 6.5-2.5V6" />
      <path d="M5.5 10c0 1.4 2.9 2.5 6.5 2.5s6.5-1.1 6.5-2.5" />
    </>
  ),
  mongodb: () => (
    <>
      <path d="M12 3c2 3.3 2 6 2 8.3 0 3-1.1 5.8-2 8.7-0.9-2.9-2-5.7-2-8.7C10 9 10 6.3 12 3z" />
      <path d="M12 7v11" />
    </>
  ),
  mysql: () => (
    <>
      <ellipse cx="12" cy="6" rx="6.5" ry="2.5" />
      <path d="M5.5 6v9c0 1.4 2.9 2.5 6.5 2.5s6.5-1.1 6.5-2.5V6" />
      <path d="M9 12l2 2 4-4" />
    </>
  ),
  sqlite: () => (
    <>
      <rect x="5.5" y="4" width="13" height="16" rx="2" />
      <path d="M8.5 8h7" />
      <path d="M8.5 12h7" />
      <path d="M8.5 16h4.5" />
    </>
  ),
  redis: () => (
    <>
      <path d="M12 4l7.5 3.7L12 11.4 4.5 7.7z" />
      <path d="M4.5 11.5L12 15.2l7.5-3.7" />
      <path d="M4.5 15.3L12 19l7.5-3.7" />
    </>
  ),
  api: () => (
    <>
      <path d="M7 8l-4 4 4 4" />
      <path d="M17 8l4 4-4 4" />
      <path d="M14 5l-4 14" />
    </>
  ),
  worker: () => (
    <>
      <circle cx="12" cy="12" r="3" />
      <path d="M12 4v2" />
      <path d="M12 18v2" />
      <path d="M4 12h2" />
      <path d="M18 12h2" />
      <path d="M6.3 6.3l1.4 1.4" />
      <path d="M16.3 16.3l1.4 1.4" />
      <path d="M17.7 6.3l-1.4 1.4" />
      <path d="M7.7 16.3l-1.4 1.4" />
    </>
  ),
  scheduler: () => (
    <>
      <circle cx="12" cy="12" r="8" />
      <path d="M12 7v5l3 2" />
    </>
  ),
  gateway: () => (
    <>
      <path d="M12 3l7 3v6c0 4.5-2.8 7.4-7 9-4.2-1.6-7-4.5-7-9V6z" />
      <path d="M9 12h6" />
      <path d="M13 9l3 3-3 3" />
    </>
  ),
  notif: () => (
    <>
      <path d="M8 9a4 4 0 1 1 8 0v4l1.5 2h-11L8 13z" />
      <path d="M10.5 18a1.5 1.5 0 0 0 3 0" />
    </>
  ),
  fullscreen: () => (
    <>
      <path d="M9 3H3v6" />
      <path d="M15 3h6v6" />
      <path d="M21 15v6h-6" />
      <path d="M9 21H3v-6" />
    </>
  ),
  fullscreenExit: () => (
    <>
      <path d="M10 3H3v7" />
      <path d="M14 3h7v7" />
      <path d="M21 14v7h-7" />
      <path d="M10 21H3v-7" />
      <path d="M9 9l-6-6" />
      <path d="M15 9l6-6" />
      <path d="M9 15l-6 6" />
      <path d="M15 15l6 6" />
    </>
  ),
  fallback: () => <circle cx="12" cy="12" r="8" />,
};

export default function Icon({
  name,
  size = 14,
  color = "currentColor",
  strokeWidth = 1.8,
  style,
}) {
  const renderIcon = ICONS[name] || ICONS.fallback;

  return (
    <svg
      aria-hidden="true"
      focusable="false"
      viewBox="0 0 24 24"
      width={size}
      height={size}
      fill="none"
      stroke={color}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      style={{ display: "inline-block", flexShrink: 0, ...style }}
    >
      {renderIcon()}
    </svg>
  );
}
