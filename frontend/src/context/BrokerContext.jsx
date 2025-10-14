import React, { createContext, useContext, useEffect, useMemo, useRef, useState } from 'react';

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

  // Always fetch profile when token is present (on mount or token change)
  useEffect(() => {
    async function fetchProfile(activeToken) {
      try {
        const res = await fetch(`${apiBase}/api/auth/whoami`, {
          method: 'GET',
          headers: { Authorization: `Bearer ${activeToken}` },
        });
        const json = await res.json();
        if (res.ok && json && json.data && json.data.role === 'broker') {
          const p = json.data;
          setState(prev => ({
            ...(prev || {}),
            token: activeToken,
            profile: p,
            name: p.name,
            email: p.email,
            phone: p.phone,
            photo: p.photo,
            brokerId: p.id,
            licenseNo: p.licenseNo,
            tenantDb: p.tenantDb,
            lastLoginAt: p.lastLoginAt,
          }));
        }
      } catch {
        // ignore
      }
    }
    if (state?.token) {
      fetchProfile(state.token);
    } 
  }, [state?.token, apiBase]);

  // Refresh profile when window gains focus or tab becomes visible
  useEffect(() => {
    function onFocus() {
      if (state?.token) {
        refreshProfile();
      }
    }
    function onVisibility() {
      if (document.visibilityState === 'visible' && state?.token) {
        refreshProfile();
      }
    }
    window.addEventListener('focus', onFocus);
    document.addEventListener('visibilitychange', onVisibility);
    return () => {
      window.removeEventListener('focus', onFocus);
      document.removeEventListener('visibilitychange', onVisibility);
    };
  }, [state?.token]);

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
    const next = { token };
    setState(next);
    try {
      const res2 = await fetch(`${apiBase}/api/auth/whoami`, {
        method: 'GET',
        headers: { Authorization: `Bearer ${token}` },
      });
      const json2 = await res2.json();
      if (res2.ok && json2 && json2.data && json2.data.role === 'broker') {
        const p = json2.data;
        const updated = {
          token,
          profile: p,
          name: p.name,
          email: p.email,
          phone: p.phone,
          photo: p.photo,
          brokerId: p.id,
          licenseNo: p.licenseNo,
          tenantDb: p.tenantDb,
          lastLoginAt: p.lastLoginAt,
        };
        setState(updated);
        return updated;
      }
    } catch {
      // ignore
    }
    return next;
  }

  function logout() {
    setState(null);
  }

  async function refreshProfile() {
    if (!state?.token) return null;
    try {
      const res = await fetch(`${apiBase}/api/auth/whoami`, {
        method: 'GET',
        headers: { Authorization: `Bearer ${state.token}` },
      });
      const json = await res.json();
      if (res.ok && json && json.data && json.data.role === 'broker') {
        const p = json.data;
        const updated = {
          token: state.token,
          profile: p,
          name: p.name,
          email: p.email,
          phone: p.phone,
          photo: p.photo,
          brokerId: p.id,
          licenseNo: p.licenseNo,
          tenantDb: p.tenantDb,
          lastLoginAt: p.lastLoginAt,
        };
        setState(updated);
        return updated;
      }
      return null;
    } catch {
      return null;
    }
  }

  async function updateProfile(payload) {
    if (!state?.token) throw new Error('Not authenticated');
    const res = await fetch(`${apiBase}/api/auth/broker/profile`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${state.token}`,
      },
      body: JSON.stringify(payload),
    });
    const ct = res.headers.get('content-type') || '';
    const data = ct.includes('application/json') ? await res.json() : null;
    if (!res.ok) {
      if (data?.message) throw new Error(data.message);
      const text = !ct.includes('application/json') ? await res.text() : '';
      throw new Error(text ? `Unexpected response (${res.status})` : 'Update failed');
    }
    if (data && data.data) {
      const p = data.data;
      const updated = {
        token: state.token,
        profile: p,
        name: p.name,
        email: p.email,
        phone: p.phone,
        photo: p.photo,
        brokerId: p.id,
        licenseNo: p.licenseNo,
        tenantDb: p.tenantDb,
        lastLoginAt: p.lastLoginAt,
      };
      setState(updated);
    }
    return data;
  }

  const value = useMemo(() => ({
    ...state,
    isAuthenticated: Boolean(state?.token),
    login,
    logout,
    refreshProfile,
    updateProfile,
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


