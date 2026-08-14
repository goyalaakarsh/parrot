import { useState, useEffect, useCallback } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { SavedLink } from '../types';

export function useLinks(showToast: (msg: string, type?: 'success' | 'error') => void) {
  const [links, setLinks] = useState<SavedLink[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchLinks = useCallback(async () => {
    try {
      setLoading(true);
      const data = await invoke<SavedLink[]>('get_links');
      const sorted = [...data].sort((a, b) => {
        if (a.pinned && b.pinned) return new Date(b.pinnedAt || b.createdAt).getTime() - new Date(a.pinnedAt || a.createdAt).getTime();
        if (a.pinned) return -1;
        if (b.pinned) return 1;
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      });
      setLinks(sorted);
    } catch (err: any) {
      console.error('Failed to load links:', err);
      showToast(err.toString() || 'Failed to load links', 'error');
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    fetchLinks();
  }, [fetchLinks]);

  const addLink = useCallback(async (link: Omit<SavedLink, 'id' | 'createdAt' | 'pinned'>) => {
    const newLink: SavedLink = {
      ...link,
      id: crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(2, 15),
      createdAt: new Date().toISOString(),
      pinned: false,
    };

    const updatedLinks = [newLink, ...links];
    setLinks(updatedLinks);

    try {
      await invoke('save_links', { links: updatedLinks });
      showToast('Link saved successfully', 'success');
      return true;
    } catch (err: any) {
      console.error('Failed to save link:', err);
      showToast(err.toString() || 'Failed to save link', 'error');
      fetchLinks();
      return false;
    }
  }, [links, fetchLinks, showToast]);

  const updateLink = useCallback(async (id: string, updates: Partial<SavedLink>) => {
    const updatedLinks = links.map(l => l.id === id ? { ...l, ...updates } : l);
    setLinks(updatedLinks);

    try {
      await invoke('save_links', { links: updatedLinks });
      showToast('Link updated successfully', 'success');
      return true;
    } catch (err: any) {
      console.error('Failed to update link:', err);
      showToast(err.toString() || 'Failed to update link', 'error');
      fetchLinks();
      return false;
    }
  }, [links, fetchLinks, showToast]);

  const deleteLink = useCallback(async (id: string) => {
    const updatedLinks = links.filter(l => l.id !== id);
    setLinks(updatedLinks);

    try {
      await invoke('save_links', { links: updatedLinks });
      showToast('Link deleted successfully', 'success');
      return true;
    } catch (err: any) {
      console.error('Failed to delete link:', err);
      showToast(err.toString() || 'Failed to delete link', 'error');
      fetchLinks();
      return false;
    }
  }, [links, fetchLinks, showToast]);

  const markLinkUsed = useCallback(async (id: string) => {
    const now = new Date().toISOString();
    const updatedLinks = links.map(l => l.id === id ? { ...l, lastUsedAt: now } : l);
    setLinks(updatedLinks);
    try {
      await invoke('save_links', { links: updatedLinks });
    } catch (err: any) {
      console.error('Failed to update lastUsedAt:', err);
      fetchLinks();
    }
  }, [links, fetchLinks]);

  const togglePin = useCallback(async (id: string) => {
    const now = new Date().toISOString();
    const updatedLinks = links.map(l => {
      if (l.id === id) {
        const willPin = !l.pinned;
        return { ...l, pinned: willPin, pinnedAt: willPin ? now : undefined };
      }
      return l;
    });
    const sorted = [...updatedLinks].sort((a, b) => {
      if (a.pinned && b.pinned) return new Date(b.pinnedAt || b.createdAt).getTime() - new Date(a.pinnedAt || a.createdAt).getTime();
      if (a.pinned) return -1;
      if (b.pinned) return 1;
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });
    setLinks(sorted);
    try {
      await invoke('save_links', { links: sorted });
    } catch (err: any) {
      console.error('Failed to toggle pin:', err);
      fetchLinks();
    }
  }, [links, fetchLinks]);

  return {
    links,
    loading,
    addLink,
    updateLink,
    deleteLink,
    markLinkUsed,
    togglePin,
    refresh: fetchLinks,
  };
}
