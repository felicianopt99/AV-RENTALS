// Enhanced fetch utility with better error handling

export interface FetchOptions extends RequestInit {
  timeout?: number;
}

export class NetworkError extends Error {
  constructor(message: string, public originalError?: Error) {
    super(message);
    this.name = 'NetworkError';
  }
}

/**
 * Enhanced fetch wrapper with better error handling for network issues
 */
export async function safeFetch(url: string, options: FetchOptions = {}): Promise<Response> {
  const { timeout = 30000, ...fetchOptions } = options;
  
  // Create abort controller for timeout
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);
  
  try {
    const response = await fetch(url, {
      ...fetchOptions,
      credentials: 'include', // Include cookies by default
      signal: controller.signal,
    });
    
    clearTimeout(timeoutId);
    return response;
  } catch (error) {
    clearTimeout(timeoutId);
    
    // Handle different types of network errors
    if (error instanceof TypeError) {
      if (error.message === 'Failed to fetch' || error.message.includes('NetworkError')) {
        throw new NetworkError('Network connection failed. Please check your internet connection.', error);
      }
      if (error.message.includes('CORS')) {
        throw new NetworkError('Cross-origin request blocked. This may be a server configuration issue.', error);
      }
    }
    
    if (error instanceof DOMException) {
      if (error.name === 'AbortError') {
        throw new NetworkError('Request timeout. The server took too long to respond.', error);
      }
    }
    
    // Re-throw the original error if we don't know how to handle it
    throw error;
  }
}

/**
 * Safe JSON fetch with automatic error handling
 */
export async function safeFetchJSON<T = any>(url: string, options: FetchOptions = {}): Promise<T> {
  try {
    const response = await safeFetch(url, options);
    
    if (!response.ok) {
      let errorMessage = `HTTP ${response.status}: ${response.statusText}`;
      
      // Try to get error details from response
      try {
        const errorData = await response.json();
        if (errorData.error) {
          errorMessage = errorData.error;
        }
      } catch {
        // Ignore JSON parsing errors for error responses
      }
      
      throw new Error(errorMessage);
    }
    
    // Check content type
    const contentType = response.headers.get('content-type');
    if (!contentType || !contentType.includes('application/json')) {
      throw new Error('Expected JSON response but received different content type');
    }
    
    return await response.json();
  } catch (error) {
    if (error instanceof NetworkError) {
      // Re-throw network errors as-is
      throw error;
    }
    
    if (error instanceof SyntaxError && error.message.includes('JSON')) {
      throw new Error('Invalid JSON response from server');
    }
    
    // Re-throw other errors
    throw error;
  }
}

/**
 * Retry fetch with exponential backoff for network errors
 */
export async function retryFetch(
  url: string, 
  options: FetchOptions = {}, 
  maxRetries: number = 3
): Promise<Response> {
  let lastError: Error;
  
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await safeFetch(url, options);
    } catch (error) {
      lastError = error as Error;
      
      // Only retry on network errors
      if (error instanceof NetworkError && attempt < maxRetries) {
        // Exponential backoff: 1s, 2s, 4s
        const delay = Math.pow(2, attempt) * 1000;
        await new Promise(resolve => setTimeout(resolve, delay));
        continue;
      }
      
      // Don't retry on other types of errors
      throw error;
    }
  }
  
  throw lastError!;
}