import { ArrowLeft } from 'lucide-react';

interface AboutPanelProps {
  onBack: () => void;
}

export function AboutPanel({ onBack }: AboutPanelProps) {
  return (
    <div className="flex-1 flex flex-col p-1 select-text">
      <div className="flex items-center gap-2 border-b border-border pb-2.5 mb-5">
        <button
          onClick={onBack}
          aria-label="Back to prompts"
          className="flex items-center gap-1.5 px-1.5 py-1 rounded-md text-muted hover:text-accent hover:bg-surface-hover transition-all"
        >
          <ArrowLeft size={16} aria-hidden="true" />
          <kbd className="text-[9px] px-1 py-0.5 rounded bg-surface border border-border text-muted font-sans font-medium leading-none">Esc</kbd>
        </button>
        <h2 className="text-sm font-semibold text-primary">About</h2>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center text-center gap-3">
        <div className="w-12 h-12 rounded-xl bg-accent/10 flex items-center justify-center">
          <span className="text-2xl">🦜</span>
        </div>
        <div>
          <h3 className="text-sm font-bold text-primary">Parrot</h3>
          <p className="text-[10px] text-muted mt-0.5">Version 0.1.0</p>
        </div>
        <p className="text-[11px] text-muted leading-relaxed max-w-[250px]">
          A lightweight tray prompt manager. Store, search, and paste your frequently used AI prompts into any window.
        </p>
        <div className="text-[10px] text-muted mt-2">
          Built with Tauri v2 + React
        </div>
      </div>
    </div>
  );
}
