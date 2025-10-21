// API utilities for frontend data fetching

const API_BASE = '/api'

export class APIError extends Error {
  constructor(public status: number, message: string) {
    super(message)
    this.name = 'APIError'
  }
}

async function fetchAPI<T>(endpoint: string, options?: RequestInit): Promise<T> {
  try {
    const response = await fetch(`${API_BASE}${endpoint}`, {
      headers: {
        'Content-Type': 'application/json',
        ...options?.headers,
      },
      credentials: 'include', // Include cookies for authentication
      ...options,
    })

    if (!response.ok) {
      let error;
      try {
        error = await response.json();
      } catch (jsonError) {
        // If response is not JSON, create a generic error
        error = { error: `HTTP ${response.status}: ${response.statusText}` };
      }
      throw new APIError(response.status, error.error || 'Request failed')
    }

    // Check if response is JSON
    const contentType = response.headers.get('content-type');
    if (!contentType || !contentType.includes('application/json')) {
      throw new APIError(500, 'Expected JSON response but received different content type');
    }

    return response.json()
  } catch (error) {
    if (error instanceof APIError) {
      throw error
    }
    
    // Handle various network errors
    if (error instanceof TypeError) {
      if (error.message === 'Failed to fetch' || error.message.includes('NetworkError')) {
        throw new APIError(0, 'Network error: Unable to connect to server. Please check your internet connection.')
      }
      if (error.message.includes('CORS')) {
        throw new APIError(0, 'CORS error: Cross-origin request blocked')
      }
      if (error.message.includes('Unexpected token')) {
        throw new APIError(500, 'Invalid JSON response from server')
      }
    }
    
    // Handle AbortError (request timeout/cancelled)
    if (error instanceof DOMException && error.name === 'AbortError') {
      throw new APIError(0, 'Request timeout or cancelled')
    }
    
    // Handle JSON parsing errors
    if (error instanceof SyntaxError && error.message.includes('JSON')) {
      throw new APIError(500, 'Invalid JSON response from server')
    }
    
    // Log unexpected errors for debugging
    console.error('Unexpected API error:', error);
    
    throw new APIError(500, error instanceof Error ? error.message : 'Unknown error')
  }
}

// Equipment API
export const equipmentAPI = {
  getAll: async () => {
    const response = await fetchAPI<{data: any[], total: number, page: number, pageSize: number, totalPages: number}>('/equipment');
    return response.data; // Return just the data array for backward compatibility
  },
  getPaginated: (page?: number, pageSize?: number, filters?: any) => {
    const params = new URLSearchParams();
    if (page) params.append('page', page.toString());
    if (pageSize) params.append('pageSize', pageSize.toString());
    if (filters?.status) params.append('status', filters.status);
    if (filters?.categoryId) params.append('categoryId', filters.categoryId);
    if (filters?.search) params.append('search', filters.search);
    
    const queryString = params.toString();
    return fetchAPI<{data: any[], total: number, page: number, pageSize: number, totalPages: number}>(`/equipment${queryString ? '?' + queryString : ''}`);
  },
  create: (data: any) => fetchAPI<any>('/equipment', {
    method: 'POST',
    body: JSON.stringify(data),
  }),
  update: (data: any) => fetchAPI<any>('/equipment', {
    method: 'PUT',
    body: JSON.stringify(data),
  }),
  delete: (id: string) => fetchAPI<{ success: boolean }>(`/equipment?id=${id}`, {
    method: 'DELETE',
  }),
}

// Categories API
export const categoriesAPI = {
  getAll: () => fetchAPI<any[]>('/categories'),
  create: (data: any) => fetchAPI<any>('/categories', {
    method: 'POST',
    body: JSON.stringify(data),
  }),
  update: (data: any) => fetchAPI<any>('/categories', {
    method: 'PUT',
    body: JSON.stringify(data),
  }),
  delete: (id: string) => fetchAPI<{ success: boolean }>(`/categories?id=${id}`, {
    method: 'DELETE',
  }),
}

// Subcategories API
export const subcategoriesAPI = {
  getAll: () => fetchAPI<any[]>('/subcategories'),
  create: (data: any) => fetchAPI<any>('/subcategories', {
    method: 'POST',
    body: JSON.stringify(data),
  }),
  update: (data: any) => fetchAPI<any>('/subcategories', {
    method: 'PUT',
    body: JSON.stringify(data),
  }),
  delete: (id: string) => fetchAPI<{ success: boolean }>(`/subcategories?id=${id}`, {
    method: 'DELETE',
  }),
}

// Clients API
export const clientsAPI = {
  getAll: () => fetchAPI<any[]>('/clients'),
  create: (data: any) => fetchAPI<any>('/clients', {
    method: 'POST',
    body: JSON.stringify(data),
  }),
  update: (data: any) => fetchAPI<any>('/clients', {
    method: 'PUT',
    body: JSON.stringify(data),
  }),
  delete: (id: string) => fetchAPI<{ success: boolean }>(`/clients?id=${id}`, {
    method: 'DELETE',
  }),
}

// Events API
export const eventsAPI = {
  getAll: () => fetchAPI<any[]>('/events'),
  create: (data: any) => fetchAPI<any>('/events', {
    method: 'POST',
    body: JSON.stringify(data),
  }),
  update: (data: any) => fetchAPI<any>('/events', {
    method: 'PUT',
    body: JSON.stringify(data),
  }),
  delete: (id: string) => fetchAPI<{ success: boolean }>(`/events?id=${id}`, {
    method: 'DELETE',
  }),
}

// Rentals API
export const rentalsAPI = {
  getAll: () => fetchAPI<any[]>('/rentals'),
  create: (data: any) => fetchAPI<any>('/rentals', {
    method: 'POST',
    body: JSON.stringify(data),
  }),
  update: (data: any) => fetchAPI<any>('/rentals', {
    method: 'PUT',
    body: JSON.stringify(data),
  }),
  delete: (id: string) => fetchAPI<{ success: boolean }>(`/rentals?id=${id}`, {
    method: 'DELETE',
  }),
}

// Quotes API
export const quotesAPI = {
  getAll: () => fetchAPI<any[]>('/quotes'),
  create: (data: any) => fetchAPI<any>('/quotes', {
    method: 'POST',
    body: JSON.stringify(data),
  }),
  update: (data: any) => fetchAPI<any>('/quotes', {
    method: 'PUT',
    body: JSON.stringify(data),
  }),
  delete: (id: string) => fetchAPI<{ success: boolean }>(`/quotes?id=${id}`, {
    method: 'DELETE',
  }),
}

// Users API
export const usersAPI = {
  getAll: () => fetchAPI<any[]>('/users'),
  create: (data: any) => fetchAPI<any>('/users', {
    method: 'POST',
    body: JSON.stringify(data),
  }),
  update: (data: any) => fetchAPI<any>('/users', {
    method: 'PUT',
    body: JSON.stringify(data),
  }),
  delete: (id: string) => fetchAPI<{ success: boolean }>(`/users?id=${id}`, {
    method: 'DELETE',
  }),
}