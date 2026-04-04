import { createContext, useContext, useState, useCallback, type ReactNode } from "react";
import { useAuth } from "@/hooks/use-auth.ts";

type DemoModeContextValue = {
  isDemoMode: boolean;
  enterDemoMode: () => void;
  exitDemoMode: () => void;
};

const DemoModeContext = createContext<DemoModeContextValue>({
  isDemoMode: false,
  enterDemoMode: () => {},
  exitDemoMode: () => {},
});

function getStoredDemoMode(): boolean {
  try {
    return localStorage.getItem("hashinah_demo_mode") === "true";
  } catch {
    return false;
  }
}

export function DemoModeProvider({ children }: { children: ReactNode }) {
  const [isDemoMode, setIsDemoMode] = useState(getStoredDemoMode);

  const enterDemoMode = useCallback(() => {
    setIsDemoMode(true);
    try {
      localStorage.setItem("hashinah_demo_mode", "true");
    } catch {
      // ignore
    }
  }, []);

  const exitDemoMode = useCallback(() => {
    setIsDemoMode(false);
    try {
      localStorage.setItem("hashinah_demo_mode", "false");
    } catch {
      // ignore
    }
  }, []);

  return (
    <DemoModeContext.Provider value={{ isDemoMode, enterDemoMode, exitDemoMode }}>
      {children}
    </DemoModeContext.Provider>
  );
}

/**
 * Hook to access demo mode state.
 *
 * Key behaviour:
 * - Authenticated users → always live data. `demoModeArg` is always `undefined`.
 * - Unauthenticated users with demo mode on → `demoModeArg` is `true`.
 * - `isDemoGuest` is true only when unauthenticated AND demo mode is active.
 */
export function useDemoMode() {
  const ctx = useContext(DemoModeContext);
  const { user, isLoading } = useAuth();
  const isAuthenticated = !!user;

  // Authenticated users: never in demo mode, always live data
  const isDemoGuest = ctx.isDemoMode && !isAuthenticated && !isLoading;
  const demoModeArg: boolean | undefined = isDemoGuest ? true : undefined;

  return {
    /** Whether the raw demo toggle is active (UI state) */
    isDemoMode: ctx.isDemoMode,
    /** Whether the current viewer is an unauthenticated demo guest */
    isDemoGuest,
    /** Pass to backend query args — true for guests, undefined for authenticated users */
    demoModeArg,
    enterDemoMode: ctx.enterDemoMode,
    exitDemoMode: ctx.exitDemoMode,
  };
}
