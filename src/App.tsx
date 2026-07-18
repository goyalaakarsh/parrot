import { useState, useEffect, useCallback, useMemo } from 'react';
import { listen } from '@tauri-apps/api/event';
import { writeText } from '@tauri-apps/plugin-clipboard-manager';
import { getCurrentWindow } from '@tauri-apps/api/window';
import { invoke } from '@tauri-apps/api/core';

import { SearchBar } from './components/SearchBar';
import { PromptList } from './components/PromptList';
import { AddEditPanel } from './components/AddEditPanel';
import { SettingsPanel } from './components/SettingsPanel';
import { AboutPanel } from './components/AboutPanel';
import { TrayMenuPanel } from './components/TrayMenuPanel';
import { CommandPalette } from './components/CommandPalette';
import { Toast } from './components/Toast';
import { Onboarding } from './components/Onboarding';

import { usePrompts } from './hooks/usePrompts';
import { useSearch } from './hooks/useSearch';
import { useKeyboard } from './hooks/useKeyboard';
import { Prompt } from './types';

export default function App() {
  const [view, setView] = useState<'list' | 'add' | 'edit' | 'settings' | 'about' | 'command-palette' | 'tray-menu'>('list');
  const [editingPrompt, setEditingPrompt] = useState<Prompt | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
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
  const { prompts, loading, addPrompt, updatePrompt, deletePrompt, markPromptUsed } = usePrompts(showToast);

  // Search filter hook
  const filteredPrompts = useSearch(prompts, searchQuery);

  // Focus search bar when returning to list view
  useEffect(() => {
    if (view === 'list') {
      setSearchFocused(true);
    }
  }, [view]);

  // Copy Only Flow
  const handleCopyPrompt = async (prompt: Prompt) => {
    try {
      await writeText(prompt.text);
      markPromptUsed(prompt.id);
      showToast('Copied!', 'success');
      
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
      const hwnd = await invoke<number>('get_foreground_hwnd');
      await writeText(prompt.text);
      markPromptUsed(prompt.id);
      const win = getCurrentWindow();
      await win.hide();
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
    onCtrlK: () => setView('command-palette'),
    isActive: view === 'list' && !loading,
  });

  // Commands for the command palette
  const commands = useMemo(() => [
    {
      id: 'open-prompts',
      label: 'Open Texts',
      category: 'Navigation',
      shortcut: 'Ctrl+Shift+P',
      action: () => { setView('list'); setSearchFocused(true); },
      enabled: true,
    },
    {
      id: 'open-settings',
      label: 'Open Settings',
      category: 'Navigation',
      shortcut: 'Ctrl+,',
      action: () => setView('settings'),
      enabled: true,
    },
    {
      id: 'add-prompt',
      label: 'Add Text',
      category: 'Navigation',
      shortcut: 'Ctrl+N',
      action: () => setView('add'),
      enabled: true,
    },
    {
      id: 'copy-selected',
      label: 'Copy Selected',
      category: 'Actions',
      shortcut: 'Shift+Enter',
      action: () => {
        if (filteredPrompts[selectedIndex]) {
          handleCopyPrompt(filteredPrompts[selectedIndex]);
        }
      },
      enabled: filteredPrompts.length > 0,
    },
    {
      id: 'paste-selected',
      label: 'Paste Selected',
      category: 'Actions',
      shortcut: 'Enter',
      action: () => {
        if (filteredPrompts[selectedIndex]) {
          handlePastePrompt(filteredPrompts[selectedIndex]);
        }
      },
      enabled: filteredPrompts.length > 0,
    },
    {
      id: 'toggle-palette',
      label: 'Command Palette',
      category: 'App',
      shortcut: 'Ctrl+K',
      action: () => setView('command-palette'),
      enabled: true,
    },
    {
      id: 'about',
      label: 'About Parrot',
      category: 'App',
      shortcut: 'Ctrl+Shift+A',
      action: () => setView('about'),
      enabled: true,
    },
    {
      id: 'quit',
      label: 'Quit Parrot',
      category: 'App',
      shortcut: 'Ctrl+Q',
      action: () => { invoke('exit_app'); },
      enabled: true,
    },
  ], [filteredPrompts, selectedIndex, handleCopyPrompt, handlePastePrompt]);

  // Listen for Tauri events
  useEffect(() => {
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

    const unlistenOpenAdd = listen('open-add', () => {
      setView('add');
    });

    const unlistenOpenAbout = listen('open-about', () => {
      setView('about');
    });

    const unlistenOpenPalette = listen('open-palette', () => {
      setView('command-palette');
    });

    return () => {
      unlistenOpenList.then((f) => f());
      unlistenOpenSettings.then((f) => f());
      unlistenOpenTrayMenu.then((f) => f());
      unlistenOpenAdd.then((f) => f());
      unlistenOpenAbout.then((f) => f());
      unlistenOpenPalette.then((f) => f());
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

  const [showOnboarding, setShowOnboarding] = useState(false);

  useEffect(() => {
    invoke<boolean>('check_first_run').then((isFirst) => {
      if (isFirst) setShowOnboarding(true);
    });
  }, []);

  if (isTrayMenu) {
    return <TrayMenuPanel />;
  }

  const screenName: Record<string, string> = {
    list: 'Texts',
    add: 'Add Text',
    edit: 'Edit Text',
    settings: 'Settings',
    about: 'About',
    'command-palette': 'Commands',
  };

  return (
    <div className="w-full h-full bg-background border border-border rounded-lg overflow-clip flex flex-col p-3 select-none">
      {showOnboarding && (
        <Onboarding onDismiss={() => setShowOnboarding(false)} />
      )}

      {toastMessage && (
        <Toast message={toastMessage} type={toastType} onClose={hideToast} />
      )}

      {/* Top bar */}
      <div data-tauri-drag-region className="flex items-center justify-between -mx-3 -mt-3 px-3 py-2 border-b border-border mb-3 cursor-default shrink-0">
        <div className="flex items-center gap-2">
          <img src="/parrot-icon-transparent.png" alt="" className="w-5 h-5" />
          <span className="text-xs font-semibold text-primary">Parrot</span>
        </div>
        <span className="text-[10px] font-medium text-muted">{screenName[view] || view}</span>
      </div>

      {view === 'list' && (
        <>
          <SearchBar
            value={searchQuery}
            onChange={setSearchQuery}
            onOpenSettings={() => setView('settings')}
            onOpenPalette={() => setView('command-palette')}
            isFocused={searchFocused}
          />
          {loading ? (
            <div role="status" className="flex-1 flex items-center justify-center">
              <span className="text-xs text-muted">Loading texts...</span>
            </div>
          ) : (
            <PromptList
              prompts={filteredPrompts}
              totalCount={prompts.length}
              searchQuery={searchQuery}
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

      {view === 'about' && (
        <AboutPanel
          onBack={() => setView('list')}
        />
      )}

      {view === 'command-palette' && (
        <CommandPalette
          onClose={() => setView('list')}
          commands={commands}
        />
      )}
    </div>
  );
}
