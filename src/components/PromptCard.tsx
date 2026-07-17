import { useState } from 'react';
import { Edit2, Trash2, Clipboard, CornerDownLeft, AlertCircle } from 'lucide-react';
import { Prompt } from '../types';

interface PromptCardProps {
  prompt: Prompt;
  isSelected: boolean;
  onSelect: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onCopy: () => void;
  onPaste: () => void;
}

export function PromptCard({
  prompt,
  isSelected,
  onSelect,
  onEdit,
  onDelete,
  onCopy,
  onPaste,
}: PromptCardProps) {
  const [isDeleting, setIsDeleting] = useState(false);

  // Truncate text to first 65 characters
  const truncatedText =
    prompt.text.length > 65 ? `${prompt.text.substring(0, 65)}...` : prompt.text;

  const handleDeleteClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsDeleting(true);
  };

  const handleConfirmDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    onDelete();
    setIsDeleting(false);
  };

  const handleCancelDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsDeleting(false);
  };

  return (
    <div
      onClick={onSelect}
      className={`relative group w-full flex flex-col p-3 rounded-md border text-left cursor-pointer transition-all duration-100 ${
        isSelected
          ? 'border-accent bg-accent-dim/15'
          : 'border-transparent bg-surface hover:border-border'
      }`}
    >
      {/* Left accent bar on selected card */}
      {isSelected && (
        <div className="absolute left-0 top-0 bottom-0 w-[3px] bg-accent rounded-l-md" />
      )}

      {isDeleting ? (
        <div className="flex flex-col gap-2 w-full animate-slide-up">
          <div className="flex items-center gap-1.5 text-danger text-xs font-semibold">
            <AlertCircle size={14} />
            <span>Delete this prompt?</span>
          </div>
          <div className="flex gap-2 justify-end">
            <button
              onClick={handleCancelDelete}
              className="px-2 py-1 text-xs rounded bg-surface-hover border border-border text-muted hover:text-primary transition-all"
            >
              Cancel
            </button>
            <button
              onClick={handleConfirmDelete}
              className="px-2 py-1 text-xs rounded bg-danger/20 border border-danger/30 text-danger hover:bg-danger/30 transition-all"
            >
              Delete
            </button>
          </div>
        </div>
      ) : (
        <>
          <div className="flex items-start justify-between gap-2">
            <span className={`text-[13px] font-semibold truncate ${prompt.title ? 'text-primary' : 'text-muted italic'}`}>
              {prompt.title || 'Untitled'}
            </span>
            
            {/* Action buttons (always visible if selected, visible on hover otherwise) */}
            <div className={`flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-100 ${
              isSelected ? 'opacity-100' : ''
            }`}>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onCopy();
                }}
                title="Copy (Enter)"
                className="p-1 rounded text-muted hover:text-accent hover:bg-surface-hover transition-all"
              >
                <Clipboard size={13} />
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onPaste();
                }}
                title="Auto-paste (Shift+Enter)"
                className="p-1 rounded text-muted hover:text-accent hover:bg-surface-hover transition-all"
              >
                <CornerDownLeft size={13} />
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onEdit();
                }}
                title="Edit"
                className="p-1 rounded text-muted hover:text-accent hover:bg-surface-hover transition-all"
              >
                <Edit2 size={13} />
              </button>
              <button
                onClick={handleDeleteClick}
                title="Delete"
                className="p-1 rounded text-muted hover:text-danger hover:bg-surface-hover transition-all"
              >
                <Trash2 size={13} />
              </button>
            </div>
          </div>

          <p className="text-xs text-muted mt-1 break-words line-clamp-2">
            {truncatedText}
          </p>

          {prompt.tags.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-2">
              {prompt.tags.map((tag) => (
                <span
                  key={tag}
                  className="px-1.5 py-0.5 rounded text-[10px] bg-surface-hover border border-border text-muted font-medium"
                >
                  #{tag}
                </span>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
