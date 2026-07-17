import { useState, useEffect, useCallback } from 'react';
import { listen } from '@tauri-apps/api/event';
import { writeText } from '@tauri-apps/plugin-clipboard-manager';
import { getCurrentWindow } from '@tauri-apps/api/window';
import { invoke } from '@tauri-apps/api/core';

import { SearchBar } from './components/SearchBar';
import { PromptList } from './components/PromptList';
import { AddEditPanel } from './components/AddEditPanel';
import { SettingsPanel } from './components/SettingsPanel';
import { TrayMenuPanel } from './components/TrayMenuPanel';
import { Toast } from './components/Toast';

import { usePrompts } from './hooks/usePrompts';
import { useSearch } from './hooks/useSearch';
import { useKeyboard } from './hooks/useKeyboard';
import { Prompt } from './types';

export default function App() {
  const [view, setView] = useState<'list' | 'add' | 'edit' | 'settings' | 'tray-menu'>('list');
  const [editingPrompt, setEditingPrompt] = useState<Prompt | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [inlineActive, setInlineActive] = useState(false);
  const [searchFocused, setSearchFocused] = useState(true);

  // Toast state
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [toastType, setToastType] = useState<'success' | 'error'>('success');

  const showToast = useCallback((message: string, type: 'success' | 'error' = 'success') => {
    setToastMessage(message);
    setToastType(type);
  }, []);

  const hideToast = useCallback(() => {
    setToastMessage(null);
  }, []);

  // CRUD hooks
  const { prompts, loading, addPrompt, updatePrompt, deletePrompt } = usePrompts(showToast);

  // Search filter hook
  const filteredPrompts = useSearch(prompts, searchQuery);

  // Copy Only Flow
  const handleCopyPrompt = async (prompt: Prompt) => {
    try {
      await writeText(prompt.text);
      showToast('Copied!', 'success');
      
      // Hide window after a tiny delay so the toast transitions nicely
      setTimeout(async () => {
        const win = getCurrentWindow();
        await win.hide();
      }, 150);
    } catch (err: any) {
      console.error('Copy failed:', err);
      showToast('Copy failed: ' + err.toString(), 'error');
    }
  };

  // Auto-Paste Flow
  const handlePastePrompt = async (prompt: Prompt) => {
    try {
      // 1. Get captured HWND
      const hwnd = await invoke<number>('get_foreground_hwnd');
      
      // 2. Copy text to clipboard
      await writeText(prompt.text);
      
      // 3. Hide window immediately
      const win = getCurrentWindow();
      await win.hide();
      
      // 4. Call Rust to restore focus, sleep, and paste
      await invoke('paste_to_previous_window', { hwnd });
    } catch (err: any) {
      console.error('Auto-paste failed:', err);
      showToast('Auto-paste failed: ' + err.toString(), 'error');
    }
  };

  // Keyboard navigation handlers
  const handleKeyboardEnter = (index: number) => {
    if (filteredPrompts[index]) {
      handlePastePrompt(filteredPrompts[index]);
    }
  };

  const handleKeyboardShiftEnter = (index: number) => {
    if (filteredPrompts[index]) {
      handleCopyPrompt(filteredPrompts[index]);
    }
  };

  const handleKeyboardEscape = async () => {
    const win = getCurrentWindow();
    await win.hide();
    
    // Deactivate hook in Rust
    await invoke('paste_to_previous_window', { hwnd: 0 });
  };

  // Setup keyboard hook navigation
  const { selectedIndex, setSelectedIndex } = useKeyboard({
    itemsCount: filteredPrompts.length,
    onEnter: handleKeyboardEnter,
    onShiftEnter: handleKeyboardShiftEnter,
    onEscape: handleKeyboardEscape,
    onCtrlN: () => setView('add'),
    onCtrlComma: () => setView('settings'),
    isActive: view === 'list' && !loading,
  });

  // Listen for Tauri events
  useEffect(() => {
    const unlistenStart = listen('inline-search-start', () => {
      setInlineActive(true);
      setView('list');
      setSearchQuery('');
      setSearchFocused(true);
    });

    const unlistenQuery = listen<string>('inline-search-query', (event) => {
      setSearchQuery(event.payload);
      setInlineActive(true);
    });

    const unlistenEnd = listen('inline-search-end', () => {
      setInlineActive(false);
      setSearchQuery('');
    });

    const unlistenOpenList = listen('open-list', () => {
      setView('list');
      setSearchQuery('');
      setSearchFocused(true);
    });

    const unlistenOpenSettings = listen('open-settings', () => {
      setView('settings');
    });

    const unlistenOpenTrayMenu = listen('open-tray-menu', () => {
      setView('tray-menu');
    });

    return () => {
      unlistenStart.then((f) => f());
      unlistenQuery.then((f) => f());
      unlistenEnd.then((f) => f());
      unlistenOpenList.then((f) => f());
      unlistenOpenSettings.then((f) => f());
      unlistenOpenTrayMenu.then((f) => f());
    };
  }, []);

  const handleAddSave = async (title: string, text: string, tags: string[]) => {
    const success = await addPrompt(title, text, tags);
    if (success) {
      setView('list');
    }
    return success;
  };

  const handleEditSave = async (title: string, text: string, tags: string[]) => {
    if (editingPrompt) {
      const success = await updatePrompt(editingPrompt.id, title, text, tags);
      if (success) {
        setEditingPrompt(null);
        setView('list');
      }
      return success;
    }
    return false;
  };

  const isTrayMenu = window.location.search.includes('window=tray_menu');

  if (isTrayMenu) {
    return <TrayMenuPanel />;
  }

  return (
    <div data-tauri-drag-region className="w-full h-full bg-background border border-border rounded-lg overflow-hidden flex flex-col p-3 select-none">
      {/* Toast popup */}
      {toastMessage && (
        <Toast message={toastMessage} type={toastType} onClose={hideToast} />
      )}

      {view === 'list' && (
        <>
          <SearchBar
            value={searchQuery}
            onChange={setSearchQuery}
            onOpenSettings={() => setView('settings')}
            isFocused={searchFocused}
          />
          {loading ? (
            <div className="flex-1 flex items-center justify-center">
              <span className="text-xs text-muted">Loading prompts...</span>
            </div>
          ) : (
            <PromptList
              prompts={filteredPrompts}
              selectedIndex={selectedIndex}
              onSelectPrompt={setSelectedIndex}
              onEditPrompt={(prompt) => {
                setEditingPrompt(prompt);
                setView('edit');
              }}
              onDeletePrompt={deletePrompt}
              onCopyPrompt={handleCopyPrompt}
              onPastePrompt={handlePastePrompt}
              onAddClick={() => setView('add')}
            />
          )}
          {inlineActive && (
            <div className="mt-1 flex items-center justify-between px-2 py-1 bg-accent-dim/10 border border-accent/20 rounded-md text-[10px] text-accent animate-pulse">
              <span>Inline search active: type to filter, click card to paste</span>
              <button
                onClick={handleKeyboardEscape}
                className="hover:underline font-bold"
              >
                [Esc] Close
              </button>
            </div>
          )}
        </>
      )}

      {view === 'add' && (
        <AddEditPanel
          prompt={null}
          onSave={handleAddSave}
          onCancel={() => setView('list')}
        />
      )}

      {view === 'edit' && (
        <AddEditPanel
          prompt={editingPrompt}
          onSave={handleEditSave}
          onCancel={() => {
            setEditingPrompt(null);
            setView('list');
          }}
        />
      )}

      {view === 'settings' && (
        <SettingsPanel
          onBack={() => setView('list')}
          showToast={showToast}
        />
      )}
    </div>
  );
}
