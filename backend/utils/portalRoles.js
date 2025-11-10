export const PORTAL_ROLES = ['super_admin', 'sales', 'property_management'];

export function normalizePortalRole(role, fallback = 'super_admin') {
  if (typeof role !== 'string') return fallback;
  const trimmed = role.trim().toLowerCase();
  const canonical = trimmed.replace(/\s+/g, '_');
  return PORTAL_ROLES.includes(canonical) ? canonical : fallback;
}

export function isValidPortalRole(role) {
  if (typeof role !== 'string') return false;
  const trimmed = role.trim().toLowerCase();
  const canonical = trimmed.replace(/\s+/g, '_');
  return PORTAL_ROLES.includes(canonical);
}

