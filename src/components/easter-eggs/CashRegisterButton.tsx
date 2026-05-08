"use client";

/**
 * CashRegisterButton — Easter egg component (reusable across all payment steps).
 *
 * On click:
 *   1. Attempts to play /sounds/cash-register.mp3 via <audio> tag.
 *      If the file is missing or autoplay is blocked, falls back to
 *      Web Audio API synthesis: two tones that approximate a "ka-ching".
 *   2. Waits ~600 ms for the sound to play through.
 *   3. Calls onConfirm() — the parent decides what happens next
 *      (navigate, submit, etc.).
 *
 * Browser mute is respected automatically — no UI toggle needed.
 * Audio errors are swallowed silently; onConfirm() is always called.
 *
 * Usage:
 *   <CashRegisterButton onConfirm={() => router.push(nextUrl)} style={...}>
 *     Credit Card Payment
 *   </CashRegisterButton>
 *
 * To enable the audio: drop cash-register.mp3 into /public/sounds/.
 */

import { useState } from "react";

interface CashRegisterButtonProps {
  /** Called after the sound plays (~600 ms after click). */
  onConfirm: () => void;
  children: React.ReactNode;
  disabled?: boolean;
  style?: React.CSSProperties;
  className?: string;
}

export function CashRegisterButton({
  onConfirm,
  children,
  disabled = false,
  style,
  className,
}: CashRegisterButtonProps) {
  const [fired, setFired] = useState(false);

  async function handleClick() {
    if (fired || disabled) return;
    setFired(true);

    await playKaChing();
    onConfirm();

    // Re-enable after navigation (in case the page stays mounted, e.g. 404 target)
    setTimeout(() => setFired(false), 1500);
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={disabled || fired}
      style={style}
      className={className}
    >
      {fired ? "…" : children}
    </button>
  );
}

// ─── Sound synthesis ──────────────────────────────────────────────────────────

/**
 * Attempts real audio, falls back to Web Audio synthesis.
 * Always resolves after ~600 ms — never rejects.
 */
async function playKaChing(): Promise<void> {
  return new Promise<void>((resolve) => {
    const WAIT_MS = 600;

    // ── Try the real audio file ───────────────────────────────────────────────
    try {
      const audio = new Audio("/sounds/cash-register.mp3");
      audio
        .play()
        .then(() => {
          // File loaded and playing — wait for it to finish (or 600 ms, whichever)
          setTimeout(resolve, WAIT_MS);
        })
        .catch(() => {
          // Playback blocked or file missing → synthesise
          synthesize();
          setTimeout(resolve, WAIT_MS);
        });
    } catch {
      // Audio() constructor not available (unlikely in a browser, but be safe)
      synthesize();
      setTimeout(resolve, WAIT_MS);
    }
  });
}

/**
 * Web Audio API "ka-ching" fallback.
 * Three overlapping tones shaped to approximate a cash-register bell:
 *   • A brief high transient click (1 200 Hz)
 *   • A sustain ring at A5 (880 Hz)
 *   • A harmonic shimmer at E6 (1 318 Hz)
 * All wrapped in exponential decay so they die out naturally.
 * Errors are swallowed — silence is always better than a crash.
 */
function synthesize() {
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const Ctx = window.AudioContext ?? (window as any).webkitAudioContext;
    if (!Ctx) return;

    const ctx = new Ctx() as AudioContext;

    function tone(
      freq: number,
      startOffset: number,
      duration: number,
      peakGain: number,
    ) {
      const osc  = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type            = "triangle"; // softer than square
      osc.frequency.value = freq;

      const t0 = ctx.currentTime + startOffset;
      gain.gain.setValueAtTime(peakGain, t0);
      gain.gain.exponentialRampToValueAtTime(0.001, t0 + duration);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(t0);
      osc.stop(t0 + duration + 0.01);
    }

    // Click transient
    tone(1200, 0,    0.06, 0.45);
    // Main ring (A5)
    tone(880,  0.04, 0.30, 0.35);
    // Upper harmonic (E6)
    tone(1318, 0.04, 0.22, 0.20);
    // Soft sub-ring (A4 — gives body)
    tone(440,  0.06, 0.28, 0.12);
  } catch {
    // AudioContext unavailable or suspended — silent fail
  }
}
