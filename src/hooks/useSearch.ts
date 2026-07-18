import { useMemo } from 'react';
import { Prompt } from '../types';

export function useSearch(prompts: Prompt[], query: string, activeTag: string | null = null) {
  return useMemo(() => {
    let filtered = prompts;

    // Apply tag filter first
    if (activeTag) {
      filtered = filtered.filter(prompt =>
        prompt.tags.some(tag => tag.toLowerCase() === activeTag.toLowerCase())
      );
    }

    // Then apply text search
    if (!query.trim()) {
      return filtered;
    }

    const lowerQuery = query.toLowerCase().trim();

    return filtered.filter(prompt => {
      const titleMatch = prompt.title.toLowerCase().includes(lowerQuery);
      if (titleMatch) return true;

      const textMatch = prompt.text.toLowerCase().includes(lowerQuery);
      if (textMatch) return true;

      const tagsMatch = prompt.tags.some(tag => tag.toLowerCase().includes(lowerQuery));
      if (tagsMatch) return true;

      const words = lowerQuery.split(/\s+/).filter(Boolean);
      if (words.length > 1) {
        return words.every(word =>
          prompt.title.toLowerCase().includes(word) ||
          prompt.text.toLowerCase().includes(word) ||
          prompt.tags.some(tag => tag.toLowerCase().includes(word))
        );
      }

      return false;
    });
  }, [prompts, query, activeTag]);
}
