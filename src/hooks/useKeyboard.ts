import { useEffect, useState } from 'react';

interface UseKeyboardProps {
  itemsCount: number;
  onEnter: (index: number) => void;
  onShiftEnter: (index: number) => void;
  onEscape: () => void;
  onCtrlN?: () => void;
  onCtrlComma?: () => void;
  onCtrlK?: () => void;
  onCtrlShiftP?: () => void;
  onCtrlShiftH?: () => void;
  onCtrlShiftA?: () => void;
  onCtrlQ?: () => void;
  isActive: boolean;
}

export function useKeyboard({ itemsCount, onEnter, onShiftEnter, onEscape, onCtrlN, onCtrlComma, onCtrlK, onCtrlShiftP, onCtrlShiftH, onCtrlShiftA, onCtrlQ, isActive }: UseKeyboardProps) {
  const [selectedIndex, setSelectedIndex] = useState<number>(0);

  // Reset selected index if items count changes
  useEffect(() => {
    setSelectedIndex(0);
  }, [itemsCount]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Allow Ctrl+K from anywhere (not gated by isActive)
      if (e.key === 'k' && (e.ctrlKey || e.metaKey)) {
        e.preventDefault();
        onCtrlK?.();
        return;
      }

      // Allow Ctrl+Shift+P from anywhere
      if (e.key === 'P' && (e.ctrlKey || e.metaKey) && e.shiftKey) {
        e.preventDefault();
        onCtrlShiftP?.();
        return;
      }

      // Allow Ctrl+Shift+H from anywhere
      if (e.key === 'H' && (e.ctrlKey || e.metaKey) && e.shiftKey) {
        e.preventDefault();
        onCtrlShiftH?.();
        return;
      }

      // Allow Ctrl+Shift+A from anywhere
      if (e.key === 'A' && (e.ctrlKey || e.metaKey) && e.shiftKey) {
        e.preventDefault();
        onCtrlShiftA?.();
        return;
      }

      // Allow Ctrl+Q from anywhere
      if (e.key === 'q' && (e.ctrlKey || e.metaKey)) {
        e.preventDefault();
        onCtrlQ?.();
        return;
      }

      if (!isActive) return;

      // Allow Ctrl+N even if list has no items
      if (e.key === 'n' && (e.ctrlKey || e.metaKey)) {
        e.preventDefault();
        onCtrlN?.();
        return;
      }

      // Allow Ctrl+, even if list has no items
      if (e.key === ',' && (e.ctrlKey || e.metaKey)) {
        e.preventDefault();
        onCtrlComma?.();
        return;
      }

      if (itemsCount === 0) return;

      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex(prev => (prev + 1) % itemsCount);
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex(prev => (prev - 1 + itemsCount) % itemsCount);
      } else if (e.key === 'Enter') {
        e.preventDefault();
        if (e.shiftKey) {
          onShiftEnter(selectedIndex);
        } else {
          onEnter(selectedIndex);
        }
      } else if (e.key === 'Escape') {
        e.preventDefault();
        onEscape();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [itemsCount, onEnter, onShiftEnter, onEscape, onCtrlN, onCtrlComma, onCtrlK, onCtrlShiftP, onCtrlShiftH, onCtrlShiftA, onCtrlQ, selectedIndex, isActive]);

  return { selectedIndex, setSelectedIndex };
}
