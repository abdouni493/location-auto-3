
import { useState, useEffect } from 'react';
import { UserSession } from '../types';

export function usePersistentFilters<T>(user: UserSession, pageKey: string, initialFilters: T) {
  const storageKey = `rentmaster_filters_${user.id}_${pageKey}`;

  const [filters, setFilters] = useState<T>(() => {
    const saved = localStorage.getItem(storageKey);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        return initialFilters;
      }
    }
    return initialFilters;
  });

  useEffect(() => {
    localStorage.setItem(storageKey, JSON.stringify(filters));
  }, [filters, storageKey]);

  const resetFilters = () => setFilters(initialFilters);

  return [filters, setFilters, resetFilters] as const;
}
