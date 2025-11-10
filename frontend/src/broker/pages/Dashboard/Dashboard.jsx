import React, { useEffect, useMemo, useRef, useState } from 'react';
import './dashboard.css';
import { useBroker } from '../../../context/BrokerContext.jsx';
import axios from 'axios';
import { Line, Bar, Pie } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title as ChartTitle,
  Tooltip,
  Legend as ChartLegend,
  Filler,
} from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, BarElement, ArcElement, ChartTitle, Tooltip, ChartLegend, Filler);

const MONTH_NAMES = ['January','February','March','April','May','June','July','August','September','October','November','December'];
const DATE_DISPLAY = new Intl.DateTimeFormat('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });

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
  { id: 'price', label: 'Price' },
  { id: 'location', label: 'Location' },
  { id: 'status', label: 'Status' },
  { id: 'date', label: 'Date' },
];

const DEFAULT_COLUMN_IDS = ['type', 'price', 'location', 'status', 'date'];

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
  const now = new Date(referenceDate);
  if (key === 'this-month') {
    const start = new Date(now.getFullYear(), now.getMonth(), 1);
    const end = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);
    return buildFilter({ key, from: formatDateInput(start), to: formatDateInput(end), yearValue: String(now.getFullYear()) });
  }
  if (key === 'this-year') {
    const start = new Date(now.getFullYear(), 0, 1);
    const end = new Date(now.getFullYear(), 11, 31, 23, 59, 59);
    return buildFilter({ key, from: formatDateInput(start), to: formatDateInput(end), yearValue: String(now.getFullYear()) });
  }
  return buildFilter({ key: 'all' });
}

