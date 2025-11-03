import React from 'react';
import axios from 'axios';
import { FiUser, FiHome, FiAperture, FiCheckCircle } from 'react-icons/fi';
import './dashboard.css';
import { useBroker } from '../../../context/BrokerContext.jsx';

const Dashboard = () => {
  const broker = useBroker();
  const token = broker?.token;
  const apiBase = broker?.apiBase;
  const [totalUsers, setTotalUsers] = React.useState(null);
  const [totalProperties, setTotalProperties] = React.useState(null);
  const [totalLeads, setTotalLeads] = React.useState(null);

  React.useEffect(() => {
    let cancelled = false;
    async function fetchTotals() {
      if (!token || !apiBase) return;
      
      // Fetch total users
      try {
        const res = await axios.get(`${apiBase}/api/broker-users`, {
          params: { page: 1, limit: 1 },
          headers: { Authorization: `Bearer ${token}` },
        });
        const meta = res?.data?.meta;
        if (!cancelled) setTotalUsers(typeof meta?.total === 'number' ? meta.total : 0);
      } catch {
        if (!cancelled) setTotalUsers(0);
      }

      // Fetch dashboard stats (total properties and total leads)
      try {
        const statsRes = await axios.get(`${apiBase}/api/broker/dashboard-stats`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const stats = statsRes?.data?.data;
        if (!cancelled) {
          setTotalProperties(typeof stats?.totalProperties === 'number' ? stats.totalProperties : 0);
          setTotalLeads(typeof stats?.totalLeads === 'number' ? stats.totalLeads : 0);
        }
      } catch {
        if (!cancelled) {
          setTotalProperties(0);
          setTotalLeads(0);
        }
      }
    }
    fetchTotals();
    return () => { cancelled = true; };
  }, [token, apiBase]);

  return (
    <div className="brokerpanelDashboard-container">
      <div className="brokerpanelDashboard-header">
        <h2 className="brokerpanelDashboard-title">Dashboard Overview</h2>
        <button className="brokerpanelDashboard-filterBtn" type="button">
          Filter by date
          <span className="brokerpanelDashboard-caret">▾</span>
        </button>
      </div>

      <div className="brokerpanelDashboard-cards">
        <div className="brokerpanelDashboard-card">
          <div className="brokerpanelDashboard-cardHeader">
            <span className="brokerpanelDashboard-cardIcon brokerpanelDashboard-iconBlue"><FiUser /></span>
            <span className="brokerpanelDashboard-cardTitle">Total Users</span>
          </div>
          <div className="brokerpanelDashboard-cardValue">{totalUsers ?? '—'}</div>
          <div className="brokerpanelDashboard-cardDelta brokerpanelDashboard-up">+12.5% from last month</div>
        </div>

        <div className="brokerpanelDashboard-card">
          <div className="brokerpanelDashboard-cardHeader">
            <span className="brokerpanelDashboard-cardIcon brokerpanelDashboard-iconOrange"><FiHome /></span>
            <span className="brokerpanelDashboard-cardTitle">Total Properties</span>
          </div>
          <div className="brokerpanelDashboard-cardValue">{totalProperties ?? '—'}</div>
          <div className="brokerpanelDashboard-cardDelta brokerpanelDashboard-up">+8.2% from last month</div>
        </div>

        <div className="brokerpanelDashboard-card">
          <div className="brokerpanelDashboard-cardHeader">
            <span className="brokerpanelDashboard-cardIcon brokerpanelDashboard-iconPink"><FiAperture /></span>
            <span className="brokerpanelDashboard-cardTitle">Total Categories</span>
          </div>
          <div className="brokerpanelDashboard-cardValue">892</div>
          <div className="brokerpanelDashboard-cardDelta brokerpanelDashboard-up">+15.3% from last month</div>
        </div>

        <div className="brokerpanelDashboard-card">
          <div className="brokerpanelDashboard-cardHeader">
            <span className="brokerpanelDashboard-cardIcon brokerpanelDashboard-iconGreen"><FiCheckCircle /></span>
            <span className="brokerpanelDashboard-cardTitle">Total Leads</span>
          </div>
          <div className="brokerpanelDashboard-cardValue">{totalLeads ?? '—'}</div>
          <div className="brokerpanelDashboard-cardDelta brokerpanelDashboard-up">+23.1% from last month</div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;