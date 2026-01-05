'use client';

import { type ReactNode, createContext, useContext, useState } from 'react';

interface ToolContextType {
  setTools: (tools: ReactNode) => void;
  tools: ReactNode;
}

const ToolContext = createContext<ToolContextType | undefined>(undefined);

export function ToolProvider({ children }: { children: ReactNode }) {
  const [tools, setTools] = useState<ReactNode>(null);

  return <ToolContext.Provider value={{ tools, setTools }}>{children}</ToolContext.Provider>;
}

export function useToolContext() {
  const context = useContext(ToolContext);
  if (context === undefined) {
    throw new Error('useToolContext must be used within a ToolProvider');
  }
  return context;
}
