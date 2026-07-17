import { useState, useEffect, useRef, useMemo } from 'react';
import { ArrowLeft } from 'lucide-react';

interface Command {
  id: string;
  label: string;
  category: string;
  shortcut?: string;
}

interface CommandPaletteProps {
  onClose: () => void;
  commands: Command[];
}

export function CommandPalette({ onClose, commands }: CommandPaletteProps) {
  const [query, setQuery] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  const filtered = useMemo(() => {
    if (!query.trim()) return commands;
    const q = query.toLowerCase();
    return commands.filter(
      c =>
        c.label.toLowerCase().includes(q) ||
        c.category.toLowerCase().includes(q) ||
        (c.shortcut && c.shortcut.toLowerCase().includes(q))
    );
  }, [commands, query]);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);

  const categories = useMemo(() => {
    const map = new Map<string, Command[]>();
    filtered.forEach(c => {
      const arr = map.get(c.category) || [];
      arr.push(c);
      map.set(c.category, arr);
    });
    return Array.from(map.entries());
  }, [filtered]);

  return (
    <div className="flex-1 flex flex-col p-1 select-text min-h-0">
      <div className="flex items-center gap-2 border-b border-border pb-2.5 mb-2">
        <button
          onClick={onClose}
          aria-label="Back to prompts"
          className="flex items-center gap-1.5 px-1.5 py-1 rounded-md text-muted hover:text-accent hover:bg-surface-hover transition-all"
        >
          <ArrowLeft size={16} aria-hidden="true" />
          <kbd className="text-[9px] px-1 py-0.5 rounded bg-surface border border-border text-muted font-sans font-medium leading-none">Esc</kbd>
        </button>
        <h2 className="text-sm font-semibold text-primary">Commands</h2>
      </div>

      <div className="relative border border-border rounded-lg bg-surface mb-2">
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={e => setQuery(e.target.value)}
          placeholder="Search commands..."
          className="w-full h-9 px-3 text-sm bg-transparent text-primary placeholder-muted focus:outline-none"
        />
      </div>

      <div className="flex-1 overflow-y-auto min-h-0">
        {categories.length === 0 && (
          <div className="py-6 text-xs text-muted text-center">No commands found</div>
        )}
        {categories.map(([category, items]) => (
          <div key={category}>
            <div className="px-1 py-1.5 text-[10px] font-semibold uppercase tracking-wider text-muted">
              {category}
            </div>
            {items.map((cmd) => (
              <div
                key={cmd.id}
                className="flex items-center justify-between px-3 py-2 text-xs rounded-md text-primary"
              >
                <span>{cmd.label}</span>
                <kbd className="text-[9px] px-1.5 py-0.5 rounded bg-surface border border-border text-muted font-sans">
                  {cmd.shortcut}
                </kbd>
              </div>
            ))}
          </div>
        ))}
      </div>

      <div className="border-t border-border pt-2 mt-1 text-[9px] text-muted text-center select-none">
        Use keyboard shortcuts to execute commands
      </div>
    </div>
  );
}
