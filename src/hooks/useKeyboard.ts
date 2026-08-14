import { useEffect, useState } from 'react';

interface UseKeyboardProps {
  itemsCount: number;
  onEnter: (index: number) => void;
  onShiftEnter: (index: number) => void;
  onEscape: () => void;
  onCtrlN?: () => void;
  onCtrlComma?: () => void;
  onCtrlK?: () => void;
  onCtrlT?: () => void;
  onCtrlH?: () => void;
  onCtrlL?: () => void;
  onCtrlI?: () => void;
  onCtrlF?: () => void;
  onCtrl1?: () => void;
  onCtrl2?: () => void;
  onCtrl3?: () => void;
  onCtrlS?: () => void;
  onCtrlShiftA?: () => void;
  onCtrlQ?: () => void;
  isActive: boolean;
}

export function useKeyboard({ itemsCount, onEnter, onShiftEnter, onEscape, onCtrlN, onCtrlComma, onCtrlK, onCtrlT, onCtrlH, onCtrlL, onCtrlI, onCtrlF, onCtrl1, onCtrl2, onCtrl3, onCtrlS, onCtrlShiftA, onCtrlQ, isActive }: UseKeyboardProps) {
  const [selectedIndex, setSelectedIndex] = useState<number>(0);

  // Reset selected index if items count changes
  useEffect(() => {
    setSelectedIndex(0);
  }, [itemsCount]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Allow Ctrl+1, Ctrl+2, Ctrl+3 subtab shortcuts
      if ((e.ctrlKey || e.metaKey) && !e.shiftKey) {
        if (e.key === '1') {
          e.preventDefault();
          onCtrl1?.();
          return;
        }
        if (e.key === '2') {
          e.preventDefault();
          onCtrl2?.();
          return;
        }
        if (e.key === '3') {
          e.preventDefault();
          onCtrl3?.();
          return;
        }
        if (e.key === 's' || e.key === 'S') {
          e.preventDefault();
          onCtrlS?.();
          return;
        }
      }

      // Allow Ctrl+F from anywhere (not gated by isActive)
      if ((e.key === 'f' || e.key === 'F') && (e.ctrlKey || e.metaKey)) {
        e.preventDefault();
        onCtrlF?.();
        return;
      }

      // Allow Ctrl+K from anywhere (not gated by isActive)
      if (e.key === 'k' && (e.ctrlKey || e.metaKey)) {
        e.preventDefault();
        onCtrlK?.();
        return;
      }

      // Allow Ctrl+T from anywhere
      if (e.key === 't' && (e.ctrlKey || e.metaKey) && !e.shiftKey) {
        e.preventDefault();
        onCtrlT?.();
        return;
      }

      // Allow Ctrl+H from anywhere
      if (e.key === 'h' && (e.ctrlKey || e.metaKey) && !e.shiftKey) {
        e.preventDefault();
        onCtrlH?.();
        return;
      }

      // Allow Ctrl+L from anywhere
      if (e.key === 'l' && (e.ctrlKey || e.metaKey) && !e.shiftKey) {
        e.preventDefault();
        onCtrlL?.();
        return;
      }

      // Allow Ctrl+I from anywhere
      if (e.key === 'i' && (e.ctrlKey || e.metaKey) && !e.shiftKey) {
        e.preventDefault();
        onCtrlI?.();
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
  }, [itemsCount, onEnter, onShiftEnter, onEscape, onCtrlN, onCtrlComma, onCtrlK, onCtrlT, onCtrlH, onCtrlL, onCtrlI, onCtrlF, onCtrl1, onCtrl2, onCtrl3, onCtrlS, onCtrlShiftA, onCtrlQ, selectedIndex, isActive]);

  return { selectedIndex, setSelectedIndex };
}
