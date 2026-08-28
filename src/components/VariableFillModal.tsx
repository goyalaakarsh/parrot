import { useState, useEffect, useRef } from 'react';
import { X, Play } from 'lucide-react';

interface VariableFillModalProps {
  promptTitle: string;
  templateText: string;
  variableNames: string[];
  onConfirm: (customValues: Record<string, string>) => void;
  onCancel: () => void;
}

export function VariableFillModal({
  promptTitle,
  variableNames,
  onConfirm,
  onCancel,
}: VariableFillModalProps) {
  const [values, setValues] = useState<Record<string, string>>(() => {
    const initial: Record<string, string> = {};
    variableNames.forEach((varName) => {
      initial[varName] = '';
    });
    return initial;
  });

  const firstInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    firstInputRef.current?.focus();
  }, []);

  const handleChange = (varName: string, val: string) => {
    setValues((prev) => ({ ...prev, [varName]: val }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onConfirm(values);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      e.preventDefault();
      onCancel();
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      onKeyDown={handleKeyDown}
      className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-3 animate-fade-in"
    >
      <div className="w-full max-w-sm bg-background border border-border rounded-lg shadow-2xl overflow-hidden flex flex-col animate-slide-up">
        {/* Header */}
        <div className="flex items-center justify-between px-3 py-2 border-b border-border bg-surface/50">
          <div className="flex items-center gap-1.5 min-w-0 pr-2">
            <span className="text-xs font-semibold text-primary truncate">Fill Variables</span>
            <span className="text-[10px] text-muted truncate">({promptTitle})</span>
          </div>
          <button
            onClick={onCancel}
            aria-label="Close"
            className="p-1 rounded text-muted hover:text-primary hover:bg-surface-hover transition-colors"
          >
            <X size={14} />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-3 space-y-3">
          <div className="space-y-2 max-h-56 overflow-y-auto pr-1 no-scrollbar">
            {variableNames.map((varName, idx) => (
              <div key={varName} className="space-y-1">
                <label className="text-[10px] font-medium text-muted capitalize flex items-center gap-1">
                  <span>{varName.replace(/_/g, ' ')}</span>
                  <span className="text-accent">*</span>
                </label>
                <input
                  ref={idx === 0 ? firstInputRef : null}
                  type="text"
                  value={values[varName] || ''}
                  onChange={(e) => handleChange(varName, e.target.value)}
                  placeholder={`Enter ${varName}...`}
                  className="w-full px-2.5 py-1.5 rounded text-xs bg-surface border border-border text-primary placeholder:text-muted/50 focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent transition-all"
                />
              </div>
            ))}
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-2 pt-2 border-t border-border">
            <button
              type="button"
              onClick={onCancel}
              className="px-3 py-1.5 rounded text-xs font-medium text-muted hover:text-primary hover:bg-surface-hover transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-3 py-1.5 rounded text-xs font-semibold bg-accent text-background hover:opacity-90 active:scale-95 transition-all shadow-md shadow-accent/10 flex items-center gap-1.5"
            >
              <Play size={12} className="fill-current" />
              <span>Paste Snippet</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

