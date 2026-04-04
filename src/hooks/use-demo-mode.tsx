import { createContext, useContext, useState, useCallback, type ReactNode } from "react";

type DemoModeContextValue = {
  isDemoMode: boolean;
  toggleDemoMode: () => void;
  /** Pass to query args: returns true in demo mode, undefined in live mode */
  demoModeArg: boolean | undefined;
};

const DemoModeContext = createContext<DemoModeContextValue>({
  isDemoMode: false,
  toggleDemoMode: () => {},
  demoModeArg: undefined,
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

  const toggleDemoMode = useCallback(() => {
    setIsDemoMode((prev) => {
      const next = !prev;
      try {
        localStorage.setItem("hashinah_demo_mode", String(next));
      } catch {
        // ignore storage errors
      }
      return next;
    });
  }, []);

  const demoModeArg = isDemoMode ? true : undefined;

  return (
    <DemoModeContext.Provider value={{ isDemoMode, toggleDemoMode, demoModeArg }}>
      {children}
    </DemoModeContext.Provider>
  );
}

export function useDemoMode() {
  return useContext(DemoModeContext);
}
