import { useState, useEffect, useCallback } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { Prompt } from '../types';

export function usePrompts(showToast: (msg: string, type?: 'success' | 'error') => void) {
  const [prompts, setPrompts] = useState<Prompt[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch prompts on mount
  const fetchPrompts = useCallback(async () => {
    try {
      setLoading(true);
      const data = await invoke<Prompt[]>('get_prompts');
      // Sort: pinned first (by pinnedAt desc), then by createdAt desc
      const sorted = [...data].sort((a, b) => {
        if (a.pinned && b.pinned) return new Date(b.pinnedAt || b.createdAt).getTime() - new Date(a.pinnedAt || a.createdAt).getTime();
        if (a.pinned) return -1;
        if (b.pinned) return 1;
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      });
      setPrompts(sorted);
    } catch (err: any) {
      console.error('Failed to load texts:', err);
      showToast(err.toString() || 'Failed to load texts', 'error');
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    fetchPrompts();
  }, [fetchPrompts]);

  // Add a new prompt
  const addPrompt = useCallback(async (title: string, text: string, tags: string[]) => {
    const newPrompt: Prompt = {
      id: crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(2, 15),
      title: title.trim(),
      text: text.trim(),
      tags: tags.map(t => t.trim().toLowerCase()).filter(Boolean),
      createdAt: new Date().toISOString(),
      pinned: false,
    };

    const updatedPrompts = [newPrompt, ...prompts];
    setPrompts(updatedPrompts); // Optimistic update

    try {
      await invoke('save_prompts', { prompts: updatedPrompts });
      showToast('Text created successfully', 'success');
      return true;
    } catch (err: any) {
      console.error('Failed to save text:', err);
      showToast(err.toString() || 'Failed to save text', 'error');
      // Rollback on error
      fetchPrompts();
      return false;
    }
  }, [prompts, fetchPrompts, showToast]);

  // Update an existing prompt
  const updatePrompt = useCallback(async (id: string, title: string, text: string, tags: string[]) => {
    const updatedPrompts = prompts.map(p => {
      if (p.id === id) {
        return {
          ...p,
          title: title.trim(),
          text: text.trim(),
          tags: tags.map(t => t.trim().toLowerCase()).filter(Boolean),
        };
      }
      return p;
    });

    setPrompts(updatedPrompts); // Optimistic update

    try {
      await invoke('save_prompts', { prompts: updatedPrompts });
      showToast('Text updated successfully', 'success');
      return true;
    } catch (err: any) {
      console.error('Failed to update text:', err);
      showToast(err.toString() || 'Failed to update text', 'error');
      fetchPrompts();
      return false;
    }
  }, [prompts, fetchPrompts, showToast]);

  // Delete a prompt
  const deletePrompt = useCallback(async (id: string) => {
    const updatedPrompts = prompts.filter(p => p.id !== id);
    setPrompts(updatedPrompts); // Optimistic update

    try {
      await invoke('save_prompts', { prompts: updatedPrompts });
      showToast('Text deleted successfully', 'success');
      return true;
    } catch (err: any) {
      console.error('Failed to delete text:', err);
      showToast(err.toString() || 'Failed to delete text', 'error');
      fetchPrompts();
      return false;
    }
  }, [prompts, fetchPrompts, showToast]);

  const markPromptUsed = useCallback(async (id: string) => {
    const now = new Date().toISOString();
    const updatedPrompts = prompts.map(p =>
      p.id === id ? { ...p, lastUsedAt: now } : p
    );
    setPrompts(updatedPrompts);
    try {
      await invoke('save_prompts', { prompts: updatedPrompts });
    } catch (err: any) {
      console.error('Failed to update lastUsedAt:', err);
      fetchPrompts();
    }
  }, [prompts, fetchPrompts]);

  const togglePin = useCallback(async (id: string) => {
    const now = new Date().toISOString();
    const updatedPrompts = prompts.map(p => {
      if (p.id === id) {
        const willPin = !p.pinned;
        return { ...p, pinned: willPin, pinnedAt: willPin ? now : undefined };
      }
      return p;
    });
    // Sort: pinned first
    const sorted = [...updatedPrompts].sort((a, b) => {
      if (a.pinned && b.pinned) return new Date(b.pinnedAt || b.createdAt).getTime() - new Date(a.pinnedAt || a.createdAt).getTime();
      if (a.pinned) return -1;
      if (b.pinned) return 1;
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });
    setPrompts(sorted);
    try {
      await invoke('save_prompts', { prompts: sorted });
    } catch (err: any) {
      console.error('Failed to toggle pin:', err);
      fetchPrompts();
    }
  }, [prompts, fetchPrompts]);

  return {
    prompts,
    loading,
    addPrompt,
    updatePrompt,
    deletePrompt,
    markPromptUsed,
    togglePin,
    refresh: fetchPrompts,
  };
}
