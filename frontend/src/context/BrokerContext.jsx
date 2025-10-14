import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';

const BrokerContext = createContext(null);
const STORAGE_KEY = 'realestate_broker_auth';
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

export function BrokerProvider({ children }) {
  const [state, setState] = useState(() => readPersistedAuth());
  const apiBase = DEFAULT_API_BASE;

  useEffect(() => {
    persistAuth(state);
  }, [state]);

  async function login(email, password) {
    const res = await fetch(`${apiBase}/api/auth/broker/login`, {
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
    const brokerId = data?.broker_id;
    const next = { token, name, email: resolvedEmail, brokerId };
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

  return <BrokerContext.Provider value={value}>{children}</BrokerContext.Provider>;
}

export function useBroker() {
  const ctx = useContext(BrokerContext);
  if (ctx === undefined) throw new Error('useBroker must be used within BrokerProvider');
  return ctx;
}

export default BrokerContext;


