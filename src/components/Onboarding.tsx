import { Keyboard, Search, Clipboard, CornerDownLeft, ArrowUpDown, Star, Clock, Zap, Tags } from 'lucide-react';

interface OnboardingProps {
  onDismiss: () => void;
}

const features = [
  {
    icon: Keyboard,
    title: 'Toggle Shortcut',
    desc: 'Press your shortcut anywhere to summon Parrot',
    shortcut: 'Ctrl+Shift+Space',
  },
  {
    icon: CornerDownLeft,
    title: 'Instant Paste',
    desc: 'Select a text and press Enter to type it out',
    shortcut: 'Enter',
  },
  {
    icon: Clipboard,
    title: 'Copy to Clipboard',
    desc: 'Copy without pasting using Shift+Enter',
    shortcut: 'Shift+Enter',
  },
  {
    icon: Zap,
    title: 'Quick Capture',
    desc: 'Save any copied text as a prompt instantly',
    shortcut: 'Ctrl+Shift+C',
  },
  {
    icon: Star,
    title: 'Pin Favorites',
    desc: 'Pin important texts to keep them on top',
    shortcut: 'Click the star',
  },
  {
    icon: Tags,
    title: 'Tag Filtering',
    desc: 'Click a tag to filter all matching texts',
    shortcut: 'Click #tag',
  },
  {
    icon: Clock,
    title: 'History',
    desc: 'Auto-captures everything you copy',
    shortcut: 'History tab',
  },
  {
    icon: Search,
    title: 'Quick Search',
    desc: 'Type to filter texts or history instantly',
    shortcut: 'Type to filter',
  },
];

const shortcuts = [
  { keys: 'Ctrl+K', action: 'Command Palette' },
  { keys: 'Ctrl+Shift+Space', action: 'Toggle Parrot' },
  { keys: 'Ctrl+Shift+C', action: 'Quick Capture' },
  { keys: '↑ / ↓', action: 'Navigate items' },
  { keys: 'Enter', action: 'Paste selected text' },
  { keys: 'Shift+Enter', action: 'Copy selected text' },
  { keys: 'Ctrl+N', action: 'Add new text' },
  { keys: 'Ctrl+E', action: 'Edit selected text' },
  { keys: 'Delete / Ctrl+D', action: 'Delete selected text' },
  { keys: 'Ctrl+,', action: 'Open settings' },
  { keys: 'Esc', action: 'Close Parrot' },
];

export function Onboarding({ onDismiss }: OnboardingProps) {
  return (
    <div className="absolute inset-0 z-50 flex flex-col bg-background overflow-y-auto">
      <div className="flex-1 flex flex-col items-center px-6 py-8">
        {/* Logo */}
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-accent/20 to-accent/5 flex items-center justify-center mb-5 shadow-inner">
          <img
            src="/parrot-icon-transparent.png"
            alt="Parrot"
            className="w-12 h-12"
          />
        </div>

        <h1 className="text-xl font-semibold text-primary mb-1">
          Welcome to Parrot
        </h1>
        <p className="text-xs text-muted text-center max-w-[280px] mb-6 leading-relaxed">
          Your texts, always a keystroke away.
          Save, capture, and paste text snippets in any app.
        </p>

        {/* Feature grid - 4 columns */}
        <div className="grid grid-cols-2 gap-2 w-full max-w-[320px] mb-6">
          {features.map((feature) => (
            <div
              key={feature.title}
              className="flex flex-col gap-1.5 p-3 rounded-lg bg-surface border border-border"
            >
              <div className="flex items-center gap-1.5">
                <feature.icon size={13} className="text-accent" aria-hidden="true" />
                <span className="text-[11px] font-medium text-primary">
                  {feature.title}
                </span>
              </div>
              <p className="text-[10px] text-muted leading-relaxed">
                {feature.desc}
              </p>
              <span className="mt-0.5 text-[9px] font-mono text-accent/80 bg-accent-dim/20 px-1.5 py-0.5 rounded self-start">
                {feature.shortcut}
              </span>
            </div>
          ))}
        </div>

        {/* Shortcut table */}
        <details className="w-full max-w-[320px] group">
          <summary className="text-[10px] text-muted cursor-pointer hover:text-primary transition-colors list-none flex items-center gap-1 select-none">
            <ArrowUpDown size={11} aria-hidden="true" />
            All keyboard shortcuts
          </summary>
          <div className="mt-2 space-y-1">
            {shortcuts.map((s) => (
              <div
                key={s.keys}
                className="flex items-center justify-between px-2 py-1 rounded bg-surface/50"
              >
                <span className="text-[10px] text-muted">{s.action}</span>
                <kbd className="text-[9px] font-mono text-accent bg-accent-dim/15 px-1.5 py-0.5 rounded">
                  {s.keys}
                </kbd>
              </div>
            ))}
          </div>
        </details>
      </div>

      {/* Bottom button */}
      <div className="shrink-0 px-6 pb-5 pt-2">
        <button
          onClick={onDismiss}
          className="w-full py-2.5 rounded-lg bg-accent text-background text-sm font-medium hover:bg-accent/90 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-accent/50"
        >
          Get Started
        </button>
      </div>
    </div>
  );
}
