import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../services/api';
import toast from 'react-hot-toast';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [cartCount, setCartCount] = useState(0);

  const refreshCartCount = async () => {
    if (!localStorage.getItem('token')) return;
    try {
      const res = await api.get('/cart');
      const items = res.data.items || [];
      const count = items.reduce((sum, item) => sum + item.quantity, 0);
      setCartCount(count);
    } catch (error) {
      console.error('Failed to fetch cart count:', error);
    }
  };

  // Load user from localStorage on mount
  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    const token = localStorage.getItem('token');
    
    if (storedUser && token) {
      try {
        setUser(JSON.parse(storedUser));
        refreshCartCount();
      } catch (e) {
        console.error('Error parsing stored user:', e);
        localStorage.removeItem('user');
        localStorage.removeItem('token');
      }
    }
    setLoading(false);
  }, []);

  const login = async (email, password) => {
    try {
      const res = await api.post('/auth/login', { email, password });
      setUser(res.data.user);
      localStorage.setItem('user', JSON.stringify(res.data.user));
      localStorage.setItem('token', res.data.token);
      refreshCartCount();
      toast.success('Welcome back!');
      return res.data.user;
    } catch (error) {
      if (!error.response?.data?.notVerified) {
    	toast.error(error.response?.data?.error || 'Login failed');
      }
      throw error;
    }
  };

  const register = async (userData) => {
    try {
      const res = await api.post('/auth/register', userData);
      toast.success(res.data.message || 'Registration successful. Check your email!');
      return res.data;
    } catch (error) {
      toast.error(error.response?.data?.error || 'Registration failed');
      throw error;
    }
  };

  const verifyOTP = async (email, otp_code) => {
    try {
      const res = await api.post('/auth/verify-otp', { email, otp_code });
      toast.success(res.data.message);
      return res.data;
    } catch (error) {
      toast.error(error.response?.data?.error || 'Verification failed');
      throw error;
    }
  };

  const logout = () => {
    setUser(null);
    setCartCount(0);
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    toast.success('Logged out successfully');
  };

  return (
    <AuthContext.Provider value={{ user, loading, cartCount, refreshCartCount, login, register, verifyOTP, logout }}>
      {children}
    </AuthContext.Provider>
  );
};
