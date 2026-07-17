import { useMemo } from 'react';
import { Prompt } from '../types';

export function useSearch(prompts: Prompt[], query: string) {
  return useMemo(() => {
    if (!query.trim()) {
      return prompts;
    }

    const lowerQuery = query.toLowerCase().trim();

    return prompts.filter(prompt => {
      // 1. Direct title match
      const titleMatch = prompt.title.toLowerCase().includes(lowerQuery);
      if (titleMatch) return true;

      // 2. Direct text match
      const textMatch = prompt.text.toLowerCase().includes(lowerQuery);
      if (textMatch) return true;

      // 3. Direct tag match
      const tagsMatch = prompt.tags.some(tag => tag.toLowerCase().includes(lowerQuery));
      if (tagsMatch) return true;

      // 4. Multi-word match: if query has multiple words, check if all words are present somewhere
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
  }, [prompts, query]);
}
