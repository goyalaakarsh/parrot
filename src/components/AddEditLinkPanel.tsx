import { useState, useEffect, useRef } from 'react';
import { ArrowLeft, Globe } from 'lucide-react';
import { SavedLink } from '../types';
import { fetchLinkMetadata } from '../utils/metadata';
import { CustomSelect } from './CustomSelect';

interface AddEditLinkPanelProps {
  link?: SavedLink | null;
  onSave: (link: Omit<SavedLink, 'id' | 'createdAt' | 'pinned'>) => Promise<boolean>;
  onCancel: () => void;
}

const CATEGORIES = ['Work', 'Social', 'Shopping', 'Entertainment', 'Other'];
const CATEGORY_OPTIONS = [
  { value: '', label: 'Select a category' },
  ...CATEGORIES.map((cat) => ({ value: cat, label: cat })),
];

export function AddEditLinkPanel({ link, onSave, onCancel }: AddEditLinkPanelProps) {
  const [url, setUrl] = useState('');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('');
  const [tagsInput, setTagsInput] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [faviconUrl, setFaviconUrl] = useState<string | null>(null);

  const urlRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (link) {
      setUrl(link.url);
      setTitle(link.title);
      setDescription(link.description);
      setCategory(link.category);
      setTagsInput(link.tags.join(', '));
      setFaviconUrl(link.faviconUrl);
    } else {
      setUrl('');
      setTitle('');
      setDescription('');
      setCategory('');
      setTagsInput('');
      setFaviconUrl(null);
    }
    setError(null);
  }, [link]);

  useEffect(() => {
    urlRef.current?.focus();
  }, []);

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

  const handleUrlBlur = async () => {
    const targetUrl = url.trim();
    if (!targetUrl) return;

    let normalized = targetUrl;
    if (!normalized.startsWith('http://') && !normalized.startsWith('https://')) {
      normalized = 'https://' + normalized;
    }

    try {
      const domain = new URL(normalized).hostname;
      if (!title.trim()) {
        setTitle(domain);
      }
      setFaviconUrl(`https://${domain}/favicon.ico`);

      // Silently fetch metadata in background if online
      const metadata = await fetchLinkMetadata(normalized);
      if (metadata.title && (!title.trim() || title.trim() === domain)) {
        setTitle(metadata.title);
      }
      if (metadata.faviconUrl) {
        setFaviconUrl(metadata.faviconUrl);
      }
    } catch {
      // ignore
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!url.trim()) {
      setError('URL is required');
      return;
    }

    // Validate URL
    let normalizedUrl = url.trim();
    if (!normalizedUrl.startsWith('http://') && !normalizedUrl.startsWith('https://')) {
      normalizedUrl = 'https://' + normalizedUrl;
    }

    try {
      new URL(normalizedUrl);
    } catch {
      setError('Please enter a valid URL');
      return;
    }

    let finalTitle = title.trim() || new URL(normalizedUrl).hostname;
    let finalFavicon = faviconUrl;

    // Fetch title/favicon in background if not filled
    if (!title.trim()) {
      const meta = await fetchLinkMetadata(normalizedUrl);
      if (meta.title) finalTitle = meta.title;
      if (meta.faviconUrl) finalFavicon = meta.faviconUrl;
    }

    setIsSubmitting(true);
    const success = await onSave({
      title: finalTitle,
      url: normalizedUrl,
      description: description.trim(),
      faviconUrl: finalFavicon,
      category: category || 'Other',
      tags: parsedTags,
      lastUsedAt: undefined,
    });
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
      noValidate
      onSubmit={handleSubmit} 
      onKeyDown={handleKeyDown}
      className="flex-1 flex flex-col justify-between p-1 select-text min-h-0"
    >
      <div className="space-y-4 overflow-y-auto pr-0.5 min-h-0 flex-1">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-base font-semibold text-primary">
            {link ? 'Edit Link' : 'New Link'}
          </h2>
          <button
            type="button"
            onClick={onCancel}
            aria-label="Back to links"
            className="flex items-center gap-1.5 px-1.5 py-1 rounded-md text-muted hover:text-accent hover:bg-surface-hover transition-[color,background-color]"
          >
            <ArrowLeft size={16} aria-hidden="true" />
            <kbd className="text-[9px] px-1 py-0.5 rounded bg-surface border border-border text-muted font-sans font-medium leading-none">Esc</kbd>
          </button>
        </div>

        {error && (
          <div role="alert" className="px-3 py-2 rounded bg-danger/10 border border-danger/20 text-danger text-xs">
            {error}
          </div>
        )}

        <div className="flex flex-col gap-1">
          <label htmlFor="link-url" className="text-[11px] font-semibold text-muted">URL</label>
          <div className="relative">
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-muted">
              <Globe size={13} />
            </div>
            <input
              ref={urlRef}
              id="link-url"
              type="text"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              onBlur={handleUrlBlur}
              placeholder="https://example.com"
              aria-label="URL"
              className="w-full h-9 pl-8 pr-3 text-[13px] rounded-md bg-surface border border-border text-primary placeholder-muted focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent transition-[border-color,box-shadow]"
            />
          </div>
        </div>

        <div className="flex flex-col gap-1">
          <label htmlFor="link-title" className="text-[11px] font-semibold text-muted">TITLE</label>
          <input
            id="link-title"
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Auto-generated from URL if empty"
            aria-label="Title"
            className="h-9 px-3 text-[13px] rounded-md bg-surface border border-border text-primary placeholder-muted focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent transition-[border-color,box-shadow]"
          />
        </div>

        <div className="flex flex-col gap-1">
          <label htmlFor="link-description" className="text-[11px] font-semibold text-muted">DESCRIPTION (optional)</label>
          <textarea
            id="link-description"
            rows={2}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="What is this link for?"
            aria-label="Description"
            className="px-3 py-2 text-[13px] rounded-md bg-surface border border-border text-primary placeholder-muted focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent transition-[border-color,box-shadow] resize-none min-h-[60px]"
          />
        </div>

        <div className="flex flex-col gap-1">
          <label htmlFor="link-category" className="text-[11px] font-semibold text-muted">CATEGORY</label>
          <CustomSelect
            id="link-category"
            value={category}
            options={CATEGORY_OPTIONS}
            onChange={(val) => setCategory(val)}
            aria-label="Category"
            className="h-9"
          />
        </div>

        <div className="flex flex-col gap-1">
          <label htmlFor="link-tags" className="text-[11px] font-semibold text-muted">TAGS (comma-separated)</label>
          <input
            id="link-tags"
            type="text"
            value={tagsInput}
            onChange={(e) => setTagsInput(e.target.value)}
            placeholder="e.g. important, daily-use"
            aria-label="Tags, comma separated"
            className="h-9 px-3 text-[13px] rounded-md bg-surface border border-border text-primary placeholder-muted focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent transition-[border-color,box-shadow]"
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
          className="flex-1 h-9 rounded-md bg-surface border border-border text-xs font-semibold text-muted hover:text-primary transition-[color] active:scale-[0.98] transition-transform flex items-center justify-center gap-1.5"
        >
          <span>Cancel</span>
          <kbd className="text-[9px] px-1.5 py-0.5 rounded bg-surface border border-border text-muted font-sans font-medium leading-none shadow-sm">Esc</kbd>
        </button>
        <button
          type="submit"
          disabled={isSubmitting}
          className="flex-1 h-9 rounded-md bg-accent text-background text-xs font-semibold hover:opacity-90 active:scale-[0.98] transition-[opacity,transform] disabled:opacity-50 flex items-center justify-center gap-1.5"
        >
          <span>{isSubmitting ? 'Saving…' : 'Save Link'}</span>
          <kbd className="text-[9px] px-1.5 py-0.5 rounded bg-accent border border-accent-dim text-background font-sans font-medium leading-none opacity-85 shadow-sm">Ctrl+Enter</kbd>
        </button>
      </div>
    </form>
  );
}
