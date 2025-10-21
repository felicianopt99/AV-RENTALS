"use client";

import { useState, useEffect, Dispatch, SetStateAction } from 'react';
import { safeParseLocalStorage, safeSetLocalStorage } from '@/lib/localStorage-utils';

type SetValue<T> = Dispatch<SetStateAction<T>>;

function useLocalStorage<T>(key: string, initialValue: T): [T, SetValue<T>] {
  
  const readValue = (): T => {
    return safeParseLocalStorage(key, initialValue);
  };

  const [storedValue, setStoredValue] = useState<T>(readValue);

  const setValue: SetValue<T> = value => {
      if (typeof window === 'undefined') {
        console.warn(
          `Tried setting localStorage key "${key}" even though environment is not a client`
        );
        return;
      }

      try {
        const newValue = value instanceof Function ? value(storedValue) : value;
        setStoredValue(newValue);
        safeSetLocalStorage(key, newValue);
      } catch (error) {
        console.warn(`Error setting localStorage key "${key}":`, error);
      }
  };

  useEffect(() => {
    setStoredValue(readValue());
  }, []);

  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key && e.key !== key) {
        return;
      }
      setStoredValue(readValue());
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [key]);

  return [storedValue, setValue];
}

export default useLocalStorage;
