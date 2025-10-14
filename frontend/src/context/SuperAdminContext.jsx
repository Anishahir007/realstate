import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';

const SuperAdminContext = createContext(null);
const STORAGE_KEY = 'realestate_superadmin_auth';
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

export function SuperAdminProvider({ children }) {
  const [state, setState] = useState(() => readPersistedAuth());
  const apiBase = DEFAULT_API_BASE;

  useEffect(() => {
    persistAuth(state);
  }, [state]);

  // Fetch profile when we have a token but profile fields are missing
  useEffect(() => {
    async function fetchProfile(activeToken) {
      try {
        const profileRes = await fetch(`${apiBase}/api/auth/whoami`, {
          method: 'GET',
          headers: { Authorization: `Bearer ${activeToken}` }
        });
        const profileJson = await profileRes.json();
        if (profileRes.ok && profileJson && profileJson.data) {
          const profile = profileJson.data;
          setState(prev => ({
            ...(prev || {}),
            token: activeToken,
            profile,
            name: profile.name,
            email: profile.email,
            phone: profile.phone,
            photo: profile.photo,
            lastLoginAt: profile.lastLoginAt,
          }));
        }
      } catch {
        // ignore
      }
    }
    const needsProfile = !state?.profile || !state?.profile?.name || !state?.profile?.email || !state?.profile?.phone || !state?.profile?.lastLoginAt;
    if (state?.token && needsProfile) {
      fetchProfile(state.token);
    }
  }, [state?.token, state?.profile, apiBase]);

  async function login(email, password) {
    const res = await fetch(`${apiBase}/api/auth/super-admin/login`, {
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
      const profileRes = await fetch(`${apiBase}/api/auth/whoami`, {
        method: 'GET',
        headers: { Authorization: `Bearer ${token}` }
      });
      const profileJson = await profileRes.json();
      if (profileRes.ok && profileJson && profileJson.data) {
        const profile = profileJson.data;
        const updated = {
          token,
          name: profile.name,
          email: profile.email,
          phone: profile.phone,
          photo: profile.photo,
          lastLoginAt: profile.lastLoginAt,
        };
        setState(updated);
        return updated;
      }
    } catch {
      // ignore profile fetch errors, token is persisted
    }
    return next;
  }

  function logout() {
    setState(null);
  }

  async function refreshProfile() {
    if (!state?.token) return null;
    try {
      const profileRes = await fetch(`${apiBase}/api/auth/whoami`, {
        method: 'GET',
        headers: { Authorization: `Bearer ${state.token}` }
      });
      const profileJson = await profileRes.json();
      if (profileRes.ok && profileJson && profileJson.data) {
        const p = profileJson.data;
        const updated = {
          token: state.token,
          profile: p,
          name: p.name,
          email: p.email,
          phone: p.phone,
          photo: p.photo,
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
    const res = await fetch(`${apiBase}/api/auth/super-admin/profile`, {
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

  return <SuperAdminContext.Provider value={value}>{children}</SuperAdminContext.Provider>;
}

export function useSuperAdmin() {
  const ctx = useContext(SuperAdminContext);
  if (ctx === undefined) throw new Error('useSuperAdmin must be used within SuperAdminProvider');
  return ctx;
}

export default SuperAdminContext;


