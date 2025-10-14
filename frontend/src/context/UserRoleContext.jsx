import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';

const AppUserContext = createContext(null);
const STORAGE_KEY = 'realestate_user_auth';
const DEFAULT_API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:8000';

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
    const res = await fetch(`${apiBase}/api/auth/user/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
    const data = await res.json();
    if (!res.ok) {
      const message = data?.message || 'Login failed';
      throw new Error(message);
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


