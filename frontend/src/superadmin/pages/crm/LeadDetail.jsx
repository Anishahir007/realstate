import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import './leadDetail.css';
import { useSuperAdmin } from '../../../context/SuperAdminContext.jsx';
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
  MdBusiness,
  MdLink,
  MdHome,
  MdAdd,
  MdStickyNote2,
  MdClose
} from 'react-icons/md';
import {
  labelize,
  buildActivityLog,
  buildSourceBreakdown,
  buildHoursInsight,
  getNotesStorageKey,
  loadStoredNotes,
  saveStoredNotes,
  buildInitialNotes,
  createNoteEntry,
  formatRelativeTime,
  loadTimeTracking,
  recordTimeTracking,
} from '../../../utils/leadInsights.js';

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
  const [notes, setNotes] = React.useState([]);
  const [isNoteModalOpen, setIsNoteModalOpen] = React.useState(false);
  const [noteDraft, setNoteDraft] = React.useState('');
  const [timeTracking, setTimeTracking] = React.useState({ totalMinutes: 0, daily: {} });

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

  const notesStorageKey = React.useMemo(
    () => (lead ? getNotesStorageKey('superadmin', lead.id) : null),
    [lead?.id]
  );

  React.useEffect(() => {
    if (!lead || !notesStorageKey) return;
    const stored = loadStoredNotes(notesStorageKey);
    if (stored.length) {
      setNotes(stored);
      return;
    }
    const initial = buildInitialNotes(lead);
    setNotes(initial);
    if (initial.length) saveStoredNotes(notesStorageKey, initial);
  }, [lead, notesStorageKey]);

  const safeLead = lead || {};
  const leadScore = safeLead.lead_score || calculateLeadScore(safeLead);
  const now = new Date();
  const created = safeLead.created_at ? new Date(safeLead.created_at) : now;
  const daysActive = Math.floor((now - created) / (1000 * 60 * 60 * 24));
  React.useEffect(() => {
    if (!lead?.id) return;
    setTimeTracking(loadTimeTracking('superadmin', lead.id));
  }, [lead?.id]);

  React.useEffect(() => {
    if (typeof window === 'undefined' || typeof document === 'undefined' || !lead?.id) return undefined;

    let sessionStart = Date.now();
    let isActive = document.visibilityState !== 'hidden';

    const commit = () => {
      if (!isActive) return;
      const minutes = (Date.now() - sessionStart) / 60000;
      if (minutes <= 0.01) return;
      const updated = recordTimeTracking('superadmin', lead.id, minutes);
      setTimeTracking(updated);
      sessionStart = Date.now();
    };

    const handleVisibility = () => {
      if (document.visibilityState === 'hidden') {
        commit();
        isActive = false;
      } else {
        sessionStart = Date.now();
        isActive = true;
      }
    };

    const interval = window.setInterval(commit, 60000);
    window.addEventListener('beforeunload', commit);
    document.addEventListener('visibilitychange', handleVisibility);

    return () => {
      commit();
      window.removeEventListener('beforeunload', commit);
      document.removeEventListener('visibilitychange', handleVisibility);
      window.clearInterval(interval);
    };
  }, [lead?.id]);

  const activities = React.useMemo(() => (lead ? buildActivityLog(lead) : []), [lead]);
  const hoursInsight = React.useMemo(
    () => buildHoursInsight(timeTracking),
    [timeTracking]
  );
  const hoursSeries = hoursInsight.series || Array(7).fill(0);
  const hoursMax = Math.max(hoursInsight.peakHours || 0, 1);
  const avgHoursValue = hoursInsight.averageHours || 0;
  const avgHoursWhole = Math.floor(avgHoursValue);
  const avgHoursMinutes = Math.round((avgHoursValue - avgHoursWhole) * 60);
  const sourceData = React.useMemo(() => buildSourceBreakdown(lead), [lead]);
  const primarySourceLabel = sourceData[0]?.label || labelize(safeLead.source || 'website');
  const activityIconMap = React.useMemo(() => ({
    created: { icon: MdPerson, color: '#ef4444' },
    status: { icon: MdCheckCircle, color: '#f59e0b' },
    property: { icon: MdVisibility, color: '#3b82f6' },
    note: { icon: MdCalendarMonth, color: '#f97316' },
    assignment: { icon: MdBusiness, color: '#0ea5e9' },
  }), []);
  const dayLabels = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  const hoursYAxis = React.useMemo(() => {
    const ceilMax = Math.ceil(Math.max(1, hoursMax));
    const step = Math.max(1, Math.ceil(ceilMax / 4));
    const labels = [];
    for (let value = ceilMax; value >= 0; value -= step) {
      labels.push(value);
    }
    if (labels[labels.length - 1] !== 0) labels.push(0);
    return labels;
  }, [hoursMax]);

  // Lead stages
  const stages = ['New Lead', 'Contacted', 'Qualified', 'Consideration', 'Negotiation', 'Won'];
  const normalizedStatus = (safeLead.status || 'new').toString().toLowerCase();
  const matchedStageIndex = stages.findIndex((stage) => stage.toLowerCase().includes(normalizedStatus));
  const currentStageIndex = Math.min(
    matchedStageIndex >= 0 ? matchedStageIndex : 0,
    stages.length - 1
  );

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

  const handleSaveNote = () => {
    if (!noteDraft.trim()) return;
    const entry = createNoteEntry(noteDraft.trim());
    const updated = [entry, ...notes];
    setNotes(updated);
    if (notesStorageKey) saveStoredNotes(notesStorageKey, updated);
    setNoteDraft('');
    setIsNoteModalOpen(false);
  };

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

  return (
    <>
    <div className="crm_leaddetail-root">
      {/* Back Button */}
      <div className="crm_leaddetail-top-bar">
        <button className="crm_leaddetail-back" onClick={() => navigate('/superadmin/crm')}>
          ← Back
        </button>
      </div>

      {/* Profile and Metrics Section */}
      <div className="crm_leaddetail-profile-section">
        {/* Left: Profile Card */}
        <div className="crm_leaddetail-profile-card">
          <div className="crm_leaddetail-profile-header">
            <div className="crm_leaddetail-avatar-profile">
              {initials(lead.full_name)}
            </div>
            <h1 className="crm_leaddetail-name-profile">{lead.full_name}</h1>
          </div>
          <div className="crm_leaddetail-contact-info-profile">
            <div className="crm_leaddetail-contact-item">
              <MdEmail className="crm_leaddetail-contact-icon-profile" />
              <span>{lead.email}</span>
            </div>
            <div className="crm_leaddetail-contact-item">
              <MdPhone className="crm_leaddetail-contact-icon-profile" />
              <span>{lead.phone || 'N/A'}</span>
            </div>
            <div className="crm_leaddetail-contact-item">
              <MdLocationOn className="crm_leaddetail-contact-icon-profile" />
              <span>{lead.city ? `${lead.city}, Maharashtra` : 'Location not specified'}</span>
            </div>
          </div>
          <div className="crm_leaddetail-tags-profile">
            <span className={`crm_leaddetail-status-badge-profile status-${(lead.status || 'new').toLowerCase()}`}>
              {labelize(lead.status || 'Qualified')}
            </span>
            <span className="crm_leaddetail-priority-badge-profile">
              <span className="crm_leaddetail-priority-dot"></span>
              High priority
            </span>
          </div>
        </div>

        {/* Right: Metrics Grid (2x2) */}
        <div className="crm_leaddetail-metrics-grid">
          <div className="crm_leaddetail-metric-card-profile">
            <div className="crm_leaddetail-metric-label-profile">Lead Score</div>
            <div className="crm_leaddetail-metric-value-row">
              <div className="crm_leaddetail-metric-value-profile">{leadScore}/100</div>
              <div className="crm_leaddetail-metric-icon-wrapper-profile" style={{ color: '#f59e0b' }}>
                <MdStar className="crm_leaddetail-metric-icon-profile" />
              </div>
            </div>
          </div>
          <div className="crm_leaddetail-metric-card-profile">
            <div className="crm_leaddetail-metric-label-profile">Buying Stage</div>
            <div className="crm_leaddetail-metric-value-row">
              <div className="crm_leaddetail-metric-value-profile">{labelize(lead.status || 'Inquiry')}</div>
              <div className="crm_leaddetail-metric-icon-wrapper-profile" style={{ color: '#22c55e' }}>
                <MdPeople className="crm_leaddetail-metric-icon-profile" />
              </div>
            </div>
          </div>
          <div className="crm_leaddetail-metric-card-profile">
            <div className="crm_leaddetail-metric-label-profile">Days Active</div>
            <div className="crm_leaddetail-metric-value-row">
              <div className="crm_leaddetail-metric-value-profile">{daysActive}</div>
              <div className="crm_leaddetail-metric-icon-wrapper-profile" style={{ color: '#3b82f6' }}>
                <MdCalendarToday className="crm_leaddetail-metric-icon-profile" />
              </div>
            </div>
          </div>
          <div className="crm_leaddetail-metric-card-profile">
            <div className="crm_leaddetail-metric-label-profile">Interactions</div>
            <div className="crm_leaddetail-metric-value-row">
              <div className="crm_leaddetail-metric-value-profile">{activities.length}</div>
              <div className="crm_leaddetail-metric-icon-wrapper-profile" style={{ color: '#8b5cf6' }}>
                <MdShowChart className="crm_leaddetail-metric-icon-profile" />
              </div>
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
                <div className="crm_leaddetail-info-icon-wrapper">
                  <MdPerson className="crm_leaddetail-info-icon" />
                </div>
                <div>
                  <div className="crm_leaddetail-info-label">Full Name</div>
                  <div className="crm_leaddetail-info-value">{lead.full_name}</div>
                </div>
              </div>
              <div className="crm_leaddetail-info-item">
                <div className="crm_leaddetail-info-icon-wrapper">
                  <MdEmail className="crm_leaddetail-info-icon" />
                </div>
                <div>
                  <div className="crm_leaddetail-info-label">Email Address</div>
                  <div className="crm_leaddetail-info-value">{lead.email}</div>
                </div>
              </div>
              <div className="crm_leaddetail-info-item">
                <div className="crm_leaddetail-info-icon-wrapper">
                  <MdLocationOn className="crm_leaddetail-info-icon" />
                </div>
                <div>
                  <div className="crm_leaddetail-info-label">Location</div>
                  <div className="crm_leaddetail-info-value">{lead.city || 'Not specified'}</div>
                </div>
              </div>
              <div className="crm_leaddetail-info-item">
                <div className="crm_leaddetail-info-icon-wrapper">
                  <MdLink className="crm_leaddetail-info-icon" />
                </div>
                <div>
                  <div className="crm_leaddetail-info-label">Lead Source</div>
                  <div className="crm_leaddetail-info-value">{labelize(lead.source || 'Website')}</div>
                </div>
              </div>
              <div className="crm_leaddetail-info-item">
                <div className="crm_leaddetail-info-icon-wrapper">
                  <MdBusiness className="crm_leaddetail-info-icon" />
                </div>
                <div>
                  <div className="crm_leaddetail-info-label">Broker/Agency</div>
                  <div className="crm_leaddetail-info-value">{lead.broker_name || 'Main Website'}</div>
                </div>
              </div>
              <div className="crm_leaddetail-info-item">
                <div className="crm_leaddetail-info-icon-wrapper">
                  <MdHome className="crm_leaddetail-info-icon" />
                </div>
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
            {activities.length === 0 ? (
              <div className="crm_leaddetail-empty">No activity recorded yet.</div>
            ) : (
              <div className="crm_leaddetail-activity-list">
                {activities.map((activity, idx) => {
                  const iconMeta = activityIconMap[activity.type] || activityIconMap.created;
                  const IconComponent = iconMeta.icon;
                  return (
                    <div key={`${activity.type}-${idx}`} className="crm_leaddetail-activity-item">
                      <div className="crm_leaddetail-activity-timeline">
                        <div className="crm_leaddetail-activity-icon-wrapper" style={{ background: iconMeta.color }}>
                          <IconComponent className="crm_leaddetail-activity-icon" />
                        </div>
                        {idx < activities.length - 1 && <div className="crm_leaddetail-activity-line" />}
                      </div>
                      <div className="crm_leaddetail-activity-content">
                        <div className="crm_leaddetail-activity-message">{activity.description}</div>
                        <div className="crm_leaddetail-activity-date">{formatDate(activity.date)}</div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Hours Spent */}
          <div className="crm_leaddetail-section">
            <h3 className="crm_leaddetail-section-title">Hours Spent</h3>
            <div className="crm_leaddetail-chart-value-small">
              {avgHoursWhole} Hours {avgHoursMinutes} minutes
            </div>
            <div className="crm_leaddetail-chart-subtitle">(average)</div>
            <div className="crm_leaddetail-hours-tabs">
              <button className="crm_leaddetail-tab active">Daily</button>
              <button className="crm_leaddetail-tab" disabled>Weekly</button>
            </div>
            <div className="crm_leaddetail-bar-chart">
              <div className="crm_leaddetail-bar-chart-yaxis">
                {hoursYAxis.map((val) => (
                  <div key={val} className="crm_leaddetail-yaxis-label">{val}</div>
                ))}
              </div>
              <div className="crm_leaddetail-bar-chart-bars">
                {hoursSeries.map((hours, idx) => {
                  const percentage = hoursMax ? (hours / hoursMax) * 100 : 0;
                  return (
                    <div key={idx} className="crm_leaddetail-bar-item">
                      <div className="crm_leaddetail-bar" style={{ height: `${percentage}%` }} />
                      <div className="crm_leaddetail-bar-label">{dayLabels[idx % dayLabels.length]}</div>
                    </div>
                  );
                })}
              </div>
            </div>
            <div className="crm_leaddetail-chart-legend">
              <div className="crm_leaddetail-legend-indicator" style={{ background: '#2563eb' }}></div>
              <span>{hoursMax.toFixed(hoursMax >= 10 ? 0 : 1)} hours peak</span>
              <span className="crm_leaddetail-legend-small">Auto-generated from recent activity</span>
            </div>
          </div>
        </div>

        {/* Right Column */}
        <div className="crm_leaddetail-right">
          {/* Lead Stages */}
          <div className="crm_leaddetail-section">
            <h3 className="crm_leaddetail-section-title">Live lead stages</h3>
            <div className="crm_leaddetail-stages-funnel">
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
                    className={`crm_leaddetail-stage-item-funnel ${isActive ? 'active' : ''}`}
                    style={{
                      background: isActive ? stageColors[idx] : (idx < currentStageIndex ? stageColors[idx] : '#e2e8f0'),
                      color: isActive || idx < currentStageIndex ? 'white' : '#64748b',
                      width: `${Math.max(30, 100 - (idx * 14))}%`,
                      marginLeft: 'auto',
                      marginRight: 'auto'
                    }}
                  >
                    <div className="crm_leaddetail-stage-text">{stage}</div>
                    {isLast && isActive && (
                      <div className="crm_leaddetail-stage-subtext">Deal closed</div>
                    )}
                  </div>
                );
              })}
            </div>
            <p className="crm_leaddetail-stage-description">
              This lead is in it's {stages[currentStageIndex].toLowerCase()} stage
            </p>
          </div>

          {/* Notes */}
          <div className="crm_leaddetail-section">
            <div className="crm_leaddetail-section-header">
              <h3 className="crm_leaddetail-section-title">Notes</h3>
              <button className="crm_leaddetail-add-note-btn" onClick={() => setIsNoteModalOpen(true)}>
                <MdAdd style={{ marginRight: '4px', fontSize: '18px' }} />
                Add Note
              </button>
            </div>
            <p className="crm_leaddetail-section-subtitle">Internal notes on this lead</p>
            {notes.length === 0 ? (
              <div className="crm_leaddetail-empty">No notes yet. Use “Add Note” to capture the next action.</div>
            ) : (
              <div className="crm_leaddetail-notes-list">
                {notes.map((note) => (
                  <div key={note.id} className="crm_leaddetail-note-item">
                    <div className="crm_leaddetail-note-icon-wrapper">
                      <MdStickyNote2 className="crm_leaddetail-note-icon" />
                    </div>
                    <div className="crm_leaddetail-note-content">
                      <div className="crm_leaddetail-note-text">{note.text}</div>
                      <div className="crm_leaddetail-note-time">{formatRelativeTime(note.timestamp)}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Lead Sources */}
          <div className="crm_leaddetail-section">
            <h3 className="crm_leaddetail-section-title">Lead Sources</h3>
            <p className="crm_leaddetail-section-subtitle">Primary source: {primarySourceLabel}</p>
            <div className="crm_leaddetail-donut-wrapper">
              <div className="crm_leaddetail-donut-chart">
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
              <div className="crm_leaddetail-source-legend">
                {sourceData.map((item, idx) => (
                  <div
                    key={idx}
                    className={`crm_leaddetail-legend-item ${item.label === primarySourceLabel ? 'active' : ''}`}
                  >
                    <div className="crm_leaddetail-legend-color" style={{ background: item.color }} />
                    <span>{item.label}: {item.value}%</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

      {isNoteModalOpen && (
        <div className="crm_leaddetail-note-modal">
          <div className="crm_leaddetail-note-modal-content">
            <div className="crm_leaddetail-note-modal-head">
              <h4>Add Note</h4>
              <button
                type="button"
                className="crm_leaddetail-note-modal-close"
                onClick={() => {
                  setIsNoteModalOpen(false);
                  setNoteDraft('');
                }}
              >
                <MdClose />
              </button>
            </div>
            <textarea
              className="crm_leaddetail-note-modal-textarea"
              placeholder="Write an update for this lead..."
              value={noteDraft}
              onChange={(event) => setNoteDraft(event.target.value)}
              rows={4}
            />
            <div className="crm_leaddetail-note-modal-actions">
              <button
                type="button"
                className="btn-light"
                onClick={() => {
                  setIsNoteModalOpen(false);
                  setNoteDraft('');
                }}
              >
                Cancel
              </button>
              <button
                type="button"
                className="btn-dark"
                onClick={handleSaveNote}
                disabled={!noteDraft.trim()}
              >
                Save Note
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
