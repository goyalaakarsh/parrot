import { useState, useEffect, useCallback, useRef } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { HistoryEntry } from '../types';

const POLL_INTERVAL = 1000;

export function useHistory(showToast: (msg: string, type?: 'success' | 'error') => void) {
  const [historyEntries, setHistoryEntries] = useState<HistoryEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const pollRef = useRef<ReturnType<typeof setInterval>>();

  const fetchHistory = useCallback(async () => {
    try {
      const data = await invoke<HistoryEntry[]>('get_history');
      setHistoryEntries(data);
    } catch (err: any) {
      console.error('Failed to load history:', err);
    }
  }, []);

  useEffect(() => {
    fetchHistory().finally(() => setLoading(false));
    pollRef.current = setInterval(fetchHistory, POLL_INTERVAL);
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, [fetchHistory]);

  const deleteHistoryEntry = useCallback(async (id: string) => {
    const updated = historyEntries.filter(e => e.id !== id);
    setHistoryEntries(updated);
    try {
      await invoke('delete_history_entry', { entryId: id });
    } catch (err: any) {
      console.error('Failed to delete history entry:', err);
    }
  }, [historyEntries]);

  const promoteToPrompt = useCallback(async (entryId: string) => {
    const updated = historyEntries.filter(e => e.id !== entryId);
    setHistoryEntries(updated);
    try {
      await invoke('promote_to_prompt', { entryId });
    } catch (err: any) {
      console.error('Failed to promote history entry:', err);
    }
  }, [historyEntries]);

  const clearHistory = useCallback(async () => {
    setHistoryEntries([]);
    try {
      await invoke('clear_history');
      showToast('History cleared', 'success');
    } catch (err: any) {
      console.error('Failed to clear history:', err);
    }
  }, [showToast]);

  return {
    historyEntries,
    loading,
    deleteHistoryEntry,
    promoteToPrompt,
    clearHistory,
    refresh: fetchHistory,
  };
}
