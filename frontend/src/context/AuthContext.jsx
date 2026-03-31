import React, { createContext, useState, useContext, useEffect } from 'react';
import api from '../api/axios';

const AuthContext = createContext(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check if user is logged in
    const token = localStorage.getItem('authToken');
    if (token) {
      fetchCurrentUser();
    } else {
      setLoading(false);
    }
  }, []);

  const fetchCurrentUser = async () => {
    try {
      const response = await api.get('/auth/me');
      setUser(response.data.data.user);
    } catch (error) {
      console.error('Fetch current user error:', error);
      localStorage.removeItem('authToken');
    } finally {
      setLoading(false);
    }
  };

  const login = async (email, password, role) => {
    const endpoint = role === 'student' ? '/auth/student/login' : '/auth/tutor/login';
    const response = await api.post(endpoint, { email, password });
    
    const { token, user } = response.data.data;
    localStorage.setItem('authToken', token);
    setUser(user);
    
    return user;
  };

  const register = async (data, role) => {
    const endpoint = role === 'student' ? '/auth/student/register' : '/auth/tutor/register';
    const response = await api.post(endpoint, data);
    
    const { token, user } = response.data.data;
    localStorage.setItem('authToken', token);
    setUser(user);
    
    return user;
  };

  const logout = () => {
    localStorage.removeItem('authToken');
    setUser(null);
    window.location.href = '/login';
  };

  const value = {
    user,
    loading,
    login,
    register,
    logout,
    isAuthenticated: !!user,
    isTutor: user?.role === 'tutor',
    isStudent: user?.role === 'student'
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
