import { useRef, useEffect } from 'react';
import { Settings, Command, X } from 'lucide-react';

interface SearchBarProps {
  value: string;
  onChange: (val: string) => void;
  onOpenSettings: () => void;
  onOpenPalette: () => void;
  isFocused: boolean;
  activeTab: 'texts' | 'history';
  onTabChange: (tab: 'texts' | 'history') => void;
  activeTag: string | null;
  onClearTag: () => void;
}

export function SearchBar({ value, onChange, onOpenSettings, onOpenPalette, isFocused, activeTab, onTabChange, activeTag, onClearTag }: SearchBarProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isFocused && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isFocused]);

  return (
    <div className="flex flex-col gap-1.5 mb-3 shrink-0">
      {/* Search input + action buttons */}
      <div className="flex items-center gap-1.5">
        <div className="relative flex-1">
          <input
            ref={inputRef}
            type="text"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={activeTab === 'texts' ? 'Search texts or tags...' : 'Search history...'}
            aria-label={activeTab === 'texts' ? 'Search texts' : 'Search history'}
            className="w-full h-9 px-3 text-sm font-medium rounded-lg bg-surface border border-border text-primary placeholder-muted focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent transition-all duration-100"
          />
          {value && (
            <button
              onClick={() => onChange('')}
              aria-label="Clear search"
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-primary text-xs"
            >
              Clear
            </button>
          )}
        </div>
        <button
          onClick={onOpenPalette}
          title="Command Palette (Ctrl+K)"
          aria-label="Command Palette"
          className="flex items-center gap-1.5 px-2.5 h-9 rounded-lg bg-surface border border-border text-muted hover:text-accent hover:border-accent transition-all duration-100"
        >
          <Command size={15} aria-hidden="true" />
          <kbd className="text-[9px] px-1 py-0.5 rounded bg-surface-hover border border-border text-muted font-sans font-medium leading-none">Ctrl+K</kbd>
        </button>
        <button
          onClick={onOpenSettings}
          title="Settings (Ctrl+,)"
          aria-label="Settings"
          className="flex items-center gap-1.5 px-2.5 h-9 rounded-lg bg-surface border border-border text-muted hover:text-accent hover:border-accent transition-all duration-100"
        >
          <Settings size={15} aria-hidden="true" />
          <kbd className="text-[9px] px-1 py-0.5 rounded bg-surface-hover border border-border text-muted font-sans font-medium leading-none">Ctrl+,</kbd>
        </button>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 border-b border-border pb-1.5">
        <button
          onClick={() => onTabChange('texts')}
          className={`text-xs font-semibold px-2 py-1 rounded transition-all ${
            activeTab === 'texts'
              ? 'text-accent bg-accent-dim/15'
              : 'text-muted hover:text-primary'
          }`}
        >
          My Texts
        </button>
        <button
          onClick={() => onTabChange('history')}
          className={`text-xs font-semibold px-2 py-1 rounded transition-all ${
            activeTab === 'history'
              ? 'text-accent bg-accent-dim/15'
              : 'text-muted hover:text-primary'
          }`}
        >
          History
        </button>
      </div>

      {/* Tag filter chip */}
      {activeTag && (
        <div className="flex items-center gap-1.5 text-xs">
          <span className="px-1.5 py-0.5 rounded bg-accent-dim/20 border border-accent/20 text-accent font-medium flex items-center gap-1">
            <span>#{activeTag}</span>
            <button
              onClick={onClearTag}
              aria-label="Clear tag filter"
              className="hover:text-accent-dim transition-all"
            >
              <X size={11} />
            </button>
          </span>
        </div>
      )}
    </div>
  );
}
