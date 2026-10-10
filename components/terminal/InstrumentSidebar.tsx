"use client";

import { INSTRUMENTS, CATEGORIES, type CategoryId } from "@/lib/instruments";

interface InstrumentSidebarProps {
  activeInstrument: string;
  onInstrumentChange: (id: string) => void;
  isOpen: boolean;
  onClose: () => void;
}

export function InstrumentSidebar({
  activeInstrument,
  onInstrumentChange,
  isOpen,
  onClose,
}: InstrumentSidebarProps) {
  const handleSelect = (id: string) => {
    onInstrumentChange(id);
    onClose();
  };

  return (
    <>
      {isOpen && (
        <div className="sidebar-overlay" onClick={onClose} aria-hidden="true" />
      )}
      <aside className={`instrument-sidebar ${isOpen ? "open" : ""}`} role="navigation" aria-label="Instrument navigator">
        <div className="sidebar-header">
          <span className="sidebar-title">INSTRUMENTS</span>
          <button className="sidebar-close" onClick={onClose} aria-label="Close sidebar">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="4" y1="4" x2="12" y2="12" />
              <line x1="12" y1="4" x2="4" y2="12" />
            </svg>
          </button>
        </div>

        <nav className="sidebar-nav">
          {(Object.keys(CATEGORIES) as Array<CategoryId>).map((catId) => {
            const cat = CATEGORIES[catId];
            
            return (
              <div key={cat.id} className="sidebar-category">
                <div className="sidebar-category-header">
                  <span className="category-label">{cat.label}</span>
                  <span className="category-count">{cat.instruments.length || 0}</span>
                </div>
                <ul className="sidebar-instrument-list">
                  {cat.instruments.map((instId) => {
                    const inst = INSTRUMENTS[instId];
                    if (!inst) return null;
                    const isActive = activeInstrument === instId;
                    return (
                      <li key={inst.id}>
                        <button
                          className={`sidebar-instrument ${isActive ? "active" : ""}`}
                          onClick={() => handleSelect(inst.id)}
                          title={inst.description}
                        >
                          <span className="inst-symbol">{inst.symbol}</span>
                          <span className="inst-name">{inst.displayName}</span>
                          <span className="inst-badges">
                            {inst.hasVolume && <span className="badge volume" title="Volume" />}
                            {inst.hasOpenInterest && <span className="badge oi" title="Open Interest" />}
                            {inst.hasCOT && <span className="badge cot" title="COT" />}
                          </span>
                        </button>
                      </li>
                    );
                  })}
                </ul>
              </div>
            );
          })}
        </nav>

        <div className="sidebar-footer">
          <div className="sidebar-search-hint">
            <kbd>/</kbd> search · <kbd>[</kbd> <kbd>]</kbd> instruments · <kbd>?</kbd> help
          </div>
        </div>
      </aside>
    </>
  );
}