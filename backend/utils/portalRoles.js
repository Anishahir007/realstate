export const PORTAL_ROLES = ['super_admin', 'sales', 'property_management'];
export const COMPANY_PORTAL_ROLES = ['company_admin', 'sales', 'property_management'];

export function normalizePortalRole(role, fallback = 'super_admin') {
  if (typeof role !== 'string') return fallback;
  const trimmed = role.trim().toLowerCase();
  const canonical = trimmed.replace(/\s+/g, '_');
  // Check both super_admin and company roles
  if (PORTAL_ROLES.includes(canonical)) return canonical;
  if (COMPANY_PORTAL_ROLES.includes(canonical)) return canonical;
  return fallback;
}

export function isValidPortalRole(role) {
  if (typeof role !== 'string') return false;
  const trimmed = role.trim().toLowerCase();
  const canonical = trimmed.replace(/\s+/g, '_');
  return PORTAL_ROLES.includes(canonical) || COMPANY_PORTAL_ROLES.includes(canonical);
}

