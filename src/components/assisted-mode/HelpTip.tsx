"use client";

import { useEffect, useRef, useState } from "react";

import { useAssistedMode } from "./AssistedModeContext";

const SNARK = (label?: string) =>
  label
    ? `${label} is set for off\u2026 You\u2019re On Your Own!!!`
    : `That feature is set for off\u2026 You\u2019re On Your Own!!!`;

/**
 * (?) help icon. Behaviour depends on Assisted Mode context:
 *
 * isOn = true  → hover/focus shows a tooltip with helpText.
 * isOn = false → hover does nothing; click shows the snark banner.
 *
 * Tooltip: square corners, thin border, 1px border — Sunbiz era.
 * Banner:  yellow/black warning-tape (#FFFF99 bg, #800000 text).
 *          Auto-dismisses after 4 seconds or on click.
 */
export function HelpTip({ helpText, label }: { helpText: string; label?: string }) {
  const { isOn } = useAssistedMode();
  const [showTip,    setShowTip]    = useState(false);
  const [showBanner, setShowBanner] = useState(false);
  const [flipLeft,   setFlipLeft]   = useState(false);
  const containerRef  = useRef<HTMLSpanElement>(null);
  const bannerTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  // Stable id generated once per mount via lazy useState initializer
  const [tipId] = useState(() => `helptip-${Math.random().toString(36).slice(2, 8)}`);

  // Auto-dismiss snark banner after 4 s
  useEffect(() => {
    if (!showBanner) return;
    bannerTimeout.current = setTimeout(() => setShowBanner(false), 4000);
    return () => { if (bannerTimeout.current) clearTimeout(bannerTimeout.current); };
  }, [showBanner]);

  function openTip() {
    if (!isOn) return;
    // Flip left if tooltip would overflow viewport right edge
    if (containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      setFlipLeft(rect.right + 290 > window.innerWidth);
    }
    setShowTip(true);
  }

  function closeTip() { setShowTip(false); }

  function handleClick() {
    if (!isOn) setShowBanner(true);
  }

  const tooltipPos: React.CSSProperties = flipLeft
    ? { right: "100%", marginRight: "4px" }
    : { left: "100%",  marginLeft:  "4px" };

  return (
    <span
      ref={containerRef}
      style={{ position: "relative", display: "inline-block", marginLeft: "3px", verticalAlign: "middle" }}
    >
      {/* (?) button */}
      <button
        type="button"
        aria-label="Help"
        aria-describedby={showTip ? tipId : undefined}
        onClick={handleClick}
        onMouseEnter={openTip}
        onMouseLeave={closeTip}
        onFocus={openTip}
        onBlur={closeTip}
        style={{
          backgroundColor: isOn ? "#CCCCCC" : "#BBBBBB",
          border: "1px solid #666",
          borderRadius: 0,
          color: "#333",
          cursor: isOn ? "help" : "default",
          fontFamily: "Arial, Helvetica, sans-serif",
          fontSize: "10px",
          fontWeight: "bold",
          lineHeight: "1",
          padding: "1px 4px",
          userSelect: "none",
          opacity: isOn ? 1 : 0.6,
        }}
      >
        ?
      </button>

      {/* Tooltip — shown when ON + hovered/focused */}
      {isOn && showTip && (
        <span
          id={tipId}
          role="tooltip"
          style={{
            position: "absolute",
            top: "0",
            ...tooltipPos,
            zIndex: 200,
            backgroundColor: "#FFFFF0",
            border: "1px solid #000000",
            borderRadius: 0,
            padding: "5px 7px",
            fontSize: "11px",
            fontFamily: "Arial, Helvetica, sans-serif",
            color: "#000000",
            lineHeight: "1.4",
            width: "280px",
            whiteSpace: "normal",
            pointerEvents: "none",
          }}
        >
          {helpText}
        </span>
      )}

      {/* Snark banner — shown when OFF + clicked */}
      {!isOn && showBanner && (
        <span
          role="alert"
          onClick={() => setShowBanner(false)}
          title="Click to dismiss"
          style={{
            position: "absolute",
            top: "100%",
            left: "0",
            zIndex: 200,
            backgroundColor: "#FFFF99",
            border: "1px solid #000000",
            borderRadius: 0,
            padding: "4px 8px",
            fontSize: "11px",
            fontFamily: "Arial, Helvetica, sans-serif",
            color: "#800000",
            fontWeight: "bold",
            whiteSpace: "nowrap",
            cursor: "pointer",
            marginTop: "2px",
          }}
        >
          {SNARK(label)}
        </span>
      )}
    </span>
  );
}
