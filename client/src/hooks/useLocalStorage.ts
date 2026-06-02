import { useState, useEffect, useCallback } from "react";

/**
 * Persistent useState backed by localStorage.
 * Automatically serializes/deserializes JSON.
 * Falls back to initialValue if key is missing or parse fails.
 */
export function useLocalStorage<T>(key: string, initialValue: T) {
  const [storedValue, setStoredValue] = useState<T>(() => {
    try {
      const item = window.localStorage.getItem(key);
      return item !== null ? (JSON.parse(item) as T) : initialValue;
    } catch {
      return initialValue;
    }
  });

  const setValue = useCallback(
    (value: T | ((prev: T) => T)) => {
      setStoredValue((prev) => {
        const next = typeof value === "function" ? (value as (p: T) => T)(prev) : value;
        try {
          window.localStorage.setItem(key, JSON.stringify(next));
        } catch {}
        return next;
      });
    },
    [key]
  );

  const removeValue = useCallback(() => {
    try {
      window.localStorage.removeItem(key);
    } catch {}
    setStoredValue(initialValue);
  }, [key, initialValue]); // eslint-disable-line react-hooks/exhaustive-deps

  return [storedValue, setValue, removeValue] as const;
}
