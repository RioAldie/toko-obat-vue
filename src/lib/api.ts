export const API_URL = import.meta.env.VITE_API_URL || 'https://toko-obat-server-five.vercel.app';

export async function fetchApi(endpoint: string, options: RequestInit = {}) {
  const url = `${API_URL}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;
  
  const defaultHeaders: HeadersInit = {
    'Content-Type': 'application/json',
  };

  // Add auth token if available
  const token = localStorage.getItem('token');
  if (token) {
    defaultHeaders['Authorization'] = `Bearer ${token}`;
  }

  const config: RequestInit = {
    ...options,
    headers: {
      ...defaultHeaders,
      ...options.headers,
    },
  };

  try {
    const response = await fetch(url, config);

    if (!response.ok) {
      const errorBody = await response.json().catch(() => ({}));
      throw new Error(errorBody.message || 'An error occurred while fetching data');
    }

    // Handle empty responses
    if (response.status === 204) {
      return null;
    }

    return response.json();
  } catch (error: any) {
    if (error.cause?.code === 'ECONNREFUSED') {
      throw new Error('Koneksi ke backend gagal. Pastikan server NestJS berjalan.');
    }
    throw error;
  }
}
