import { createContext, useContext, useState, useEffect } from 'react';
import { authAPI } from '../api/client';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (token) {
      authAPI.me()
        .then((r) => setUser(r.data))
        .catch(() => { localStorage.removeItem('token'); setToken(null); })
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, [token]);

  const login = async (u, p) => {
    const r = await authAPI.login(u, p);
    localStorage.setItem('token', r.data.access_token);
    setToken(r.data.access_token);
    setUser(r.data.user);
    return r.data;
  };

  const register = async (d) => {
    const r = await authAPI.register(d);
    localStorage.setItem('token', r.data.access_token);
    setToken(r.data.access_token);
    setUser(r.data.user);
    return r.data;
  };

  const logout = () => {
    localStorage.removeItem('token');
    setToken(null);
    setUser(null);
  };

  // Role helpers
  const isManager = () => user?.role === 'manager';
  const isTechnician = () => user?.role === 'technician';

  return (
    <AuthContext.Provider value={{ 
      user, token, loading, 
      login, register, logout,
      isManager, isTechnician 
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);