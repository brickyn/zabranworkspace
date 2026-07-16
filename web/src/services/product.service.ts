import { Product, CreateProductInput, UpdateProductInput } from '../types/product';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'; // Adjust as needed

// Helper to get auth token (assuming stored in localStorage for now)
const getAuthHeaders = () => {
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
};

export const productService = {
  async getProducts(params?: { status?: string; brand?: string; search?: string }): Promise<Product[]> {
    const query = new URLSearchParams();
    if (params?.status) query.append('status', params.status);
    if (params?.brand) query.append('brand', params.brand);
    if (params?.search) query.append('search', params.search);
    
    const queryString = query.toString() ? `?${query.toString()}` : '';
    
    const response = await fetch(`${API_URL}/products${queryString}`, {
      headers: getAuthHeaders(),
    });
    
    if (!response.ok) throw new Error('Failed to fetch products');
    return response.json();
  },

  async getProductById(id: string): Promise<Product> {
    const response = await fetch(`${API_URL}/products/${id}`, {
      headers: getAuthHeaders(),
    });
    if (!response.ok) throw new Error('Failed to fetch product');
    return response.json();
  },

  async createProduct(data: CreateProductInput): Promise<Product> {
    const response = await fetch(`${API_URL}/products`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });
    
    if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create product');
    }
    return response.json();
  },

  async updateProduct(id: string, data: UpdateProductInput): Promise<Product> {
    const response = await fetch(`${API_URL}/products/${id}`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });
    
    if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update product');
    }
    return response.json();
  },

  async deleteProduct(id: string): Promise<void> {
    const response = await fetch(`${API_URL}/products/${id}`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
    });
    if (!response.ok) throw new Error('Failed to delete product');
  }
};
