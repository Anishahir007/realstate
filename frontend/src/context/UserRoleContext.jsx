import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import axios from 'axios';

const AppUserContext = createContext(null);
const STORAGE_KEY = 'realestate_user_auth';
const DEFAULT_API_BASE = import.meta.env.VITE_API_BASE;

function readPersistedAuth() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function persistAuth(state) {
  try {
    if (!state) localStorage.removeItem(STORAGE_KEY);
    else localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // ignore
  }
}

export function AppUserProvider({ children }) {
  const [state, setState] = useState(() => readPersistedAuth());
  const apiBase = DEFAULT_API_BASE;

  useEffect(() => {
    persistAuth(state);
  }, [state]);

  async function login(email, password) {
    let data;
    try {
      ({ data } = await axios.post(`${apiBase}/api/auth/user/login`, { email, password }, {
        headers: { 'Content-Type': 'application/json' },
      }));
    } catch (err) {
      const status = err?.response?.status;
      const serverMsg = err?.response?.data?.message;
      const msg = status === 401 ? 'Invalid email or password' : (serverMsg || err?.message || 'Login failed');
      throw new Error(msg);
    }
    const token = data.token;
    const name = data?.user?.name || data?.name;
    const resolvedEmail = data?.user?.email || data?.email || email;
    const next = { token, name, email: resolvedEmail };
    setState(next);
    return next;
  }

  function logout() {
    setState(null);
  }

  const value = useMemo(() => ({
    ...state,
    isAuthenticated: Boolean(state?.token),
    login,
    logout,
    apiBase,
  }), [state, apiBase]);

  return <AppUserContext.Provider value={value}>{children}</AppUserContext.Provider>;
}

export function useAppUser() {
  const ctx = useContext(AppUserContext);
  if (ctx === undefined) throw new Error('useAppUser must be used within AppUserProvider');
  return ctx;
}

export default AppUserContext;


