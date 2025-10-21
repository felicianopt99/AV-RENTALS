// Utility functions for safe localStorage operations

/**
 * Safely parse JSON from localStorage, with automatic cleanup of corrupted data
 */
export function safeParseLocalStorage<T>(key: string, defaultValue: T): T {
  if (typeof window === 'undefined') {
    return defaultValue;
  }
  
  try {
    const item = localStorage.getItem(key);
    
    if (!item || item.trim() === '' || item === 'undefined' || item === 'null') {
      return defaultValue;
    }
    
    // Additional validation for empty objects/arrays
    if (item === '{}' || item === '[]') {
      return JSON.parse(item) as T;
    }
    
    return JSON.parse(item) as T;
  } catch (error) {
    console.warn(`Error parsing localStorage key "${key}":`, error);
    
    // Clear the corrupted data
    try {
      localStorage.removeItem(key);
      console.info(`Cleared corrupted localStorage key: ${key}`);
    } catch (clearError) {
      console.warn(`Error clearing corrupted localStorage key "${key}":`, clearError);
    }
    
    return defaultValue;
  }
}

/**
 * Safely set JSON data in localStorage
 */
export function safeSetLocalStorage<T>(key: string, value: T): boolean {
  if (typeof window === 'undefined') {
    return false;
  }
  
  try {
    localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch (error) {
    console.warn(`Error setting localStorage key "${key}":`, error);
    return false;
  }
}

/**
 * Clean up potentially corrupted localStorage data
 */
export function cleanupLocalStorage(): void {
  if (typeof window === 'undefined') {
    return;
  }
  
  const keysToCheck = [
    'currentUser',
    'quoteDraft',
    'appSettings',
    'userPreferences',
    'recentEquipment',
    'searchHistory'
  ];
  
  keysToCheck.forEach(key => {
    try {
      const item = localStorage.getItem(key);
      if (item && item !== 'null' && item !== 'undefined' && item.trim() !== '') {
        // Try to parse to validate
        JSON.parse(item);
      }
    } catch (error) {
      console.warn(`Removing corrupted localStorage key: ${key}`, error);
      try {
        localStorage.removeItem(key);
      } catch (removeError) {
        console.warn(`Failed to remove corrupted key ${key}:`, removeError);
      }
    }
  });
}

/**
 * Get localStorage item with type safety and error handling
 */
export function getLocalStorageItem<T>(key: string, defaultValue: T): T {
  return safeParseLocalStorage(key, defaultValue);
}

/**
 * Set localStorage item with error handling
 */
export function setLocalStorageItem<T>(key: string, value: T): boolean {
  return safeSetLocalStorage(key, value);
}