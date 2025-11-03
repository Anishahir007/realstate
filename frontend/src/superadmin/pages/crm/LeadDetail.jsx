import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import './leadDetail.css';
import { useSuperAdmin } from '../../../context/SuperAdminContext.jsx';

// Calculate lead score based on multiple factors
function calculateLeadScore(lead) {
  let score = 0;
  
  // Contact completeness (0-30 points)
  if (lead.full_name) score += 5;
  if (lead.email) score += 10;
  if (lead.phone) score += 10;
  if (lead.city) score += 5;
  
  // Status scoring (0-30 points)
  const statusScores = {
    'qualified': 30,
    'proposal': 25,
    'contacted': 15,
    'new': 10,
    'closed': 5,
    'lost': 0
  };
  score += statusScores[lead.status?.toLowerCase()] || 10;
  
  // Source scoring (0-20 points)
  const sourceScores = {
    'referral': 20,
    'call': 15,
    'website': 10,
    'social_media': 8
  };
  score += sourceScores[lead.source?.toLowerCase()] || 10;
  
  // Property interest (0-10 points)
  if (lead.property_interest) score += 10;
  
  // Recent activity bonus (0-10 points) - leads from last 24 hours
  if (lead.created_at) {
    const created = new Date(lead.created_at);
    const now = new Date();
    const hoursDiff = (now - created) / (1000 * 60 * 60);
    if (hoursDiff <= 24) score += 10;
    else if (hoursDiff <= 72) score += 5;
  }
  
  return Math.min(100, Math.max(0, score));
}

function labelize(v) {
  if (!v) return '-';
  return String(v).replace(/_/g, ' ').replace(/\b\w/g, (m) => m.toUpperCase());
}

function initials(name) {
  const parts = String(name || '').trim().split(/\s+/).slice(0, 2);
  return parts.map((p) => p[0]?.toUpperCase?.() || '').join('') || 'NA';
}

