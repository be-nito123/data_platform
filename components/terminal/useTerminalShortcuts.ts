"use client";

import { useEffect } from "react";
import { CATEGORIES, type CategoryId } from "@/lib/instruments";

export const INSTRUMENT_ORDER: string[] = (Object.keys(CATEGORIES) as Array<CategoryId>)
  .sort((a, b) => CATEGORIES[a].order - CATEGORIES[b].order)
  .flatMap((catId) => CATEGORIES[catId].instruments);

interface UseTerminalShortcutsOptions {
  activeInstrument: string;
  onInstrumentChange: (id: string) => void;
  metricKeys: string[];
  onMetricChange: (key: string) => void;
  sidebarOpen: boolean;
  onSidebarToggle: () => void;
  onRefresh: () => void;
  helpOpen: boolean;
  onHelpToggle: () => void;
}

function isTypingTarget(e: KeyboardEvent) {
  const t = e.target as HTMLElement | null;
  const tag = t?.tagName;
  return tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT" || t?.isContentEditable === true;
}

export function useTerminalShortcuts({
  activeInstrument,
  onInstrumentChange,
  metricKeys,
  onMetricChange,
  sidebarOpen,
  onSidebarToggle,
  onRefresh,
  helpOpen,
  onHelpToggle,
}: UseTerminalShortcutsOptions) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey || e.altKey) return;

      // ? toggles help even while typing (it's Shift+/).
      if (e.key === "?") {
        e.preventDefault();
        onHelpToggle();
        return;
      }

      if (helpOpen) {
        if (e.key === "Escape") onHelpToggle();
        return;
      }

      if (isTypingTarget(e)) return;

      switch (e.key) {
        case "[": {
          e.preventDefault();
          const i = INSTRUMENT_ORDER.indexOf(activeInstrument);
          const next = INSTRUMENT_ORDER[(i - 1 + INSTRUMENT_ORDER.length) % INSTRUMENT_ORDER.length];
          if (next) onInstrumentChange(next);
          break;
        }
        case "]": {
          e.preventDefault();
          const i = INSTRUMENT_ORDER.indexOf(activeInstrument);
          const next = INSTRUMENT_ORDER[(i + 1) % INSTRUMENT_ORDER.length];
          if (next) onInstrumentChange(next);
          break;
        }
        case "\\":
          e.preventDefault();
          onSidebarToggle();
          break;
        case "Escape":
          if (sidebarOpen) onSidebarToggle();
          break;
        case "r":
          e.preventDefault();
          onRefresh();
          break;
        default: {
          if (e.key >= "1" && e.key <= "9") {
            const idx = Number(e.key) - 1;
            const key = metricKeys[idx];
            if (key) {
              e.preventDefault();
              onMetricChange(key);
            }
          }
        }
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [
    activeInstrument,
    onInstrumentChange,
    metricKeys,
    onMetricChange,
    sidebarOpen,
    onSidebarToggle,
    onRefresh,
    helpOpen,
    onHelpToggle,
  ]);
}
