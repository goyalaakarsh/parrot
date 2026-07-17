import { useState, useEffect, useRef } from 'react';
import { ArrowLeft } from 'lucide-react';
import { Prompt } from '../types';

interface AddEditPanelProps {
  prompt?: Prompt | null;
  onSave: (title: string, text: string, tags: string[]) => Promise<boolean>;
  onCancel: () => void;
}

export function AddEditPanel({ prompt, onSave, onCancel }: AddEditPanelProps) {
  const [text, setText] = useState('');
  const [tagsInput, setTagsInput] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (prompt) {
      setText(prompt.text);
      setTagsInput(prompt.tags.join(', '));
    } else {
      setText('');
      setTagsInput('');
    }
    setError(null);
  }, [prompt]);

  // Auto-grow text textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [text]);

  // Wire Escape to cancel
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onCancel();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onCancel]);

  const parsedTags = tagsInput
    .split(',')
    .map((tag) => tag.trim().toLowerCase())
    .filter(Boolean);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!text.trim()) {
      setError('Text is required');
      return;
    }

    const firstLine = text.split('\n')[0].trim();
    const autoTitle = firstLine.length > 40 ? `${firstLine.substring(0, 40)}...` : firstLine;

    setIsSubmitting(true);
    const success = await onSave(autoTitle, text, parsedTags);
    setIsSubmitting(false);

    if (!success) {
      setError('Failed to save. Please try again.');
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
      e.preventDefault();
      handleSubmit(e as any);
    }
  };

  return (
    <form 
      onSubmit={handleSubmit} 
      onKeyDown={handleKeyDown}
      className="flex-1 flex flex-col justify-between p-1 select-text"
    >
      <div className="space-y-4 overflow-y-auto pr-0.5">
        <div className="flex items-center gap-2 border-b border-border pb-2.5 mb-2">
          <button
            type="button"
            onClick={onCancel}
            aria-label="Back to prompts"
            className="flex items-center gap-1.5 px-1.5 py-1 rounded-md text-muted hover:text-accent hover:bg-surface-hover transition-all"
          >
            <ArrowLeft size={16} aria-hidden="true" />
            <kbd className="text-[9px] px-1 py-0.5 rounded bg-surface border border-border text-muted font-sans font-medium leading-none">Esc</kbd>
          </button>
          <h2 className="text-sm font-semibold text-primary">
            {prompt ? 'Edit Text' : 'New Text'}
          </h2>
        </div>

        {error && (
          <div role="alert" className="px-3 py-2 rounded bg-danger/10 border border-danger/20 text-danger text-xs">
            {error}
          </div>
        )}

        <div className="flex flex-col gap-1">
          <label htmlFor="prompt-text" className="text-[11px] font-semibold text-muted">TEXT</label>
          <textarea
            ref={textareaRef}
            id="prompt-text"
            rows={4}
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Type or paste your text template here..."
            aria-label="Prompt text"
            className="px-3 py-2 text-[13px] rounded-md bg-surface border border-border text-primary placeholder-muted focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent transition-all resize-none min-h-[90px]"
            required
            autoFocus
          />
        </div>

        <div className="flex flex-col gap-1">
          <label htmlFor="prompt-tags" className="text-[11px] font-semibold text-muted">TAGS (comma-separated)</label>
          <input
            id="prompt-tags"
            type="text"
            value={tagsInput}
            onChange={(e) => setTagsInput(e.target.value)}
            placeholder="e.g. react, code-review, helper"
            aria-label="Tags, comma separated"
            className="h-9 px-3 text-[13px] rounded-md bg-surface border border-border text-primary placeholder-muted focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent transition-all"
          />
          
          {parsedTags.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-1.5" aria-live="polite" aria-atomic="true">
              {parsedTags.map((tag, i) => (
                <span
                  key={`${tag}-${i}`}
                  className="px-1.5 py-0.5 rounded text-[10px] bg-accent-dim/20 border border-accent/20 text-accent font-medium"
                >
                  #{tag}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="flex items-center gap-2 mt-4 border-t border-border pt-3">
        <button
          type="button"
          onClick={onCancel}
          disabled={isSubmitting}
          className="flex-1 h-9 rounded-md bg-surface border border-border text-xs font-semibold text-muted hover:text-primary transition-all active:scale-[0.98] flex items-center justify-center gap-1.5"
        >
          <span>Cancel</span>
          <kbd className="text-[9px] px-1.5 py-0.5 rounded bg-surface border border-border text-muted font-sans font-medium leading-none shadow-sm">Esc</kbd>
        </button>
        <button
          type="submit"
          disabled={isSubmitting}
          className="flex-1 h-9 rounded-md bg-accent text-background text-xs font-semibold hover:opacity-90 active:scale-[0.98] transition-all disabled:opacity-50 flex items-center justify-center gap-1.5"
        >
          <span>{isSubmitting ? 'Saving...' : 'Save Text'}</span>
          <kbd className="text-[9px] px-1.5 py-0.5 rounded bg-accent border border-accent-dim text-background font-sans font-medium leading-none opacity-85 shadow-sm">Ctrl+Enter</kbd>
        </button>
      </div>
    </form>
  );
}