export default function LeadDetail() {
  const { id, source } = useParams();
  const navigate = useNavigate();
  const { token, apiBase } = useSuperAdmin();
  
  const [loading, setLoading] = React.useState(true);
  const [lead, setLead] = React.useState(null);
  const [error, setError] = React.useState('');

  React.useEffect(() => {
    async function loadLead() {
      if (!token) return;
      setLoading(true);
      setError('');
      try {
        const headers = { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' };
        let response;
        
        if (source === 'broker') {
          // Fetch from all sources and find the broker lead
          response = await axios.get(`${apiBase}/api/leads/admin/all-sources`, { headers });
          const allLeads = Array.isArray(response.data?.data) ? response.data.data : [];
          const found = allLeads.find(l => 
            l.id === Number(id) && l.lead_source_type === 'broker'
          );
          if (found) {
            setLead({ ...found, lead_score: calculateLeadScore(found) });
          } else {
            setError('Lead not found');
          }
        } else {
          // Fetch admin lead
          response = await axios.get(`${apiBase}/api/leads/admin`, { headers });
          const leads = Array.isArray(response.data?.data) ? response.data.data : [];
          const found = leads.find(l => l.id === Number(id));
          if (found) {
            setLead({ ...found, lead_score: calculateLeadScore(found) });
          } else {
            setError('Lead not found');
          }
        }
      } catch (e) {
        setError(e?.response?.data?.message || e?.message || 'Failed to load lead');
      } finally {
        setLoading(false);
      }
    }
    loadLead();
  }, [id, source, token, apiBase]);

  if (loading) {
    return (
      <div className="crm_leaddetail-root">
        <div className="crm_leaddetail-loading">Loading lead details...</div>
      </div>
    );
  }

  if (error || !lead) {
    return (
      <div className="crm_leaddetail-root">
        <div className="crm_leaddetail-error">
          {error || 'Lead not found'}
          <button onClick={() => navigate('/superadmin/crm')} style={{ marginTop: '12px' }}>
            Back to CRM
          </button>
        </div>
      </div>
    );
  }

  const leadScore = lead.lead_score || calculateLeadScore(lead);
  const now = new Date();
  const created = lead.created_at ? new Date(lead.created_at) : now;
  const daysActive = Math.floor((now - created) / (1000 * 60 * 60 * 24));
  
  // Mock data for activities (in real app, fetch from API)
  const activities = [
    { type: 'login', message: `${lead.full_name} logged in`, date: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000), icon: '👤' },
    { type: 'email', message: 'Email address verified successfully', date: new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000), icon: '✓' },
    { type: 'view', message: 'Viewed property listing "Skyline Residency - Tower B, Flat 1203"', date: new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000 + 60 * 60 * 1000), icon: '🏠' },
    { type: 'visit', message: 'Scheduled a site visit for "Skyline Residency"', date: new Date(now.getTime() - 0.5 * 24 * 60 * 60 * 1000), icon: '📅' },
  ];

  // Mock data for notes (in real app, fetch from API)
  const notes = [
    { text: 'Client is very interested in the property. Scheduling property visit for this weekend.', time: '2 hours ago' },
    { text: 'Initial contact made via website form. High engagement potential.', time: '1 day ago' },
    { text: 'Meeting today at 02:00 PM', time: '2 days ago' },
  ];

  // Lead stages
  const stages = ['New Lead', 'Contacted', 'Qualified', 'Consideration', 'Negotiation', 'Won'];
  const currentStageIndex = Math.min(
    stages.findIndex(s => s.toLowerCase().includes((lead.status || 'new').toLowerCase())),
    stages.length - 1
  );

  // Mock hours data
  const weeklyHours = [2, 3, 1, 5, 3, 2, 1];
  const maxHours = Math.max(...weeklyHours);
  
  // Mock source distribution
  const sourceData = [
    { label: 'Website', value: 25 },
    { label: 'WhatsApp', value: 15 },
    { label: 'Social Media', value: 30 },
    { label: 'Referral', value: 10 },
    { label: 'Direct', value: 20 },
  ];

  const formatDate = (date) => {
    if (!date) return '';
    const d = new Date(date);
    const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
    const day = d.getDate();
    const month = months[d.getMonth()];
    const year = d.getFullYear();
    const hours = d.getHours();
    const minutes = d.getMinutes();
    const ampm = hours >= 12 ? 'PM' : 'AM';
    const h12 = hours % 12 || 12;
    const m = minutes.toString().padStart(2, '0');
    return `${day}${getOrdinal(day)} ${month} ${year}, ${h12}:${m} ${ampm}`;
  };

  const getOrdinal = (n) => {
    const s = ['th', 'st', 'nd', 'rd'];
    const v = n % 100;
    return s[(v - 20) % 10] || s[v] || s[0];
  };

  return (
    <div className="crm_leaddetail-root">
      {/* Header */}
      <div className="crm_leaddetail-header">
        <button className="crm_leaddetail-back" onClick={() => navigate('/superadmin/crm')}>
          ← Back
        </button>
        <button className="crm_leaddetail-close" onClick={() => navigate('/superadmin/crm')}>×</button>
        <div className="crm_leaddetail-header-main">
          <div className="crm_leaddetail-avatar-large">
            {initials(lead.full_name)}
          </div>
          <div className="crm_leaddetail-header-info">
            <h1 className="crm_leaddetail-name">{lead.full_name}</h1>
            <div className="crm_leaddetail-contact-info">
              <span>📧 {lead.email}</span>
              <span>📱 {lead.phone || 'N/A'}</span>
              <span>📍 {lead.city ? `${lead.city}` : 'Location not specified'}</span>
            </div>
            <div className="crm_leaddetail-tags">
              <span className={`crm_leaddetail-status-badge status-${(lead.status || 'new').toLowerCase()}`}>
                {labelize(lead.status)}
              </span>
              <span className="crm_leaddetail-priority-badge">High priority</span>
            </div>
          </div>
        </div>
        <div className="crm_leaddetail-metrics-row">
          <div className="crm_leaddetail-metric-card">
            <div className="crm_leaddetail-metric-icon">⭐</div>
            <div className="crm_leaddetail-metric-content">
              <div className="crm_leaddetail-metric-label">Lead Score</div>
              <div className="crm_leaddetail-metric-value">{leadScore}/100</div>
            </div>
          </div>
          <div className="crm_leaddetail-metric-card">
            <div className="crm_leaddetail-metric-icon">👤</div>
            <div className="crm_leaddetail-metric-content">
              <div className="crm_leaddetail-metric-label">Buying Stage</div>
              <div className="crm_leaddetail-metric-value">{labelize(lead.status || 'Inquiry')}</div>
            </div>
          </div>
          <div className="crm_leaddetail-metric-card">
            <div className="crm_leaddetail-metric-icon">📅</div>
            <div className="crm_leaddetail-metric-content">
              <div className="crm_leaddetail-metric-label">Days Active</div>
              <div className="crm_leaddetail-metric-value">{daysActive}</div>
            </div>
          </div>
          <div className="crm_leaddetail-metric-card">
            <div className="crm_leaddetail-metric-icon">💬</div>
            <div className="crm_leaddetail-metric-content">
              <div className="crm_leaddetail-metric-label">Interactions</div>
              <div className="crm_leaddetail-metric-value">{activities.length}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="crm_leaddetail-content">
        {/* Left Column */}
        <div className="crm_leaddetail-left">
          {/* Lead Information */}
          <div className="crm_leaddetail-section">
            <h3 className="crm_leaddetail-section-title">Lead Information</h3>
            <div className="crm_leaddetail-info-grid">
              <div className="crm_leaddetail-info-item">
                <span className="crm_leaddetail-info-icon">👤</span>
                <div>
                  <div className="crm_leaddetail-info-label">Full Name</div>
                  <div className="crm_leaddetail-info-value">{lead.full_name}</div>
                </div>
              </div>
              <div className="crm_leaddetail-info-item">
                <span className="crm_leaddetail-info-icon">📧</span>
                <div>
                  <div className="crm_leaddetail-info-label">Email Address</div>
                  <div className="crm_leaddetail-info-value">{lead.email}</div>
                </div>
              </div>
              <div className="crm_leaddetail-info-item">
                <span className="crm_leaddetail-info-icon">📍</span>
                <div>
                  <div className="crm_leaddetail-info-label">Location</div>
                  <div className="crm_leaddetail-info-value">{lead.city || 'Not specified'}</div>
                </div>
              </div>
              <div className="crm_leaddetail-info-item">
                <span className="crm_leaddetail-info-icon">🌐</span>
                <div>
                  <div className="crm_leaddetail-info-label">Lead Source</div>
                  <div className="crm_leaddetail-info-value">{labelize(lead.source || 'Website')}</div>
                </div>
              </div>
              <div className="crm_leaddetail-info-item">
                <span className="crm_leaddetail-info-icon">🏢</span>
                <div>
                  <div className="crm_leaddetail-info-label">Broker/Agency</div>
                  <div className="crm_leaddetail-info-value">{lead.broker_name || 'Main Website'}</div>
                </div>
              </div>
              <div className="crm_leaddetail-info-item">
                <span className="crm_leaddetail-info-icon">🏠</span>
                <div>
                  <div className="crm_leaddetail-info-label">Property Interest</div>
                  <div className="crm_leaddetail-info-value">{lead.property_interest || 'Not specified'}</div>
                </div>
              </div>
            </div>
          </div>

          {/* Activity Log */}
          <div className="crm_leaddetail-section">
            <h3 className="crm_leaddetail-section-title">Activity log</h3>
            <p className="crm_leaddetail-section-subtitle">Chronological view of all activities</p>
            <div className="crm_leaddetail-activity-list">
              {activities.map((activity, idx) => (
                <div key={idx} className="crm_leaddetail-activity-item">
                  <div className="crm_leaddetail-activity-icon">{activity.icon}</div>
                  <div className="crm_leaddetail-activity-content">
                    <div className="crm_leaddetail-activity-message">{activity.message}</div>
                    <div className="crm_leaddetail-activity-date">{formatDate(activity.date)}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column */}
        <div className="crm_leaddetail-right">
          {/* Lead Stages */}
          <div className="crm_leaddetail-section">
            <h3 className="crm_leaddetail-section-title">Live lead stages</h3>
            <div className="crm_leaddetail-stages-funnel">
              {stages.map((stage, idx) => (
                <div
                  key={idx}
                  className={`crm_leaddetail-stage-item ${idx === currentStageIndex ? 'active' : ''} ${idx < currentStageIndex ? 'completed' : ''}`}
                >
                  {stage}
                </div>
              ))}
            </div>
            <p className="crm_leaddetail-stage-description">
              This lead is in it's {stages[currentStageIndex].toLowerCase()} stage
            </p>
          </div>

          {/* Notes */}
          <div className="crm_leaddetail-section">
            <div className="crm_leaddetail-section-header">
              <h3 className="crm_leaddetail-section-title">Notes</h3>
              <button className="crm_leaddetail-add-note-btn">+ Add Note</button>
            </div>
            <p className="crm_leaddetail-section-subtitle">Internal notes on this lead</p>
            <div className="crm_leaddetail-notes-list">
              {notes.map((note, idx) => (
                <div key={idx} className="crm_leaddetail-note-item">
                  <div className="crm_leaddetail-note-icon">📝</div>
                  <div className="crm_leaddetail-note-content">
                    <div className="crm_leaddetail-note-text">{note.text}</div>
                    <div className="crm_leaddetail-note-time">{note.time}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Charts */}
      <div className="crm_leaddetail-charts">
        <div className="crm_leaddetail-chart-card">
          <h3 className="crm_leaddetail-chart-title">Hours Spent</h3>
          <div className="crm_leaddetail-chart-value">6 Hours 30 minutes</div>
          <div className="crm_leaddetail-chart-subtitle">(average)</div>
          <div className="crm_leaddetail-hours-tabs">
            <button className="crm_leaddetail-tab active">Daily</button>
            <button className="crm_leaddetail-tab">Weekly</button>
          </div>
          <div className="crm_leaddetail-bar-chart">
            {weeklyHours.map((hours, idx) => {
              const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
              const percentage = (hours / maxHours) * 100;
              return (
                <div key={idx} className="crm_leaddetail-bar-item">
                  <div className="crm_leaddetail-bar" style={{ height: `${percentage}%` }} />
                  <div className="crm_leaddetail-bar-label">{days[idx]}</div>
                </div>
              );
            })}
          </div>
          <div className="crm_leaddetail-chart-legend">8 hours from yesterday</div>
        </div>

        <div className="crm_leaddetail-chart-card">
          <h3 className="crm_leaddetail-chart-title">Lead Sources</h3>
          <div className="crm_leaddetail-donut-chart">
            <svg width="200" height="200" viewBox="0 0 200 200">
              {(() => {
                let currentAngle = 0;
                const colors = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];
                return sourceData.map((item, idx) => {
                  const angle = (item.value / 100) * 360;
                  const startAngle = currentAngle;
                  const endAngle = currentAngle + angle;
                  currentAngle = endAngle;
                  
                  const x1 = 100 + 80 * Math.cos((startAngle - 90) * Math.PI / 180);
                  const y1 = 100 + 80 * Math.sin((startAngle - 90) * Math.PI / 180);
                  const x2 = 100 + 80 * Math.cos((endAngle - 90) * Math.PI / 180);
                  const y2 = 100 + 80 * Math.sin((endAngle - 90) * Math.PI / 180);
                  const largeArc = angle > 180 ? 1 : 0;
                  
                  return (
                    <path
                      key={idx}
                      d={`M 100 100 L ${x1} ${y1} A 80 80 0 ${largeArc} 1 ${x2} ${y2} Z`}
                      fill={colors[idx]}
                    />
                  );
                });
              })()}
              <circle cx="100" cy="100" r="50" fill="white" />
            </svg>
          </div>
          <div className="crm_leaddetail-source-legend">
            {sourceData.map((item, idx) => (
              <div key={idx} className="crm_leaddetail-legend-item">
                <div className="crm_leaddetail-legend-color" style={{ background: ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'][idx] }} />
                <span>{item.label}: {item.value}%</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
