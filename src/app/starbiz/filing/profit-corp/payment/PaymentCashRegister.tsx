"use client";

/**
 * PaymentCashRegister — Cash register easter egg for the Profit Corp 1:1
 * payment clone. R8-5.
 *
 * Verbatim mirror of LLC PaymentCashRegister.tsx (R7b-5).
 *
 * Renders null (no visible DOM). On mount, attaches click interceptors to
 * BOTH submit buttons in #MainContentEfiling. On click:
 *   1. Prevents immediate form submission.
 *   2. Plays the cash-register sound:
 *      • Tries /sounds/cash-register.mp3 first.
 *      • Falls back to Web Audio synthesis (identical tones to CashRegisterButton).
 *   3. After 250ms delay, submits the parent form.
 *
 * Compatible with dangerouslySetInnerHTML — attaches listeners after
 * hydration without modifying the visible DOM.
 */

import { useEffect } from "react";

export function PaymentCashRegister() {
  useEffect(() => {
    const container = document.getElementById("MainContentEfiling");
    if (!container) return;

    const btns = container.querySelectorAll<HTMLInputElement>(
      'input[type="submit"]',
    );

    const handlers: Array<{ btn: HTMLInputElement; handler: (e: Event) => void }> = [];

    btns.forEach((btn) => {
      const handler = async (e: Event) => {
        e.preventDefault();
        const form = btn.form;
        await playKaChing(250);
        if (form) {
          try {
            form.submit();
          } catch {
            // form.submit() blocked (e.g., browser policy) — silent fail
          }
        }
      };

      btn.addEventListener("click", handler);
      handlers.push({ btn, handler });
    });

    return () => {
      handlers.forEach(({ btn, handler }) =>
        btn.removeEventListener("click", handler),
      );
    };
  }, []);

  return null;
}

// ─── Sound ────────────────────────────────────────────────────────────────────

/**
 * Plays the cash-register sound then resolves after `waitMs`.
 * Tries /sounds/cash-register.mp3 first; falls back to synthesis.
 * Never rejects.
 */
async function playKaChing(waitMs = 600): Promise<void> {
  return new Promise<void>((resolve) => {
    try {
      const audio = new Audio("/sounds/cash-register.mp3");
      audio
        .play()
        .then(() => setTimeout(resolve, waitMs))
        .catch(() => {
          synthesize();
          setTimeout(resolve, waitMs);
        });
    } catch {
      synthesize();
      setTimeout(resolve, waitMs);
    }
  });
}

/**
 * Web Audio API ka-ching synthesis.
 * Mirrors CashRegisterButton.tsx exactly:
 *   • 1200 Hz click transient
 *   • 880 Hz main ring (A5)
 *   • 1318 Hz upper harmonic (E6)
 *   • 440 Hz soft sub-ring (A4)
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
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "triangle";
      osc.frequency.value = freq;
      const t0 = ctx.currentTime + startOffset;
      gain.gain.setValueAtTime(peakGain, t0);
      gain.gain.exponentialRampToValueAtTime(0.001, t0 + duration);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(t0);
      osc.stop(t0 + duration + 0.01);
    }

    tone(1200, 0,    0.06, 0.45);
    tone(880,  0.04, 0.30, 0.35);
    tone(1318, 0.04, 0.22, 0.20);
    tone(440,  0.06, 0.28, 0.12);
  } catch {
    // AudioContext unavailable — silent fail
  }
}
