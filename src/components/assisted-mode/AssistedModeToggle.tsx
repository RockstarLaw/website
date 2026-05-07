"use client";

import { useAssistedMode } from "./AssistedModeContext";

/**
 * Pill-shaped toggle for Assisted Mode.
 * ON  → green  (#2E7D32), white text
 * OFF → gray   (#666666), white text
 * Small — designed to sit in a header slot, not dominate the page.
 */
export function AssistedModeToggle() {
  const { isOn, toggle } = useAssistedMode();

  return (
    <button
      type="button"
      role="switch"
      aria-checked={isOn}
      onClick={toggle}
      style={{
        backgroundColor: isOn ? "#2E7D32" : "#666666",
        color: "#ffffff",
        border: "1px solid rgba(0,0,0,0.4)",
        borderRadius: "20px",   // pill — override on Sunbiz square rule for toggle UI
        padding: "2px 10px",
        fontFamily: "Arial, Helvetica, sans-serif",
        fontSize: "11px",
        fontWeight: "bold",
        cursor: "pointer",
        userSelect: "none",
        whiteSpace: "nowrap",
        outline: "none",
      }}
      onFocus={(e) => (e.currentTarget.style.outline = "2px solid #FFFF00")}
      onBlur={(e)  => (e.currentTarget.style.outline = "none")}
    >
      {isOn ? "Assisted Mode: ON" : "Assisted Mode: OFF"}
    </button>
  );
}
