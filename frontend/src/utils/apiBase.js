export function getApiBase() {
  try {
    let base = (import.meta.env.VITE_API_BASE || '').trim();
    // If not provided, default to same-origin (empty prefix → "/api/..." requests)
    if (!base) return '';
    // Ensure protocol when user provides host:port
    if (!/^https?:\/\//i.test(base)) base = `http://${base}`;
    const provided = new URL(base);
    const current = new URL(window.location.origin);
    // If same origin, return empty so app uses relative "/api"
    if (provided.origin === current.origin) return '';
    return provided.origin;
  } catch {
    return '';
  }
}


