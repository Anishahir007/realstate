import React, { useMemo, useState } from "react";
import "./UnifiedAuth.css";
import {
  SuperAdminProvider,
  useSuperAdmin,
} from "../../context/SuperAdminContext.jsx";
import { BrokerProvider, useBroker } from "../../context/BrokerContext.jsx";
import { AppUserProvider, useAppUser } from "../../context/UserRoleContext.jsx";

 const ROLE_OPTIONS = [
   { value: "user", label: "Buyer/Owner/Tenant" },
   { value: "broker", label: "Agent/Broker" },
   // Super admin hidden in UI per requirement; can be exposed later if needed
 ];

function PasswordHint() {
  return (
    <ul style={{ margin: "8px 0 0 16px", color: "#666", fontSize: 12 }}>
      <li>At least 8 characters</li>
      <li>Include uppercase, lowercase, number and special character</li>
      <li>No spaces or simple number-only sequences</li>
    </ul>
  );
}

function UnifiedAuthInner() {
  const sa = (() => {
    try {
      return useSuperAdmin();
    } catch {
      return {};
    }
  })();
  const broker = (() => {
    try {
      return useBroker();
    } catch {
      return {};
    }
  })();
  const appUser = (() => {
    try {
      return useAppUser();
    } catch {
      return {};
    }
  })();

  const [mode, setMode] = useState("login"); // 'login' | 'signup'
  const [role, setRole] = useState("user");
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [passwordError, setPasswordError] = useState("");

  const apiBase =
    sa?.apiBase ||
    broker?.apiBase ||
    appUser?.apiBase ||
    import.meta.env.VITE_API_BASE ||
    "http://localhost:8000";

  const heading = useMemo(() => {
    const r = ROLE_OPTIONS.find((r) => r.value === role)?.label || "User";
    return `${mode === "login" ? "Login" : "New Registration"} — ${r}`;
  }, [mode, role]);

  async function handleLogin() {
    if (role === "super_admin") return sa.login(email, password);
    if (role === "broker") return broker.login(email, password);
    return appUser.login(email, password);
  }

  function clientValidatePassword(pwd) {
    if (!pwd || pwd.trim().length < 8) return 'Password must be at least 8 characters long';
    if (/\s/.test(pwd)) return 'Password must not contain spaces';
    if (!/[A-Z]/.test(pwd)) return 'Password must include an uppercase letter';
    if (!/[a-z]/.test(pwd)) return 'Password must include a lowercase letter';
    if (!/[0-9]/.test(pwd)) return 'Password must include a number';
    if (!/[^A-Za-z0-9]/.test(pwd)) return 'Password must include a special character';
    if (/^\d+$/.test(pwd)) return 'Password cannot be only numbers';
    const sequences = ['0123456789', '9876543210'];
    for (const seq of sequences) { if (seq.includes(pwd)) return 'Password is too simple. Avoid numeric sequences'; }
    return '';
  }

  async function handleSignup() {
    const localPwdErr = clientValidatePassword(password);
    if (localPwdErr) {
      setPasswordError(localPwdErr);
      throw new Error(localPwdErr);
    }
    const payload = { full_name: fullName, email, phone, password };
    const url =
      role === "super_admin"
        ? `${apiBase}/api/auth/super-admin/signup`
        : role === "broker"
        ? `${apiBase}/api/auth/broker/signup`
        : `${apiBase}/api/auth/user/signup`;
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    if (!res.ok) {
      // Prefer backend specific error
      const backendPwdErr = data?.errors?.password;
      if (backendPwdErr) setPasswordError(backendPwdErr);
      const msg = backendPwdErr || data?.message || "Signup failed";
      throw new Error(msg);
    }
    // Auto-login after signup
    return handleLogin();
  }

  async function onSubmit(e) {
    e.preventDefault();
    setError("");
    setMessage("");
    setPasswordError("");
    setLoading(true);
    try {
      if (mode === "login") {
        await handleLogin();
      } else {
        await handleSignup();
      }
      // Redirect by role
      if (role === "super_admin")
        window.location.href = "/superadmin/dashboard";
      else if (role === "broker") window.location.href = "/broker/dashboard";
      else window.location.href = "/";
    } catch (err) {
      setError(err.message || "Action failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="uauth-container">
      <h2 className="uauth-heading">{heading}</h2>
      <p className="uauth-subtitle">
        Create an account or login to avail the Best Real Estate Solutions
      </p>

      <div className="uauth-role-row">
        <label className="uauth-role">
          <input
            type="radio"
            name="role"
            value="user"
            checked={role === "user"}
            onChange={() => setRole("user")}
          />{" "}
          Buyer/Owner/Tenant
        </label>
        <label className="uauth-role">
          <input
            type="radio"
            name="role"
            value="broker"
            checked={role === "broker"}
            onChange={() => setRole("broker")}
          />{" "}
          Agent
        </label>
         {/* Super Admin selection intentionally hidden */}
      </div>

      {error && <div className="uauth-alert-error">{error}</div>}
      {message && <div className="uauth-alert-info">{message}</div>}

      <form onSubmit={onSubmit}>
        {mode === "signup" && (
          <>
            <label className="uauth-label">Your Name</label>
            <input
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="Your Name"
              required
              className="uauth-input"
            />
          </>
        )}

        <label className="uauth-label">E-mail</label>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@example.com"
          required
          className="uauth-input"
        />

        <label className="uauth-label">Password</label>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Anish@25"
          required
          className="uauth-input"
        />
        {passwordError && <div className="uauth-pass-error">{passwordError}</div>}
        {mode === "signup" && (
          <ul className="uauth-pass-hint">
            <li>At least 8 characters</li>
            <li>Include uppercase, lowercase, number and special character</li>
            <li>No spaces or simple number-only sequences</li>
          </ul>
        )}

        {mode === "signup" && (
          <>
            <div className="uauth-phone-row">
              <select className="uauth-select" defaultValue="IND">
                <option value="IND">IND (+91)</option>
              </select>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="Mobile"
                className="uauth-input"
              />
            </div>
            <label className="uauth-checkbox">
              <input type="checkbox" defaultChecked required /> I agree to Terms & Privacy Policy
            </label>
          </>
        )}

        <button type="submit" disabled={loading} className="uauth-button">
          {loading
            ? "Please wait…"
            : mode === "login"
            ? "CONTINUE ➜"
            : "SIGN UP ➜"}
        </button>
      </form>

      <div className="uauth-foot">
        {mode === "login" ? (
          <>
            New here? <button onClick={() => setMode("signup")} className="uauth-link">Create an account</button>
          </>
        ) : (
          <>
            Already Registered? <button onClick={() => setMode("login")} className="uauth-link">Login here</button>
          </>
        )}
      </div>
    </div>
  );
}

export default function UnifiedAuth() {
  return (
    <div className="uauth-page">
      <SuperAdminProvider>
        <BrokerProvider>
          <AppUserProvider>
            <UnifiedAuthInner />
          </AppUserProvider>
        </BrokerProvider>
      </SuperAdminProvider>
    </div>
  );
}
