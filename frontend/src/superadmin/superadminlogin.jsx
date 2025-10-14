import React, { useState } from 'react';
import { FiEye, FiEyeOff } from 'react-icons/fi';
import { useSuperAdmin } from '../context/SuperAdminContext.jsx';
import './superadminlogin.css';

export default function SuperAdminLogin() {
  const { login } = useSuperAdmin() || {};
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function onSubmit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      if (!login) throw new Error('Auth not initialized');
      await login(email, password);
      window.location.href = '/superadmin/dashboard';
    } catch (err) {
      setError(err?.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="superadminlogin-root">
      <div className="superadminlogin-hero" aria-hidden="true" />
      <div className="superadminlogin-panel">
        <div className="superadminlogin-card">
          <div className="superadminlogin-brand">
            <img src="/vite.svg" alt="Logo" className="superadminlogin-logo" />
          </div>
          <h1 className="superadminlogin-title">Welcome Back!</h1>
          <p className="superadminlogin-subtitle">Login to manage, market, and sell properties effortlessly.</p>

          {error && (
            <div className="superadminlogin-error" role="alert">{error}</div>
          )}

          <form className="superadminlogin-form" onSubmit={onSubmit}>
            <label className="superadminlogin-label">Email</label>
            <input
              type="email"
              className="superadminlogin-input"
              placeholder="Enter your Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />

            <label className="superadminlogin-label">Password</label>
            <div className="superadminlogin-password">
              <input
                type={showPassword ? 'text' : 'password'}
                className="superadminlogin-input superadminlogin-input-password"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
              <button
                type="button"
                className="superadminlogin-eye"
                aria-label={showPassword ? 'Hide password' : 'Show password'}
                onClick={() => setShowPassword((v) => !v)}
              >
                {showPassword ? <FiEyeOff aria-hidden /> : <FiEye aria-hidden />}
              </button>
            </div>

            <div className="superadminlogin-row">
              <label className="superadminlogin-remember">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                />
                <span>Remember Me</span>
              </label>
              <a className="superadminlogin-link" href="#">Forgot password?</a>
            </div>

            <button type="submit" className="superadminlogin-button" disabled={loading}>
              {loading ? 'Logging in…' : 'Login'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}


