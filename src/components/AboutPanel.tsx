import { useEffect } from 'react';
import { ArrowLeft, Command, Github } from 'lucide-react';

interface AboutPanelProps {
  onBack: () => void;
}

export function AboutPanel({ onBack }: AboutPanelProps) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onBack();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onBack]);

  const openUrl = (url: string) => {
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  return (
    <div className="flex-1 flex flex-col p-1 select-text min-h-0 overflow-y-auto">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-base font-semibold text-primary">About</h2>
        <button
          onClick={onBack}
          aria-label="Back to texts"
          className="flex items-center gap-1.5 px-1.5 py-1 rounded-md text-muted hover:text-accent hover:bg-surface-hover transition-[color,background-color]"
        >
          <ArrowLeft size={16} aria-hidden="true" />
          <kbd className="text-[9px] px-1 py-0.5 rounded bg-surface border border-border text-muted font-sans font-medium leading-none">Esc</kbd>
        </button>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center text-center gap-4">
        <div className="w-16 h-16 rounded-2xl flex items-center justify-center shadow-inner">
          <img
            src="/parrot-icon-transparent.png"
            alt="Parrot"
            className="w-12 h-12"
          />
        </div>

        <div>
          <h3 className="text-base font-bold text-primary">Parrot</h3>
          <p className="text-[11px] text-muted mt-0.5">Version 0.2.0</p>
        </div>

        <div className="w-full max-w-[240px] px-4 py-3 rounded-lg bg-surface border border-border">
          <p className="text-[11px] text-muted leading-relaxed">
            A power clipboard for your desktop. Store, search, and paste your frequently used text snippets into any window.
          </p>
        </div>

        <div className="flex items-center gap-3 mt-1">
          <div className="flex items-center gap-1.5 text-[10px] text-muted">
            <Command size={11} aria-hidden="true" />
            <span>Ctrl+K</span>
          </div>
          <span className="text-border">|</span>
          <button
            onClick={() => openUrl('https://github.com/goyalaakarsh/parrot')}
            className="flex items-center gap-1.5 text-[10px] text-muted hover:text-accent transition-colors"
          >
            <Github size={11} aria-hidden="true" />
            <span className="underline">Parrot</span>
          </button>
        </div>

        <div className="text-xs text-muted mt-1">
          made by{' '}
          <button
            onClick={() => openUrl('https://aakarshgoyal.in')}
            className="text-accent underline font-medium hover:opacity-80 transition-opacity"
          >
            aakarsh
          </button>
        </div>
      </div>
    </div>
  );
}
