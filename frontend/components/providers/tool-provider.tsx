'use client';

import { type ReactNode, createContext, useContext, useMemo, useState } from 'react';

interface ToolContextType {
  setTools: (tools: ReactNode) => void;
  tools: ReactNode;
}

const ToolContext = createContext<ToolContextType | undefined>(undefined);

export function ToolProvider({ children }: { children: ReactNode }) {
  const [tools, setTools] = useState<ReactNode>(null);

  const value = useMemo(() => ({ tools, setTools }), [tools]);

  return <ToolContext.Provider value={value}>{children}</ToolContext.Provider>;
}

export function useToolContext() {
  const context = useContext(ToolContext);
  if (context === undefined) {
    throw new Error('useToolContext must be used within a ToolProvider');
  }
  return context;
}
