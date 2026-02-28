import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../utils/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    const u = localStorage.getItem('pos_user');
    return u ? JSON.parse(u) : null;
  });
  const [loading, setLoading] = useState(false);

  const login = async (email, password) => {
    const { data } = await api.post('/auth/login', { email, password });
    localStorage.setItem('pos_token', data.token);
    localStorage.setItem('pos_user', JSON.stringify(data.user));
    setUser(data.user);
    return data.user;
  };

  const logout = () => {
    localStorage.removeItem('pos_token');
    localStorage.removeItem('pos_user');
    setUser(null);
  };

  const hasRole = (...roles) => user && roles.includes(user.role);

  return (
    <AuthContext.Provider value={{ user, login, logout, hasRole, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
