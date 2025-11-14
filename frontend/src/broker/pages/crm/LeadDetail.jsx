import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import './leadDetail.css';
import { useBroker } from '../../../context/BrokerContext.jsx';
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
  MdBusiness,
  MdClose,
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
  const { id } = useParams();
  const navigate = useNavigate();
  const { token, apiBase } = useBroker();
  
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
        const response = await axios.get(`${apiBase}/api/leads/broker`, { headers });
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

  const notesStorageKey = React.useMemo(
    () => (lead ? getNotesStorageKey('broker', lead.id) : null),
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
    setTimeTracking(loadTimeTracking('broker', lead.id));
  }, [lead?.id]);

  React.useEffect(() => {
    if (typeof window === 'undefined' || typeof document === 'undefined' || !lead?.id) return undefined;

    let sessionStart = Date.now();
    let isActive = document.visibilityState !== 'hidden';

    const commit = () => {
      if (!isActive) return;
      const minutes = (Date.now() - sessionStart) / 60000;
      if (minutes <= 0.01) return;
      const updated = recordTimeTracking('broker', lead.id, minutes);
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
  const currentStageIndex = Math.min(
    stages.findIndex(s => s.toLowerCase().includes((safeLead.status || 'new').toLowerCase())),
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
      <div className="brokerleaddetail-root">
        <div className="brokerleaddetail-loading">Loading lead details...</div>
      </div>
    );
  }

  if (error || !lead) {
    return (
      <div className="brokerleaddetail-root">
        <div className="brokerleaddetail-error">
          {error || 'Lead not found'}
          <button onClick={() => navigate('/broker/crm')} style={{ marginTop: '12px' }}>
            Back to CRM
          </button>
        </div>
      </div>
    );
  }

  return (
    <>
    <div className="brokerleaddetail-root">
      {/* Back Button */}
      <div className="brokerleaddetail-top-bar">
        <button className="brokerleaddetail-back" onClick={() => navigate('/broker/crm')}>
          ← Back
        </button>
      </div>

      {/* Profile and Metrics Section */}
      <div className="brokerleaddetail-profile-section">
        {/* Left: Profile Card */}
        <div className="brokerleaddetail-profile-card">
          <div className="brokerleaddetail-profile-header">
            <div className="brokerleaddetail-avatar-profile">
              {initials(lead.full_name)}
            </div>
            <h1 className="brokerleaddetail-name-profile">{lead.full_name}</h1>
          </div>
          <div className="brokerleaddetail-contact-info-profile">
            <div className="brokerleaddetail-contact-item">
              <MdEmail className="brokerleaddetail-contact-icon-profile" />
              <span>{lead.email}</span>
            </div>
            <div className="brokerleaddetail-contact-item">
              <MdPhone className="brokerleaddetail-contact-icon-profile" />
              <span>{lead.phone || 'N/A'}</span>
            </div>
            <div className="brokerleaddetail-contact-item">
              <MdLocationOn className="brokerleaddetail-contact-icon-profile" />
              <span>{lead.city ? `${lead.city}, Maharashtra` : 'Location not specified'}</span>
            </div>
          </div>
          <div className="brokerleaddetail-tags-profile">
            <span className={`brokerleaddetail-status-badge-profile status-${(lead.status || 'new').toLowerCase()}`}>
              {labelize(lead.status || 'Qualified')}
            </span>
            <span className="brokerleaddetail-priority-badge-profile">
              <span className="brokerleaddetail-priority-dot"></span>
              High priority
            </span>
          </div>
        </div>

        {/* Right: Metrics Grid (2x2) */}
        <div className="brokerleaddetail-metrics-grid">
          <div className="brokerleaddetail-metric-card-profile">
            <div className="brokerleaddetail-metric-label-profile">Lead Score</div>
            <div className="brokerleaddetail-metric-value-row">
              <div className="brokerleaddetail-metric-value-profile">{leadScore}/100</div>
              <div className="brokerleaddetail-metric-icon-wrapper-profile" style={{ color: '#f59e0b' }}>
                <MdStar className="brokerleaddetail-metric-icon-profile" />
              </div>
            </div>
          </div>
          <div className="brokerleaddetail-metric-card-profile">
            <div className="brokerleaddetail-metric-label-profile">Buying Stage</div>
            <div className="brokerleaddetail-metric-value-row">
              <div className="brokerleaddetail-metric-value-profile">{labelize(lead.status || 'Inquiry')}</div>
              <div className="brokerleaddetail-metric-icon-wrapper-profile" style={{ color: '#22c55e' }}>
                <MdPeople className="brokerleaddetail-metric-icon-profile" />
              </div>
            </div>
          </div>
          <div className="brokerleaddetail-metric-card-profile">
            <div className="brokerleaddetail-metric-label-profile">Days Active</div>
            <div className="brokerleaddetail-metric-value-row">
              <div className="brokerleaddetail-metric-value-profile">{daysActive}</div>
              <div className="brokerleaddetail-metric-icon-wrapper-profile" style={{ color: '#3b82f6' }}>
                <MdCalendarToday className="brokerleaddetail-metric-icon-profile" />
              </div>
            </div>
          </div>
          <div className="brokerleaddetail-metric-card-profile">
            <div className="brokerleaddetail-metric-label-profile">Interactions</div>
            <div className="brokerleaddetail-metric-value-row">
              <div className="brokerleaddetail-metric-value-profile">{activities.length}</div>
              <div className="brokerleaddetail-metric-icon-wrapper-profile" style={{ color: '#8b5cf6' }}>
                <MdShowChart className="brokerleaddetail-metric-icon-profile" />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="brokerleaddetail-content">
        {/* Left Column */}
        <div className="brokerleaddetail-left">
          {/* Lead Information */}
          <div className="brokerleaddetail-section">
            <h3 className="brokerleaddetail-section-title">Lead Information</h3>
            <div className="brokerleaddetail-info-grid">
              <div className="brokerleaddetail-info-item">
                <div className="brokerleaddetail-info-icon-wrapper">
                  <MdPerson className="brokerleaddetail-info-icon" />
                </div>
                <div>
                  <div className="brokerleaddetail-info-label">Full Name</div>
                  <div className="brokerleaddetail-info-value">{lead.full_name}</div>
                </div>
              </div>
              <div className="brokerleaddetail-info-item">
                <div className="brokerleaddetail-info-icon-wrapper">
                  <MdEmail className="brokerleaddetail-info-icon" />
                </div>
                <div>
                  <div className="brokerleaddetail-info-label">Email Address</div>
                  <div className="brokerleaddetail-info-value">{lead.email}</div>
                </div>
              </div>
              <div className="brokerleaddetail-info-item">
                <div className="brokerleaddetail-info-icon-wrapper">
                  <MdLocationOn className="brokerleaddetail-info-icon" />
                </div>
                <div>
                  <div className="brokerleaddetail-info-label">Location</div>
                  <div className="brokerleaddetail-info-value">{lead.city || 'Not specified'}</div>
                </div>
              </div>
              <div className="brokerleaddetail-info-item">
                <div className="brokerleaddetail-info-icon-wrapper">
                  <MdLink className="brokerleaddetail-info-icon" />
                </div>
                <div>
                  <div className="brokerleaddetail-info-label">Lead Source</div>
                  <div className="brokerleaddetail-info-value">{labelize(lead.source || 'Website')}</div>
                </div>
              </div>
              <div className="brokerleaddetail-info-item">
                <div className="brokerleaddetail-info-icon-wrapper">
                  <MdPhone className="brokerleaddetail-info-icon" />
                </div>
                <div>
                  <div className="brokerleaddetail-info-label">Phone</div>
                  <div className="brokerleaddetail-info-value">{lead.phone || 'Not specified'}</div>
                </div>
              </div>
              <div className="brokerleaddetail-info-item">
                <div className="brokerleaddetail-info-icon-wrapper">
                  <MdHome className="brokerleaddetail-info-icon" />
                </div>
                <div>
                  <div className="brokerleaddetail-info-label">Property Interest</div>
                  <div className="brokerleaddetail-info-value">{lead.property_interest || 'Not specified'}</div>
                </div>
              </div>
            </div>
          </div>

          {/* Activity Log */}
          <div className="brokerleaddetail-section">
            <h3 className="brokerleaddetail-section-title">Activity log</h3>
            <p className="brokerleaddetail-section-subtitle">Chronological view of all activities</p>
            {activities.length === 0 ? (
              <div className="brokerleaddetail-empty">No activity recorded yet.</div>
            ) : (
            <div className="brokerleaddetail-activity-list">
              {activities.map((activity, idx) => {
                  const iconMeta = activityIconMap[activity.type] || activityIconMap.created;
                  const IconComponent = iconMeta.icon;
                return (
                    <div key={`${activity.type}-${idx}`} className="brokerleaddetail-activity-item">
                    <div className="brokerleaddetail-activity-timeline">
                        <div className="brokerleaddetail-activity-icon-wrapper" style={{ background: iconMeta.color }}>
                        <IconComponent className="brokerleaddetail-activity-icon" />
                      </div>
                      {idx < activities.length - 1 && <div className="brokerleaddetail-activity-line" />}
                    </div>
                    <div className="brokerleaddetail-activity-content">
                        <div className="brokerleaddetail-activity-message">{activity.description}</div>
                      <div className="brokerleaddetail-activity-date">{formatDate(activity.date)}</div>
                    </div>
                  </div>
                );
              })}
            </div>
            )}
          </div>

          {/* Hours Spent */}
          <div className="brokerleaddetail-section">
            <h3 className="brokerleaddetail-section-title">Hours Spent</h3>
            <div className="brokerleaddetail-chart-value-small">
              {avgHoursWhole} Hours {avgHoursMinutes} minutes
            </div>
            <div className="brokerleaddetail-chart-subtitle">(average)</div>
            <div className="brokerleaddetail-hours-tabs">
              <button className="brokerleaddetail-tab active">Daily</button>
              <button className="brokerleaddetail-tab" disabled>Weekly</button>
            </div>
            <div className="brokerleaddetail-bar-chart">
              <div className="brokerleaddetail-bar-chart-yaxis">
                {hoursYAxis.map((val) => (
                  <div key={val} className="brokerleaddetail-yaxis-label">{val}</div>
                ))}
              </div>
              <div className="brokerleaddetail-bar-chart-bars">
                {hoursSeries.map((hours, idx) => {
                  const percentage = hoursMax ? (hours / hoursMax) * 100 : 0;
                  return (
                    <div key={idx} className="brokerleaddetail-bar-item">
                      <div className="brokerleaddetail-bar" style={{ height: `${percentage}%` }} />
                      <div className="brokerleaddetail-bar-label">{dayLabels[idx % dayLabels.length]}</div>
                    </div>
                  );
                })}
              </div>
            </div>
            <div className="brokerleaddetail-chart-legend">
              <div className="brokerleaddetail-legend-indicator" style={{ background: '#2563eb' }}></div>
              <span>{hoursMax.toFixed(hoursMax >= 10 ? 0 : 1)} hours peak</span>
              <span className="brokerleaddetail-legend-small">Auto-generated from your recent activity</span>
            </div>
          </div>
        </div>

        {/* Right Column */}
        <div className="brokerleaddetail-right">
          {/* Lead Stages */}
          <div className="brokerleaddetail-section">
            <h3 className="brokerleaddetail-section-title">Live lead stages</h3>
            <div className="brokerleaddetail-stages-funnel">
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
                    className={`brokerleaddetail-stage-item-funnel ${isActive ? 'active' : ''}`}
                    style={{
                      background: isActive ? stageColors[idx] : (idx < currentStageIndex ? stageColors[idx] : '#e2e8f0'),
                      color: isActive || idx < currentStageIndex ? 'white' : '#64748b',
                      width: `${Math.max(30, 100 - (idx * 14))}%`,
                      marginLeft: 'auto',
                      marginRight: 'auto'
                    }}
                  >
                    <div className="brokerleaddetail-stage-text">{stage}</div>
                    {isLast && isActive && (
                      <div className="brokerleaddetail-stage-subtext">Deal closed</div>
                    )}
                  </div>
                );
              })}
            </div>
            <p className="brokerleaddetail-stage-description">
              This lead is in it's {stages[currentStageIndex].toLowerCase()} stage
            </p>
          </div>

          {/* Notes */}
          <div className="brokerleaddetail-section">
            <div className="brokerleaddetail-section-header">
              <h3 className="brokerleaddetail-section-title">Notes</h3>
              <button className="brokerleaddetail-add-note-btn" onClick={() => setIsNoteModalOpen(true)}>
                <MdAdd style={{ marginRight: '4px', fontSize: '18px' }} />
                Add Note
              </button>
            </div>
            <p className="brokerleaddetail-section-subtitle">Internal notes on this lead</p>
            {notes.length === 0 ? (
              <div className="brokerleaddetail-empty">No notes yet. Capture your next action with “Add Note”.</div>
            ) : (
            <div className="brokerleaddetail-notes-list">
                {notes.map((note) => (
                  <div key={note.id} className="brokerleaddetail-note-item">
                  <div className="brokerleaddetail-note-icon-wrapper">
                    <MdStickyNote2 className="brokerleaddetail-note-icon" />
                  </div>
                  <div className="brokerleaddetail-note-content">
                    <div className="brokerleaddetail-note-text">{note.text}</div>
                      <div className="brokerleaddetail-note-time">{formatRelativeTime(note.timestamp)}</div>
                    </div>
                </div>
              ))}
            </div>
            )}
          </div>

          {/* Lead Sources */}
          <div className="brokerleaddetail-section">
            <h3 className="brokerleaddetail-section-title">Lead Sources</h3>
            <p className="brokerleaddetail-section-subtitle">Primary source: {primarySourceLabel}</p>
            <div className="brokerleaddetail-donut-wrapper">
              <div className="brokerleaddetail-donut-chart">
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
              <div className="brokerleaddetail-source-legend">
                {sourceData.map((item, idx) => (
                  <div
                    key={idx}
                    className={`brokerleaddetail-legend-item ${item.label === primarySourceLabel ? 'active' : ''}`}
                  >
                    <div className="brokerleaddetail-legend-color" style={{ background: item.color }} />
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
        <div className="brokerleaddetail-note-modal">
          <div className="brokerleaddetail-note-modal-content">
            <div className="brokerleaddetail-note-modal-head">
              <h4>Add Note</h4>
              <button
                type="button"
                className="brokerleaddetail-note-modal-close"
                onClick={() => {
                  setIsNoteModalOpen(false);
                  setNoteDraft('');
                }}
              >
                <MdClose />
              </button>
            </div>
            <textarea
              className="brokerleaddetail-note-modal-textarea"
              placeholder="Write an update for this lead..."
              value={noteDraft}
              onChange={(event) => setNoteDraft(event.target.value)}
              rows={4}
            />
            <div className="brokerleaddetail-note-modal-actions">
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

