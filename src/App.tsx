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
import { HistoryPanel } from './components/HistoryPanel';
import { UnifiedSearchResults } from './components/UnifiedSearchResults';
import { LinkList } from './components/LinkList';
import { AddEditLinkPanel } from './components/AddEditLinkPanel';
import { IdentityList } from './components/IdentityList';
import { AddEditIdentityPanel } from './components/AddEditIdentityPanel';

import { usePrompts } from './hooks/usePrompts';
import { useSearch } from './hooks/useSearch';
import { useHistory } from './hooks/useHistory';
import { useLinks } from './hooks/useLinks';
import { useIdentities } from './hooks/useIdentities';
import { useKeyboard } from './hooks/useKeyboard';
import { Prompt, HistoryEntry, SavedLink, Identity, Settings } from './types';

export default function App() {
  const [view, setView] = useState<'list' | 'add' | 'edit' | 'settings' | 'about' | 'command-palette' | 'tray-menu' | 'add-link' | 'edit-link' | 'add-identity' | 'edit-identity'>('list');
  const [editingPrompt, setEditingPrompt] = useState<Prompt | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchFocused, setSearchFocused] = useState(true);
  const [activeTab, setActiveTab] = useState<'texts' | 'history' | 'links' | 'identity'>('texts');
  const [activeTag, setActiveTag] = useState<string | null>(null);
  const [historyFilter, setHistoryFilter] = useState<'all' | 'text' | 'images'>('all');
  const [theme, setTheme] = useState<'dark' | 'light' | 'system'>('dark');

  // Links state
  const [editingLink, setEditingLink] = useState<SavedLink | null>(null);
  const [linkCategoryFilter, setLinkCategoryFilter] = useState('');

  // Identity state
  const [editingIdentity, setEditingIdentity] = useState<Identity | null>(null);

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

  // Load theme from settings on mount
  useEffect(() => {
    invoke<Settings>('get_settings').then((s) => {
      setTheme(s.theme || 'dark');
    }).catch(() => {});
  }, []);

  // Apply theme class to <html>
  useEffect(() => {
    const mq = window.matchMedia('(prefers-color-scheme: light)');
    const apply = () => {
      const resolved = theme === 'system' ? (mq.matches ? 'light' : 'dark') : theme;
      document.documentElement.classList.toggle('light', resolved === 'light');
    };
    apply();
    if (theme === 'system') {
      mq.addEventListener('change', apply);
      return () => mq.removeEventListener('change', apply);
    }
  }, [theme]);

  // CRUD hooks
  const { prompts, loading, addPrompt, updatePrompt, deletePrompt, markPromptUsed, togglePin, refresh: refreshPrompts } = usePrompts(showToast);
  const { historyEntries, loading: historyLoading, deleteHistoryEntry, promoteToPrompt, refresh: refreshHistory } = useHistory(showToast);
  const { links, loading: linksLoading, addLink, updateLink, deleteLink, markLinkUsed, togglePin: toggleLinkPin, refresh: refreshLinks } = useLinks(showToast);
  const { identities, loading: identitiesLoading, addIdentity, updateIdentity, deleteIdentity, togglePin: toggleIdentityPin, refresh: refreshIdentities } = useIdentities(showToast);

  // Search filter hook (for My Texts tab)
  const filteredPrompts = useSearch(prompts, searchQuery, activeTag);

  // Search filter for history
  const filteredHistory = useMemo(() => {
    if (!searchQuery.trim()) return historyEntries;
    const q = searchQuery.toLowerCase().trim();
    return historyEntries.filter(e => {
      if (e.text && e.text.toLowerCase().includes(q)) return true;
      if (e.sourceApp && e.sourceApp.toLowerCase().includes(q)) return true;
      return false;
    });
  }, [historyEntries, searchQuery]);

  // Whether we're in unified search mode (showing results from both tabs)
  const isSearching = searchQuery.trim().length > 0;

  // Search filter for links
  const filteredLinks = useMemo(() => {
    let result = links;
    if (linkCategoryFilter) {
      result = result.filter(l => l.category === linkCategoryFilter);
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter(l => {
        if (l.title.toLowerCase().includes(q)) return true;
        if (l.url.toLowerCase().includes(q)) return true;
        if (l.description.toLowerCase().includes(q)) return true;
        if (l.category.toLowerCase().includes(q)) return true;
        if (l.tags.some(t => t.toLowerCase().includes(q))) return true;
        return false;
      });
    }
    return result;
  }, [links, searchQuery, linkCategoryFilter]);

  // Search filter for identities
  const filteredIdentities = useMemo(() => {
    if (!searchQuery.trim()) return identities;
    const q = searchQuery.toLowerCase().trim();
    return identities.filter(i => {
      if (i.name.toLowerCase().includes(q)) return true;
      if (i.fields.some(f => f.label.toLowerCase().includes(q) || f.value.toLowerCase().includes(q))) return true;
      return false;
    });
  }, [identities, searchQuery]);

  const displayHistory = useMemo(() => {
    if (historyFilter === 'text') return filteredHistory.filter(e => !e.imagePath);
    if (historyFilter === 'images') return filteredHistory.filter(e => e.imagePath);
    return filteredHistory;
  }, [filteredHistory, historyFilter]);

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

  // History Copy Flow
  const handleCopyHistory = async (entry: HistoryEntry) => {
    try {
      if (entry.imagePath) {
        await invoke('copy_image', { entryId: entry.id });
      } else {
        await writeText(entry.text);
      }
      showToast('Copied!', 'success');
      setTimeout(async () => {
        const win = getCurrentWindow();
        await win.hide();
      }, 150);
    } catch (err: any) {
      showToast('Copy failed: ' + err.toString(), 'error');
    }
  };

  // History Paste Flow
  const handlePasteHistory = async (entry: HistoryEntry) => {
    try {
      if (entry.imagePath) {
        // Image paste — handled by Rust command
        await invoke('paste_image', { entryId: entry.id });
      } else {
        // Text paste — existing flow
        const hwnd = await invoke<number>('get_foreground_hwnd');
        await writeText(entry.text);
        const win = getCurrentWindow();
        await win.hide();
        await invoke('paste_to_previous_window', { hwnd });
      }
    } catch (err: any) {
      showToast('Paste failed: ' + err.toString(), 'error');
    }
  };

  // History Promote Flow
  const handlePromoteHistory = async (entry: HistoryEntry) => {
    try {
      await promoteToPrompt(entry.id);
      showToast('Saved to My Texts', 'success');
    } catch (err: any) {
      showToast('Failed to save: ' + err.toString(), 'error');
    }
  };

  // History Delete Flow
  const handleDeleteHistory = async (id: string) => {
    try {
      await deleteHistoryEntry(id);
      showToast('History entry deleted', 'success');
    } catch (err: any) {
      showToast('Delete failed: ' + err.toString(), 'error');
    }
  };

  // Links Copy Flow
  const handleCopyLink = async (link: SavedLink) => {
    try {
      await writeText(link.url);
      markLinkUsed(link.id);
      showToast('Link copied!', 'success');
      setTimeout(async () => {
        const win = getCurrentWindow();
        await win.hide();
      }, 150);
    } catch (err: any) {
      console.error('Copy failed:', err);
      showToast('Copy failed: ' + err.toString(), 'error');
    }
  };

  // Links Paste Flow
  const handlePasteLink = async (link: SavedLink) => {
    try {
      const hwnd = await invoke<number>('get_foreground_hwnd');
      await writeText(link.url);
      markLinkUsed(link.id);
      const win = getCurrentWindow();
      await win.hide();
      await invoke('paste_to_previous_window', { hwnd });
    } catch (err: any) {
      console.error('Auto-paste failed:', err);
      showToast('Auto-paste failed: ' + err.toString(), 'error');
    }
  };

  // Identity Copy Field Flow
  const handleCopyIdentityField = async (value: string) => {
    try {
      await writeText(value);
      showToast('Copied!', 'success');
      setTimeout(async () => {
        const win = getCurrentWindow();
        await win.hide();
      }, 150);
    } catch (err: any) {
      showToast('Copy failed: ' + err.toString(), 'error');
    }
  };

  // Identity Copy Block Flow
  const handleCopyIdentityBlock = async (identity: Identity) => {
    try {
      const block = identity.fields
        .filter(f => f.value.trim())
        .map(f => `${f.label}: ${f.value}`)
        .join('\n');
      await writeText(block);
      showToast('Identity block copied!', 'success');
      setTimeout(async () => {
        const win = getCurrentWindow();
        await win.hide();
      }, 150);
    } catch (err: any) {
      showToast('Copy failed: ' + err.toString(), 'error');
    }
  };

  // Keyboard navigation handlers
  const handleKeyboardEnter = useCallback((index: number) => {
    if (isSearching) {
      // Unified search mode: index spans texts, history, links, identities
      if (index < filteredPrompts.length) {
        handlePastePrompt(filteredPrompts[index]);
      } else if (index < filteredPrompts.length + displayHistory.length) {
        const historyIdx = index - filteredPrompts.length;
        if (displayHistory[historyIdx]) {
          handlePasteHistory(displayHistory[historyIdx]);
        }
      } else if (index < filteredPrompts.length + displayHistory.length + filteredLinks.length) {
        const linkIdx = index - filteredPrompts.length - displayHistory.length;
        if (filteredLinks[linkIdx]) {
          handlePasteLink(filteredLinks[linkIdx]);
        }
      } else {
        const identityIdx = index - filteredPrompts.length - displayHistory.length - filteredLinks.length;
        if (filteredIdentities[identityIdx]) {
          handleCopyIdentityBlock(filteredIdentities[identityIdx]);
        }
      }
    } else if (activeTab === 'texts' && filteredPrompts[index]) {
      handlePastePrompt(filteredPrompts[index]);
    } else if (activeTab === 'history' && displayHistory[index]) {
      handlePasteHistory(displayHistory[index]);
    } else if (activeTab === 'links' && filteredLinks[index]) {
      handlePasteLink(filteredLinks[index]);
    } else if (activeTab === 'identity' && filteredIdentities[index]) {
      handleCopyIdentityBlock(filteredIdentities[index]);
    }
  }, [isSearching, activeTab, filteredPrompts, displayHistory, filteredLinks, filteredIdentities, handlePastePrompt, handlePasteHistory, handlePasteLink, handleCopyIdentityBlock]);

  const handleKeyboardShiftEnter = useCallback((index: number) => {
    if (isSearching) {
      if (index < filteredPrompts.length) {
        handleCopyPrompt(filteredPrompts[index]);
      } else if (index < filteredPrompts.length + displayHistory.length) {
        const historyIdx = index - filteredPrompts.length;
        if (displayHistory[historyIdx]) {
          handleCopyHistory(displayHistory[historyIdx]);
        }
      } else if (index < filteredPrompts.length + displayHistory.length + filteredLinks.length) {
        const linkIdx = index - filteredPrompts.length - displayHistory.length;
        if (filteredLinks[linkIdx]) {
          handleCopyLink(filteredLinks[linkIdx]);
        }
      } else {
        const identityIdx = index - filteredPrompts.length - displayHistory.length - filteredLinks.length;
        if (filteredIdentities[identityIdx]) {
          handleCopyIdentityBlock(filteredIdentities[identityIdx]);
        }
      }
    } else if (activeTab === 'texts' && filteredPrompts[index]) {
      handleCopyPrompt(filteredPrompts[index]);
    } else if (activeTab === 'history' && displayHistory[index]) {
      handleCopyHistory(displayHistory[index]);
    } else if (activeTab === 'links' && filteredLinks[index]) {
      handleCopyLink(filteredLinks[index]);
    } else if (activeTab === 'identity' && filteredIdentities[index]) {
      handleCopyIdentityBlock(filteredIdentities[index]);
    }
  }, [isSearching, activeTab, filteredPrompts, displayHistory, filteredLinks, filteredIdentities, handleCopyPrompt, handleCopyHistory, handleCopyLink, handleCopyIdentityBlock]);

  const handleKeyboardEscape = useCallback(async () => {
    if (searchQuery.length > 0) {
      setSearchQuery('');
      return;
    }
    const win = getCurrentWindow();
    await win.hide();
    await invoke('paste_to_previous_window', { hwnd: 0 });
  }, [searchQuery]);

  // Total items count for keyboard navigation
  const keyboardItemCount = isSearching
    ? filteredPrompts.length + displayHistory.length + filteredLinks.length + filteredIdentities.length
    : (activeTab === 'texts' ? filteredPrompts.length
      : activeTab === 'history' ? displayHistory.length
      : activeTab === 'links' ? filteredLinks.length
      : filteredIdentities.length);

  // Setup keyboard hook navigation
  const { selectedIndex, setSelectedIndex } = useKeyboard({
    itemsCount: keyboardItemCount,
    onEnter: handleKeyboardEnter,
    onShiftEnter: handleKeyboardShiftEnter,
    onEscape: handleKeyboardEscape,
    onCtrlN: () => {
      if (activeTab === 'texts') setView('add');
      else if (activeTab === 'links') setView('add-link');
      else if (activeTab === 'identity') setView('add-identity');
    },
    onCtrlComma: () => setView('settings'),
    onCtrlK: () => setView('command-palette'),
    onCtrlT: () => {
      setView('list');
      setActiveTab('texts');
      setSearchFocused(true);
    },
    onCtrlH: () => {
      setView('list');
      setActiveTab('history');
      setSearchFocused(true);
    },
    onCtrlL: () => {
      setView('list');
      setActiveTab('links');
      setSearchFocused(true);
    },
    onCtrlI: () => {
      setView('list');
      setActiveTab('identity');
      setSearchFocused(true);
    },
    onCtrlF: () => {
      setView('list');
      setSearchFocused(false);
      setTimeout(() => setSearchFocused(true), 0);
    },
    onCtrl1: () => {
      if (view === 'list' && activeTab === 'history') setHistoryFilter('all');
    },
    onCtrl2: () => {
      if (view === 'list' && activeTab === 'history') setHistoryFilter('text');
    },
    onCtrl3: () => {
      if (view === 'list' && activeTab === 'history') setHistoryFilter('images');
    },
    onCtrlS: () => {
      if (view === 'list' && activeTab === 'history' && displayHistory[selectedIndex]) {
        handlePromoteHistory(displayHistory[selectedIndex]);
      }
    },
    onCtrlShiftA: () => setView('about'),
    onCtrlQ: () => invoke('exit_app'),
    isActive: view === 'list' && (activeTab === 'texts' ? !loading : activeTab === 'history' ? !historyLoading : activeTab === 'links' ? !linksLoading : !identitiesLoading),
  });

  // Tab switching
  const handleTabChange = useCallback((tab: 'texts' | 'history' | 'links' | 'identity') => {
    setActiveTab(tab);
    setSearchQuery('');
    setActiveTag(null);
    setSearchFocused(true);
    setSelectedIndex(0);
    if (tab === 'history') {
      refreshHistory();
    } else if (tab === 'links') {
      refreshLinks();
    } else if (tab === 'identity') {
      refreshIdentities();
    }
  }, [refreshHistory, refreshLinks, refreshIdentities, setSelectedIndex]);

  // Commands for the command palette
  const commands = useMemo(() => [
    {
      id: 'open-prompts',
      label: 'Open Texts',
      category: 'Navigation',
      shortcut: 'Ctrl+T',
      action: () => { setView('list'); setActiveTab('texts'); setSearchFocused(true); },
      enabled: true,
    },
    {
      id: 'open-history',
      label: 'Open History',
      category: 'Navigation',
      shortcut: 'Ctrl+H',
      action: () => { setView('list'); setActiveTab('history'); setSearchFocused(true); },
      enabled: true,
    },
    {
      id: 'open-links',
      label: 'Open Links',
      category: 'Navigation',
      shortcut: 'Ctrl+L',
      action: () => { setView('list'); setActiveTab('links'); setSearchFocused(true); },
      enabled: true,
    },
    {
      id: 'open-identity',
      label: 'Open Identity',
      category: 'Navigation',
      shortcut: 'Ctrl+I',
      action: () => { setView('list'); setActiveTab('identity'); setSearchFocused(true); },
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
      label: 'Add New Text',
      category: 'Actions',
      shortcut: 'Ctrl+N',
      action: () => setView('add'),
      enabled: true,
    },
    {
      id: 'add-link',
      label: 'Add New Link',
      category: 'Actions',
      shortcut: 'Ctrl+N',
      action: () => setView('add-link'),
      enabled: true,
    },
    {
      id: 'add-identity',
      label: 'Add New Identity',
      category: 'Actions',
      shortcut: 'Ctrl+N',
      action: () => setView('add-identity'),
      enabled: true,
    },
    {
      id: 'copy-identity-block',
      label: 'Copy Identity Block',
      category: 'Actions',
      shortcut: 'Ctrl+B',
      action: () => {
        if (filteredIdentities[selectedIndex]) {
          handleCopyIdentityBlock(filteredIdentities[selectedIndex]);
        }
      },
      enabled: activeTab === 'identity' && filteredIdentities.length > 0,
    },
    {
      id: 'copy-selected',
      label: 'Copy Selected',
      category: 'Actions',
      shortcut: 'Shift+Enter',
      action: () => {
        if (activeTab === 'texts' && filteredPrompts[selectedIndex]) {
          handleCopyPrompt(filteredPrompts[selectedIndex]);
        } else if (activeTab === 'links' && filteredLinks[selectedIndex]) {
          handleCopyLink(filteredLinks[selectedIndex]);
        } else if (activeTab === 'identity' && filteredIdentities[selectedIndex]) {
          handleCopyIdentityBlock(filteredIdentities[selectedIndex]);
        }
      },
      enabled: (activeTab === 'texts' && filteredPrompts.length > 0) ||
               (activeTab === 'links' && filteredLinks.length > 0) ||
               (activeTab === 'identity' && filteredIdentities.length > 0),
    },
    {
      id: 'paste-selected',
      label: 'Paste Selected',
      category: 'Actions',
      shortcut: 'Enter',
      action: () => {
        if (activeTab === 'texts' && filteredPrompts[selectedIndex]) {
          handlePastePrompt(filteredPrompts[selectedIndex]);
        } else if (activeTab === 'links' && filteredLinks[selectedIndex]) {
          handlePasteLink(filteredLinks[selectedIndex]);
        } else if (activeTab === 'identity' && filteredIdentities[selectedIndex]) {
          handleCopyIdentityBlock(filteredIdentities[selectedIndex]);
        }
      },
      enabled: (activeTab === 'texts' && filteredPrompts.length > 0) ||
               (activeTab === 'links' && filteredLinks.length > 0) ||
               (activeTab === 'identity' && filteredIdentities.length > 0),
    },
    {
      id: 'clear-search',
      label: 'Clear Search',
      category: 'Actions',
      shortcut: 'Escape',
      action: () => setSearchQuery(''),
      enabled: searchQuery.length > 0,
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
  ], [filteredPrompts, filteredLinks, filteredIdentities, selectedIndex, handleCopyPrompt, handlePastePrompt, handleCopyLink, handlePasteLink, handleCopyIdentityBlock, activeTab, searchQuery]);

  // Listen for Tauri events
  useEffect(() => {
    const unlistenOpenList = listen('open-list', () => {
      setView('list');
      setSearchQuery('');
      setSearchFocused(true);
      refreshHistory();
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

    const unlistenQuickCapture = listen('quick-capture-saved', () => {
      showToast('Text saved!', 'success');
      refreshPrompts();
    });

    const unlistenHistoryUpdated = listen('history-updated', () => {
      refreshHistory();
    });

    return () => {
      unlistenOpenList.then((f) => f());
      unlistenOpenSettings.then((f) => f());
      unlistenOpenTrayMenu.then((f) => f());
      unlistenOpenAdd.then((f) => f());
      unlistenOpenAbout.then((f) => f());
      unlistenOpenPalette.then((f) => f());
      unlistenQuickCapture.then((f) => f());
      unlistenHistoryUpdated.then((f) => f());
    };
  }, [showToast, refreshPrompts, refreshHistory, refreshLinks, refreshIdentities]);

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

  // Link save handlers
  const handleAddLinkSave = async (link: Omit<SavedLink, 'id' | 'createdAt' | 'pinned'>) => {
    const success = await addLink(link);
    if (success) {
      setView('list');
    }
    return success;
  };

  const handleEditLinkSave = async (link: Omit<SavedLink, 'id' | 'createdAt' | 'pinned'>) => {
    if (editingLink) {
      const success = await updateLink(editingLink.id, link);
      if (success) {
        setEditingLink(null);
        setView('list');
      }
      return success;
    }
    return false;
  };

  // Identity save handlers
  const handleAddIdentitySave = async (data: Omit<Identity, 'id' | 'createdAt' | 'pinned'>) => {
    const success = await addIdentity(data);
    if (success) {
      setView('list');
    }
    return success;
  };

  const handleEditIdentitySave = async (data: Omit<Identity, 'id' | 'createdAt' | 'pinned'>) => {
    if (editingIdentity) {
      const success = await updateIdentity(editingIdentity.id, data);
      if (success) {
        setEditingIdentity(null);
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
    list: activeTab === 'history' ? 'History' : activeTab === 'links' ? 'Links' : activeTab === 'identity' ? 'Identity' : 'Texts',
    add: 'Add Text',
    edit: 'Edit Text',
    'add-link': 'Add Link',
    'edit-link': 'Edit Link',
    'add-identity': 'Add Identity',
    'edit-identity': 'Edit Identity',
    settings: 'Settings',
    about: 'About',
    'command-palette': 'Commands',
  };

  return (
    <div className="relative w-full h-full bg-background border border-border rounded-lg overflow-clip flex flex-col p-3 select-none">
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
            activeTab={activeTab}
            onTabChange={handleTabChange}
            activeTag={activeTag}
            onClearTag={() => setActiveTag(null)}
          />
          {isSearching ? (
            loading || historyLoading ? (
              <div role="status" className="flex-1 flex items-center justify-center">
                <span className="text-xs text-muted">Searching…</span>
              </div>
            ) : (
              <UnifiedSearchResults
                prompts={filteredPrompts}
                historyEntries={displayHistory}
                links={filteredLinks}
                identities={filteredIdentities}
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
                onTogglePin={togglePin}
                onTagClick={(tag) => {
                  setActiveTag(tag);
                  setSearchQuery('');
                }}
                onCopyHistory={handleCopyHistory}
                onPasteHistory={handlePasteHistory}
                onCopyLink={handleCopyLink}
                onPasteLink={handlePasteLink}
                onEditLink={(link) => {
                  setEditingLink(link);
                  setView('edit-link');
                }}
                onDeleteLink={deleteLink}
                onToggleLinkPin={toggleLinkPin}
                onCopyIdentityField={handleCopyIdentityField}
                onCopyIdentityBlock={handleCopyIdentityBlock}
                onEditIdentity={(identity) => {
                  setEditingIdentity(identity);
                  setView('edit-identity');
                }}
                onDeleteIdentity={deleteIdentity}
                onToggleIdentityPin={toggleIdentityPin}
              />
            )
          ) : activeTab === 'texts' ? (
            loading ? (
              <div role="status" className="flex-1 flex items-center justify-center">
                <span className="text-xs text-muted">Loading texts…</span>
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
                onTogglePin={togglePin}
                onTagClick={(tag) => {
                  setActiveTag(tag);
                  setSearchQuery('');
                }}
                onAddClick={() => setView('add')}
              />
            )
          ) : activeTab === 'links' ? (
            linksLoading ? (
              <div role="status" className="flex-1 flex items-center justify-center">
                <span className="text-xs text-muted">Loading links…</span>
              </div>
            ) : (
              <LinkList
                links={filteredLinks}
                totalCount={links.length}
                searchQuery={searchQuery}
                selectedIndex={selectedIndex}
                onSelectLink={setSelectedIndex}
                onEditLink={(link) => {
                  setEditingLink(link);
                  setView('edit-link');
                }}
                onDeleteLink={deleteLink}
                onCopyLink={handleCopyLink}
                onPasteLink={handlePasteLink}
                onTogglePin={toggleLinkPin}
                onTagClick={(tag) => {
                  setActiveTag(tag);
                  setSearchQuery('');
                }}
                onAddClick={() => setView('add-link')}
                categoryFilter={linkCategoryFilter}
                onCategoryChange={setLinkCategoryFilter}
              />
            )
          ) : activeTab === 'identity' ? (
            identitiesLoading ? (
              <div role="status" className="flex-1 flex items-center justify-center">
                <span className="text-xs text-muted">Loading identities…</span>
              </div>
            ) : (
              <IdentityList
                identities={filteredIdentities}
                totalCount={identities.length}
                searchQuery={searchQuery}
                selectedIndex={selectedIndex}
                onSelectIdentity={setSelectedIndex}
                onEditIdentity={(identity) => {
                  setEditingIdentity(identity);
                  setView('edit-identity');
                }}
                onDeleteIdentity={deleteIdentity}
                onCopyField={handleCopyIdentityField}
                onCopyBlock={handleCopyIdentityBlock}
                onTogglePin={toggleIdentityPin}
                onAddClick={() => setView('add-identity')}
              />
            )
          ) : (
            historyLoading ? (
              <div role="status" className="flex-1 flex items-center justify-center">
                <span className="text-xs text-muted">Loading history…</span>
              </div>
            ) : (
              <HistoryPanel
                entries={displayHistory}
                totalCount={historyEntries.length}
                filter={historyFilter}
                onFilterChange={setHistoryFilter}
                onCopy={handleCopyHistory}
                onPaste={handlePasteHistory}
                onPromote={handlePromoteHistory}
                onDelete={handleDeleteHistory}
                selectedIndex={selectedIndex}
                onSelectPrompt={setSelectedIndex}
              />
            )
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

      {view === 'add-link' && (
        <AddEditLinkPanel
          link={null}
          onSave={handleAddLinkSave}
          onCancel={() => setView('list')}
        />
      )}

      {view === 'edit-link' && (
        <AddEditLinkPanel
          link={editingLink}
          onSave={handleEditLinkSave}
          onCancel={() => {
            setEditingLink(null);
            setView('list');
          }}
        />
      )}

      {view === 'add-identity' && (
        <AddEditIdentityPanel
          identity={null}
          onSave={handleAddIdentitySave}
          onCancel={() => setView('list')}
        />
      )}

      {view === 'edit-identity' && (
        <AddEditIdentityPanel
          identity={editingIdentity}
          onSave={handleEditIdentitySave}
          onCancel={() => {
            setEditingIdentity(null);
            setView('list');
          }}
        />
      )}

      {view === 'settings' && (
        <SettingsPanel
          onBack={() => setView('list')}
          showToast={showToast}
          onThemeChange={setTheme}
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
