import { useState, useEffect, useCallback } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { HistoryEntry } from '../types';

export function useHistory(showToast: (msg: string, type?: 'success' | 'error') => void) {
  const [historyEntries, setHistoryEntries] = useState<HistoryEntry[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchHistory = useCallback(async () => {
    try {
      setLoading(true);
      const data = await invoke<HistoryEntry[]>('get_history');
      setHistoryEntries(data);
    } catch (err: any) {
      console.error('Failed to load history:', err);
      showToast(err.toString() || 'Failed to load history', 'error');
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    fetchHistory();
  }, [fetchHistory]);

  const deleteHistoryEntry = useCallback(async (id: string) => {
    const updated = historyEntries.filter(e => e.id !== id);
    setHistoryEntries(updated);
    try {
      await invoke('delete_history_entry', { entryId: id });
    } catch (err: any) {
      console.error('Failed to delete history entry:', err);
      fetchHistory();
    }
  }, [historyEntries, fetchHistory]);

  const promoteToPrompt = useCallback(async (entryId: string) => {
    const updated = historyEntries.filter(e => e.id !== entryId);
    setHistoryEntries(updated);
    try {
      await invoke('promote_to_prompt', { entryId });
    } catch (err: any) {
      console.error('Failed to promote history entry:', err);
      fetchHistory();
    }
  }, [historyEntries, fetchHistory]);

  const clearHistory = useCallback(async () => {
    setHistoryEntries([]);
    try {
      await invoke('clear_history');
      showToast('History cleared', 'success');
    } catch (err: any) {
      console.error('Failed to clear history:', err);
      fetchHistory();
    }
  }, [fetchHistory, showToast]);

  return {
    historyEntries,
    loading,
    deleteHistoryEntry,
    promoteToPrompt,
    clearHistory,
    refresh: fetchHistory,
  };
}
