import type { ReactNode } from "react";

import { AssistedModeWrapper } from "@/components/assisted-mode/AssistedModeWrapper";

export default function StarBizLayout({ children }: { children: ReactNode }) {
  // Wraps all /starbiz/* routes in the Assisted Mode context.
  // State resets on full page reload (v1 behavior — no persistence).
  return <AssistedModeWrapper>{children}</AssistedModeWrapper>;
}
