import React, { useEffect, useMemo, useRef, useState } from 'react';
import './dashboard.css';
import { useSuperAdmin } from '../../../context/SuperAdminContext.jsx';
import axios from 'axios';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title as ChartTitle,
  Tooltip,
  Legend as ChartLegend,
  Filler,
} from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, ChartTitle, Tooltip, ChartLegend, Filler);

const MONTH_NAMES = ['January','February','March','April','May','June','July','August','September','October','November','December'];
const DATE_DISPLAY = new Intl.DateTimeFormat('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
const INITIAL_COUNTS = {
  totalBrokers: 0,
  totalLeads: 0,
  activeProperties: 0,
  totalProperties: 0,
  liveSitesTotal: 0,
  liveSitesSubdomain: 0,
  liveSitesCustom: 0,
  liveSitesCustomVerified: 0,
};

const QUICK_RANGE_OPTIONS = [
  { key: 'this-month', label: 'This month' },
  { key: 'this-year', label: 'This year' },
  { key: 'all', label: 'All time' },
];

const COLUMN_OPTIONS = [
  { id: 'type', label: 'Type' },
  { id: 'buildingType', label: 'Building Type' },
  { id: 'propertyFor', label: 'Property For' },
  { id: 'saleType', label: 'Sale Type' },
  { id: 'availability', label: 'Availability' },
  { id: 'approvingAuthority', label: 'Approving Authority' },
  { id: 'ownership', label: 'Ownership' },
  { id: 'reraStatus', label: 'RERA Status' },
  { id: 'reraNumber', label: 'RERA Number' },
  { id: 'floors', label: 'Floors' },
  { id: 'propertyOnFloor', label: 'Property on Floor' },
  { id: 'furnishingStatus', label: 'Furnishing' },
  { id: 'facing', label: 'Facing' },
  { id: 'flooringType', label: 'Flooring' },
  { id: 'ageYears', label: 'Age of Property' },
  { id: 'bedrooms', label: 'Bedrooms' },
  { id: 'bathrooms', label: 'Bathrooms' },
  { id: 'builtArea', label: 'Built-up Area' },
  { id: 'carpetArea', label: 'Carpet Area' },
  { id: 'superArea', label: 'Super Area' },
  { id: 'price', label: 'Price' },
  { id: 'bookingAmount', label: 'Booking Amount' },
  { id: 'maintenanceCharges', label: 'Maintenance' },
  { id: 'possessionBy', label: 'Possession By' },
  { id: 'location', label: 'Location' },
  { id: 'broker', label: 'Broker' },
  { id: 'status', label: 'Status' },
  { id: 'date', label: 'Date' },
];

const DEFAULT_COLUMN_IDS = ['type', 'price', 'location', 'broker', 'status', 'date'];

const statusColorClass = (status) => {
  const normalized = String(status || '').toLowerCase();
  if (normalized === 'active' || normalized === 'published') return 'status-pill-active';
  if (normalized === 'inactive' || normalized === 'draft') return 'status-pill-inactive';
  if (normalized === 'sold') return 'status-pill-sold';
  return 'status-pill-neutral';
};

const pad = (value) => String(value).padStart(2, '0');

function parseDateValue(value) {
  if (!value && value !== 0) return null;
  if (value instanceof Date) {
    return Number.isNaN(value.getTime()) ? null : new Date(value);
  }
  const str = value.toString();
  if (str.includes('T')) {
    const dt = new Date(str);
    if (!Number.isNaN(dt.getTime())) return dt;
  }
  const parts = str.split('-').map((segment) => Number.parseInt(segment, 10));
  if (parts.length >= 2 && parts.every((num) => Number.isFinite(num))) {
    const [year, month, day = 1] = parts;
    const dt = new Date(year, month - 1, day);
    return Number.isNaN(dt.getTime()) ? null : dt;
  }
  const fallback = new Date(str);
  return Number.isNaN(fallback.getTime()) ? null : fallback;
}

function formatDateInput(date) {
  const dt = parseDateValue(date);
  if (!dt) return '';
  return `${dt.getFullYear()}-${pad(dt.getMonth() + 1)}-${pad(dt.getDate())}`;
}

function monthValueFromDate(date) {
  const dt = parseDateValue(date) || new Date();
  return `${dt.getFullYear()}-${pad(dt.getMonth() + 1)}`;
}

function formatRangeLabel({ key, from, to, monthValue, yearValue }) {
  if (key === 'this-month') return 'This month';
  if (key === 'this-year') return 'This year';
  if (key === 'all') return 'All time';
  if (key === 'month' && monthValue) {
    const [y, m] = monthValue.split('-');
    const yearNum = Number.parseInt(y, 10);
    const monthNum = Number.parseInt(m, 10);
    if (Number.isFinite(yearNum) && Number.isFinite(monthNum)) {
      return `${MONTH_NAMES[monthNum - 1] || 'Month'} ${yearNum}`;
    }
  }
  if (key === 'year' && yearValue) {
    return `Year ${yearValue}`;
  }
  const fromDate = parseDateValue(from);
  const toDate = parseDateValue(to || from);
  if (fromDate && toDate) {
    const formattedFrom = DATE_DISPLAY.format(fromDate);
    const formattedTo = DATE_DISPLAY.format(toDate);
    return formattedFrom === formattedTo ? formattedFrom : `${formattedFrom} – ${formattedTo}`;
  }
  if (fromDate) return DATE_DISPLAY.format(fromDate);
  return 'Custom range';
}

function buildFilter({ key, from, to, monthValue, yearValue }) {
  const base = {
    key,
    from: from || null,
    to: to || null,
    monthValue: monthValue || null,
    yearValue: yearValue || null,
  };
  return { ...base, label: formatRangeLabel(base) };
}

function createPresetFilter(key, referenceDate = new Date()) {
  const ref = parseDateValue(referenceDate) || new Date();
  if (key === 'this-month') {
    const start = new Date(ref.getFullYear(), ref.getMonth(), 1);
    const end = new Date(ref.getFullYear(), ref.getMonth(), ref.getDate());
    return buildFilter({
      key,
      from: formatDateInput(start),
      to: formatDateInput(end),
      monthValue: monthValueFromDate(ref),
      yearValue: String(ref.getFullYear()),
    });
  }
  if (key === 'this-year') {
    const start = new Date(ref.getFullYear(), 0, 1);
    const end = new Date(ref.getFullYear(), ref.getMonth(), ref.getDate());
    return buildFilter({
      key,
      from: formatDateInput(start),
      to: formatDateInput(end),
      yearValue: String(ref.getFullYear()),
    });
  }
  if (key === 'all') {
    return buildFilter({ key });
  }
  return buildFilter({ key });
}

function computeMonthRange(monthValue) {
  const [y, m] = (monthValue || '').split('-');
  const yearNum = Number.parseInt(y, 10);
  const monthNum = Number.parseInt(m, 10) - 1;
  if (!Number.isFinite(yearNum) || !Number.isFinite(monthNum) || monthNum < 0 || monthNum > 11) {
    return null;
  }
  const start = new Date(yearNum, monthNum, 1);
  const end = new Date(yearNum, monthNum + 1, 0);
  return {
    from: formatDateInput(start),
    to: formatDateInput(end),
    monthValue,
    yearValue: String(yearNum),
  };
}

function computeYearRange(yearValue) {
  const yearNum = Number.parseInt(yearValue, 10);
  if (!Number.isFinite(yearNum)) return null;
  const start = new Date(yearNum, 0, 1);
  const end = new Date(yearNum, 11, 31);
  return {
    from: formatDateInput(start),
    to: formatDateInput(end),
    yearValue: String(yearNum),
  };
}

function getMonthParts(monthValue) {
  const now = new Date();
  const [y, m] = (monthValue || '').split('-');
  let year = Number.parseInt(y, 10);
  let monthIndex = Number.parseInt(m, 10) - 1;
  if (!Number.isFinite(year)) year = now.getFullYear();
  if (!Number.isFinite(monthIndex) || monthIndex < 0 || monthIndex > 11) monthIndex = now.getMonth();
  return { year, monthIndex };
}

function formatPrice(value) {
  const num = Number(value);
  if (!Number.isFinite(num) || num <= 0) return '—';
  const abs = Math.abs(num);
  if (abs >= 1e7) {
    return `₹${(abs / 1e7).toFixed(abs >= 1e8 ? 0 : 1).replace(/\.0$/, '')}Cr`;
  }
  if (abs >= 1e5) {
    return `₹${(abs / 1e5).toFixed(abs >= 1e6 ? 0 : 1).replace(/\.0$/, '')} Lakh`;
  }
  return `₹${abs.toLocaleString('en-IN')}`;
}

function formatArea(value, unit) {
  const num = Number(value);
  if (!Number.isFinite(num) || num <= 0) return null;
  const safeUnit = unit ? String(unit).replace(/_/g, ' ') : 'sqft';
  return `${num.toLocaleString('en-IN')} ${safeUnit}`;
}

function formatCurrency(value) {
  const num = Number(value);
  if (!Number.isFinite(num)) return '—';
  return `₹${num.toLocaleString('en-IN', { maximumFractionDigits: 2 })}`;
}

export default function Dashboard() { 
  const superAdmin = useSuperAdmin();
  const [sys, setSys] = useState({ serverUptimePct: 99.9, dbPerformancePct: 95.5, apiResponseMs: 150, storageUsagePct: 60 });
  const [counts, setCounts] = useState(() => ({ ...INITIAL_COUNTS }));
  const [brokerTrend, setBrokerTrend] = useState(() => (
    ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sept','Oct','Nov','Dec'].map((m) => ({ m, a: 0, b: 0 }))
  ));
  const [filter, setFilter] = useState(() => createPresetFilter('all'));
  const [filterMenuOpen, setFilterMenuOpen] = useState(false);
  const filterButtonRef = useRef(null);
  const filterMenuRef = useRef(null);
  const [monthDraft, setMonthDraft] = useState(() => filter.monthValue || monthValueFromDate(new Date()));
  const [yearDraft, setYearDraft] = useState(() => filter.yearValue || String(new Date().getFullYear()));
  const [customDraft, setCustomDraft] = useState(() => ({ from: filter.from || '', to: filter.to || '' }));
  const [recentProperties, setRecentProperties] = useState([]);
  const [propertiesLoading, setPropertiesLoading] = useState(false);
  const [columnMenuOpen, setColumnMenuOpen] = useState(false);
  const [visibleColumnIds, setVisibleColumnIds] = useState(() => DEFAULT_COLUMN_IDS);
  const monthParts = useMemo(() => getMonthParts(monthDraft), [monthDraft]);
  const monthYearOptions = useMemo(() => {
    const current = new Date().getFullYear();
    const base = Array.from({ length: 9 }, (_, idx) => current + 4 - idx);
    if (!base.includes(monthParts.year)) base.push(monthParts.year);
    return Array.from(new Set(base)).sort((a, b) => b - a);
  }, [monthParts.year]);
  const columnButtonRef = useRef(null);
  const columnMenuRef = useRef(null);

  const monthValid = useMemo(() => /^\d{4}-\d{2}$/.test(monthDraft), [monthDraft]);
  const yearValid = useMemo(() => {
    if (!/^\d{4}$/.test(yearDraft)) return false;
    const yearNum = Number.parseInt(yearDraft, 10);
    return yearNum >= 2000 && yearNum <= 2100;
  }, [yearDraft]);
  const customRangeError = useMemo(() => {
    if (!customDraft.from && !customDraft.to) return '';
    if (!customDraft.from || !customDraft.to) return 'Select both start and end dates.';
    if (customDraft.from > customDraft.to) return 'End date must be after start date.';
    return '';
  }, [customDraft.from, customDraft.to]);
  const customRangeValid = Boolean(customDraft.from && customDraft.to && !customRangeError);

  const formatNumber = (value) => Number(value || 0).toLocaleString();

  const trendYear = useMemo(() => {
    if (filter.key === 'year' && filter.yearValue) {
      const parsed = Number.parseInt(filter.yearValue, 10);
      if (Number.isFinite(parsed)) return parsed;
    }
    if (filter.key === 'month' && filter.monthValue) {
      const yearPart = Number.parseInt(filter.monthValue.split('-')[0], 10);
      if (Number.isFinite(yearPart)) return yearPart;
    }
    if (filter.key === 'custom' && filter.from) {
      const parsed = parseDateValue(filter.from);
      if (parsed) return parsed.getFullYear();
    }
    if ((filter.key === 'this-month' || filter.key === 'this-year') && filter.from) {
      const parsed = parseDateValue(filter.from);
      if (parsed) return parsed.getFullYear();
    }
    return new Date().getFullYear();
  }, [filter]);

  useEffect(() => {
    if (!filterMenuOpen) return undefined;
    function handleClickOutside(event) {
      if (!filterMenuRef.current || !filterButtonRef.current) return;
      if (filterMenuRef.current.contains(event.target) || filterButtonRef.current.contains(event.target)) return;
      setFilterMenuOpen(false);
    }
    function handleEsc(event) {
      if (event.key === 'Escape') setFilterMenuOpen(false);
    }
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEsc);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEsc);
    };
  }, [filterMenuOpen]);

  const applyFilter = (nextFilter) => {
    setFilter(nextFilter);
    setCustomDraft({ from: nextFilter.from || '', to: nextFilter.to || '' });
    if (nextFilter.monthValue) setMonthDraft(nextFilter.monthValue);
    if (nextFilter.yearValue) setYearDraft(nextFilter.yearValue);
    setFilterMenuOpen(false);
  };

  useEffect(() => {
    if (!columnMenuOpen) return undefined;
    function handleClickOutside(event) {
      if (!columnMenuRef.current || !columnButtonRef.current) return;
      if (columnMenuRef.current.contains(event.target) || columnButtonRef.current.contains(event.target)) return;
      setColumnMenuOpen(false);
    }
    function handleEsc(event) {
      if (event.key === 'Escape') setColumnMenuOpen(false);
    }
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEsc);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEsc);
    };
  }, [columnMenuOpen]);

  const toggleColumn = (id) => {
    setVisibleColumnIds((prev) => {
      const set = new Set(prev);
      if (set.has(id)) set.delete(id); else set.add(id);
      return COLUMN_OPTIONS.map((col) => col.id).filter((colId) => set.has(colId));
    });
  };

  const handleSelectPreset = (key) => {
    applyFilter(createPresetFilter(key));
  };

  const handleApplyMonth = () => {
    if (!monthValid) return;
    const range = computeMonthRange(monthDraft);
    if (!range) return;
    applyFilter(buildFilter({ key: 'month', ...range }));
  };

  const handleApplyYear = () => {
    if (!yearValid) return;
    const range = computeYearRange(yearDraft);
    if (!range) return;
    applyFilter(buildFilter({ key: 'year', ...range }));
  };

  const handleApplyCustom = () => {
    if (!customRangeValid) return;
    applyFilter(buildFilter({ key: 'custom', from: customDraft.from, to: customDraft.to }));
  };

  const handleYearInput = (event) => {
    const safe = event.target.value.replace(/[^0-9]/g, '').slice(0, 4);
    setYearDraft(safe);
  };

  const handleSelectMonth = (event) => {
    const nextMonthIndex = Number.parseInt(event.target.value, 10);
    if (!Number.isFinite(nextMonthIndex)) return;
    const value = `${monthParts.year}-${pad(nextMonthIndex + 1)}`;
    setMonthDraft(value);
  };

  const handleSelectMonthYear = (event) => {
    const nextYear = Number.parseInt(event.target.value, 10);
    if (!Number.isFinite(nextYear)) return;
    const value = `${nextYear}-${pad(monthParts.monthIndex + 1)}`;
    setMonthDraft(value);
  };

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const { data: json } = await axios.get(`${superAdmin.apiBase}/api/system/health`, {
          headers: { Authorization: `Bearer ${superAdmin.token}` },
        });
        if (!cancelled && json?.data) setSys(json.data);
      } catch {
        // keep defaults
      }
    }
    if (superAdmin?.token) load();
    return () => { cancelled = true; };
  }, [superAdmin?.token, superAdmin?.apiBase]);

  useEffect(() => {
    let cancelled = false;
    async function loadDashboardCounts() {
      if (!superAdmin?.token) return;
      try {
        const params = new URLSearchParams();
        if (filter.key && filter.key !== 'all') params.set('range', filter.key);
        if (filter.from) params.set('from', filter.from);
        if (filter.to) params.set('to', filter.to);
        if (filter.key === 'month' && filter.monthValue) params.set('month', filter.monthValue);
        if (filter.key === 'year' && filter.yearValue) params.set('year', filter.yearValue);
        if ((filter.key === 'this-month' || filter.key === 'this-year') && filter.yearValue) params.set('year', filter.yearValue);
        const query = params.toString();
        const url = `${superAdmin.apiBase}/api/system/dashboard-stats${query ? `?${query}` : ''}`;
        const { data: json } = await axios.get(url, {
          headers: { Authorization: `Bearer ${superAdmin.token}` },
        });
        if (cancelled) return;
        const payload = json?.data || {};
        setCounts({
          totalBrokers: Number(payload.totalBrokers || 0),
          totalLeads: Number(payload.totalLeads || 0),
          activeProperties: Number(payload.activeProperties ?? payload.totalProperties ?? 0),
          totalProperties: Number(payload.totalProperties || 0),
          liveSitesTotal: Number(payload?.liveSites?.total || 0),
          liveSitesSubdomain: Number(payload?.liveSites?.subdomain || 0),
          liveSitesCustom: Number(payload?.liveSites?.customDomain || 0),
          liveSitesCustomVerified: Number(payload?.liveSites?.verifiedCustomDomain || 0),
        });
      } catch {
        if (!cancelled) {
          setCounts((prev) => ({ ...prev }));
        }
      }
    }
    loadDashboardCounts();
    return () => { cancelled = true; };
  }, [superAdmin?.token, superAdmin?.apiBase, filter.key, filter.from, filter.to, filter.monthValue, filter.yearValue]);

  useEffect(() => {
    let cancelled = false;
    async function loadTrends() {
      if (!superAdmin?.token) return;
      try {
        const params = new URLSearchParams({ year: String(trendYear) });
        if (filter.key && filter.key !== 'all') params.set('range', filter.key);
        if (filter.from) params.set('from', filter.from);
        if (filter.to) params.set('to', filter.to);
        if (filter.key === 'month' && filter.monthValue) params.set('month', filter.monthValue);
        if (filter.key === 'year' && filter.yearValue) params.set('year', filter.yearValue);
        const { data: json } = await axios.get(`${superAdmin.apiBase}/api/broker/monthly-trends?${params.toString()}` ,{
          headers: { Authorization: `Bearer ${superAdmin.token}` },
        });
        const rows = Array.isArray(json?.data) ? json.data : [];
        const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sept','Oct','Nov','Dec'];
        const normalized = months.map((label) => {
          const r = rows.find(x => x.month === label) || { active: 0, suspended: 0 };
          return { m: label, a: Number(r.active || 0), b: Number(r.suspended || 0) };
        });
        if (!cancelled) setBrokerTrend(normalized);
      } catch {
        if (!cancelled) setBrokerTrend((prev) => prev.map(x => ({ ...x, a: 0, b: 0 })));
      }
    }
    loadTrends();
    return () => { cancelled = true; };
  }, [superAdmin?.token, superAdmin?.apiBase, trendYear, filter.key, filter.from, filter.to, filter.monthValue, filter.yearValue]);

  useEffect(() => {
    let cancelled = false;
    async function loadRecentProperties() {
      if (!superAdmin?.token) return;
      try {
        setPropertiesLoading(true);
        const params = new URLSearchParams({ limit: '50' });
        if (filter.key && filter.key !== 'all') params.set('range', filter.key);
        if (filter.from) params.set('from', filter.from);
        if (filter.to) params.set('to', filter.to);
        if (filter.key === 'month' && filter.monthValue) params.set('month', filter.monthValue);
        if (filter.key === 'year' && filter.yearValue) params.set('year', filter.yearValue);
        const url = `${superAdmin.apiBase}/api/properties/admin/all?${params.toString()}`;
        const { data: json } = await axios.get(url, {
          headers: { Authorization: `Bearer ${superAdmin.token}` },
        });
        if (!cancelled) {
          const rows = Array.isArray(json?.data) ? json.data : [];
          setRecentProperties(rows);
        }
      } catch {
        if (!cancelled) setRecentProperties([]);
      } finally {
        if (!cancelled) setPropertiesLoading(false);
      }
    }
    loadRecentProperties();
    return () => { cancelled = true; };
  }, [superAdmin?.token, superAdmin?.apiBase, filter.key, filter.from, filter.to, filter.monthValue, filter.yearValue]);

  const visibleColumns = useMemo(() => COLUMN_OPTIONS.filter((col) => visibleColumnIds.includes(col.id)), [visibleColumnIds]);

  const data = brokerTrend;
  const labels = data.map(d => d.m);
  const chartData = {
    labels,
    datasets: [
      {
        label: 'Onboarded',
        data: data.map(d => d.a),
        borderColor: '#2563eb',
        backgroundColor: 'rgba(37, 99, 235, 0.08)',
        pointRadius: 0,
        tension: 0.35,
        fill: false,
      },
      {
        label: 'Deactivated',
        data: data.map(d => d.b),
        borderColor: '#ef4444',
        backgroundColor: 'rgba(239, 68, 68, 0.08)',
        pointRadius: 0,
        tension: 0.35,
        fill: false,
      },
    ],
  };
  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: true,
        position: 'top',
        align: 'end',
        labels: { color: '#334155', usePointStyle: true, boxWidth: 28, boxHeight: 6, pointStyle: 'line' },
      },
      title: { display: false },
      tooltip: { intersect: false, mode: 'index' },
    },
    elements: { line: { borderWidth: 2.5 }, point: { radius: 0, hoverRadius: 4, hitRadius: 10 } },
    scales: {
      x: {
        grid: { display: false },
        ticks: { color: '#64748b' },
        border: { display: false },
      },
      y: {
        min: -20,
        max: 100,
        ticks: { stepSize: 20, color: '#64748b' },
        grid: { color: '#e5e7eb' },
        border: { display: false },
      },
    },
  };
  const BAR_MAX = 200;

  return (
    <div className="superadmindashboard-root">
      <main className="superadmindashboard-main">
        <div className="superadmindashboard-topbar">
          <h1 className="superadmindashboard-title">Dashboard Overview</h1>
          <div className="superadmindashboard-filterwrap">
            <button
              type="button"
              ref={filterButtonRef}
              className="superadmindashboard-filter"
              aria-haspopup="menu"
              aria-expanded={filterMenuOpen}
              onClick={() => setFilterMenuOpen((open) => !open)}
            >
              <span>{filter.label}</span>
            <svg className="superadmindashboard-filter-caret" viewBox="0 0 24 24" width="18" height="18" aria-hidden>
              <path fill="currentColor" d="M7 10l5 5 5-5z" />
            </svg>
          </button>
            {filterMenuOpen && (
              <div className="superadmindashboard-filtermenu" ref={filterMenuRef} role="menu">
                <div className="superadmindashboard-filterheader">
                  <div className="superadmindashboard-filtertitle">Date range</div>
                  <div className="superadmindashboard-filtersubtitle">Currently showing {filter.label}</div>
                </div>
                <div className="superadmindashboard-filtergroup">
                  <div className="superadmindashboard-filterheading">Quick ranges</div>
                  <div className="superadmindashboard-chiprow">
                    {QUICK_RANGE_OPTIONS.map((option) => (
                      <button
                        type="button"
                        key={option.key}
                        className="superadmindashboard-filterchip"
                        aria-pressed={filter.key === option.key}
                        onClick={() => handleSelectPreset(option.key)}
                      >
                        {option.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="superadmindashboard-filtergroup">
                  <div className="superadmindashboard-filterheading">Month</div>
                  <div className="superadmindashboard-filterrow superadmindashboard-filterrow-month">
                    <select value={monthParts.monthIndex} onChange={handleSelectMonth} aria-label="Select month">
                      {MONTH_NAMES.map((name, idx) => (
                        <option key={name} value={idx}>{name}</option>
                      ))}
                    </select>
                    <select value={monthParts.year} onChange={handleSelectMonthYear} aria-label="Select year for month">
                      {monthYearOptions.map((yearValue) => (
                        <option key={yearValue} value={yearValue}>{yearValue}</option>
                      ))}
                    </select>
                    <button type="button" onClick={handleApplyMonth} disabled={!monthValid}>Apply</button>
                  </div>
                </div>

                <div className="superadmindashboard-filtergroup">
                  <div className="superadmindashboard-filterheading">Year</div>
                  <div className="superadmindashboard-filterrow superadmindashboard-filterrow-year">
                    <input
                      type="number"
                      min="2000"
                      max="2100"
                      value={yearDraft}
                      onChange={handleYearInput}
                      aria-label="Select year"
                    />
                    <button type="button" onClick={handleApplyYear} disabled={!yearValid}>Apply</button>
                  </div>
                </div>

                <div className="superadmindashboard-filtergroup">
                  <div className="superadmindashboard-filterheading">Custom range</div>
                  <div className="superadmindashboard-filterrow superadmindashboard-filterrow-dates">
                    <input
                      type="date"
                      value={customDraft.from}
                      onChange={(event) => setCustomDraft((prev) => ({ ...prev, from: event.target.value }))}
                      aria-label="Start date"
                    />
                    <span>to</span>
                    <input
                      type="date"
                      value={customDraft.to}
                      onChange={(event) => setCustomDraft((prev) => ({ ...prev, to: event.target.value }))}
                      aria-label="End date"
                    />
                  </div>
                  {customRangeError && (
                    <div className="superadmindashboard-filterhelp">{customRangeError}</div>
                  )}
                  <div className="superadmindashboard-filterrow superadmindashboard-filterrow-actions">
                    <button type="button" onClick={handleApplyCustom} disabled={!customRangeValid}>Apply</button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        <section className="superadmindashboard-stats" aria-label="Summary stats">
          <div className="superadmindashboard-card">
            <div className="superadmindashboard-card-head">
              <div className="superadmindashboard-icon superadmindashboard-icon-blue" aria-hidden>
                {/* Avatar */}
                <svg viewBox="0 0 24 24">
                  <path fill="currentColor" d="M12 12a4 4 0 100-8 4 4 0 000 8z"/>
                  <path fill="currentColor" d="M4 19a8 8 0 0116 0v1H4v-1z"/>
                </svg>
              </div>
              <div className="superadmindashboard-card-title">Total Brokers</div>
            </div>
            <div className="superadmindashboard-metric">{formatNumber(counts.totalBrokers)}</div>
            <div className="superadmindashboard-delta superadmindashboard-delta-up">All statuses included</div>
          </div>

          <div className="superadmindashboard-card">
            <div className="superadmindashboard-card-head">
              <div className="superadmindashboard-icon superadmindashboard-icon-orange" aria-hidden>
                {/* Building */}
                <svg viewBox="0 0 24 24">
                  <path fill="currentColor" d="M4 20V6l8-3 8 3v14h-5v-4H9v4H4zM9 9h2v2H9V9zm4 0h2v2h-2V9zM9 13h2v2H9v-2zm4 0h2v2h-2v-2z"/>
                </svg>
              </div>
              <div className="superadmindashboard-card-title">Active Properties</div>
            </div>
            <div className="superadmindashboard-metric">{formatNumber(counts.activeProperties)}</div>
            <div className="superadmindashboard-delta superadmindashboard-delta-up">Total listings: {formatNumber(counts.totalProperties)}</div>
          </div>

          <div className="superadmindashboard-card">
            <div className="superadmindashboard-card-head">
              <div className="superadmindashboard-icon superadmindashboard-icon-pink" aria-hidden>
                {/* Live / network */}
                <svg viewBox="0 0 24 24">
                  <circle cx="12" cy="12" r="2.2" fill="currentColor"/>
                  <g stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round">
                    <path d="M12 4v3"/>
                    <path d="M12 17v3"/>
                    <path d="M4 12h3"/>
                    <path d="M17 12h3"/>
                    <path d="M6.8 6.8l2.2 2.2"/>
                    <path d="M15 15l2.2 2.2"/>
                    <path d="M6.8 17.2L9 15"/>
                    <path d="M15 9l2.2-2.2"/>
                  </g>
                </svg>
              </div>
              <div className="superadmindashboard-card-title">Live Websites</div>
            </div>
            <div className="superadmindashboard-metric">{formatNumber(counts.liveSitesTotal)}</div>
            <div className="superadmindashboard-delta superadmindashboard-delta-up">
              {`Subdomain: ${formatNumber(counts.liveSitesSubdomain)} | Custom: ${formatNumber(counts.liveSitesCustom)}`}
              {counts.liveSitesCustomVerified ? (
                <span>{` • Verified: ${formatNumber(counts.liveSitesCustomVerified)}`}</span>
              ) : null}
            </div>
          </div>

          <div className="superadmindashboard-card">
            <div className="superadmindashboard-card-head">
              <div className="superadmindashboard-icon superadmindashboard-icon-green" aria-hidden>
                {/* Rupee */}
                <svg viewBox="0 0 24 24">
                  <path d="M7 6h10M7 10h8M7 6c0 4 4 4 4 4m0 0c3 0 5 2 5 4s-2 4-5 4H8" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round"/>
                </svg>
              </div>
              <div className="superadmindashboard-card-title">Total Leads</div>
            </div>
            <div className="superadmindashboard-metric">{formatNumber(counts.totalLeads)}</div>
            <div className="superadmindashboard-delta superadmindashboard-delta-up">Admin + broker sources</div>
          </div>
        </section>

        <section className="superadmindashboard-grid">
          <div className="superadmindashboard-panel trend-card">
            <div className="trend-head">
              <div className="trend-head-left">
                <h2 className="trend-title">Broker Trends</h2>
                <div className="trend-sub">Monthly broker onboarding vs deactivated metrics.</div>
              </div>
            </div>

            <div className="trend-chart" role="img" aria-label="Broker trends line chart">
              <div className="trend-plot" style={{ height: 260 }}>
                <Line data={chartData} options={chartOptions} />
              </div>
            </div>
          </div>

          <div className="superadmindashboard-panel">
            <div className="superadmindashboard-panel-head">
              <h2>Subscription Plans</h2>
              <span className="superadmindashboard-sub">Distribution of broker subscriptions</span>
            </div>
            {(() => {
              const segments = [
                { label: 'Basic', value: 45, color: '#EF4444' },
                { label: 'Premium', value: 30, color: '#F97316' },
                { label: 'Pro', value: 15, color: '#EAB308' }
              ];
              const total = segments.reduce((s, x) => s + x.value, 0) || 1;
              const pct = segments.map((x) => (x.value / total) * 100);
              const stop1 = pct[0].toFixed(2);
              const stop2 = (pct[0] + pct[1]).toFixed(2);
              const gradient = `conic-gradient(${segments[0].color} 0% ${stop1}%, ${segments[1].color} ${stop1}% ${stop2}%, ${segments[2].color} ${stop2}% 100%)`;
              return (
                <div className="superadmindashboard-piewrap">
                  <div className="superadmindashboard-pie" style={{ background: gradient }} />
                  <ul className="superadmindashboard-legend">
                    <li><span className="superadmindashboard-dot superadmindashboard-basic" /> Basic: 45%</li>
                    <li><span className="superadmindashboard-dot superadmindashboard-premium" /> Premium: 30%</li>
                    <li><span className="superadmindashboard-dot superadmindashboard-pro" /> Pro: 15%</li>
                  </ul>
                </div>
              );
            })()}
          </div>
        </section>

        <section className="superadmindashboard-grid superadmindashboard-grid-bottom">
          <div className="superadmindashboard-panel">
            <div className="superadmindashboard-panel-head superadmindashboard-panel-head-row">
              <div className="superadmindashboard-headicon" aria-hidden>
                <svg viewBox="0 0 36 36" width="28" height="28">
                  <circle cx="18" cy="18" r="16" fill="none" stroke="#D1D5DB" strokeWidth="2"/>
                  <circle cx="18" cy="18" r="12" fill="#F59E0B"/>
                  <circle cx="18" cy="18" r="7" fill="none" stroke="#ffffff" strokeWidth="3"/>
                  <circle cx="18" cy="18" r="2" fill="#ffffff"/>
                  <path d="M18 18 L22 16" stroke="#ffffff" strokeWidth="2" strokeLinecap="round"/>
                </svg>
              </div>
              <div>
                <h2>Recent Activities</h2>
                <div className="superadmindashboard-sub">Latest platform activities and notifications</div>
              </div>
            </div>
            <ul className="superadmindashboard-activity">
              <li>
                <span className="superadmindashboard-ic superadmindashboard-ic-ok" aria-hidden>
                  <svg viewBox="0 0 24 24">
                    <circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" strokeWidth="2"/>
                    <path d="M8 12l2.5 2.5L16 9" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </span>
                <div className="superadmindashboard-activity-body">
                  <div className="superadmindashboard-activity-text">New broker account approved: Mumbai Realty Co.</div>
                  <div className="superadmindashboard-activity-time">2 minutes ago</div>
                </div>
              </li>
              <li>
                <span className="superadmindashboard-ic superadmindashboard-ic-alert" aria-hidden>
                  <svg viewBox="0 0 24 24">
                    <path d="M12 3l10 18H2L12 3z" fill="currentColor"/>
                    <rect x="11" y="9" width="2" height="6" fill="#ffffff" rx="1"/>
                    <rect x="11" y="16.5" width="2" height="2" fill="#ffffff" rx="1"/>
                  </svg>
                </span>
                <div className="superadmindashboard-activity-body">
                  <div className="superadmindashboard-activity-text">15 properties pending approval</div>
                  <div className="superadmindashboard-activity-time">5 minutes ago</div>
                </div>
              </li>
              <li>
                <span className="superadmindashboard-ic superadmindashboard-ic-ok" aria-hidden>
                  <svg viewBox="0 0 24 24">
                    <circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" strokeWidth="2"/>
                    <path d="M8 12l2.5 2.5L16 9" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </span>
                <div className="superadmindashboard-activity-body">
                  <div className="superadmindashboard-activity-text">Payment received from Delhi Properties Ltd.</div>
                  <div className="superadmindashboard-activity-time">10 minutes ago</div>
                </div>
              </li>
              <li>
                <span className="superadmindashboard-ic superadmindashboard-ic-alert" aria-hidden>
                  <svg viewBox="0 0 24 24">
                    <path d="M12 3l10 18H2L12 3z" fill="currentColor"/>
                    <rect x="11" y="9" width="2" height="6" fill="#ffffff" rx="1"/>
                    <rect x="11" y="16.5" width="2" height="2" fill="#ffffff" rx="1"/>
                  </svg>
                </span>
                <div className="superadmindashboard-activity-body">
                  <div className="superadmindashboard-activity-text">Website disabled for policy violation</div>
                  <div className="superadmindashboard-activity-time">1 hour ago</div>
                </div>
              </li>
            </ul>
          </div>

          <div className="superadmindashboard-panel">
            <div className="superadmindashboard-panel-head">
              <h2>System Health</h2>
              <div className="superadmindashboard-sub">Platform performance metrics</div>
            </div>

            <div className="superadmindashboard-meter">
              <div className="superadmindashboard-meter-row">
                <span>Server Uptime</span>
                <span className="superadmindashboard-meter-value">{sys.serverUptimePct}%</span>
              </div>
              <div className="superadmindashboard-track"><div className="superadmindashboard-thumb" style={{ width: `${sys.serverUptimePct}%` }} /></div>
            </div>

            <div className="superadmindashboard-meter">
              <div className="superadmindashboard-meter-row">
                <span>Database Performance</span>
                <span className="superadmindashboard-meter-value">{sys.dbPerformancePct}%</span>
              </div>
              <div className="superadmindashboard-track"><div className="superadmindashboard-thumb" style={{ width: `${sys.dbPerformancePct}%` }} /></div>
            </div>

            <div className="superadmindashboard-meter">
              <div className="superadmindashboard-meter-row">
                <span>API Response Time</span>
                <span className="superadmindashboard-meter-value">{sys.apiResponseMs}ms</span>
              </div>
              <div className="superadmindashboard-track"><div className="superadmindashboard-thumb" style={{ width: `${Math.max(5, Math.min(100, Math.round((2000 / Math.max(1, sys.apiResponseMs)) * 5)))}%` }} /></div>
            </div>

            <div className="superadmindashboard-meter">
              <div className="superadmindashboard-meter-row">
                <span>Storage Usage</span>
                <span className="superadmindashboard-meter-value">{sys.storageUsagePct}%</span>
              </div>
              <div className="superadmindashboard-track"><div className="superadmindashboard-thumb" style={{ width: `${sys.storageUsagePct}%` }} /></div>
            </div>
          </div>
        </section>

        <section className="superadmindashboard-panel superadmindashboard-properties">
          <div className="superadmindashboard-tableactions">
            <button
              type="button"
              ref={columnButtonRef}
              className="superadmindashboard-columns-btn"
              onClick={() => setColumnMenuOpen((open) => !open)}
            >
              <span aria-hidden>🗂️</span>
              <span>Columns</span>
            </button>
            {columnMenuOpen && (
              <div className="superadmindashboard-colmenu" ref={columnMenuRef} role="menu">
                <div className="superadmindashboard-colmenu-head">Show columns</div>
                {COLUMN_OPTIONS.map((col) => (
                  <label key={col.id} className="superadmindashboard-colmenu-item">
                    <input
                      type="checkbox"
                      checked={visibleColumnIds.includes(col.id)}
                      onChange={() => toggleColumn(col.id)}
                    />
                    <span>{col.label}</span>
                  </label>
                ))}
              </div>
            )}
          </div>

          <div className="superadmindashboard-tablewrap">
            <table className="superadmindashboard-table" role="table">
              <thead>
                <tr>
                  <th scope="col" className="col-checkbox"><input type="checkbox" aria-label="Select all" /></th>
                  <th scope="col">Property</th>
                  {visibleColumns.map((col) => (
                    <th key={col.id} scope="col" className={`col-${col.id}`}>{col.label}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {propertiesLoading ? (
                  <tr>
                    <td colSpan={visibleColumns.length + 2} className="superadmindashboard-table-empty">Loading properties…</td>
                  </tr>
                ) : recentProperties.length ? (
                  recentProperties.map((row) => {
                    const areaText = formatArea(row.area, row.areaUnit);
                    const dateLabel = row.createdAt ? DATE_DISPLAY.format(new Date(row.createdAt)) : '—';
                    const brokerLabel = row.brokerName || '—';
                    const locationParts = [row.city, row.state].filter(Boolean);
                    const location = locationParts.length ? locationParts.join(', ') : row.locality || '—';
                    const priceLabel = formatPrice(row.price);
                    const imageSrc = row.image
                      ? (row.image.startsWith('http') ? row.image : `${superAdmin.apiBase}${row.image}`)
                      : '/templates/proclassic/public/img/noimg.png';
                    const propertyMeta = [row.property_type, row.buildingType].filter(Boolean).join(' • ');
                    const buildingType = row.buildingType || row.building_type || '—';
                    const builtUp = formatArea(row.area, row.areaUnit) || '—';
                    const carpet = formatArea(row.carpetArea, row.carpetAreaUnit) || '—';
                    const superArea = formatArea(row.superArea, row.superAreaUnit) || '—';
                    return (
                      <tr key={`${row.tenantDb}-${row.id}`}>
                        <td className="col-checkbox"><input type="checkbox" aria-label={`Select ${row.title || 'property'}`} /></td>
                        <td className="col-property">
                          <div className="property-cell">
                            <div className="property-thumb">
                              <img src={imageSrc} alt="" />
                            </div>
                            <div className="property-meta">
                              <div className="property-title">{row.title || 'Untitled property'}</div>
                              {areaText ? <div className="property-sub">{areaText}</div> : null}
                              {propertyMeta ? <div className="property-sub alt">{propertyMeta}</div> : null}
                            </div>
                          </div>
                        </td>
                        {visibleColumns.map((col) => {
                          const key = col.id;
                          if (key === 'status') {
                            return (
                              <td key={key} className={`col-${key}`}>
                                <span className={`status-pill ${statusColorClass(row.status)}`}>
                                  <span className="status-dot" />
                                  {row.status ? String(row.status).replace(/_/g, ' ') : '—'}
                                </span>
                              </td>
                            );
                          }
                          if (key === 'price') return <td key={key} className={`col-${key}`}>{priceLabel}</td>;
                          if (key === 'type') return <td key={key} className={`col-${key}`}>{row.type || row.property_type || '—'}</td>;
                          if (key === 'buildingType') return <td key={key} className={`col-${key}`}>{buildingType}</td>;
                          if (key === 'propertyFor') return <td key={key} className={`col-${key}`}>{row.propertyFor || '—'}</td>;
                          if (key === 'saleType') return <td key={key} className={`col-${key}`}>{row.saleType || '—'}</td>;
                          if (key === 'availability') return <td key={key} className={`col-${key}`}>{row.availability || '—'}</td>;
                          if (key === 'approvingAuthority') return <td key={key} className={`col-${key}`}>{row.approvingAuthority || '—'}</td>;
                          if (key === 'ownership') return <td key={key} className={`col-${key}`}>{row.ownership || '—'}</td>;
                          if (key === 'reraStatus') return <td key={key} className={`col-${key}`}>{row.reraStatus || '—'}</td>;
                          if (key === 'reraNumber') return <td key={key} className={`col-${key}`}>{row.reraNumber || '—'}</td>;
                          if (key === 'floors') return <td key={key} className={`col-${key}`}>{row.floors ?? '—'}</td>;
                          if (key === 'propertyOnFloor') return <td key={key} className={`col-${key}`}>{row.propertyOnFloor || '—'}</td>;
                          if (key === 'furnishingStatus') return <td key={key} className={`col-${key}`}>{row.furnishingStatus || '—'}</td>;
                          if (key === 'facing') return <td key={key} className={`col-${key}`}>{row.facing || '—'}</td>;
                          if (key === 'flooringType') return <td key={key} className={`col-${key}`}>{row.flooringType || '—'}</td>;
                          if (key === 'ageYears') return <td key={key} className={`col-${key}`}>{row.ageYears || '—'}</td>;
                          if (key === 'bedrooms') return <td key={key} className={`col-${key}`}>{row.bedrooms ?? '—'}</td>;
                          if (key === 'bathrooms') return <td key={key} className={`col-${key}`}>{row.bathrooms ?? '—'}</td>;
                          if (key === 'builtArea') return <td key={key} className={`col-${key}`}>{builtUp}</td>;
                          if (key === 'carpetArea') return <td key={key} className={`col-${key}`}>{carpet}</td>;
                          if (key === 'superArea') return <td key={key} className={`col-${key}`}>{superArea}</td>;
                          if (key === 'bookingAmount') return <td key={key} className={`col-${key}`}>{formatCurrency(row.bookingAmount)}</td>;
                          if (key === 'maintenanceCharges') return <td key={key} className={`col-${key}`}>{formatCurrency(row.maintenanceCharges)}</td>;
                          if (key === 'possessionBy') return <td key={key} className={`col-${key}`}>{row.possessionBy || '—'}</td>;
                          if (key === 'location') return <td key={key} className={`col-${key}`}>{location}</td>;
                          if (key === 'broker') return <td key={key} className={`col-${key}`}>{brokerLabel}</td>;
                          if (key === 'date') return <td key={key} className={`col-${key}`}>{dateLabel}</td>;
                          return <td key={key} className={`col-${key}`}>—</td>;
                        })}
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={visibleColumns.length + 2} className="superadmindashboard-table-empty">No properties in this range.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>
      </main>
    </div>
  );
}
