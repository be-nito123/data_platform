"use client";

import { useEffect } from "react";
import { createPortal } from "react-dom";

interface ShortcutHelpProps {
  onClose: () => void;
}

const SHORTCUTS: Array<{ keys: string[]; desc: string }> = [
  { keys: ["/", "⌘K"], desc: "Focus search" },
  { keys: ["↑", "↓", "Enter"], desc: "Navigate / select search results" },
  { keys: ["[", "]"], desc: "Previous / next instrument" },
  { keys: ["1–9"], desc: "Jump to metric tab" },
  { keys: ["\\"], desc: "Toggle sidebar" },
  { keys: ["r"], desc: "Refresh data" },
  { keys: ["?"], desc: "Toggle this help" },
  { keys: ["Esc"], desc: "Close sidebar / help / expanded table" },
  { keys: ["←", "→"], desc: "Slider handles (Shift = 7 days)" },
];

export function ShortcutHelp({ onClose }: ShortcutHelpProps) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" || e.key === "?") {
        e.preventDefault();
        onClose();
      }
    };
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [onClose]);

  if (typeof document === "undefined") return null;

  return createPortal(
    <div className="sheet-modal shortcut-help" role="dialog" aria-modal="true" aria-label="Keyboard shortcuts">
      <div className="sheet-modal-backdrop" onClick={onClose} />
      <div className="sheet-modal-panel shortcut-help-panel">
        <div className="sheet-modal-head">
          <span className="raw-table-title">Keyboard shortcuts</span>
          <button type="button" className="sheet-modal-close" onClick={onClose} aria-label="Close">
            <svg
              viewBox="0 0 16 16"
              width="14"
              height="14"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M4 4l12 12m0-12L4 12" />
            </svg>
          </button>
        </div>
        <div className="sheet-modal-body shortcut-help-body">
          <dl className="shortcut-list">
            {SHORTCUTS.map((s) => (
              <div className="shortcut-row" key={s.desc}>
                <dt className="shortcut-keys">
                  {s.keys.map((k) => (
                    <kbd key={k}>{k}</kbd>
                  ))}
                </dt>
                <dd className="shortcut-desc">{s.desc}</dd>
              </div>
            ))}
          </dl>
        </div>
      </div>
    </div>,
    document.body
  );
}
