import Link from "next/link";
import { useState, useEffect, useRef } from "react";
import { INSTRUMENTS } from "@/lib/instruments";

interface TerminalHeaderProps {
  activeInstrument: string;
  onInstrumentChange: (id: string) => void;
  onMenuClick?: () => void;
}

export function TerminalHeader({
  activeInstrument,
  onInstrumentChange,
  onMenuClick,
}: TerminalHeaderProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [showSearch, setShowSearch] = useState(false);
  const [searchResults, setSearchResults] = useState<string[]>([]);
  const [activeResult, setActiveResult] = useState(0);
  const [time, setTime] = useState("--:--:--");
  const searchRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const onGlobalKey = (e: KeyboardEvent) => {
      const isSearchHotkey =
        (e.key === "/" && !e.metaKey && !e.ctrlKey && !e.altKey) ||
        ((e.metaKey || e.ctrlKey) && (e.key === "k" || e.key === "K"));
      if (!isSearchHotkey) return;
      const t = e.target as HTMLElement | null;
      const tag = t?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA" || t?.isContentEditable) return;
      e.preventDefault();
      searchRef.current?.focus();
      searchRef.current?.select();
      setShowSearch(true);
    };
    window.addEventListener("keydown", onGlobalKey);
    return () => window.removeEventListener("keydown", onGlobalKey);
  }, []);

  useEffect(() => {
    const updateTime = () => setTime(new Date().toLocaleTimeString("en-US", { hour12: false, hour: "2-digit", minute: "2-digit", second: "2-digit" }));
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const handler = setTimeout(() => {
      if (searchQuery.trim()) {
        const lower = searchQuery.toLowerCase();
        setSearchResults(
          Object.entries(INSTRUMENTS)
            .filter(([, v]) =>
              v.id.toLowerCase().includes(lower) ||
              v.symbol.toLowerCase().includes(lower) ||
              v.displayName.toLowerCase().includes(lower)
            )
            .map(([k]) => k)
        );
        setActiveResult(0);
      } else {
        setSearchResults([]);
      }
    }, 150);
    return () => clearTimeout(handler);
  }, [searchQuery]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!showSearch) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveResult(prev => Math.min(prev + 1, searchResults.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveResult(prev => Math.max(prev - 1, 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (searchResults[activeResult]) {
        onInstrumentChange(searchResults[activeResult]);
        setSearchQuery("");
        setShowSearch(false);
      }
    } else if (e.key === "Escape") {
      setSearchQuery("");
      setShowSearch(false);
    }
  };

  const activeInst = INSTRUMENTS[activeInstrument];

  return (
    <header className="terminal-header">
      <div className="header-left">
        {onMenuClick && (
          <button
            className="header-menu-btn"
            onClick={onMenuClick}
            aria-label="Toggle instrument sidebar"
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="3" y1="4" x2="13" y2="4" />
              <line x1="3" y1="8" x2="13" y2="8" />
              <line x1="3" y1="12" x2="13" y2="12" />
            </svg>
          </button>
        )}
        <Link href="/" className="header-logo" title="DataVault Terminal">
          <span className="logo-icon">›_</span>
          <span className="logo-text">DATA<span className="logo-accent">VAULT</span></span>
        </Link>
        <nav className="header-nav">
          <Link href="/datasets" className="nav-item">DATASETS</Link>
          <Link href="/terminal" className="nav-item">TERMINAL</Link>
          <Link href="/research" className="nav-item">RESEARCH</Link>
        </nav>
      </div>

      <div className="header-center">
        <div className="header-search-wrapper">
          <input
            type="text"
            className="header-search"
            ref={searchRef}
            placeholder="Search instrument... (/) "
            value={searchQuery}
            onChange={e => { setSearchQuery(e.target.value); setShowSearch(true); }}
            onFocus={() => setShowSearch(true)}
            onKeyDown={handleKeyDown}
            autoComplete="off"
            spellCheck={false}
          />
          {showSearch && searchResults.length > 0 && (
            <div className="search-results">
              {searchResults.map((id, idx) => {
                const inst = INSTRUMENTS[id];
                return (
                  <button
                    key={id}
                    className={`search-result ${idx === activeResult ? "active" : ""}`}
                    onClick={() => {
                      onInstrumentChange(id);
                      setSearchQuery("");
                      setShowSearch(false);
                    }}
                    onMouseEnter={() => setActiveResult(idx)}
                  >
                    <span className="result-symbol">{inst.symbol}</span>
                    <span className="result-name">{inst.displayName}</span>
                    <span className="result-category">{inst.category}</span>
                  </button>
                );
              })}
            </div>
          )}
        </div>
        <div className="header-status">
          <span className={`status-dot ${activeInst ? "live" : ""}`} />
          <span className="status-text">LIVE</span>
          <span className="status-separator" />
          <span className="status-time" id="header-time">{time}</span>
          {activeInst && (
            <>
              <span className="status-separator" />
              <span className="status-instrument">{activeInst.symbol}</span>
            </>
          )}
        </div>
      </div>

      <div className="header-right">
        <Link href="/login" className="btn btn-ghost btn-sm">LOGIN</Link>
        <Link href="/register" className="btn btn-primary btn-sm">GET STARTED</Link>
      </div>
    </header>
  );
}