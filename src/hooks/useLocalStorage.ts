
"use client";

import { useState, useEffect, Dispatch, SetStateAction, useCallback } from 'react';

type SetValue<T> = Dispatch<SetStateAction<T>>;

function useLocalStorage<T>(key: string, initialValue: T): [T, SetValue<T>] {
  const [storedValue, setStoredValue] = useState<T>(initialValue);

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }
    try {
      const item = window.localStorage.getItem(key);
      if (item) {
        setStoredValue(JSON.parse(item) as T);
      }
    } catch (error) {
      console.warn(`Error reading localStorage key “${key}” in effect:`, error);
    }
  }, [key]);

  const setValue: SetValue<T> = useCallback(
    (value) => {
      if (typeof window === 'undefined') {
        console.warn(
          `Tried setting localStorage key “${key}” even though environment is not a client`
        );
        return;
      }
      try {
        // Use the callback form of setStoredValue to ensure we're operating on the latest state
        // and to correctly get the newValue for localStorage.
        setStoredValue(prevStoredValue => {
          const newValue = value instanceof Function ? value(prevStoredValue) : value;
          window.localStorage.setItem(key, JSON.stringify(newValue));
          window.dispatchEvent(new Event("local-storage")); // Notify other tabs/hooks
          return newValue;
        });
      } catch (error) {
        console.warn(`Error setting localStorage key “${key}”:`, error);
      }
    },
    [key] // setStoredValue from useState is stable and not needed in deps. key is stable per hook instance.
  );

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }
    const handleStorageChange = (event: StorageEvent) => {
      if (event.key === key) {
        try {
          if (event.newValue) {
            setStoredValue(JSON.parse(event.newValue) as T);
          } else {
            setStoredValue(initialValue);
          }
        } catch (error) {
          console.warn(`Error parsing storage event for key “${key}”:`, error);
          setStoredValue(initialValue);
        }
      }
    };
    
    const handleLocalStorageEvent = () => {
        if (typeof window !== 'undefined') {
            try {
                const item = window.localStorage.getItem(key);
                if (item) {
                    setStoredValue(JSON.parse(item) as T);
                } else {
                    setStoredValue(initialValue);
                }
            } catch (error) {
                console.warn(`Error reading localStorage key “${key}” on local-storage event:`, error);
                setStoredValue(initialValue);
            }
        }
    };

    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('local-storage', handleLocalStorageEvent);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('local-storage', handleLocalStorageEvent);
    };
  }, [key, initialValue]);

  return [storedValue, setValue];
}

export default useLocalStorage;