function computeMonthRange(monthValue) {
  const [y, m] = (monthValue || '').split('-');
  const yearNum = Number.parseInt(y, 10);
  const monthIndex = Number.parseInt(m, 10) - 1;
  if (!Number.isFinite(yearNum) || !Number.isFinite(monthIndex) || monthIndex < 0 || monthIndex > 11) return null;
  const start = new Date(yearNum, monthIndex, 1);
  const end = new Date(yearNum, monthIndex + 1, 0, 23, 59, 59);
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

export default function Dashboard() {
  const broker = useBroker();
  const [stats, setStats] = useState({
    totalProperties: 0,
    publishedProperties: 0,
    highDemandProperties: 0,
    newThisWeek: 0,
    activeLeads: 0,
    totalLeads: 0,
    totalUsers: 0,
  });
  const [propertyTrend, setPropertyTrend] = useState(() =>
    ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sept','Oct','Nov','Dec'].map((m) => ({ m, created: 0, updated: 0 }))
  );
  const [propertyTypesDistribution, setPropertyTypesDistribution] = useState([]);
  const [propertyTrendsFilter, setPropertyTrendsFilter] = useState('this-month');
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
  const [columnFilters, setColumnFilters] = useState({});
  const [openFilterMenu, setOpenFilterMenu] = useState(null);
  const [displayLimit, setDisplayLimit] = useState(10);
  const monthParts = useMemo(() => {
    const [y, m] = (monthDraft || '').split('-');
    let year = Number.parseInt(y, 10);
    let monthIndex = Number.parseInt(m, 10) - 1;
    const now = new Date();
    if (!Number.isFinite(year)) year = now.getFullYear();
    if (!Number.isFinite(monthIndex) || monthIndex < 0 || monthIndex > 11) monthIndex = now.getMonth();
    return { year, monthIndex };
  }, [monthDraft]);
  const monthYearOptions = useMemo(() => {
    const current = new Date().getFullYear();
    const base = Array.from({ length: 9 }, (_, idx) => current + 4 - idx);
    if (!base.includes(monthParts.year)) base.push(monthParts.year);
    return Array.from(new Set(base)).sort((a, b) => b - a);
  }, [monthParts.year]);
  const columnButtonRef = useRef(null);
  const columnMenuRef = useRef(null);
  const filterMenuRefs = useRef({});

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

  useEffect(() => {
    if (openFilterMenu === null) return undefined;
    function handleClickOutside(event) {
      const menuRef = filterMenuRefs.current[openFilterMenu];
      const buttonRef = document.querySelector(`[data-filter-col="${openFilterMenu}"]`);
      if (!menuRef && !buttonRef) return;
      if (menuRef?.contains(event.target) || buttonRef?.contains(event.target)) return;
      setOpenFilterMenu(null);
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [openFilterMenu]);

  const toggleFilter = (colId) => {
    setOpenFilterMenu(openFilterMenu === colId ? null : colId);
  };

  const setColumnFilter = (colId, value) => {
    setColumnFilters(prev => ({
      ...prev,
      [colId]: value === 'All' ? undefined : value,
    }));
    setOpenFilterMenu(null);
  };

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

  // Load stats
  useEffect(() => {
    let cancelled = false;
    async function loadStats() {
      if (!broker?.token || !broker?.apiBase) return;
      try {
        const statsParams = new URLSearchParams();
        if (filter.from) statsParams.set('from', filter.from);
        if (filter.to) statsParams.set('to', filter.to);
        if (filter.key === 'month' && filter.monthValue) statsParams.set('month', filter.monthValue);
        if (filter.key === 'year' && filter.yearValue) statsParams.set('year', filter.yearValue);
        const statsQuery = statsParams.toString() ? `?${statsParams.toString()}` : '';
        
        const [statsRes, usersRes] = await Promise.all([
          axios.get(`${broker.apiBase}/api/properties/broker/stats${statsQuery}`, {
            headers: { Authorization: `Bearer ${broker.token}` },
          }),
          axios.get(`${broker.apiBase}/api/broker-users`, {
          params: { page: 1, limit: 1 },
            headers: { Authorization: `Bearer ${broker.token}` },
          }).catch(() => ({ data: { meta: { total: 0 } } })),
        ]);
        if (!cancelled) {
          const statsData = statsRes?.data?.data || {};
          const usersTotal = usersRes?.data?.meta?.total || 0;
          setStats({
            totalProperties: Number(statsData.totalProperties || 0),
            publishedProperties: Number(statsData.publishedProperties || 0),
            highDemandProperties: Number(statsData.highDemandProperties || 0),
            newThisWeek: Number(statsData.newThisWeek || 0),
            activeLeads: Number(statsData.activeLeads || 0),
            totalLeads: Number(statsData.activeLeads || 0),
            totalUsers: usersTotal,
          });
        }
      } catch {
        if (!cancelled) {
          setStats(prev => ({ ...prev }));
        }
      }
    }
    loadStats();
    return () => { cancelled = true; };
  }, [broker?.token, broker?.apiBase, filter.key, filter.from, filter.to, filter.monthValue, filter.yearValue]);

  // Load property trends (simplified - monthly created properties)
  useEffect(() => {
    let cancelled = false;
    async function loadTrends() {
      if (!broker?.token || !broker?.apiBase) return;
      try {
        const params = new URLSearchParams({ page: '1', limit: '1000' });
        if (filter.from) params.set('from', filter.from);
        if (filter.to) params.set('to', filter.to);
        if (filter.key === 'month' && filter.monthValue) params.set('month', filter.monthValue);
        if (filter.key === 'year' && filter.yearValue) params.set('year', filter.yearValue);
        const { data } = await axios.get(`${broker.apiBase}/api/properties/listproperty?${params.toString()}`, {
          headers: { Authorization: `Bearer ${broker.token}` },
        });
        if (!cancelled) {
          const rows = Array.isArray(data?.data) ? data.data : [];
          // Transform data same as PropertiesList
          const transformed = rows.map(item => {
            const features = item.features || {};
            return {
              id: item.id,
              title: item.title || 'Untitled property',
              type: item.property_type || '—',
              buildingType: item.building_type || '—',
              propertyFor: item.property_for || '—',
              locality: item.locality || '',
              city: item.city || '',
              state: item.state || '',
              status: item.status || 'published',
              createdAt: item.created_at || item.createdAt,
              updatedAt: item.updated_at || item.updatedAt,
            };
          });
          const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sept','Oct','Nov','Dec'];
          const monthData = {};
          transformed.forEach(p => {
            if (p.createdAt) {
              const date = new Date(p.createdAt);
              const monthIndex = date.getMonth();
              const monthKey = months[monthIndex];
              if (!monthData[monthKey]) monthData[monthKey] = { created: 0, updated: 0 };
              monthData[monthKey].created++;
            }
            if (p.updatedAt) {
              const date = new Date(p.updatedAt);
              const monthIndex = date.getMonth();
              const monthKey = months[monthIndex];
              if (!monthData[monthKey]) monthData[monthKey] = { created: 0, updated: 0 };
              monthData[monthKey].updated++;
            }
          });
          const normalized = months.map((label) => ({
            m: label,
            created: Number(monthData[label]?.created || 0),
            updated: Number(monthData[label]?.updated || 0),
          }));
          setPropertyTrend(normalized);
        }
      } catch {
        if (!cancelled) setPropertyTrend((prev) => prev.map(x => ({ ...x, created: 0, updated: 0 })));
      }
    }
    loadTrends();
    return () => { cancelled = true; };
  }, [broker?.token, broker?.apiBase, trendYear, filter.key, filter.from, filter.to, filter.monthValue, filter.yearValue]);

  // Load recent properties
  useEffect(() => {
    let cancelled = false;
    async function loadRecentProperties() {
      if (!broker?.token || !broker?.apiBase) return;
      try {
        setPropertiesLoading(true);
        const params = new URLSearchParams({ page: '1', limit: '1000' });
        if (filter.from) params.set('from', filter.from);
        if (filter.to) params.set('to', filter.to);
        if (filter.key === 'month' && filter.monthValue) params.set('month', filter.monthValue);
        if (filter.key === 'year' && filter.yearValue) params.set('year', filter.yearValue);
        const { data } = await axios.get(`${broker.apiBase}/api/properties/listproperty?${params.toString()}`, {
          headers: { Authorization: `Bearer ${broker.token}` },
        });
        if (!cancelled) {
          // Transform data same as PropertiesList.jsx
          const transformed = (Array.isArray(data?.data) ? data.data : []).map(item => {
            const features = item.features || {};
            const itemPrice = item.expected_price || features.expected_price;
            const itemArea = item.built_up_area || features.built_up_area;
            const itemAreaUnit = item.area_unit || features.area_unit;
            
            return {
              id: item.id,
              title: item.title || 'Untitled property',
              type: item.property_type || '—',
              property_type: item.property_type || '—',
              buildingType: item.building_type || '—',
              building_type: item.building_type || '—',
              propertyFor: item.property_for || '—',
              property_for: item.property_for || '—',
              locality: item.locality || '',
              city: item.city || '',
              state: item.state || '',
              area: itemArea,
              areaUnit: itemAreaUnit,
              carpetArea: features.carpet_area || item.carpet_area,
              carpetAreaUnit: features.carpet_area_unit || item.carpet_area_unit,
              superArea: features.super_area || item.super_area,
              superAreaUnit: features.super_area_unit || item.super_area_unit,
              price: itemPrice,
              expected_price: itemPrice,
              image: item.primary_image || null,
              primary_image: item.primary_image || null,
              features: features,
              status: item.status || 'published',
              createdAt: item.created_at || item.createdAt,
              updatedAt: item.updated_at || item.updatedAt,
              media: item.media || [],
              // Map features to top level for easy access
              saleType: features.sale_type || '—',
              availability: features.availability || '—',
              approvingAuthority: features.approving_authority || '—',
              ownership: features.ownership || '—',
              reraStatus: features.rera_status || '—',
              reraNumber: features.rera_number || '—',
              floors: features.no_of_floors || item.floors || null,
              propertyOnFloor: features.property_on_floor || '—',
              furnishingStatus: features.furnishing_status || '—',
              facing: features.facing || '—',
              flooringType: features.flooring_type || '—',
              ageYears: features.age_years || '—',
              bedrooms: features.num_bedrooms || item.bedrooms || null,
              bathrooms: features.num_bathrooms || item.bathrooms || null,
              bookingAmount: features.booking_amount || null,
              maintenanceCharges: features.maintenance_charges || null,
              possessionBy: features.possession_by || '—',
            };
          });
          setRecentProperties(transformed);
        }
      } catch {
        if (!cancelled) setRecentProperties([]);
      } finally {
        if (!cancelled) setPropertiesLoading(false);
      }
    }
    loadRecentProperties();
    return () => { cancelled = true; };
  }, [broker?.token, broker?.apiBase, filter.key, filter.from, filter.to, filter.monthValue, filter.yearValue]);

  // Calculate property types distribution
  useEffect(() => {
    const now = new Date();
    let filteredProperties = recentProperties;
    
    // Filter based on propertyTrendsFilter
    if (propertyTrendsFilter === 'this-month') {
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      filteredProperties = recentProperties.filter(prop => {
        if (!prop.createdAt) return false;
        const propDate = new Date(prop.createdAt);
        return propDate >= startOfMonth;
      });
    } else if (propertyTrendsFilter === 'this-year') {
      const startOfYear = new Date(now.getFullYear(), 0, 1);
      filteredProperties = recentProperties.filter(prop => {
        if (!prop.createdAt) return false;
        const propDate = new Date(prop.createdAt);
        return propDate >= startOfYear;
      });
    }
    // 'all' doesn't need filtering
    
    const typeCounts = {};
    filteredProperties.forEach(prop => {
      const type = prop.type || prop.property_type || 'Other';
      typeCounts[type] = (typeCounts[type] || 0) + 1;
    });
    
    const distribution = Object.entries(typeCounts)
      .map(([type, count]) => ({ type, count }))
      .sort((a, b) => b.count - a.count);
    
    setPropertyTypesDistribution(distribution);
  }, [recentProperties, propertyTrendsFilter]);

  const filterValues = useMemo(() => {
    const values = {
      type: [...new Set(recentProperties.map(x => x.type || x.property_type).filter(Boolean))].sort(),
      buildingType: [...new Set(recentProperties.map(x => x.buildingType || x.building_type).filter(Boolean))].sort(),
      propertyFor: [...new Set(recentProperties.map(x => x.propertyFor).filter(Boolean))].sort(),
      saleType: [...new Set(recentProperties.map(x => x.saleType).filter(Boolean))].sort(),
      availability: [...new Set(recentProperties.map(x => x.availability).filter(Boolean))].sort(),
      location: [...new Set(recentProperties.map(x => {
        const parts = [x.locality, x.city, x.state].filter(Boolean);
        return parts.length ? parts.join(', ') : '';
      }).filter(Boolean))].sort(),
      status: [...new Set(recentProperties.map(x => x.status).filter(Boolean))].sort(),
    };
    return values;
  }, [recentProperties]);

  const getColumnValue = (colId, p) => {
    switch (colId) {
      case 'type': return p.type || p.property_type;
      case 'buildingType': return p.buildingType || p.building_type;
      case 'propertyFor': return p.propertyFor;
      case 'saleType': return p.saleType;
      case 'availability': return p.availability;
      case 'location': {
        const parts = [p.locality, p.city, p.state].filter(Boolean);
        return parts.length ? parts.join(', ') : '';
      }
      case 'status': return p.status;
      default: return null;
    }
  };

  const filteredProperties = useMemo(() => {
    return recentProperties.filter((x) => {
      for (const [colId, filterValue] of Object.entries(columnFilters)) {
        if (filterValue === undefined) continue;
        const value = getColumnValue(colId, x);
        if (String(value || '').toLowerCase() !== String(filterValue || '').toLowerCase()) {
          return false;
        }
      }
      return true;
    });
  }, [recentProperties, columnFilters]);

  const paginatedFiltered = useMemo(() => {
    return filteredProperties.slice(0, displayLimit);
  }, [filteredProperties, displayLimit]);

  const hasMore = filteredProperties.length > displayLimit;

  const handleSeeMore = () => {
    setDisplayLimit(prev => prev + 10);
  };

  const visibleColumns = useMemo(
    () => COLUMN_OPTIONS.filter((col) => visibleColumnIds.includes(col.id)),
    [visibleColumnIds]
  );

  const chartData = useMemo(() => {
    return {
      labels: propertyTrend.map((x) => x.m),
      datasets: [
        {
          label: 'Properties Created',
          data: propertyTrend.map((x) => x.created),
          borderColor: '#2563eb',
          backgroundColor: 'rgba(37, 99, 235, 0.1)',
          fill: true,
          tension: 0.4,
        },
        {
          label: 'Properties Updated',
          data: propertyTrend.map((x) => x.updated),
          borderColor: '#10b981',
          backgroundColor: 'rgba(16, 185, 129, 0.1)',
          fill: true,
          tension: 0.4,
        },
      ],
    };
  }, [propertyTrend]);

  const chartOptions = useMemo(() => ({
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top',
        labels: {
          usePointStyle: true,
          padding: 15,
          font: { size: 12 },
        },
      },
      tooltip: {
        mode: 'index',
        intersect: false,
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          precision: 0,
        },
      },
    },
  }), []);

  // Property Types Pie Chart Data
  const propertyTypesPieData = useMemo(() => {
    const colors = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#06B6D4', '#EC4899', '#84CC16'];
    const labels = propertyTypesDistribution.map(d => d.type);
    const data = propertyTypesDistribution.map(d => d.count);
    const backgroundColors = propertyTypesDistribution.map((_, idx) => colors[idx % colors.length]);
    
    return {
      labels,
      datasets: [{
        data,
        backgroundColor: backgroundColors,
        borderWidth: 0,
      }],
    };
  }, [propertyTypesDistribution]);

  const propertyTypesPieOptions = useMemo(() => ({
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom',
        labels: {
          usePointStyle: true,
          padding: 15,
          font: { size: 12 },
        },
      },
      tooltip: {
        callbacks: {
          label: (context) => {
            const label = context.label || '';
            const value = context.parsed || 0;
            const total = context.dataset.data.reduce((a, b) => a + b, 0);
            const percentage = total > 0 ? ((value / total) * 100).toFixed(1) : 0;
            return `${label}: ${value} (${percentage}%)`;
          },
        },
      },
    },
  }), []);

  // Property Trends Horizontal Bar Chart Data (Property Types Distribution)
  const propertyTrendsBarData = useMemo(() => {
    const colors = ['#8B5CF6', '#10B981', '#3B82F6', '#F59E0B', '#06B6D4', '#EC4899', '#84CC16', '#EF4444'];
    const maxValue = propertyTypesDistribution.length > 0 
      ? Math.max(...propertyTypesDistribution.map(d => d.count))
      : 100;
    
    const labels = propertyTypesDistribution.map(d => d.type);
    const data = propertyTypesDistribution.map(d => d.count);
    const backgroundColors = propertyTypesDistribution.map((_, idx) => colors[idx % colors.length]);
    
    return {
      labels,
      datasets: [{
        label: 'Properties',
        data,
        backgroundColor: backgroundColors,
        borderWidth: 0,
        barThickness: 20,
      }],
    };
  }, [propertyTypesDistribution]);

  const propertyTrendsBarOptions = useMemo(() => ({
    indexAxis: 'y',
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        callbacks: {
          label: (context) => {
            return `${context.label}: ${context.parsed.x} properties`;
          },
        },
      },
    },
    scales: {
      x: {
        beginAtZero: true,
        grid: {
          display: true,
          color: '#F1F5F9',
        },
        ticks: {
          precision: 0,
          font: { size: 11 },
        },
      },
      y: {
        grid: {
          display: false,
        },
        ticks: {
          font: { size: 11 },
        },
      },
    },
  }), []);

  return (
    <div className="brokerdashboard-root">
      <header className="brokerdashboard-header">
        <div>
          <h1 className="brokerdashboard-title">Dashboard</h1>
          <div className="brokerdashboard-sub">Overview of your properties and leads</div>
        </div>
        <div className="brokerdashboard-filterwrap">
          <button
            type="button"
            ref={filterButtonRef}
            className="brokerdashboard-filterbtn"
            onClick={() => setFilterMenuOpen((open) => !open)}
          >
            {filter.label}
            <span className="brokerdashboard-caret">▾</span>
          </button>
          {filterMenuOpen && (
            <div className="brokerdashboard-filtermenu" ref={filterMenuRef}>
              <div className="brokerdashboard-filtermenu-section">
                <div className="brokerdashboard-filtermenu-label">Quick ranges</div>
                {QUICK_RANGE_OPTIONS.map((opt) => (
                  <button
                    key={opt.key}
                    type="button"
                    className={`brokerdashboard-filtermenu-item ${filter.key === opt.key ? 'active' : ''}`}
                    onClick={() => handleSelectPreset(opt.key)}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
              <div className="brokerdashboard-filtermenu-section">
                <div className="brokerdashboard-filtermenu-label">Month</div>
                <div className="brokerdashboard-filtermenu-inputs">
                  <select value={monthParts.monthIndex} onChange={handleSelectMonth} className="brokerdashboard-select">
                    {MONTH_NAMES.map((name, idx) => (
                      <option key={idx} value={idx}>{name}</option>
                    ))}
                  </select>
                  <select value={monthParts.year} onChange={handleSelectMonthYear} className="brokerdashboard-select">
                    {monthYearOptions.map((y) => (
                      <option key={y} value={y}>{y}</option>
                    ))}
                  </select>
                  <button
                    type="button"
                    className="brokerdashboard-filtermenu-apply"
                    onClick={handleApplyMonth}
                    disabled={!monthValid}
                  >
                    Apply
                  </button>
                </div>
              </div>
              <div className="brokerdashboard-filtermenu-section">
                <div className="brokerdashboard-filtermenu-label">Year</div>
                <div className="brokerdashboard-filtermenu-inputs">
                  <input
                    type="text"
                    value={yearDraft}
                    onChange={handleYearInput}
                    placeholder="YYYY"
                    maxLength={4}
                    className="brokerdashboard-input"
                  />
                  <button
                    type="button"
                    className="brokerdashboard-filtermenu-apply"
                    onClick={handleApplyYear}
                    disabled={!yearValid}
                  >
                    Apply
                  </button>
                </div>
              </div>
              <div className="brokerdashboard-filtermenu-section">
                <div className="brokerdashboard-filtermenu-label">Custom range</div>
                <div className="brokerdashboard-filtermenu-inputs">
                  <input
                    type="date"
                    value={customDraft.from}
                    onChange={(e) => setCustomDraft(prev => ({ ...prev, from: e.target.value }))}
                    className="brokerdashboard-input"
                  />
                  <input
                    type="date"
                    value={customDraft.to}
                    onChange={(e) => setCustomDraft(prev => ({ ...prev, to: e.target.value }))}
                    className="brokerdashboard-input"
                  />
                  <button
                    type="button"
                    className="brokerdashboard-filtermenu-apply"
                    onClick={handleApplyCustom}
                    disabled={!customRangeValid}
                  >
                    Apply
        </button>
                </div>
                {customRangeError && (
                  <div className="brokerdashboard-filtermenu-error">{customRangeError}</div>
                )}
              </div>
            </div>
          )}
        </div>
      </header>

      <main className="brokerdashboard-main">
        <section className="brokerdashboard-cards">
          <div className="brokerdashboard-card">
            <div className="brokerdashboard-card-head">
              <div className="brokerdashboard-icon brokerdashboard-icon-blue">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                  <polyline points="9 22 9 12 15 12 15 22" />
                </svg>
              </div>
              <div className="brokerdashboard-card-title">Total Properties</div>
            </div>
            <div className="brokerdashboard-metric">{formatNumber(stats.totalProperties)}</div>
            <div className="brokerdashboard-delta brokerdashboard-delta-up">All properties</div>
      </div>

          <div className="brokerdashboard-card">
            <div className="brokerdashboard-card-head">
              <div className="brokerdashboard-icon brokerdashboard-icon-green">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                  <polyline points="22 4 12 14.01 9 11.01" />
                </svg>
              </div>
              <div className="brokerdashboard-card-title">Published</div>
            </div>
            <div className="brokerdashboard-metric">{formatNumber(stats.publishedProperties)}</div>
            <div className="brokerdashboard-delta brokerdashboard-delta-up">Active listings</div>
          </div>

          <div className="brokerdashboard-card">
            <div className="brokerdashboard-card-head">
              <div className="brokerdashboard-icon brokerdashboard-icon-purple">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                  <circle cx="9" cy="7" r="4" />
                  <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                  <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                </svg>
              </div>
              <div className="brokerdashboard-card-title">Total Users</div>
            </div>
            <div className="brokerdashboard-metric">{formatNumber(stats.totalUsers)}</div>
            <div className="brokerdashboard-delta brokerdashboard-delta-up">Registered users</div>
          </div>

          <div className="brokerdashboard-card">
            <div className="brokerdashboard-card-head">
              <div className="brokerdashboard-icon brokerdashboard-icon-pink">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                </svg>
              </div>
              <div className="brokerdashboard-card-title">Active Leads</div>
            </div>
            <div className="brokerdashboard-metric">{formatNumber(stats.activeLeads)}</div>
            <div className="brokerdashboard-delta brokerdashboard-delta-up">Updated in last 24h</div>
        </div>

          <div className="brokerdashboard-card">
            <div className="brokerdashboard-card-head">
              <div className="brokerdashboard-icon brokerdashboard-icon-teal">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
                </svg>
              </div>
              <div className="brokerdashboard-card-title">New This Week</div>
            </div>
            <div className="brokerdashboard-metric">{formatNumber(stats.newThisWeek)}</div>
            <div className="brokerdashboard-delta brokerdashboard-delta-up">Properties added</div>
          </div>
        </section>

        <section className="brokerdashboard-grid">
          <div className="brokerdashboard-panel trend-card">
            <div className="trend-head">
              <div className="trend-head-left">
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="3" y="3" width="18" height="18" rx="2" />
                    <path d="M3 9h18M9 21V9" />
                  </svg>
                  <h2 className="trend-title">Property Trends</h2>
                </div>
                <div className="trend-sub">Distribution of available properties</div>
              </div>
              <div className="trend-head-right">
                <select 
                  className="trend-filter-select"
                  value={propertyTrendsFilter}
                  onChange={(e) => setPropertyTrendsFilter(e.target.value)}
                >
                  <option value="this-month">This month</option>
                  <option value="this-year">This year</option>
                  <option value="all">All time</option>
                </select>
              </div>
            </div>
            <div className="trend-chart" role="img" aria-label="Property trends bar chart">
              <div className="trend-plot" style={{ height: Math.max(300, propertyTypesDistribution.length * 50) }}>
                {propertyTypesDistribution.length > 0 ? (
                  <Bar data={propertyTrendsBarData} options={propertyTrendsBarOptions} />
                ) : (
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: '#64748b' }}>
                    No property data available
                  </div>
                )}
              </div>
            </div>
        </div>

          <div className="brokerdashboard-panel">
            <div className="brokerdashboard-panel-head">
              <h2>Property Types</h2>
              <div className="brokerdashboard-sub">Distribution of available properties</div>
            </div>
            <div className="brokerdashboard-pie-chart" style={{ height: 300, position: 'relative' }}>
              {propertyTypesDistribution.length > 0 ? (
                <Pie data={propertyTypesPieData} options={propertyTypesPieOptions} />
              ) : (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: '#64748b' }}>
                  No property data available
                </div>
              )}
            </div>
          </div>
        </section>

        <section className="brokerdashboard-panel brokerdashboard-properties">
          <div className="brokerdashboard-tableactions">
            <button
              type="button"
              ref={columnButtonRef}
              className="brokerdashboard-columns-btn"
              onClick={() => setColumnMenuOpen((open) => !open)}
            >
              <span aria-hidden>🗂️</span>
              <span>Columns</span>
            </button>
            {columnMenuOpen && (
              <div className="brokerdashboard-colmenu" ref={columnMenuRef} role="menu">
                <div className="brokerdashboard-colmenu-head">Show columns</div>
                {COLUMN_OPTIONS.map((col) => (
                  <label key={col.id} className="brokerdashboard-colmenu-item">
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

          <div className="brokerdashboard-tablewrap">
            <table className="brokerdashboard-table" role="table">
              <thead>
                <tr>
                  <th scope="col" className="col-checkbox"><input type="checkbox" aria-label="Select all" /></th>
                  <th scope="col">Property</th>
                  {visibleColumns.map((col) => {
                    const filterValuesForCol = filterValues[col.id] || [];
                    const hasFilter = filterValuesForCol.length > 0;
                    const currentFilter = columnFilters[col.id];
                    const isMenuOpen = openFilterMenu === col.id;
                    return (
                      <th key={col.id} scope="col" className={`col-${col.id}`}>
                        <div className="brokerdashboard-th-filter">
                          <span>{col.label}</span>
                          {hasFilter && (
                            <div className="brokerdashboard-th-filter-btn-wrap">
                              <button
                                type="button"
                                data-filter-col={col.id}
                                className={`brokerdashboard-th-filter-btn ${currentFilter ? 'active' : ''}`}
                                onClick={() => toggleFilter(col.id)}
                                title="Filter"
                              >
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                  <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" />
                                </svg>
                              </button>
                              {isMenuOpen && (
                                <div
                                  className="brokerdashboard-filter-menu"
                                  ref={(el) => { if (el) filterMenuRefs.current[col.id] = el; }}
                                >
                                  <div className="brokerdashboard-filter-menu-item">
                                    <button
                                      type="button"
                                      className={!currentFilter ? 'active' : ''}
                                      onClick={() => setColumnFilter(col.id, 'All')}
                                    >
                                      All
                                    </button>
                                  </div>
                                  {filterValuesForCol.map((val) => (
                                    <div key={val} className="brokerdashboard-filter-menu-item">
                                      <button
                                        type="button"
                                        className={currentFilter === val ? 'active' : ''}
                                        onClick={() => setColumnFilter(col.id, val)}
                                      >
                                        {val}
                                      </button>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      </th>
                    );
                  })}
                </tr>
              </thead>
              <tbody>
                {propertiesLoading ? (
                  <tr>
                    <td colSpan={visibleColumns.length + 2} className="brokerdashboard-table-empty">Loading properties…</td>
                  </tr>
                ) : paginatedFiltered.length ? (
                  paginatedFiltered.map((row) => {
                    const areaText = formatArea(row.area, row.areaUnit);
                    const dateLabel = row.createdAt ? DATE_DISPLAY.format(new Date(row.createdAt)) : '—';
                    const locationParts = [row.city, row.state].filter(Boolean);
                    const location = locationParts.length ? locationParts.join(', ') : row.locality || '—';
                    const priceLabel = formatPrice(row.price);
                    const imageSrc = row.image
                      ? (row.image.startsWith('http') ? row.image : `${broker.apiBase}${row.image}`)
                      : '/templates/proclassic/public/img/noimg.png';
                    const propertyMeta = [row.property_type, row.buildingType].filter(Boolean).join(' • ');
                    return (
                      <tr key={row.id}>
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
                          if (key === 'buildingType') return <td key={key} className={`col-${key}`}>{row.buildingType || row.building_type || '—'}</td>;
                          if (key === 'propertyFor') return <td key={key} className={`col-${key}`}>{row.propertyFor || '—'}</td>;
                          if (key === 'saleType') return <td key={key} className={`col-${key}`}>{row.saleType || '—'}</td>;
                          if (key === 'availability') return <td key={key} className={`col-${key}`}>{row.availability || '—'}</td>;
                          if (key === 'location') return <td key={key} className={`col-${key}`}>{location}</td>;
                          if (key === 'date') return <td key={key} className={`col-${key}`}>{dateLabel}</td>;
                          return <td key={key} className={`col-${key}`}>—</td>;
                        })}
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={visibleColumns.length + 2} className="brokerdashboard-table-empty">No properties found.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          {hasMore && (
            <div style={{ textAlign: 'center', padding: '20px' }}>
              <button
                onClick={handleSeeMore}
                className="brokerdashboard-seemore-btn"
              >
                See More
              </button>
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
