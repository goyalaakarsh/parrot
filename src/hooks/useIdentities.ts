import { useState, useEffect, useCallback } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { Identity } from '../types';

export function useIdentities(showToast: (msg: string, type?: 'success' | 'error') => void) {
  const [identities, setIdentities] = useState<Identity[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchIdentities = useCallback(async () => {
    try {
      setLoading(true);
      const data = await invoke<Identity[]>('get_identities');
      const list = Array.isArray(data) ? data : [];
      const sorted = [...list].sort((a, b) => {
        if (a.pinned && b.pinned) return new Date(b.pinnedAt || b.createdAt).getTime() - new Date(a.pinnedAt || a.createdAt).getTime();
        if (a.pinned) return -1;
        if (b.pinned) return 1;
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      });
      setIdentities(sorted);
    } catch (err: any) {
      console.error('Failed to load identities:', err);
      showToast(err.toString() || 'Failed to load identities', 'error');
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    fetchIdentities();
  }, [fetchIdentities]);

  const addIdentity = useCallback(async (identity: Omit<Identity, 'id' | 'createdAt' | 'pinned'>) => {
    const newIdentity: Identity = {
      ...identity,
      id: crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(2, 15),
      createdAt: new Date().toISOString(),
      pinned: false,
    };

    const updatedIdentities = [newIdentity, ...identities];
    setIdentities(updatedIdentities);

    try {
      await invoke('save_identities', { identities: updatedIdentities });
      showToast('Identity saved successfully', 'success');
      return true;
    } catch (err: any) {
      console.error('Failed to save identity:', err);
      showToast(err.toString() || 'Failed to save identity', 'error');
      fetchIdentities();
      return false;
    }
  }, [identities, fetchIdentities, showToast]);

  const updateIdentity = useCallback(async (id: string, updates: Partial<Identity>) => {
    const updatedIdentities = identities.map(i => i.id === id ? { ...i, ...updates, updatedAt: new Date().toISOString() } : i);
    setIdentities(updatedIdentities);

    try {
      await invoke('save_identities', { identities: updatedIdentities });
      showToast('Identity updated successfully', 'success');
      return true;
    } catch (err: any) {
      console.error('Failed to update identity:', err);
      showToast(err.toString() || 'Failed to update identity', 'error');
      fetchIdentities();
      return false;
    }
  }, [identities, fetchIdentities, showToast]);

  const deleteIdentity = useCallback(async (id: string) => {
    const updatedIdentities = identities.filter(i => i.id !== id);
    setIdentities(updatedIdentities);

    try {
      await invoke('save_identities', { identities: updatedIdentities });
      showToast('Identity deleted successfully', 'success');
      return true;
    } catch (err: any) {
      console.error('Failed to delete identity:', err);
      showToast(err.toString() || 'Failed to delete identity', 'error');
      fetchIdentities();
      return false;
    }
  }, [identities, fetchIdentities, showToast]);

  const togglePin = useCallback(async (id: string) => {
    const now = new Date().toISOString();
    const updatedIdentities = identities.map(i => {
      if (i.id === id) {
        const willPin = !i.pinned;
        return { ...i, pinned: willPin, pinnedAt: willPin ? now : undefined };
      }
      return i;
    });
    const sorted = [...updatedIdentities].sort((a, b) => {
      if (a.pinned && b.pinned) return new Date(b.pinnedAt || b.createdAt).getTime() - new Date(a.pinnedAt || a.createdAt).getTime();
      if (a.pinned) return -1;
      if (b.pinned) return 1;
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });
    setIdentities(sorted);
    try {
      await invoke('save_identities', { identities: sorted });
    } catch (err: any) {
      console.error('Failed to toggle pin:', err);
      fetchIdentities();
    }
  }, [identities, fetchIdentities]);

  return {
    identities,
    loading,
    addIdentity,
    updateIdentity,
    deleteIdentity,
    togglePin,
    refresh: fetchIdentities,
  };
}
