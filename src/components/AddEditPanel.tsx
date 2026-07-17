import { useState, useEffect, useRef } from 'react';
import { Prompt } from '../types';

interface AddEditPanelProps {
  prompt?: Prompt | null; // If null, we are adding a prompt
  onSave: (title: string, text: string, tags: string[]) => Promise<boolean>;
  onCancel: () => void;
}

export function AddEditPanel({ prompt, onSave, onCancel }: AddEditPanelProps) {
  const [title, setTitle] = useState('');
  const [text, setText] = useState('');
  const [tagsInput, setTagsInput] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Pre-fill fields if we are editing an existing prompt
  useEffect(() => {
    if (prompt) {
      setTitle(prompt.title);
      setText(prompt.text);
      setTagsInput(prompt.tags.join(', '));
    } else {
      setTitle('');
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

  // Real-time parsed tags to display as preview pills
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

    setIsSubmitting(true);
    const success = await onSave(title.trim(), text, parsedTags);
    setIsSubmitting(false);

    if (!success) {
      setError('Failed to save. Please try again.');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex-1 flex flex-col justify-between p-1 select-text">
      <div className="space-y-4 overflow-y-auto pr-0.5">
        <h2 className="text-sm font-semibold text-accent mb-2">
          {prompt ? 'Edit Text' : 'New Text'}
        </h2>

        {error && (
          <div className="px-3 py-2 rounded bg-danger/10 border border-danger/20 text-danger text-xs">
            {error}
          </div>
        )}

        {/* Title Input */}
        <div className="flex flex-col gap-1">
          <label className="text-[11px] font-semibold text-muted">TITLE (Optional)</label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. Refactor React Component"
            className="h-9 px-3 text-[13px] rounded-md bg-surface border border-border text-primary placeholder-muted focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent transition-all"
            autoFocus
          />
        </div>

        {/* Text Textarea */}
        <div className="flex flex-col gap-1">
          <label className="text-[11px] font-semibold text-muted">TEXT</label>
          <textarea
            ref={textareaRef}
            rows={4}
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Type or paste your text template here..."
            className="px-3 py-2 text-[13px] rounded-md bg-surface border border-border text-primary placeholder-muted focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent transition-all resize-none min-h-[90px]"
            required
          />
        </div>

        {/* Tags Input */}
        <div className="flex flex-col gap-1">
          <label className="text-[11px] font-semibold text-muted">TAGS (comma-separated)</label>
          <input
            type="text"
            value={tagsInput}
            onChange={(e) => setTagsInput(e.target.value)}
            placeholder="e.g. react, code-review, helper"
            className="h-9 px-3 text-[13px] rounded-md bg-surface border border-border text-primary placeholder-muted focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent transition-all"
          />
          
          {/* Real-time Tags Pills Preview */}
          {parsedTags.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-1.5">
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

      {/* Action Buttons */}
      <div className="flex items-center gap-2 mt-4 border-t border-border pt-3">
        <button
          type="button"
          onClick={onCancel}
          disabled={isSubmitting}
          className="flex-1 h-9 rounded-md bg-surface border border-border text-xs font-semibold text-muted hover:text-primary transition-all active:scale-[0.98]"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={isSubmitting}
          className="flex-1 h-9 rounded-md bg-accent text-background text-xs font-semibold hover:opacity-90 active:scale-[0.98] transition-all disabled:opacity-50"
        >
          {isSubmitting ? 'Saving...' : 'Save Text'}
        </button>
      </div>
    </form>
  );
}
