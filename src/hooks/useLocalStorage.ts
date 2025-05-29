
"use client";

import { useState, useEffect, Dispatch, SetStateAction } from 'react';

type SetValue<T> = Dispatch<SetStateAction<T>>;

function useLocalStorage<T>(key: string, initialValue: T): [T, SetValue<T>] {
  // STEP 1: Initialize state with initialValue.
  // This ensures server and initial client render are consistent.
  const [storedValue, setStoredValue] = useState<T>(initialValue);

  // STEP 2: Load value from localStorage in an effect.
  // This runs only on the client, after the initial render.
  useEffect(() => {
    // Prevent build error "window is undefined"
    if (typeof window === 'undefined') {
      return;
    }

    try {
      const item = window.localStorage.getItem(key);
      if (item) {
        setStoredValue(JSON.parse(item) as T);
      }
      // If item is null, storedValue remains initialValue from useState,
      // which is correct. AppContext can then decide if sample data is needed.
    } catch (error) {
      console.warn(`Error reading localStorage key “${key}” in effect:`, error);
      // If error, storedValue remains initialValue
    }
  }, [key]); // Effect runs when key changes or on mount

  // Wrapped version of useState's setter function that persists the new value to localStorage.
  const setValue: SetValue<T> = (value) => {
    // Prevent build error "window is undefined"
    if (typeof window === 'undefined') {
      console.warn(
        `Tried setting localStorage key “${key}” even though environment is not a client`
      );
      return; 
    }

    try {
      const newValue = value instanceof Function ? value(storedValue) : value;
      window.localStorage.setItem(key, JSON.stringify(newValue));
      setStoredValue(newValue);
      // We dispatch a custom event so other tabs can react to changes
      window.dispatchEvent(new Event("local-storage"));
    } catch (error) {
      console.warn(`Error setting localStorage key “${key}”:`, error);
    }
  };

  // Effect for syncing with 'storage' events from other tabs/windows
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
            // Key was removed or cleared from another tab
            setStoredValue(initialValue); // Reset to initialValue
          }
        } catch (error) {
          console.warn(`Error parsing storage event for key “${key}”:`, error);
          setStoredValue(initialValue); // Reset to initialValue on error
        }
      }
    };
    
    // Effect for syncing with 'local-storage' events dispatched by setValue in the same document
    const handleLocalStorageEvent = () => {
        // This ensures that if multiple hooks use the same key, or if localStorage is modified
        // externally and the 'local-storage' event is dispatched, the state is updated.
        if (typeof window !== 'undefined') {
            try {
                const item = window.localStorage.getItem(key);
                if (item) {
                    setStoredValue(JSON.parse(item) as T);
                } else {
                    // If item was removed, reset to initialValue
                    setStoredValue(initialValue);
                }
            } catch (error) {
                console.warn(`Error reading localStorage key “${key}” on local-storage event:`, error);
                setStoredValue(initialValue); // Reset to initialValue on error
            }
        }
    };

    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('local-storage', handleLocalStorageEvent);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('local-storage', handleLocalStorageEvent);
    };
  }, [key, initialValue]); // initialValue is needed here to correctly reset if the key is cleared in storage.

  return [storedValue, setValue];
}

export default useLocalStorage;
