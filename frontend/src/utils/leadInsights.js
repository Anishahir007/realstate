const SOURCE_SEGMENTS = [
  { key: 'website', label: 'Website', color: '#3b82f6' },
  { key: 'whatsapp', label: 'WhatsApp', color: '#10b981' },
  { key: 'social_media', label: 'Social Media', color: '#8b5cf6' },
  { key: 'referral', label: 'Referral', color: '#f59e0b' },
  { key: 'direct', label: 'Direct', color: '#60a5fa' },
  { key: 'call', label: 'Phone', color: '#0ea5e9' },
  { key: 'email', label: 'Email', color: '#1d4ed8' },
];

const SOURCE_COLOR_MAP = SOURCE_SEGMENTS.reduce((acc, segment) => {
  acc[segment.key] = segment.color;
  return acc;
}, {});

export function labelize(value) {
  if (!value) return '-';
  return String(value).replace(/_/g, ' ').replace(/\b\w/g, (char) => char.toUpperCase());
}

export function formatRelativeTime(dateString) {
  if (!dateString) return '';
  const date = new Date(dateString);
  const diffMs = Date.now() - date.getTime();
  const minutes = Math.floor(diffMs / 60000);
  if (minutes < 1) return 'just now';
  if (minutes < 60) return `${minutes} minute${minutes === 1 ? '' : 's'} ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} hour${hours === 1 ? '' : 's'} ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days} day${days === 1 ? '' : 's'} ago`;
  const weeks = Math.floor(days / 7);
  if (weeks < 5) return `${weeks} week${weeks === 1 ? '' : 's'} ago`;
  const months = Math.floor(days / 30);
  if (months < 12) return `${months} month${months === 1 ? '' : 's'} ago`;
  const years = Math.floor(days / 365);
  return `${years} year${years === 1 ? '' : 's'} ago`;
}

function parseAssignee(value) {
  if (!value) return null;
  if (typeof value === 'object') return value;
  const trimmed = String(value).trim();
  if (!trimmed) return null;
  if (trimmed.startsWith('{')) {
    try {
      const parsed = JSON.parse(trimmed);
      if (parsed && typeof parsed === 'object') return parsed;
    } catch {
      /* noop */
    }
  }
  return { name: trimmed };
}

export function parseAssigneeLabel(value) {
  const parsed = parseAssignee(value);
  if (!parsed) return '';
  if (parsed.name && parsed.role) return `${parsed.name} (${labelize(parsed.role)})`;
  if (parsed.name) return parsed.name;
  if (parsed.email) return parsed.email;
  if (parsed.id) return `User #${parsed.id}`;
  return typeof value === 'string' ? value : '';
}

export function buildActivityLog(lead) {
  if (!lead) return [];
  const events = [];
  const createdAt = lead.created_at || lead.updated_at || new Date().toISOString();
  events.push({
    type: 'created',
    title: 'Lead created',
    description: `Captured via ${labelize(lead.source || 'website')}`,
    date: createdAt,
  });
  if (lead.status) {
    events.push({
      type: 'status',
      title: 'Status updated',
      description: `Current status: ${labelize(lead.status)}`,
      date: lead.updated_at || createdAt,
    });
  }
  if (lead.property_interest) {
    events.push({
      type: 'property',
      title: 'Property interest recorded',
      description: lead.property_interest,
      date: lead.updated_at || createdAt,
    });
  }
  if (lead.message) {
    events.push({
      type: 'note',
      title: 'Lead message',
      description: lead.message,
      date: lead.created_at || createdAt,
    });
  }
  if (lead.assigned_to) {
    events.push({
      type: 'assignment',
      title: 'Owner assigned',
      description: parseAssigneeLabel(lead.assigned_to),
      date: lead.updated_at || new Date().toISOString(),
    });
  }
  return events;
}

function toNumber(value) {
  if (value == null) return null;
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  const parsed = Number(String(value).replace(/[^0-9.]/g, ''));
  return Number.isFinite(parsed) ? parsed : null;
}

function normalizeSourceEntries(entries) {
  const filtered = (entries || []).filter((entry) => entry && Number(entry.value) > 0);
  if (!filtered.length) return [];
  const total = filtered.reduce((sum, entry) => sum + Number(entry.value), 0) || 1;
  return filtered.map((entry) => ({
    ...entry,
    value: Number(((entry.value / total) * 100).toFixed(1)),
  }));
}

function parseSourceArray(raw) {
  if (!raw) return null;
  if (Array.isArray(raw)) return raw;
  if (typeof raw === 'string') {
    try {
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed : null;
    } catch {
      return null;
    }
  }
  return null;
}

