/**
 * Server-safe wrapper that mounts AssistedModeProvider.
 * Import this in layout files for any route group that wants Assisted Mode.
 * The Provider itself is a client component; this wrapper is not.
 */
import type { ReactNode } from "react";

import { AssistedModeProvider } from "./AssistedModeContext";

export function AssistedModeWrapper({ children }: { children: ReactNode }) {
  return <AssistedModeProvider>{children}</AssistedModeProvider>;
}
