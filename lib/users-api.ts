// lib/users-api.ts
import { Profile } from '@/types/profile';

export type UserRole = 'user' | 'pic' | 'admin';

export interface User {
  id: string;
  full_name: string | null;
  phone: string | null;
  email: string | null;
  nip: string | null;
  jabatan: string | null;
  satuan_kerja: string | null;
  instansi: string | null;
  role?: UserRole | null;
  created_at: string;
  updated_at: string;
  unit_id?: number; // Single assigned unit ID
}

export interface CreateUserData {
  email: string;
  password: string;
  role?: UserRole; // user | pic | admin - default 'user' jika tidak diisi
  full_name?: string;
  phone?: string;
  nip?: string;
  jabatan?: string;
  satuan_kerja?: string;
  instansi?: string;
  unit_id?: number; // Single unit ID to assign
}

export interface UpdateUserData {
  full_name?: string;
  phone?: string;
  email?: string;
  password?: string;
  role?: UserRole; // user | pic | admin - untuk mengubah role (termasuk jadi admin)
  nip?: string;
  jabatan?: string;
  satuan_kerja?: string;
  instansi?: string;
  unit_id?: number; // Single unit ID to assign
}

export interface UsersResponse {
  success: boolean;
  data: User[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface UserResponse {
  success: boolean;
  data: User;
  message?: string;
}

export class UsersAPI {
  private static baseUrl = '/api/v1/users';

  // Get all users with pagination and search
  static async getUsers(
    page = 1,
    limit = 10,
    search = ''
  ): Promise<UsersResponse> {
    const searchParams = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
      ...(search && { search })
    });

    const response = await fetch(`${this.baseUrl}?${searchParams}`);
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    return response.json();
  }

  // Get single user by ID
  static async getUser(id: string): Promise<UserResponse> {
    const response = await fetch(`${this.baseUrl}/${id}`);
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    return response.json();
  }

  // Create new user
  static async createUser(userData: CreateUserData): Promise<UserResponse> {
    const response = await fetch(this.baseUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(userData),
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
    }
    
    return response.json();
  }

  // Update user
  static async updateUser(id: string, userData: UpdateUserData): Promise<UserResponse> {
    const response = await fetch(`${this.baseUrl}/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(userData),
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
    }
    
    return response.json();
  }

  // Delete user
  static async deleteUser(id: string): Promise<{ success: boolean; message: string }> {
    const response = await fetch(`${this.baseUrl}/${id}`, {
      method: 'DELETE',
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
    }
    
    return response.json();
  }
}

// Helper functions
export const formatUserName = (user: User): string => {
  return user.full_name || user.email || 'Unknown User';
};

export const formatUserRole = (user: User): string => {
  return user.role || user.jabatan || 'No Role';
};

export const formatUserInstitution = (user: User): string => {
  const parts = [user.satuan_kerja, user.instansi].filter(Boolean);
  return parts.length > 0 ? parts.join(' - ') : 'No Institution';
};
