import React, { createContext, useContext, useState, useEffect } from 'react';
import { authService } from '../services/authService';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('bhoomisetu_token') || null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const initAuth = async () => {
      const savedToken = localStorage.getItem('bhoomisetu_token');
      const savedUser = localStorage.getItem('bhoomisetu_user');
      
      if (savedToken && savedUser) {
        setToken(savedToken);
        try {
          setUser(JSON.parse(savedUser));
          // Validate with backend in background
          const freshProfile = await authService.getCurrentUser();
          if (freshProfile) {
            setUser(freshProfile);
            localStorage.setItem('bhoomisetu_user', JSON.stringify(freshProfile));
          }
        } catch (err) {
          console.warn("Auth initialization note:", err);
        }
      }
      setLoading(false);
    };
    initAuth();
  }, []);

  const login = async (email, password) => {
    const data = await authService.login(email, password);
    setToken(data.access_token);
    setUser(data.user);
    localStorage.setItem('bhoomisetu_token', data.access_token);
    localStorage.setItem('bhoomisetu_user', JSON.stringify(data.user));
    return data.user;
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('bhoomisetu_token');
    localStorage.removeItem('bhoomisetu_user');
  };

  const isRole = (roles) => {
    if (!user) return false;
    if (user.role === 'admin') return true;
    if (Array.isArray(roles)) return roles.includes(user.role);
    return user.role === roles;
  };

  return (
    <AuthContext.Provider value={{ user, token, loading, login, logout, isRole, isAuthenticated: !!user }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