export function buildSourceBreakdown(sourceOrLead) {
  const lead = typeof sourceOrLead === 'string' ? { source: sourceOrLead } : (sourceOrLead || {});
  const structured =
    parseSourceArray(lead.source_distribution) ||
    parseSourceArray(lead.source_breakdown) ||
    parseSourceArray(lead.sources);

  if (structured && structured.length) {
    const mapped = structured
      .map((item) => {
        const label = labelize(item.label || item.name || item.source || item.key);
        const value =
          toNumber(item.value ?? item.percent ?? item.percentage ?? item.share) ?? 0;
        if (!label || value <= 0) return null;
        const normalizedKey = String(item.label || item.key || label).toLowerCase();
        return {
          label,
          value,
          color: item.color || SOURCE_COLOR_MAP[normalizedKey] || '#94a3b8',
        };
      })
      .filter(Boolean);
    const normalized = normalizeSourceEntries(mapped);
    if (normalized.length) return normalized;
  }

  if (typeof lead.source_details === 'string' && lead.source_details.includes(',')) {
    const parts = lead.source_details
      .split(',')
      .map((part) => part.trim())
      .filter(Boolean);
    if (parts.length) {
      const share = 100 / parts.length;
      return normalizeSourceEntries(
        parts.map((part, idx) => ({
          label: labelize(part),
          value: share,
          color: SOURCE_COLOR_MAP[part.toLowerCase()] || SOURCE_SEGMENTS[idx % SOURCE_SEGMENTS.length].color,
        }))
      );
    }
  }

  const primaryKey = (lead.source || lead.primary_source || 'website').toLowerCase();
  const primaryEntry = {
    label: labelize(primaryKey),
    value: 100,
    color: SOURCE_COLOR_MAP[primaryKey] || SOURCE_SEGMENTS[0].color,
  };
  return [primaryEntry];
}

function parseDateSafe(value) {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

function normalizeTrackingRecord(record) {
  return {
    totalMinutes: Math.max(0, Number(record?.totalMinutes) || 0),
    daily: record?.daily && typeof record.daily === 'object' ? { ...record.daily } : {},
  };
}

function getTimeTrackingKey(scope, leadId) {
  if (!scope || !leadId) return null;
  return `lead-time-${scope}-${leadId}`;
}

export function loadTimeTracking(scope, leadId) {
  if (typeof window === 'undefined') return normalizeTrackingRecord();
  const key = getTimeTrackingKey(scope, leadId);
  if (!key) return normalizeTrackingRecord();
  try {
    const raw = window.localStorage.getItem(key);
    return normalizeTrackingRecord(raw ? JSON.parse(raw) : {});
  } catch {
    return normalizeTrackingRecord();
  }
}

function saveTimeTracking(scope, leadId, record) {
  if (typeof window === 'undefined') return;
  const key = getTimeTrackingKey(scope, leadId);
  if (!key) return;
  try {
    window.localStorage.setItem(key, JSON.stringify(record));
  } catch {
    /* noop */
  }
}

export function recordTimeTracking(scope, leadId, minutes) {
  if (typeof window === 'undefined' || !scope || !leadId || !minutes || minutes <= 0) {
    return normalizeTrackingRecord();
  }
  const record = loadTimeTracking(scope, leadId);
  record.totalMinutes += minutes;
  const dayKey = new Date().toISOString().slice(0, 10);
  record.daily[dayKey] = (record.daily[dayKey] || 0) + minutes;

  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - 60);
  Object.keys(record.daily).forEach((dateKey) => {
    const dateValue = parseDateSafe(dateKey);
    if (!dateValue || dateValue < cutoff) {
      delete record.daily[dateKey];
    }
  });

  saveTimeTracking(scope, leadId, record);
  return normalizeTrackingRecord(record);
}

export function buildHoursInsight(trackingRecord, points = 7) {
  const record = normalizeTrackingRecord(trackingRecord);
  const series = [];
  const today = new Date();
  let displayedMinutes = 0;
  let activeDays = 0;

  for (let i = points - 1; i >= 0; i -= 1) {
    const date = new Date(today);
    date.setDate(today.getDate() - (points - 1 - i));
    const dateKey = date.toISOString().slice(0, 10);
    const minutes = Number(record.daily[dateKey]) || 0;
    displayedMinutes += minutes;
    if (minutes > 0) activeDays += 1;
    series.push(Number((minutes / 60).toFixed(2)));
  }

  const peakHours = Math.max(...series, 0);
  const averageHours = activeDays ? (displayedMinutes / 60) / activeDays : 0;

  return {
    series,
    averageHours,
    peakHours,
    totalMinutes: record.totalMinutes,
  };
}

export function getNotesStorageKey(scope, leadId) {
  if (!leadId) return null;
  return `lead-notes-${scope}-${leadId}`;
}

export function loadStoredNotes(storageKey) {
  if (typeof window === 'undefined' || !storageKey) return [];
  try {
    const raw = window.localStorage.getItem(storageKey);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function saveStoredNotes(storageKey, notes) {
  if (typeof window === 'undefined' || !storageKey) return;
  try {
    window.localStorage.setItem(storageKey, JSON.stringify(notes));
  } catch {
    /* noop */
  }
}

export function buildInitialNotes(lead) {
  const notes = [];
  if (lead?.message) {
    notes.push({
      id: `message-${lead.id}`,
      text: lead.message,
      timestamp: lead.created_at || new Date().toISOString(),
    });
  }
  return notes;
}

export function createNoteEntry(text) {
  return {
    id: `note-${Date.now()}`,
    text,
    timestamp: new Date().toISOString(),
  };
}

export function generateHoursSeries(trackingRecord, points = 7) {
  return buildHoursInsight(trackingRecord, points).series;
}


