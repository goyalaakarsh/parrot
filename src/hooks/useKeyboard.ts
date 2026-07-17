import { useEffect, useState } from 'react';

interface UseKeyboardProps {
  itemsCount: number;
  onEnter: (index: number) => void;
  onShiftEnter: (index: number) => void;
  onEscape: () => void;
  onCtrlN?: () => void;
  onCtrlComma?: () => void;
  isActive: boolean;
}

export function useKeyboard({ itemsCount, onEnter, onShiftEnter, onEscape, onCtrlN, onCtrlComma, isActive }: UseKeyboardProps) {
  const [selectedIndex, setSelectedIndex] = useState<number>(0);

  // Reset selected index if items count changes
  useEffect(() => {
    setSelectedIndex(0);
  }, [itemsCount]);

  useEffect(() => {
    if (!isActive) return;

    const handleKeyDown = (e: KeyboardEvent) => {
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
  }, [itemsCount, onEnter, onShiftEnter, onEscape, onCtrlN, onCtrlComma, selectedIndex, isActive]);

  return { selectedIndex, setSelectedIndex };
}
