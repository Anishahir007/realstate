import React, { useMemo, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import "./UnifiedAuth.css";
import { FiEye, FiEyeOff } from "react-icons/fi";
import { SuperAdminProvider } from "../../context/SuperAdminContext.jsx";
import { BrokerProvider, useBroker } from "../../context/BrokerContext.jsx";
import { CompanyProvider, useCompany } from "../../context/CompanyContext.jsx";
import { AppUserProvider, useAppUser } from "../../context/UserRoleContext.jsx";

 const ROLE_OPTIONS = [
   { value: "user", label: "Buyer/Owner/Tenant" },
   { value: "broker", label: "Agent/Broker" },
   { value: "company", label: "Company" },
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
  const navigate = useNavigate();
  const broker = (() => {
    try {
      return useBroker();
    } catch {
      return {};
    }
  })();
  const company = (() => {
    try {
      return useCompany();
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
  const [companyName, setCompanyName] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [otpId, setOtpId] = useState("");
  const [otpCode, setOtpCode] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const apiBase =
    broker?.apiBase ||
    company?.apiBase ||
    appUser?.apiBase ||
    import.meta.env.VITE_API_BASE;

  const heading = useMemo(() => {
    const r = ROLE_OPTIONS.find((r) => r.value === role)?.label || "User";
    return `${mode === "login" ? "Login" : "New Registration"} — ${r}`;
  }, [mode, role]);

  async function handleLogin() {
    try {
      if (role === "broker") return await broker.login(email, password);
      if (role === "company") return await company.login(email, password);
      return await appUser.login(email, password);
    } catch (err) {
      const status = err?.response?.status;
      const msg = status === 401 ? 'Invalid email or password' : (err?.message || 'Login failed');
      throw new Error(msg);
    }
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
    
    // Company requires company_name
    if (role === "company" && !companyName.trim()) {
      throw new Error("Company name is required");
    }
    
    const payload = role === "company" 
      ? { full_name: fullName, email, phone, password, company_name: companyName }
      : { full_name: fullName, email, phone, password };
    
    const url =
      role === "broker"
        ? `${apiBase}/api/auth/broker/signup`
        : role === "company"
        ? `${apiBase}/api/auth/company/signup`
        : `${apiBase}/api/auth/user/signup`;

    // User/Broker/Company two-step: send OTP or verify
    const body = otpId ? { ...payload, otpId, otpCode } : payload;
    try {
      const { status, data } = await axios.post(url, body, { headers: { "Content-Type": "application/json" } });
      if (status === 202) {
        setOtpId(data?.otpId || "");
        setMessage("OTP sent to your phone");
        return { step: "otp_sent" };
      }
      await handleLogin();
      return { step: "done" };
    } catch (err) {
      const data = err?.response?.data;
      const backendPwdErr = data?.errors?.password;
      if (backendPwdErr) setPasswordError(backendPwdErr);
      const msg = data?.message || err?.message || "Signup failed";
      throw new Error(msg);
    }
  }

  async function onSubmit(e) {
    e.preventDefault();
    setError("");
    setMessage("");
    setPasswordError("");
    setLoading(true);
    try {
      let result;
      if (mode === "login") {
        await handleLogin();
        result = { step: "done" };
      } else {
        result = await handleSignup();
      }
      // Only redirect when flow completed
      if (result?.step === "done") {
        // Small delay to ensure state is updated and context is ready
        setTimeout(() => {
          if (role === "broker") {
            navigate("/broker/dashboard", { replace: true });
          } else if (role === "company") {
            navigate("/company/dashboard", { replace: true });
          } else {
            navigate("/", { replace: true });
          }
        }, 200);
      }
    } catch (err) {
      const msg = err?.message || "Action failed";
      setError(msg);
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
            onChange={() => {
              setRole("user");
              if (mode === "signup") setCompanyName("");
            }}
          />{" "}
          Buyer/Owner/Tenant
        </label>
        <label className="uauth-role">
          <input
            type="radio"
            name="role"
            value="broker"
            checked={role === "broker"}
            onChange={() => {
              setRole("broker");
              if (mode === "signup") setCompanyName("");
            }}
          />{" "}
          Agent
        </label>
        <label className="uauth-role">
          <input
            type="radio"
            name="role"
            value="company"
            checked={role === "company"}
            onChange={() => setRole("company")}
          />{" "}
          Company
        </label>
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
            {role === "company" && (
              <>
                <label className="uauth-label">Company Name</label>
                <input
                  type="text"
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  placeholder="Company Name"
                  required
                  className="uauth-input"
                />
              </>
            )}
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
        <div className="uauth-password-wrapper">
          <input
            type={showPassword ? "text" : "password"}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Anish@25"
            required
            className="uauth-input uauth-password-input"
          />
          <button
            type="button"
            className="uauth-password-toggle"
            onClick={() => setShowPassword(!showPassword)}
            aria-label={showPassword ? "Hide password" : "Show password"}
          >
            {showPassword ? <FiEyeOff /> : <FiEye />}
          </button>
        </div>
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

        {otpId && mode === "signup" ? (
          <>
            <label className="uauth-label">Enter OTP</label>
            <input
              type="text"
              value={otpCode}
              onChange={(e) => setOtpCode(e.target.value)}
              placeholder="6-digit code"
              className="uauth-input"
            />
            <button type="submit" disabled={loading || !otpCode} className="uauth-button">
              {loading ? "Please wait…" : "VERIFY OTP ➜"}
            </button>
            <div style={{ marginTop: 8 }}>
              <button
                type="button"
                className="uauth-link"
                onClick={async () => {
                  try {
                    setError("");
                    setMessage("");
                    setLoading(true);
                    // Resend request: call send step again
                    setOtpId("");
                    await handleSignup();
                  } catch (e) {
                    setError(e.message || "Failed to resend OTP");
                  } finally {
                    setLoading(false);
                  }
                }}
              >
                Resend OTP
              </button>
            </div>
          </>
        ) : (
          <button type="submit" disabled={loading} className="uauth-button">
            {loading
              ? "Please wait…"
              : mode === "login"
              ? "CONTINUE ➜"
              : "SIGN UP ➜"}
          </button>
        )}
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
          <CompanyProvider>
            <AppUserProvider>
              <UnifiedAuthInner />
            </AppUserProvider>
          </CompanyProvider>
        </BrokerProvider>
      </SuperAdminProvider>
    </div>
  );
}
