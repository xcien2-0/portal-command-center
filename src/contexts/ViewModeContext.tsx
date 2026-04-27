import React, { createContext, useContext, useState, useEffect } from 'react';

export type ViewMode = 'classic' | 'holo';

interface ViewModeContextType {
  mode: ViewMode;
  setMode: (mode: ViewMode) => void;
  toggleMode: () => void;
}

const ViewModeContext = createContext<ViewModeContextType | undefined>(undefined);

export function ViewModeProvider({ children }: { children: React.ReactNode }) {
  const [mode, setModeState] = useState<ViewMode>(() => {
    try {
      return (localStorage.getItem('xcien_view_mode') as ViewMode) || 'classic';
    } catch {
      return 'classic';
    }
  });

  const setMode = (newMode: ViewMode) => {
    setModeState(newMode);
    try {
      localStorage.setItem('xcien_view_mode', newMode);
    } catch (e) {
      console.error(e);
    }
  };

  const toggleMode = () => {
    setMode(mode === 'classic' ? 'holo' : 'classic');
  };

  // Optional: add a class to body for global styling if needed
  useEffect(() => {
    if (mode === 'holo') {
      document.body.classList.add('holo-mode');
    } else {
      document.body.classList.remove('holo-mode');
    }
  }, [mode]);

  return (
    <ViewModeContext.Provider value={{ mode, setMode, toggleMode }}>
      {children}
    </ViewModeContext.Provider>
  );
}

export function useViewMode() {
  const context = useContext(ViewModeContext);
  if (!context) {
    throw new Error('useViewMode must be used within a ViewModeProvider');
  }
  return context;
}
