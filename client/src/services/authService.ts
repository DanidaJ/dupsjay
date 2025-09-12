import axios from 'axios';

// Define interfaces for our data types
export interface UserData {
  name?: string;
  email: string;
  password: string;
}

export interface AuthResponse {
  success: boolean;
  token?: string;
  message?: string;
}

const API_URL = 'http://localhost:5000/api/auth/';

// Register user
export const register = async (userData: UserData) => {
  try {
    const response = await axios.post<AuthResponse>(API_URL + 'register', userData);
    
    if (response.data.token) {
      localStorage.setItem('token', response.data.token);
    }
    
    return response.data;
  } catch (error: any) {
    throw error.response ? error.response.data : { message: 'Server error' };
  }
};

// Login user
export const login = async (userData: UserData) => {
  try {
    const response = await axios.post<AuthResponse>(API_URL + 'login', userData);
    
    if (response.data.token) {
      localStorage.setItem('token', response.data.token);
    }
    
    return response.data;
  } catch (error: any) {
    throw error.response ? error.response.data : { message: 'Server error' };
  }
};

// Logout user
export const logout = () => {
  localStorage.removeItem('token');
};

// Define User interface
export interface User {
  _id: string;
  name: string;
  email: string;
  role: string;
  createdAt: string;
}

interface UserResponse {
  success: boolean;
  data: User;
}

// Get current user
export const getCurrentUser = async (): Promise<User | null> => {
  try {
    const token = localStorage.getItem('token');
    
    if (!token) {
      return null;
    }
    
    const response = await axios.get<UserResponse>(API_URL + 'me', {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });
    
    return response.data.data;
  } catch (error: any) {
    logout();
    return null;
  }
};

// Check if user is authenticated
export const isAuthenticated = () => {
  const token = localStorage.getItem('token');
  return !!token;
};

// Get token
export const getToken = () => {
  return localStorage.getItem('token');
};

// Define password reset interfaces
export interface ForgotPasswordResponse {
  success: boolean;
  message: string;
  resetToken?: string; // Only for testing purposes
}

export interface ResetPasswordData {
  password: string;
}

// Forgot password - send reset email
export const forgotPassword = async (email: string): Promise<ForgotPasswordResponse> => {
  try {
    const response = await axios.post<ForgotPasswordResponse>(
      API_URL + 'forgotpassword',
      { email }
    );
    
    return response.data;
  } catch (error: any) {
    throw error.response ? error.response.data : { message: 'Server error' };
  }
};

// Reset password with token
export const resetPassword = async (resetToken: string, password: string): Promise<AuthResponse> => {
  try {
    const response = await axios.put<AuthResponse>(
      API_URL + `resetpassword/${resetToken}`,
      { password }
    );
    
    if (response.data.token) {
      localStorage.setItem('token', response.data.token);
    }
    
    return response.data;
  } catch (error: any) {
    throw error.response ? error.response.data : { message: 'Server error' };
  }
};
