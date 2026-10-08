"use client";

import { ReactNode } from "react";
import { TerminalHeader } from "./TerminalHeader";
import { InstrumentSidebar } from "./InstrumentSidebar";

interface TerminalShellProps {
  children: ReactNode;
  activeInstrument: string;
  onInstrumentChange: (id: string) => void;
  sidebarOpen?: boolean;
  onSidebarToggle?: () => void;
}

export function TerminalShell({
  children,
  activeInstrument,
  onInstrumentChange,
  sidebarOpen = false,
  onSidebarToggle = () => {},
}: TerminalShellProps) {
  return (
    <div className="terminal-shell">
      <TerminalHeader
        activeInstrument={activeInstrument}
        onInstrumentChange={onInstrumentChange}
        onMenuClick={onSidebarToggle}
      />
      <div className="terminal-body">
        <InstrumentSidebar
          activeInstrument={activeInstrument}
          onInstrumentChange={onInstrumentChange}
          isOpen={sidebarOpen}
          onClose={onSidebarToggle}
        />
        <main className="terminal-main">{children}</main>
      </div>
    </div>
  );
}