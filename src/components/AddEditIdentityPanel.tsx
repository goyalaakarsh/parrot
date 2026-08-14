import { useState, useEffect, useRef } from 'react';
import { ArrowLeft, Plus, Trash2 } from 'lucide-react';
import { Identity, IdentityField } from '../types';
import { CustomSelect } from './CustomSelect';

interface AddEditIdentityPanelProps {
  identity?: Identity | null;
  onSave: (data: Omit<Identity, 'id' | 'createdAt' | 'pinned'>) => Promise<boolean>;
  onCancel: () => void;
}

const FIELD_TYPES = ['text', 'email', 'phone', 'address'] as const;
const FIELD_TYPE_OPTIONS = FIELD_TYPES.map((t) => ({ value: t, label: t }));
const FIELD_TEMPLATES = [
  { label: 'Full Name', type: 'text' as const },
  { label: 'Email', type: 'email' as const },
  { label: 'Phone', type: 'phone' as const },
  { label: 'Address Line 1', type: 'address' as const },
  { label: 'Address Line 2', type: 'address' as const },
  { label: 'City', type: 'text' as const },
  { label: 'State', type: 'text' as const },
  { label: 'ZIP Code', type: 'text' as const },
  { label: 'Country', type: 'text' as const },
  { label: 'Company', type: 'text' as const },
  { label: 'Job Title', type: 'text' as const },
  { label: 'Website', type: 'text' as const },
];

function createFieldId(): string {
  return crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(2, 15);
}

export function AddEditIdentityPanel({ identity, onSave, onCancel }: AddEditIdentityPanelProps) {
  const [name, setName] = useState('');
  const [fields, setFields] = useState<IdentityField[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const nameRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (identity) {
      setName(identity.name);
      setFields(identity.fields);
    } else {
      setName('');
      setFields([
        { id: createFieldId(), label: 'Email', value: '', type: 'email' },
        { id: createFieldId(), label: 'Phone', value: '', type: 'phone' },
      ]);
    }
    setError(null);
  }, [identity]);

  useEffect(() => {
    nameRef.current?.focus();
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

  const addField = (template?: { label: string; type: IdentityField['type'] }) => {
    setFields([...fields, {
      id: createFieldId(),
      label: template?.label || '',
      value: '',
      type: template?.type || 'text',
    }]);
  };

  const removeField = (id: string) => {
    setFields(fields.filter(f => f.id !== id));
  };

  const updateField = (id: string, updates: Partial<IdentityField>) => {
    setFields(fields.map(f => f.id === id ? { ...f, ...updates } : f));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!name.trim()) {
      setError('Identity name is required');
      return;
    }

    const validFields = fields.filter(f => f.label.trim());
    if (validFields.length === 0) {
      setError('Add at least one field with a label');
      return;
    }

    setIsSubmitting(true);
    const success = await onSave({
      name: name.trim(),
      fields: validFields,
      updatedAt: undefined,
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
            {identity ? 'Edit Identity' : 'New Identity'}
          </h2>
          <button
            type="button"
            onClick={onCancel}
            aria-label="Back to identities"
            className="flex items-center gap-1.5 px-1.5 py-1 rounded-md text-muted hover:text-accent hover:bg-surface-hover transition-[color,background-color]"
          >
            <ArrowLeft size={16} aria-hidden="true" />
            <kbd className="text-[9px] px-1 py-0.5 rounded bg-surface border border-border text-muted font-sans font-medium leading-none">Esc</kbd>
          </button>
        </div>

        {error && (
          <div role="alert" className="px-3 py-2 rounded bg-danger/10 border border-danger/20 text-danger text-xs font-medium animate-slide-up">
            {error}
          </div>
        )}

        <div className="flex flex-col gap-1">
          <label htmlFor="identity-name" className="text-[11px] font-semibold text-muted">IDENTITY NAME</label>
          <input
            ref={nameRef}
            id="identity-name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Home, Work, Shipping"
            aria-label="Identity name"
            className="h-9 px-3 text-[13px] rounded-md bg-surface border border-border text-primary placeholder-muted focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent transition-[border-color,box-shadow]"
          />
        </div>

        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <label className="text-[11px] font-semibold text-muted">FIELDS</label>
            <button
              type="button"
              onClick={() => addField()}
              className="text-[10px] text-accent hover:text-accent/80 font-medium flex items-center gap-1"
            >
              <Plus size={11} />
              Add Custom
            </button>
          </div>

          {/* Quick add templates */}
          <div className="flex flex-wrap gap-1">
            {FIELD_TEMPLATES.slice(0, 6).map((template) => (
              <button
                key={template.label}
                type="button"
                onClick={() => addField(template)}
                className="text-[9px] px-1.5 py-0.5 rounded bg-surface-hover border border-border text-muted hover:text-accent hover:border-accent/30 transition-all"
              >
                + {template.label}
              </button>
            ))}
          </div>

          {/* Fields list */}
          <div className="space-y-2 mt-1">
            {fields.map((field) => (
              <div key={field.id} className="flex items-start gap-2">
                <div className="flex-1 grid grid-cols-[100px_1fr] gap-2">
                  <input
                    type="text"
                    value={field.label}
                    onChange={(e) => updateField(field.id, { label: e.target.value })}
                    placeholder="Label"
                    aria-label="Field label"
                    className="h-8 px-2 text-[11px] rounded bg-surface border border-border text-primary placeholder-muted focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent transition-[border-color,box-shadow]"
                  />
                  <input
                    type="text"
                    value={field.value}
                    onChange={(e) => updateField(field.id, { value: e.target.value })}
                    placeholder="Value"
                    aria-label="Field value"
                    className="h-8 px-2 text-[11px] rounded bg-surface border border-border text-primary placeholder-muted focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent transition-[border-color,box-shadow]"
                  />
                </div>
                <CustomSelect
                  value={field.type}
                  options={FIELD_TYPE_OPTIONS}
                  onChange={(val) => updateField(field.id, { type: val as IdentityField['type'] })}
                  aria-label="Field type"
                  className="w-20 h-8"
                />
                <button
                  type="button"
                  onClick={() => removeField(field.id)}
                  className="shrink-0 h-8 w-8 flex items-center justify-center rounded text-muted hover:text-danger hover:bg-surface-hover transition-all"
                  aria-label="Remove field"
                >
                  <Trash2 size={12} />
                </button>
              </div>
            ))}
          </div>
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
          <span>{isSubmitting ? 'Saving…' : 'Save Identity'}</span>
          <kbd className="text-[9px] px-1.5 py-0.5 rounded bg-accent border border-accent-dim text-background font-sans font-medium leading-none opacity-85 shadow-sm">Ctrl+Enter</kbd>
        </button>
      </div>
    </form>
  );
}
