"use client";

import { createContext, useContext, useState } from "react";
import type { ReactNode } from "react";

type AssistedModeContextType = {
  isOn: boolean;
  toggle: () => void;
  setOn: (b: boolean) => void;
};

const AssistedModeContext = createContext<AssistedModeContextType>({
  isOn: true,
  toggle: () => {},
  setOn: () => {},
});

/**
 * Wraps a StarBiz route group (or any form-bearing route group)
 * with Assisted Mode state. Default isOn = true.
 *
 * State is component-only — NO localStorage, NO DB, NO cookies.
 * Resets on full page reload. That is the v1 behavior.
 */
export function AssistedModeProvider({ children }: { children: ReactNode }) {
  const [isOn, setIsOn] = useState(true);

  return (
    <AssistedModeContext.Provider
      value={{
        isOn,
        toggle: () => setIsOn((v) => !v),
        setOn: (b) => setIsOn(b),
      }}
    >
      {children}
    </AssistedModeContext.Provider>
  );
}

export function useAssistedMode(): AssistedModeContextType {
  return useContext(AssistedModeContext);
}
