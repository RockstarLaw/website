"use client";

import { useEffect, useRef, useState } from "react";

const EYE_R = 36; // eye circle radius

function Eye({
  cx,
  cy,
  strokeColor,
  clipId,
  isBlinking,
  onHover,
}: {
  cx: number;
  cy: number;
  strokeColor: string;
  clipId: string;
  isBlinking: boolean;
  onHover: () => void;
}) {
  return (
    <g onMouseEnter={onHover} style={{ cursor: "default" }}>
      <defs>
        <clipPath id={clipId}>
          <circle cx={cx} cy={cy} r={EYE_R} />
        </clipPath>
      </defs>
      {/* Sclera */}
      <circle cx={cx} cy={cy} r={EYE_R} fill="white" stroke={strokeColor} strokeWidth={3.5} />
      {/* Iris + pupil */}
      <circle cx={cx} cy={cy + 3} r={16} fill="#1a1a1a" />
      {/* Highlight */}
      <circle cx={cx + 8} cy={cy - 6} r={5} fill="white" />
      {/* Eyelid — covers eye from top when blinking */}
      <rect
        x={cx - EYE_R}
        y={cy - EYE_R}
        width={EYE_R * 2}
        height={EYE_R * 2}
        fill="#E8D5B0"
        clipPath={`url(#${clipId})`}
        style={{
          transformOrigin: `${cx}px ${cy - EYE_R}px`,
          transform: isBlinking ? "scaleY(1)" : "scaleY(0)",
          transition: "transform 0.12s ease-in, transform 0.14s ease-out",
        }}
      />
    </g>
  );
}

export function OogleLogo() {
  const [leftBlink, setLeftBlink] = useState(false);
  const [rightBlink, setRightBlink] = useState(false);
  const blinkingRef = useRef(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  function blink(which: "left" | "right" | "both") {
    if (blinkingRef.current) return;
    blinkingRef.current = true;
    if (which !== "right") setLeftBlink(true);
    if (which !== "left") setRightBlink(true);
    setTimeout(() => {
      setLeftBlink(false);
      setRightBlink(false);
      blinkingRef.current = false;
    }, 350);
  }

  function scheduleIdle() {
    const delay = 8000 + Math.random() * 7000; // 8–15 s
    timerRef.current = setTimeout(() => {
      blink("both");
      scheduleIdle();
    }, delay);
  }

  useEffect(() => {
    scheduleIdle();
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // SVG canvas: two eyes + "gle" text
  // Left O: cx=46  Right O: cx=128  "gle" starts at x=174
  const cy = 50;

  return (
    <div aria-label="OOgle" role="img">
      <svg
        width="310"
        height="100"
        viewBox="0 0 310 100"
        style={{ overflow: "visible" }}
      >
        {/* Left O — blue eye */}
        <Eye
          cx={46}
          cy={cy}
          strokeColor="#4285F4"
          clipId="oogle-left-clip"
          isBlinking={leftBlink}
          onHover={() => blink("left")}
        />

        {/* Right O — red eye */}
        <Eye
          cx={128}
          cy={cy}
          strokeColor="#EA4335"
          clipId="oogle-right-clip"
          isBlinking={rightBlink}
          onHover={() => blink("right")}
        />

        {/* "gle" — matching Google's multi-color style */}
        <text
          x={174}
          y={74}
          fontFamily="'Arial', 'Helvetica Neue', sans-serif"
          fontSize={72}
          fontWeight="400"
          letterSpacing={-1}
        >
          <tspan fill="#4285F4">g</tspan>
          <tspan fill="#34A853">l</tspan>
          <tspan fill="#FBBC05">e</tspan>
        </text>
      </svg>
    </div>
  );
}
