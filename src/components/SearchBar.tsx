import { useRef, useEffect } from 'react';
import { Plus, Settings } from 'lucide-react';

interface SearchBarProps {
  value: string;
  onChange: (val: string) => void;
  onOpenSettings: () => void;
  onAddClick: () => void;
  isFocused: boolean;
}

export function SearchBar({ value, onChange, onOpenSettings, onAddClick, isFocused }: SearchBarProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isFocused && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isFocused]);

  return (
    <div className="flex items-center gap-2 mb-3">
      <div className="relative flex-1">
        <input
          ref={inputRef}
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="Search prompts or tags..."
          aria-label="Search prompts"
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
        onClick={onAddClick}
        title="Add prompt (Ctrl+N)"
        aria-label="Add prompt"
        className="flex items-center gap-1.5 px-2.5 h-9 rounded-lg bg-surface border border-border text-muted hover:text-accent hover:border-accent transition-all duration-100"
      >
        <Plus size={15} aria-hidden="true" />
        <kbd className="text-[9px] px-1 py-0.5 rounded bg-surface-hover border border-border text-muted font-sans font-medium leading-none">Ctrl+N</kbd>
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
  );
}
