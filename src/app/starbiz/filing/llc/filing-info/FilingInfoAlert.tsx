"use client";

/**
 * FilingInfoAlert — R7b-4 patch
 *
 * Reproduces the review_document_alert(true) popup that fires on page load
 * in the real Sunbiz corefile.exe page.
 *
 * The original popup is a browser-native window.alert() call, which provides
 * a single "OK" dismiss button automatically. We fire it via useEffect once,
 * on mount, to match the captured behavior (popup appears on page load).
 *
 * Popup text is verbatim from the folder-5 screenshot reference.
 * Locked decision: popup MUST be reproduced per the screenshot-wins rule.
 *
 * Mirror of src/app/starbiz/filing/profit-corp/filing-info/FilingInfoAlert.tsx
 * (commit c83ed97 — R8-4). Brings LLC into parity with Profit Corp.
 */

import { useEffect } from "react";

const ALERT_TEXT =
  "Please review the filing for accuracy. If you need to make corrections, " +
  "do so at this time. The filing information will be added/edited exactly " +
  "as you have entered it. Once you have submitted the information, your " +
  "filing cannot be updated, removed, cancelled or refunded.";

export default function FilingInfoAlert() {
  useEffect(() => {
    window.alert(ALERT_TEXT);
  }, []);

  // Renders nothing — side-effect only component.
  return null;
}
