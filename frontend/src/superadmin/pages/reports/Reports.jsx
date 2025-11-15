import React, { useEffect, useState, useMemo, useRef } from 'react';
import axios from 'axios';
import { useSuperAdmin } from '../../../context/SuperAdminContext.jsx';
import { Line, Bar, Doughnut } from 'react-chartjs-2';
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
import './reports.css';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, BarElement, ArcElement, ChartTitle, Tooltip, ChartLegend, Filler);

const REPORT_TABS = [
  { id: 'brokers', label: 'Broker Reports', icon: '👥' },
  { id: 'properties', label: 'Property Reports', icon: '🏠' },
  { id: 'leads', label: 'Lead Reports', icon: '📊' },
  { id: 'analytics', label: 'Analytics', icon: '📈' },
];

const MONTH_NAMES = ['January','February','March','April','May','June','July','August','September','October','November','December'];
const DATE_DISPLAY = new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
const QUICK_RANGE_OPTIONS = [
  { key: 'this-month', label: 'This month' },
  { key: 'this-year', label: 'This year' },
  { key: 'all', label: 'All time' },
];

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

const DEFAULT_FILTER = createPresetFilter('all');

const formatCurrency = (value) => {
  const num = Number(value);
  if (!Number.isFinite(num)) return '₹—';
  if (num >= 10000000) return `₹${(num / 10000000).toFixed(2)}Cr`;
  if (num >= 100000) return `₹${(num / 100000).toFixed(2)}L`;
  return `₹${num.toLocaleString('en-IN')}`;
};

