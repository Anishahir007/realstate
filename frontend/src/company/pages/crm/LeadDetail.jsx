import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import './leadDetail.css';
import { useCompany } from '../../../context/CompanyContext.jsx';
import { 
  MdEmail, 
  MdPhone, 
  MdLocationOn, 
  MdStar, 
  MdPeople, 
  MdCalendarToday, 
  MdShowChart,
  MdPerson,
  MdCheckCircle,
  MdVisibility,
  MdCalendarMonth,
  MdLink,
  MdHome,
  MdAdd,
  MdStickyNote2,
} from 'react-icons/md';

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
  const { id } = useParams();
  const navigate = useNavigate();
  const { token, apiBase } = useCompany();
  
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
        const response = await axios.get(`${apiBase}/api/leads/company`, { headers });
        const leads = Array.isArray(response.data?.data) ? response.data.data : [];
        const found = leads.find(l => l.id === Number(id));
        if (found) {
          setLead({ ...found, lead_score: calculateLeadScore(found) });
        } else {
          setError('Lead not found');
        }
      } catch (e) {
        setError(e?.response?.data?.message || e?.message || 'Failed to load lead');
      } finally {
        setLoading(false);
      }
    }
    loadLead();
  }, [id, token, apiBase]);

  if (loading) {
    return (
      <div className="companyleaddetail-root">
        <div className="companyleaddetail-loading">Loading lead details...</div>
      </div>
    );
  }

  if (error || !lead) {
    return (
      <div className="companyleaddetail-root">
        <div className="companyleaddetail-error">
          {error || 'Lead not found'}
          <button onClick={() => navigate('/company/crm')} style={{ marginTop: '12px' }}>
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
    { 
      type: 'login', 
      message: `${lead.full_name} logged in on 24th Oct 2025, 10:42 AM`, 
      date: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000), 
      icon: MdPerson,
      color: '#ef4444' 
    },
    { 
      type: 'email', 
      message: 'Email address verified successfully on 25th October 2025', 
      date: new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000), 
      icon: MdCheckCircle,
      color: '#f59e0b'
    },
    { 
      type: 'view', 
      message: 'Viewed property listing "Skyline Residency - Tower B, Flat 1203" on 25th October 2025, 11:37 AM', 
      date: new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000 + 60 * 60 * 1000), 
      icon: MdVisibility,
      color: '#3b82f6'
    },
    { 
      type: 'visit', 
      message: 'Scheduled a site visit for "Skyline Residency" on 27th October 2025, 02:00 PM', 
      date: new Date(now.getTime() - 0.5 * 24 * 60 * 60 * 1000), 
      icon: MdCalendarMonth,
      color: '#f97316'
    },
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

  // Mock hours data - matching image (Mon ~2, Tue ~5, Wed ~6, Thu ~8, Fri ~5, Sat ~3, Sun ~7)
  const weeklyHours = [2, 5, 6, 8, 5, 3, 7];
  const maxHours = Math.max(...weeklyHours);
  const avgHours = 6.5; // 6 hours 30 minutes
  
  // Mock source distribution - matching image
  const sourceData = [
    { label: 'Website', value: 25, color: '#3b82f6' },
    { label: 'WhatsApp', value: 15, color: '#10b981' },
    { label: 'Social Media', value: 20, color: '#8b5cf6' },
    { label: 'Referral', value: 10, color: '#f59e0b' },
    { label: 'Direct', value: 20, color: '#60a5fa' },
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
    <div className="companyleaddetail-root">
      {/* Back Button */}
      <div className="companyleaddetail-top-bar">
        <button className="companyleaddetail-back" onClick={() => navigate('/company/crm')}>
          ← Back
        </button>
      </div>

      {/* Profile and Metrics Section */}
      <div className="companyleaddetail-profile-section">
        {/* Left: Profile Card */}
        <div className="companyleaddetail-profile-card">
          <div className="companyleaddetail-profile-header">
            <div className="companyleaddetail-avatar-profile">
              {initials(lead.full_name)}
            </div>
            <h1 className="companyleaddetail-name-profile">{lead.full_name}</h1>
          </div>
          <div className="companyleaddetail-contact-info-profile">
            <div className="companyleaddetail-contact-item">
              <MdEmail className="companyleaddetail-contact-icon-profile" />
              <span>{lead.email}</span>
            </div>
            <div className="companyleaddetail-contact-item">
              <MdPhone className="companyleaddetail-contact-icon-profile" />
              <span>{lead.phone || 'N/A'}</span>
            </div>
            <div className="companyleaddetail-contact-item">
              <MdLocationOn className="companyleaddetail-contact-icon-profile" />
              <span>{lead.city ? `${lead.city}, Maharashtra` : 'Location not specified'}</span>
            </div>
          </div>
          <div className="companyleaddetail-tags-profile">
            <span className={`companyleaddetail-status-badge-profile status-${(lead.status || 'new').toLowerCase()}`}>
              {labelize(lead.status || 'Qualified')}
            </span>
            <span className="companyleaddetail-priority-badge-profile">
              <span className="companyleaddetail-priority-dot"></span>
              High priority
            </span>
          </div>
        </div>

        {/* Right: Metrics Grid (2x2) */}
        <div className="companyleaddetail-metrics-grid">
          <div className="companyleaddetail-metric-card-profile">
            <div className="companyleaddetail-metric-label-profile">Lead Score</div>
            <div className="companyleaddetail-metric-value-row">
              <div className="companyleaddetail-metric-value-profile">{leadScore}/100</div>
              <div className="companyleaddetail-metric-icon-wrapper-profile" style={{ color: '#f59e0b' }}>
                <MdStar className="companyleaddetail-metric-icon-profile" />
              </div>
            </div>
          </div>
          <div className="companyleaddetail-metric-card-profile">
            <div className="companyleaddetail-metric-label-profile">Buying Stage</div>
            <div className="companyleaddetail-metric-value-row">
              <div className="companyleaddetail-metric-value-profile">{labelize(lead.status || 'Inquiry')}</div>
              <div className="companyleaddetail-metric-icon-wrapper-profile" style={{ color: '#22c55e' }}>
                <MdPeople className="companyleaddetail-metric-icon-profile" />
              </div>
            </div>
          </div>
          <div className="companyleaddetail-metric-card-profile">
            <div className="companyleaddetail-metric-label-profile">Days Active</div>
            <div className="companyleaddetail-metric-value-row">
              <div className="companyleaddetail-metric-value-profile">{daysActive}</div>
              <div className="companyleaddetail-metric-icon-wrapper-profile" style={{ color: '#3b82f6' }}>
                <MdCalendarToday className="companyleaddetail-metric-icon-profile" />
              </div>
            </div>
          </div>
          <div className="companyleaddetail-metric-card-profile">
            <div className="companyleaddetail-metric-label-profile">Interactions</div>
            <div className="companyleaddetail-metric-value-row">
              <div className="companyleaddetail-metric-value-profile">{activities.length}</div>
              <div className="companyleaddetail-metric-icon-wrapper-profile" style={{ color: '#8b5cf6' }}>
                <MdShowChart className="companyleaddetail-metric-icon-profile" />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="companyleaddetail-content">
        {/* Left Column */}
        <div className="companyleaddetail-left">
          {/* Lead Information */}
          <div className="companyleaddetail-section">
            <h3 className="companyleaddetail-section-title">Lead Information</h3>
            <div className="companyleaddetail-info-grid">
              <div className="companyleaddetail-info-item">
                <div className="companyleaddetail-info-icon-wrapper">
                  <MdPerson className="companyleaddetail-info-icon" />
                </div>
                <div>
                  <div className="companyleaddetail-info-label">Full Name</div>
                  <div className="companyleaddetail-info-value">{lead.full_name}</div>
                </div>
              </div>
              <div className="companyleaddetail-info-item">
                <div className="companyleaddetail-info-icon-wrapper">
                  <MdEmail className="companyleaddetail-info-icon" />
                </div>
                <div>
                  <div className="companyleaddetail-info-label">Email Address</div>
                  <div className="companyleaddetail-info-value">{lead.email}</div>
                </div>
              </div>
              <div className="companyleaddetail-info-item">
                <div className="companyleaddetail-info-icon-wrapper">
                  <MdLocationOn className="companyleaddetail-info-icon" />
                </div>
                <div>
                  <div className="companyleaddetail-info-label">Location</div>
                  <div className="companyleaddetail-info-value">{lead.city || 'Not specified'}</div>
                </div>
              </div>
              <div className="companyleaddetail-info-item">
                <div className="companyleaddetail-info-icon-wrapper">
                  <MdLink className="companyleaddetail-info-icon" />
                </div>
                <div>
                  <div className="companyleaddetail-info-label">Lead Source</div>
                  <div className="companyleaddetail-info-value">{labelize(lead.source || 'Website')}</div>
                </div>
              </div>
              <div className="companyleaddetail-info-item">
                <div className="companyleaddetail-info-icon-wrapper">
                  <MdPhone className="companyleaddetail-info-icon" />
                </div>
                <div>
                  <div className="companyleaddetail-info-label">Phone</div>
                  <div className="companyleaddetail-info-value">{lead.phone || 'Not specified'}</div>
                </div>
              </div>
              <div className="companyleaddetail-info-item">
                <div className="companyleaddetail-info-icon-wrapper">
                  <MdHome className="companyleaddetail-info-icon" />
                </div>
                <div>
                  <div className="companyleaddetail-info-label">Property Interest</div>
                  <div className="companyleaddetail-info-value">{lead.property_interest || 'Not specified'}</div>
                </div>
              </div>
            </div>
          </div>

          {/* Activity Log */}
          <div className="companyleaddetail-section">
            <h3 className="companyleaddetail-section-title">Activity log</h3>
            <p className="companyleaddetail-section-subtitle">Chronological view of all activities</p>
            <div className="companyleaddetail-activity-list">
              {activities.map((activity, idx) => {
                const IconComponent = activity.icon;
                return (
                  <div key={idx} className="companyleaddetail-activity-item">
                    <div className="companyleaddetail-activity-timeline">
                      <div className="companyleaddetail-activity-icon-wrapper" style={{ background: activity.color }}>
                        <IconComponent className="companyleaddetail-activity-icon" />
                      </div>
                      {idx < activities.length - 1 && <div className="companyleaddetail-activity-line" />}
                    </div>
                    <div className="companyleaddetail-activity-content">
                      <div className="companyleaddetail-activity-message">{activity.message}</div>
                      <div className="companyleaddetail-activity-date">{formatDate(activity.date)}</div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Hours Spent */}
          <div className="companyleaddetail-section">
            <h3 className="companyleaddetail-section-title">Hours Spent</h3>
            <div className="companyleaddetail-chart-value-small">{Math.floor(avgHours)} Hours {Math.round((avgHours % 1) * 60)} minutes</div>
            <div className="companyleaddetail-chart-subtitle">(average)</div>
            <div className="companyleaddetail-hours-tabs">
              <button className="companyleaddetail-tab active">Daily</button>
              <button className="companyleaddetail-tab">Weekly</button>
            </div>
            <div className="companyleaddetail-bar-chart">
              <div className="companyleaddetail-bar-chart-yaxis">
                {[8, 6, 4, 2, 0].map((val) => (
                  <div key={val} className="companyleaddetail-yaxis-label">{val}</div>
                ))}
              </div>
              <div className="companyleaddetail-bar-chart-bars">
                {weeklyHours.map((hours, idx) => {
                  const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
                  const percentage = (hours / maxHours) * 100;
                  return (
                    <div key={idx} className="companyleaddetail-bar-item">
                      <div className="companyleaddetail-bar" style={{ height: `${percentage}%` }} />
                      <div className="companyleaddetail-bar-label">{days[idx]}</div>
                    </div>
                  );
                })}
              </div>
            </div>
            <div className="companyleaddetail-chart-legend">
              <div className="companyleaddetail-legend-indicator" style={{ background: '#2563eb' }}></div>
              <span>8 hours</span>
              <span className="companyleaddetail-legend-small">+1 hour from yesterday</span>
            </div>
          </div>
        </div>

        {/* Right Column */}
        <div className="companyleaddetail-right">
          {/* Lead Stages */}
          <div className="companyleaddetail-section">
            <h3 className="companyleaddetail-section-title">Live lead stages</h3>
            <div className="companyleaddetail-stages-funnel">
              {stages.map((stage, idx) => {
                // Define colors for each stage matching the image
                const stageColors = [
                  '#2563eb', // New Lead - dark blue
                  '#a78bfa', // Contacted - light purple
                  '#fb923c', // Qualified - light orange
                  '#f472b6', // Consideration - pink
                  '#e9d5ff', // Negotiation - light pink
                  '#86efac'  // Won - light green
                ];
                const isActive = idx === currentStageIndex;
                const isLast = idx === stages.length - 1;
                
                return (
                  <div
                    key={idx}
                    className={`companyleaddetail-stage-item-funnel ${isActive ? 'active' : ''}`}
                    style={{
                      background: isActive ? stageColors[idx] : (idx < currentStageIndex ? stageColors[idx] : '#e2e8f0'),
                      color: isActive || idx < currentStageIndex ? 'white' : '#64748b',
                      width: `${Math.max(30, 100 - (idx * 14))}%`,
                      marginLeft: 'auto',
                      marginRight: 'auto'
                    }}
                  >
                    <div className="companyleaddetail-stage-text">{stage}</div>
                    {isLast && isActive && (
                      <div className="companyleaddetail-stage-subtext">Deal closed</div>
                    )}
                  </div>
                );
              })}
            </div>
            <p className="companyleaddetail-stage-description">
              This lead is in it's {stages[currentStageIndex].toLowerCase()} stage
            </p>
          </div>

          {/* Notes */}
          <div className="companyleaddetail-section">
            <div className="companyleaddetail-section-header">
              <h3 className="companyleaddetail-section-title">Notes</h3>
              <button className="companyleaddetail-add-note-btn">
                <MdAdd style={{ marginRight: '4px', fontSize: '18px' }} />
                Add Note
              </button>
            </div>
            <p className="companyleaddetail-section-subtitle">Internal notes on this lead</p>
            <div className="companyleaddetail-notes-list">
              {notes.map((note, idx) => (
                <div key={idx} className="companyleaddetail-note-item">
                  <div className="companyleaddetail-note-icon-wrapper">
                    <MdStickyNote2 className="companyleaddetail-note-icon" />
                  </div>
                  <div className="companyleaddetail-note-content">
                    <div className="companyleaddetail-note-text">{note.text}</div>
                    <div className="companyleaddetail-note-time">{note.time}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Lead Sources */}
          <div className="companyleaddetail-section">
            <h3 className="companyleaddetail-section-title">Lead Sources</h3>
            <div className="companyleaddetail-donut-wrapper">
              <div className="companyleaddetail-donut-chart">
                <svg width="200" height="200" viewBox="0 0 200 200">
                  {(() => {
                    let currentAngle = 0;
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
                          fill={item.color}
                        />
                      );
                    });
                  })()}
                  <circle cx="100" cy="100" r="50" fill="white" />
                </svg>
              </div>
              <div className="companyleaddetail-source-legend">
                {sourceData.map((item, idx) => (
                  <div key={idx} className="companyleaddetail-legend-item">
                    <div className="companyleaddetail-legend-color" style={{ background: item.color }} />
                    <span>{item.label}: {item.value}%</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

