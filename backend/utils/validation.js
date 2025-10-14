import validator from 'validator';

export function isNonEmptyString(value) {
  return typeof value === 'string' && value.trim().length > 0;
}

export function validateEmail(email) {
  return typeof email === 'string' && validator.isEmail(email);
}

export function validatePassword(password) {
  // Strong password policy:
  // - Min 8 characters
  // - At least 1 uppercase, 1 lowercase, 1 number, 1 special char
  // - No whitespace, not only numbers, and avoid simple numeric sequences
  if (typeof password !== 'string') return false;
  const pwd = password.trim();
  if (pwd.length < 8) return false;
  if (/\s/.test(pwd)) return false;
  const hasUpper = /[A-Z]/.test(pwd);
  const hasLower = /[a-z]/.test(pwd);
  const hasNumber = /[0-9]/.test(pwd);
  const hasSpecial = /[^A-Za-z0-9]/.test(pwd);
  // Reject only-numeric passwords
  if (/^\d+$/.test(pwd)) return false;
  // Reject obvious ascending/descending sequences of length >= 6
  const sequences = ['0123456789', '9876543210'];
  for (const seq of sequences) {
    if (seq.includes(pwd)) return false;
  }
  return hasUpper && hasLower && hasNumber && hasSpecial;
}

export function getPasswordValidationError(password) {
  if (typeof password !== 'string' || password.length === 0) {
    return 'Password is required';
  }
  const pwd = password.trim();
  if (pwd.length < 8) return 'Password must be at least 8 characters long';
  if (/\s/.test(pwd)) return 'Password must not contain spaces';
  const hasUpper = /[A-Z]/.test(pwd);
  const hasLower = /[a-z]/.test(pwd);
  const hasNumber = /[0-9]/.test(pwd);
  const hasSpecial = /[^A-Za-z0-9]/.test(pwd);
  if (/^\d+$/.test(pwd)) return 'Password cannot be only numbers';
  const sequences = ['0123456789', '9876543210'];
  for (const seq of sequences) {
    if (seq.includes(pwd)) return 'Password is too simple. Avoid numeric sequences';
  }
  if (!(hasUpper && hasLower && hasNumber && hasSpecial)) {
    return 'Password must include uppercase, lowercase, number and special character';
  }
  return null;
}

export function sanitizeName(name) {
  if (!isNonEmptyString(name)) return '';
  return validator.escape(name.trim());
}

export function toSafeDbName(seed) {
  // create safe tenant DB name: realstate_broker_{slug}
  const base = String(seed || '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '');
  const trimmed = base || 'broker';
  return `realstate_broker_${trimmed}`.slice(0, 63);
}


