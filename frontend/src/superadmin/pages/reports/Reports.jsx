import React, { useEffect, useState, useMemo } from 'react';
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

const QUICK_RANGES = [
  { key: 'this-month', label: 'This Month' },
  { key: 'this-year', label: 'This Year' },
  { key: 'all', label: 'All Time' },
];

const formatCurrency = (value) => {
  const num = Number(value);
  if (!Number.isFinite(num)) return '₹—';
  if (num >= 10000000) return `₹${(num / 10000000).toFixed(2)}Cr`;
  if (num >= 100000) return `₹${(num / 100000).toFixed(2)}L`;
  return `₹${num.toLocaleString('en-IN')}`;
};

export default function Reports() {
  const { token, apiBase } = useSuperAdmin();
  const [activeTab, setActiveTab] = useState('brokers');
  const [dateRange, setDateRange] = useState('all');
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState(null);

  const headers = useMemo(() => ({ Authorization: token ? `Bearer ${token}` : '' }), [token]);

  useEffect(() => {
    if (!token) return;
    setLoading(true);
    const endpoint = `/api/reports/${activeTab}`;
    const params = { range: dateRange };
    
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
  }, [activeTab, dateRange, apiBase, headers, token]);

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
          <h3 className="reports-table-title">Top Brokers by Properties</h3>
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
          <h3 className="reports-table-title">Top Brokers by Leads</h3>
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
          <h3 className="reports-table-title">Broker Performance</h3>
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
          {QUICK_RANGES.map((range) => (
            <button
              key={range.key}
              type="button"
              className={`reports-range-btn ${dateRange === range.key ? 'active' : ''}`}
              onClick={() => setDateRange(range.key)}
            >
              {range.label}
            </button>
          ))}
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
