import React, { createContext, useContext, useEffect, useMemo, useRef, useState } from 'react';
import axios from 'axios';
import { getApiBase } from '../utils/apiBase.js';

const BrokerContext = createContext(null);
const STORAGE_KEY = 'realestate_broker_auth';
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

export function BrokerProvider({ children }) {
  const [state, setState] = useState(() => readPersistedAuth());
  const apiBase = useMemo(() => getApiBase(), []);

  useEffect(() => {
    persistAuth(state);
  }, [state]);

  // Always fetch profile when token is present (on mount or token change)
  useEffect(() => {
    async function fetchProfile(activeToken) {
      try {
        const { data } = await axios.get(`${apiBase}/api/auth/whoami`, {
          headers: { Authorization: `Bearer ${activeToken}` },
        });
        if (data && data.data && data.data.role === 'broker') {
          const p = data.data;
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
    let data;
    try {
      ({ data } = await axios.post(`${apiBase}/api/auth/broker/login`, { email, password }, {
        headers: { 'Content-Type': 'application/json' },
      }));
    } catch (err) {
      const status = err?.response?.status;
      const serverMsg = err?.response?.data?.message;
      const msg = status === 401 ? 'Invalid email or password' : (serverMsg || err?.message || 'Login failed');
      throw new Error(msg);
    }
    const token = data.token;
    const next = { token };
    setState(next);
    try {
      const { data: data2 } = await axios.get(`${apiBase}/api/auth/whoami`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (data2 && data2.data && data2.data.role === 'broker') {
        const p = data2.data;
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
      const { data } = await axios.get(`${apiBase}/api/auth/whoami`, {
        headers: { Authorization: `Bearer ${state.token}` },
      });
      if (data && data.data && data.data.role === 'broker') {
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
        return updated;
      }
      return null;
    } catch {
      return null;
    }
  }

  async function updateProfile(payload) {
    if (!state?.token) throw new Error('Not authenticated');
    const { data } = await axios.put(`${apiBase}/api/auth/broker/profile`, payload, {
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${state.token}`,
      },
    });
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
    ...(state || {}),
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


