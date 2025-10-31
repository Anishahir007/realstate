const pad = (value) => String(value).padStart(2, '0');

function startOfDay(date) {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

function endOfDay(date) {
  const d = new Date(date);
  d.setHours(23, 59, 59, 999);
  return d;
}

function parseDateInput(input) {
  if (!input) return null;
  const d = new Date(input);
  if (Number.isNaN(d.getTime())) return null;
  return d;
}

export function resolveDateRange({ range, from, to, month, year, now = new Date() } = {}) {
  const normalized = (range || '').toString().toLowerCase();
  const reference = now instanceof Date && !Number.isNaN(now.getTime()) ? new Date(now) : new Date();

  let startDate = null;
  let endDate = null;

  if (normalized === 'this-month') {
    const start = new Date(reference.getFullYear(), reference.getMonth(), 1);
    startDate = startOfDay(start);
    endDate = endOfDay(reference);
  } else if (normalized === 'this-year') {
    const start = new Date(reference.getFullYear(), 0, 1);
    startDate = startOfDay(start);
    endDate = endOfDay(reference);
  } else if (normalized === 'month') {
    const monthValue = (month || '').toString();
    const [y, m] = monthValue.split('-');
    const yearNum = Number.parseInt(y, 10);
    const monthNum = Number.parseInt(m, 10) - 1;
    if (Number.isFinite(yearNum) && Number.isFinite(monthNum) && monthNum >= 0 && monthNum <= 11) {
      const start = new Date(yearNum, monthNum, 1);
      const end = new Date(yearNum, monthNum + 1, 0);
      startDate = startOfDay(start);
      endDate = endOfDay(end);
    }
  } else if (normalized === 'year') {
    const yearNum = Number.parseInt(year, 10);
    if (Number.isFinite(yearNum)) {
      const start = new Date(yearNum, 0, 1);
      const end = new Date(yearNum, 11, 31);
      startDate = startOfDay(start);
      endDate = endOfDay(end);
    }
  } else if (normalized === 'custom') {
    const startParsed = parseDateInput(from);
    const endParsed = parseDateInput(to || from);
    if (startParsed) {
      startDate = startOfDay(startParsed);
      endDate = endOfDay(endParsed || startParsed);
    }
  } else if (normalized === 'range' || normalized === 'between') {
    // Support alternate synonyms if needed in future
    const startParsed = parseDateInput(from);
    const endParsed = parseDateInput(to || from);
    if (startParsed) {
      startDate = startOfDay(startParsed);
      endDate = endOfDay(endParsed || startParsed);
    }
  } else if (normalized === 'all' || normalized === 'all-time' || normalized === '') {
    startDate = null;
    endDate = null;
  } else {
    // Allow explicit from/to even if range keyword not recognised
    const startParsed = parseDateInput(from);
    const endParsed = parseDateInput(to || from);
    if (startParsed || endParsed) {
      startDate = startParsed ? startOfDay(startParsed) : null;
      endDate = endParsed ? endOfDay(endParsed) : null;
    }
  }

  if (startDate && endDate && startDate > endDate) {
    const tmp = startDate;
    startDate = endDate;
    endDate = tmp;
  }

  return { startDate, endDate };
}

export function dateRangeLabel({ range, from, to, month, year } = {}) {
  const normalized = (range || '').toString().toLowerCase();
  const formatter = new Intl.DateTimeFormat('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });

  const formatDate = (value) => {
    const parsed = parseDateInput(value);
    if (!parsed) return null;
    return formatter.format(parsed);
  };

  if (normalized === 'this-month') return 'This month';
  if (normalized === 'this-year') return 'This year';
  if (normalized === 'all' || normalized === 'all-time' || normalized === '') return 'All time';

  if (normalized === 'year') {
    const yearNum = Number.parseInt(year, 10);
    if (Number.isFinite(yearNum)) return `Year ${yearNum}`;
  }

  if (normalized === 'month') {
    const monthValue = (month || '').toString();
    const [y, m] = monthValue.split('-');
    const yearNum = Number.parseInt(y, 10);
    const monthNum = Number.parseInt(m, 10);
    if (Number.isFinite(yearNum) && Number.isFinite(monthNum)) {
      const monthFormatter = new Intl.DateTimeFormat('en-IN', { month: 'long', year: 'numeric' });
      const sample = new Date(yearNum, monthNum - 1, 1);
      return monthFormatter.format(sample);
    }
  }

  const formattedFrom = formatDate(from);
  const formattedTo = formatDate(to || from);
  if (formattedFrom && formattedTo) {
    if (formattedFrom === formattedTo) return formattedFrom;
    return `${formattedFrom} – ${formattedTo}`;
  }
  if (formattedFrom) return formattedFrom;
  return 'Custom range';
}

export function toDateInputValue(date) {
  const d = parseDateInput(date) || new Date(date || Date.now());
  if (Number.isNaN(d.getTime())) return '';
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}


