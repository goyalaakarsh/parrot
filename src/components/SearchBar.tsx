import { useRef, useEffect } from 'react';
import { Settings } from 'lucide-react';

interface SearchBarProps {
  value: string;
  onChange: (val: string) => void;
  onOpenSettings: () => void;
  isFocused: boolean;
}

export function SearchBar({ value, onChange, onOpenSettings, isFocused }: SearchBarProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto-focus search input when it mounts or when isFocused is triggered
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
          className="w-full h-9 px-3 text-sm font-medium rounded-lg bg-surface border border-border text-primary placeholder-muted focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent transition-all duration-100"
        />
        {value && (
          <button
            onClick={() => onChange('')}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-primary text-xs"
          >
            Clear
          </button>
        )}
      </div>
      <button
        onClick={onOpenSettings}
        title="Settings"
        className="flex items-center justify-center w-9 h-9 rounded-lg bg-surface border border-border text-muted hover:text-accent hover:border-accent transition-all duration-100"
      >
        <Settings size={16} />
      </button>
    </div>
  );
}
