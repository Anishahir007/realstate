import React, { useEffect, useState } from 'react';
import './dashboard.css';
import { useSuperAdmin } from '../../../context/SuperAdminContext.jsx';
import axios from 'axios';

export default function Dashboard() { 
  const superAdmin = useSuperAdmin();
  const [sys, setSys] = useState({ serverUptimePct: 99.9, dbPerformancePct: 95.5, apiResponseMs: 150, storageUsagePct: 60 });
  const [counts, setCounts] = useState({ totalBrokers: 0 });
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

  // Load total brokers count
  useEffect(() => {
    let cancelled = false;
    async function loadCount() {
      try {
        const { data: json } = await axios.get(`${superAdmin.apiBase}/api/broker/listbroker?limit=1`, {
          headers: { Authorization: `Bearer ${superAdmin.token}` },
        });
        if (!cancelled) setCounts({ totalBrokers: json?.meta?.total ?? 0 });
      } catch {
        if (!cancelled) setCounts({ totalBrokers: 0 });
      }
    }
    if (superAdmin?.token) loadCount();
    return () => { cancelled = true; };
  }, [superAdmin?.token, superAdmin?.apiBase]);
  const data = [
    { m: 'Jan', a: 12000, b: 8000 },
    { m: 'Feb', a: 22000, b: 16000 },
    { m: 'Mar', a: 30000, b: 33000 },
    { m: 'Apr', a: 25000, b: 26000 },
    { m: 'May', a: 40000, b: 50000 }
  ];
  const MAX = 50000;
  const BAR_MAX = 200;

  return (
    <div className="superadmindashboard-root">
      <main className="superadmindashboard-main">
        <div className="superadmindashboard-topbar">
          <h1 className="superadmindashboard-title">Dashboard Overview</h1>
          <button className="superadmindashboard-filter" aria-label="Filter by date">
            <span>Filter by date</span>
            <svg className="superadmindashboard-filter-caret" viewBox="0 0 24 24" width="18" height="18" aria-hidden>
              <path fill="currentColor" d="M7 10l5 5 5-5z" />
            </svg>
          </button>
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
            <div className="superadmindashboard-metric">{(counts.totalBrokers || 0).toLocaleString()}</div>
            <div className="superadmindashboard-delta superadmindashboard-delta-up">+12.5% from last month</div>
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
            <div className="superadmindashboard-metric">3,567</div>
            <div className="superadmindashboard-delta superadmindashboard-delta-up">+8.2% from last month</div>
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
            <div className="superadmindashboard-metric">892</div>
            <div className="superadmindashboard-delta superadmindashboard-delta-up">+15.3% from last month</div>
          </div>

          <div className="superadmindashboard-card">
            <div className="superadmindashboard-card-head">
              <div className="superadmindashboard-icon superadmindashboard-icon-green" aria-hidden>
                {/* Rupee */}
                <svg viewBox="0 0 24 24">
                  <path d="M7 6h10M7 10h8M7 6c0 4 4 4 4 4m0 0c3 0 5 2 5 4s-2 4-5 4H8" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round"/>
                </svg>
              </div>
              <div className="superadmindashboard-card-title">Total Sales</div>
            </div>
            <div className="superadmindashboard-metric superadmindashboard-rupee">₹2,45,600</div>
            <div className="superadmindashboard-delta superadmindashboard-delta-up">+23.1% from last month</div>
          </div>
        </section>

        <section className="superadmindashboard-grid">
          <div className="superadmindashboard-panel">
            <div className="superadmindashboard-panel-head">
              <h2>Sales Trends</h2>
              <span className="superadmindashboard-sub">Monthly sales and broker acquisition</span>
            </div>

            <div className="superadmindashboard-chart" role="img" aria-label="Bar chart of monthly sales">
              <div className="superadmindashboard-ylabels" aria-hidden>
                {[50000, 40000, 30000, 20000, 10000, 0].map((v) => (
                  <span key={v}>{v.toLocaleString()}</span>
                ))}
              </div>

              <div className="superadmindashboard-plot">
                {data.map((d) => (
                  <div key={d.m} className="superadmindashboard-barcol">
                    <div className="superadmindashboard-bars">
                      <div
                        className="superadmindashboard-bar superadmindashboard-bar-a"
                        style={{ height: `${Math.round((d.a / MAX) * BAR_MAX)}px` }}
                        aria-label={`${d.m} series A ${d.a.toLocaleString()}`}
                      />
                      <div
                        className="superadmindashboard-bar superadmindashboard-bar-b"
                        style={{ height: `${Math.round((d.b / MAX) * BAR_MAX)}px` }}
                        aria-label={`${d.m} series B ${d.b.toLocaleString()}`}
                      />
                    </div>
                    <div className="superadmindashboard-barlabel">{d.m}</div>
                  </div>
                ))}
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
      </main>
    </div>
  );
}
