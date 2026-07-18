import { ArrowLeft, Command, Github } from 'lucide-react';

interface AboutPanelProps {
  onBack: () => void;
}

export function AboutPanel({ onBack }: AboutPanelProps) {
  return (
    <div className="flex-1 flex flex-col p-1 select-text">
      <div className="flex items-center gap-2 border-b border-border pb-2.5 mb-5">
        <button
          onClick={onBack}
          aria-label="Back to texts"
          className="flex items-center gap-1.5 px-1.5 py-1 rounded-md text-muted hover:text-accent hover:bg-surface-hover transition-all"
        >
          <ArrowLeft size={16} aria-hidden="true" />
          <kbd className="text-[9px] px-1 py-0.5 rounded bg-surface border border-border text-muted font-sans font-medium leading-none">Esc</kbd>
        </button>
        <h2 className="text-sm font-semibold text-primary">About</h2>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center text-center gap-4">
        <div className="w-16 h-16 rounded-2xl  flex items-center justify-center shadow-inner">
          <img
            src="/parrot-icon-transparent.png"
            alt="Parrot"
            className="w-12 h-12"
          />
        </div>

        <div>
          <h3 className="text-base font-bold text-primary">Parrot</h3>
          <p className="text-[11px] text-muted mt-0.5">Version 0.1.0</p>
        </div>

        <div className="w-full max-w-[240px] px-4 py-3 rounded-lg bg-surface border border-border">
          <p className="text-[11px] text-muted leading-relaxed">
            A power clipboard for your desktop. Store, search, and paste your frequently used text snippets into any window.
          </p>
        </div>

        <div className="flex items-center gap-3 mt-1">
          <div className="flex items-center gap-1.5 text-[10px] text-muted">
            <Command size={11} />
            <span>Ctrl+K</span>
          </div>
          <span className="text-border">|</span>
          <div className="flex items-center gap-1.5 text-[10px] text-muted">
            <Github size={11} />
            <span>Parrot</span>
          </div>
        </div>
      </div>
    </div>
  );
}