// Export CSV utility
const exportToCSV = (data, filename) => {
  if (!data || data.length === 0) {
    alert('No data to export');
    return;
  }
  
  // Convert data to CSV format
  const headers = Object.keys(data[0]).map(h => `"${h.replace(/"/g, '""')}"`).join(',');
  const rows = data.map(row => 
    Object.values(row).map(val => {
      const str = String(val || '');
      return `"${str.replace(/"/g, '""')}"`;
    }).join(',')
  );
  
  const csvContent = [headers, ...rows].join('\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

export default function Reports() {
  const { token, apiBase } = useSuperAdmin();
  const [activeTab, setActiveTab] = useState('brokers');
  const [filter, setFilter] = useState(() => DEFAULT_FILTER);
  const [filterMenuOpen, setFilterMenuOpen] = useState(false);
  const filterButtonRef = useRef(null);
  const filterMenuRef = useRef(null);
  const [monthDraft, setMonthDraft] = useState(() => DEFAULT_FILTER.monthValue || monthValueFromDate(new Date()));
  const [yearDraft, setYearDraft] = useState(() => DEFAULT_FILTER.yearValue || String(new Date().getFullYear()));
  const [customDraft, setCustomDraft] = useState(() => ({ from: DEFAULT_FILTER.from || '', to: DEFAULT_FILTER.to || '' }));
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState(null);
  const monthParts = useMemo(() => getMonthParts(monthDraft), [monthDraft]);
  const monthYearOptions = useMemo(() => {
    const current = new Date().getFullYear();
    const base = Array.from({ length: 9 }, (_, idx) => current + 4 - idx);
    if (!base.includes(monthParts.year)) base.push(monthParts.year);
    return Array.from(new Set(base)).sort((a, b) => b - a);
  }, [monthParts.year]);
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

  const headers = useMemo(() => ({ Authorization: token ? `Bearer ${token}` : '' }), [token]);

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

  const buildExportFilename = (prefix) => {
    const key = filter?.key || 'all';
    const dateStamp = new Date().toISOString().split('T')[0];
    return `${prefix}-${key}-${dateStamp}.csv`;
  };

  useEffect(() => {
    if (!token) return;
    setLoading(true);
    const endpoint = `/api/reports/${activeTab}`;
    const params = {};
    if (filter.key) params.range = filter.key;
    if (filter.from) params.from = filter.from;
    if (filter.to) params.to = filter.to;
    if (filter.key === 'month' && filter.monthValue) params.month = filter.monthValue;
    if (filter.key === 'year' && filter.yearValue) params.year = filter.yearValue;
    if ((filter.key === 'this-month' || filter.key === 'this-year') && filter.yearValue) params.year = filter.yearValue;

    axios.get(`${apiBase}${endpoint}`, { headers, params })
      .then(({ data: resData }) => {
        setData(resData?.data || null);
      })
      .catch((err) => {
        console.error('Failed to fetch reports:', err);
        setData(null);
      })
      .finally(() => {
        setLoading(false);
      });
  }, [activeTab, apiBase, headers, token, filter]);

  // Export handlers
  const handleExportBrokers = () => {
    if (!data) return;
    const { monthlyTrend = [], topBrokers = [] } = data;
    
    const exportData = [
      ...monthlyTrend.map(d => ({
        Month: d.month,
        'Brokers Added': d.count,
      })),
      { Month: '', 'Brokers Added': '' },
      { Month: 'Top Brokers by Properties', 'Brokers Added': '' },
      ...topBrokers.map((b, idx) => ({
        Month: `${idx + 1}. ${b.brokerName}`,
        'Brokers Added': b.propertyCount,
      })),
    ];
    exportToCSV(exportData, buildExportFilename('broker-reports'));
  };

  const handleExportProperties = () => {
    if (!data) return;
    const { byType = [], byCity = [], monthlyTrend = [] } = data;
    
    const exportData = [
      ...monthlyTrend.map(d => ({
        Month: d.month,
        'Properties Added': d.count,
      })),
      { Month: '', 'Properties Added': '' },
      { Month: 'Properties by Type', 'Properties Added': '' },
      ...byType.map(t => ({
        Month: t.type,
        'Properties Added': t.count,
      })),
      { Month: '', 'Properties Added': '' },
      { Month: 'Top Cities', 'Properties Added': '' },
      ...byCity.map((c, idx) => ({
        Month: `${idx + 1}. ${c.city}`,
        'Properties Added': c.count,
      })),
    ];
    exportToCSV(exportData, buildExportFilename('property-reports'));
  };

  const handleExportLeads = () => {
    if (!data) return;
    const { bySource = [], monthlyTrend = [], brokerLeads = [] } = data;
    
    const exportData = [
      ...monthlyTrend.map(d => ({
        Month: d.month,
        'Leads Generated': d.count,
      })),
      { Month: '', 'Leads Generated': '' },
      { Month: 'Leads by Source', 'Leads Generated': '' },
      ...bySource.map(s => ({
        Month: s.source,
        'Leads Generated': s.count,
      })),
      { Month: '', 'Leads Generated': '' },
      { Month: 'Top Brokers by Leads', 'Leads Generated': '' },
      ...brokerLeads.map((b, idx) => ({
        Month: `${idx + 1}. ${b.brokerName}`,
        'Leads Generated': b.count,
      })),
    ];
    exportToCSV(exportData, buildExportFilename('leads-reports'));
  };

  const handleExportAnalytics = () => {
    if (!data) return;
    const { brokerPerformance = [] } = data;
    
    const exportData = brokerPerformance.map((b, idx) => ({
      Rank: idx + 1,
      'Broker Name': b.brokerName,
      Properties: b.properties,
      Leads: b.leads,
      'Conversion Rate (%)': b.conversionRate,
    }));
    exportToCSV(exportData, buildExportFilename('analytics-report'));
  };

  const renderBrokerReports = () => {
    if (!data) return <div className="reports-empty">No data available</div>;
    
    const { total = 0, active = 0, suspended = 0, monthlyTrend = [], topBrokers = [] } = data;
    
    const monthlyChartData = {
      labels: monthlyTrend.length > 0 ? monthlyTrend.map((d) => {
        const [year, month] = d.month.split('-');
        return new Date(year, month - 1).toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
      }) : ['No Data'],
      datasets: [{
        label: 'Brokers Added',
        data: monthlyTrend.length > 0 ? monthlyTrend.map((d) => d.count) : [0],
        borderColor: 'rgb(37, 99, 235)',
        backgroundColor: 'rgba(37, 99, 235, 0.1)',
        fill: true,
        tension: 0.4,
      }],
    };

    const statusData = {
      labels: ['Active', 'Suspended'],
      datasets: [{
        data: [active, suspended],
        backgroundColor: ['rgba(34, 197, 94, 0.8)', 'rgba(239, 68, 68, 0.8)'],
        borderColor: ['rgb(34, 197, 94)', 'rgb(239, 68, 68)'],
        borderWidth: 2,
      }],
    };

    return (
      <div className="reports-content">
        <div className="reports-stats-grid">
          <div className="reports-stat-card">
            <div className="reports-stat-icon">👥</div>
            <div className="reports-stat-info">
              <div className="reports-stat-label">Total Brokers</div>
              <div className="reports-stat-value">{total}</div>
            </div>
          </div>
          <div className="reports-stat-card">
            <div className="reports-stat-icon" style={{ color: '#22c55e' }}>✓</div>
            <div className="reports-stat-info">
              <div className="reports-stat-label">Active Brokers</div>
              <div className="reports-stat-value">{active}</div>
            </div>
          </div>
          <div className="reports-stat-card">
            <div className="reports-stat-icon" style={{ color: '#ef4444' }}>⚠</div>
            <div className="reports-stat-info">
              <div className="reports-stat-label">Suspended Brokers</div>
              <div className="reports-stat-value">{suspended}</div>
            </div>
          </div>
        </div>

        <div className="reports-charts-grid">
          <div className="reports-chart-card">
            <h3 className="reports-chart-title">Broker Signup Trend</h3>
            <Line data={monthlyChartData} options={{
              responsive: true,
              maintainAspectRatio: false,
              plugins: { legend: { display: false } },
              scales: { y: { beginAtZero: true } },
            }} />
          </div>
          <div className="reports-chart-card">
            <h3 className="reports-chart-title">Status Distribution</h3>
            <Doughnut data={statusData} options={{
              responsive: true,
              maintainAspectRatio: false,
              plugins: { legend: { position: 'bottom' } },
            }} />
          </div>
        </div>

        <div className="reports-table-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <h3 className="reports-table-title" style={{ margin: 0 }}>Top Brokers by Properties</h3>
            <button type="button" onClick={handleExportBrokers} className="reports-export-btn">
              📥 Export CSV
            </button>
          </div>
          <div className="reports-table">
            <div className="reports-table-header">
              <div>Broker Name</div>
              <div>Properties</div>
            </div>
            {topBrokers.length > 0 ? (
              topBrokers.map((broker, idx) => (
                <div key={broker.brokerId} className="reports-table-row">
                  <div>
                    <span className="reports-rank">{idx + 1}</span>
                    {broker.brokerName || 'Unknown'}
                  </div>
                  <div className="reports-number">{broker.propertyCount}</div>
                </div>
              ))
            ) : (
              <div className="reports-empty-row">No data available</div>
            )}
          </div>
        </div>
      </div>
    );
  };

  const renderPropertyReports = () => {
    if (!data) return <div className="reports-empty">No data available</div>;
    
    const { 
      total = 0, 
      active = 0, 
      inactive = 0, 
      byType = [], 
      byBuildingType = [], 
      byStatus = [], 
      byCity = [], 
      monthlyTrend = [], 
      priceRanges = {} 
    } = data;

    const monthlyChartData = {
      labels: monthlyTrend.length > 0 ? monthlyTrend.map((d) => {
        const [year, month] = d.month.split('-');
        return new Date(year, month - 1).toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
      }) : ['No Data'],
      datasets: [{
        label: 'Properties Added',
        data: monthlyTrend.length > 0 ? monthlyTrend.map((d) => d.count) : [0],
        borderColor: 'rgb(34, 197, 94)',
        backgroundColor: 'rgba(34, 197, 94, 0.1)',
        fill: true,
        tension: 0.4,
      }],
    };

    const typeData = {
      labels: byType.length > 0 ? byType.slice(0, 8).map((d) => d.type) : ['No Data'],
      datasets: [{
        label: 'Properties',
        data: byType.length > 0 ? byType.slice(0, 8).map((d) => d.count) : [0],
        backgroundColor: 'rgba(37, 99, 235, 0.8)',
        borderColor: 'rgb(37, 99, 235)',
        borderWidth: 1,
      }],
    };

    const priceRangeData = {
      labels: Object.keys(priceRanges).length > 0 ? Object.keys(priceRanges) : ['No Data'],
      datasets: [{
        data: Object.keys(priceRanges).length > 0 ? Object.values(priceRanges) : [0],
        backgroundColor: [
          'rgba(34, 197, 94, 0.8)',
          'rgba(59, 130, 246, 0.8)',
          'rgba(168, 85, 247, 0.8)',
          'rgba(239, 68, 68, 0.8)',
          'rgba(249, 115, 22, 0.8)',
        ],
        borderWidth: 2,
      }],
    };

    return (
      <div className="reports-content">
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '16px' }}>
          <button type="button" onClick={handleExportProperties} className="reports-export-btn">
            📥 Export CSV
          </button>
        </div>
        <div className="reports-stats-grid">
          <div className="reports-stat-card">
            <div className="reports-stat-icon">🏠</div>
            <div className="reports-stat-info">
              <div className="reports-stat-label">Total Properties</div>
              <div className="reports-stat-value">{total}</div>
            </div>
          </div>
          <div className="reports-stat-card">
            <div className="reports-stat-icon" style={{ color: '#22c55e' }}>✓</div>
            <div className="reports-stat-info">
              <div className="reports-stat-label">Active Properties</div>
              <div className="reports-stat-value">{active}</div>
            </div>
          </div>
          <div className="reports-stat-card">
            <div className="reports-stat-icon" style={{ color: '#6b7280' }}>○</div>
            <div className="reports-stat-info">
              <div className="reports-stat-label">Inactive Properties</div>
              <div className="reports-stat-value">{inactive}</div>
            </div>
          </div>
        </div>

        <div className="reports-charts-grid">
          <div className="reports-chart-card">
            <h3 className="reports-chart-title">Properties Added Over Time</h3>
            <Line data={monthlyChartData} options={{
              responsive: true,
              maintainAspectRatio: false,
              plugins: { legend: { display: false } },
              scales: { y: { beginAtZero: true } },
            }} />
          </div>
          <div className="reports-chart-card">
            <h3 className="reports-chart-title">Properties by Type</h3>
            <Bar data={typeData} options={{
              responsive: true,
              maintainAspectRatio: false,
              plugins: { legend: { display: false } },
              scales: { y: { beginAtZero: true } },
            }} />
          </div>
        </div>

        <div className="reports-charts-grid">
          <div className="reports-chart-card">
            <h3 className="reports-chart-title">Price Distribution</h3>
            <Doughnut data={priceRangeData} options={{
              responsive: true,
              maintainAspectRatio: false,
              plugins: { legend: { position: 'bottom' } },
            }} />
          </div>
          <div className="reports-chart-card">
            <h3 className="reports-chart-title">Top Cities</h3>
            <div className="reports-list">
              {byCity.slice(0, 10).map((city, idx) => (
                <div key={city.city} className="reports-list-item">
                  <span className="reports-rank">{idx + 1}</span>
                  <span className="reports-label">{city.city}</span>
                  <span className="reports-number">{city.count}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderLeadsReports = () => {
    if (!data) return <div className="reports-empty">No data available</div>;
    
    const { total, bySource = [], byStatus = [], monthlyTrend = [], brokerLeads = [] } = data;

    const monthlyChartData = {
      labels: monthlyTrend.length > 0 ? monthlyTrend.map((d) => {
        const [year, month] = d.month.split('-');
        return new Date(year, month - 1).toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
      }) : ['No Data'],
      datasets: [{
        label: 'Leads Generated',
        data: monthlyTrend.length > 0 ? monthlyTrend.map((d) => d.count) : [0],
        borderColor: 'rgb(168, 85, 247)',
        backgroundColor: 'rgba(168, 85, 247, 0.1)',
        fill: true,
        tension: 0.4,
      }],
    };

    const sourceData = {
      labels: bySource.length > 0 ? bySource.map((d) => d.source) : ['No Data'],
      datasets: [{
        data: bySource.length > 0 ? bySource.map((d) => d.count) : [0],
        backgroundColor: [
          'rgba(37, 99, 235, 0.8)',
          'rgba(34, 197, 94, 0.8)',
          'rgba(249, 115, 22, 0.8)',
          'rgba(239, 68, 68, 0.8)',
          'rgba(168, 85, 247, 0.8)',
        ],
        borderWidth: 2,
      }],
    };

    return (
      <div className="reports-content">
        <div className="reports-stats-grid">
          <div className="reports-stat-card">
            <div className="reports-stat-icon">📊</div>
            <div className="reports-stat-info">
              <div className="reports-stat-label">Total Leads</div>
              <div className="reports-stat-value">{total}</div>
            </div>
          </div>
        </div>

        <div className="reports-charts-grid">
          <div className="reports-chart-card">
            <h3 className="reports-chart-title">Leads Generated Over Time</h3>
            <Line data={monthlyChartData} options={{
              responsive: true,
              maintainAspectRatio: false,
              plugins: { legend: { display: false } },
              scales: { y: { beginAtZero: true } },
            }} />
          </div>
          <div className="reports-chart-card">
            <h3 className="reports-chart-title">Leads by Source</h3>
            <Doughnut data={sourceData} options={{
              responsive: true,
              maintainAspectRatio: false,
              plugins: { legend: { position: 'bottom' } },
            }} />
          </div>
        </div>

        <div className="reports-table-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <h3 className="reports-table-title" style={{ margin: 0 }}>Top Brokers by Leads</h3>
            <button type="button" onClick={handleExportLeads} className="reports-export-btn">
              📥 Export CSV
            </button>
          </div>
          <div className="reports-table">
            <div className="reports-table-header">
              <div>Broker Name</div>
              <div>Leads</div>
            </div>
            {brokerLeads.length > 0 ? (
              brokerLeads.map((broker, idx) => (
                <div key={broker.brokerId} className="reports-table-row">
                  <div>
                    <span className="reports-rank">{idx + 1}</span>
                    {broker.brokerName || 'Unknown'}
                  </div>
                  <div className="reports-number">{broker.count}</div>
                </div>
              ))
            ) : (
              <div className="reports-empty-row">No data available</div>
            )}
          </div>
        </div>
      </div>
    );
  };

  const renderAnalytics = () => {
    if (!data) return <div className="reports-empty">No data available</div>;
    
    const { 
      totalBrokers = 0, 
      totalProperties = 0, 
      totalLeads = 0, 
      averagePropertiesPerBroker = '0.00', 
      averageLeadsPerBroker = '0.00', 
      brokerPerformance = [] 
    } = data;

    return (
      <div className="reports-content">
        <div className="reports-stats-grid">
          <div className="reports-stat-card">
            <div className="reports-stat-icon">👥</div>
            <div className="reports-stat-info">
              <div className="reports-stat-label">Total Brokers</div>
              <div className="reports-stat-value">{totalBrokers}</div>
            </div>
          </div>
          <div className="reports-stat-card">
            <div className="reports-stat-icon">🏠</div>
            <div className="reports-stat-info">
              <div className="reports-stat-label">Total Properties</div>
              <div className="reports-stat-value">{totalProperties}</div>
            </div>
          </div>
          <div className="reports-stat-card">
            <div className="reports-stat-icon">📊</div>
            <div className="reports-stat-info">
              <div className="reports-stat-label">Total Leads</div>
              <div className="reports-stat-value">{totalLeads}</div>
            </div>
          </div>
          <div className="reports-stat-card">
            <div className="reports-stat-icon">📈</div>
            <div className="reports-stat-info">
              <div className="reports-stat-label">Avg Properties/Broker</div>
              <div className="reports-stat-value">{averagePropertiesPerBroker}</div>
            </div>
          </div>
          <div className="reports-stat-card">
            <div className="reports-stat-icon">📈</div>
            <div className="reports-stat-info">
              <div className="reports-stat-label">Avg Leads/Broker</div>
              <div className="reports-stat-value">{averageLeadsPerBroker}</div>
            </div>
          </div>
        </div>

        <div className="reports-table-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <h3 className="reports-table-title" style={{ margin: 0 }}>Broker Performance</h3>
            <button type="button" onClick={handleExportAnalytics} className="reports-export-btn">
              📥 Export CSV
            </button>
          </div>
          <div className="reports-table reports-table-analytics">
            <div className="reports-table-header reports-table-header-analytics">
              <div>Broker Name</div>
              <div>Properties</div>
              <div>Leads</div>
              <div>Conversion Rate</div>
            </div>
            {brokerPerformance.length > 0 ? (
              brokerPerformance.map((broker, idx) => (
                <div key={broker.brokerId} className="reports-table-row">
                  <div>
                    <span className="reports-rank">{idx + 1}</span>
                    {broker.brokerName || 'Unknown'}
                  </div>
                  <div className="reports-number">{broker.properties}</div>
                  <div className="reports-number">{broker.leads}</div>
                  <div className="reports-number">{broker.conversionRate}%</div>
                </div>
              ))
            ) : (
              <div className="reports-empty-row">No data available</div>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="reports-root">
      <div className="reports-header">
        <div>
          <h1 className="reports-title">Reports & Analytics</h1>
          <div className="reports-subtitle">Comprehensive insights into your real estate platform</div>
        </div>
        <div className="reports-date-filter">
          <div className="reports-filterwrap">
            <button
              type="button"
              ref={filterButtonRef}
              className="reports-filter"
              aria-haspopup="menu"
              aria-expanded={filterMenuOpen}
              onClick={() => setFilterMenuOpen((open) => !open)}
            >
              <span>{filter.label}</span>
              <svg className="reports-filter-caret" viewBox="0 0 24 24" width="18" height="18" aria-hidden>
                <path fill="currentColor" d="M7 10l5 5 5-5z" />
              </svg>
            </button>
            {filterMenuOpen && (
              <div className="reports-filtermenu" ref={filterMenuRef} role="menu">
                <div className="reports-filterheader">
                  <div className="reports-filtertitle">Date range</div>
                  <div className="reports-filtersubtitle">Currently showing {filter.label}</div>
                </div>

                <div className="reports-filtergroup">
                  <div className="reports-filterheading">Quick ranges</div>
                  <div className="reports-chiprow">
                    {QUICK_RANGE_OPTIONS.map((option) => (
                      <button
                        type="button"
                        key={option.key}
                        className="reports-filterchip"
                        aria-pressed={filter.key === option.key}
                        onClick={() => handleSelectPreset(option.key)}
                      >
                        {option.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="reports-filtergroup">
                  <div className="reports-filterheading">Month</div>
                  <div className="reports-filterrow reports-filterrow-month">
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

                <div className="reports-filtergroup">
                  <div className="reports-filterheading">Year</div>
                  <div className="reports-filterrow reports-filterrow-year">
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

                <div className="reports-filtergroup">
                  <div className="reports-filterheading">Custom range</div>
                  <div className="reports-filterrow reports-filterrow-dates">
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
                    <div className="reports-filterhelp">{customRangeError}</div>
                  )}
                  <div className="reports-filterrow reports-filterrow-actions">
                    <button type="button" onClick={handleApplyCustom} disabled={!customRangeValid}>Apply</button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="reports-tabs">
        {REPORT_TABS.map((tab) => (
          <button
            key={tab.id}
            type="button"
            className={`reports-tab ${activeTab === tab.id ? 'active' : ''}`}
            onClick={() => setActiveTab(tab.id)}
          >
            <span className="reports-tab-icon">{tab.icon}</span>
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      {loading ? (
        <div className="reports-loading">Loading reports...</div>
      ) : (
        <>
          {activeTab === 'brokers' && renderBrokerReports()}
          {activeTab === 'properties' && renderPropertyReports()}
          {activeTab === 'leads' && renderLeadsReports()}
          {activeTab === 'analytics' && renderAnalytics()}
        </>
      )}
    </div>
  );
}
