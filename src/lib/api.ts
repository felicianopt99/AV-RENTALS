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
      ...options,
    })

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Unknown error' }))
      throw new APIError(response.status, error.error || 'Request failed')
    }

    return response.json()
  } catch (error) {
    if (error instanceof APIError) {
      throw error
    }
    
    // Handle network errors
    if (error instanceof TypeError && error.message === 'Failed to fetch') {
      throw new APIError(0, 'Network error: Unable to connect to server')
    }
    
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