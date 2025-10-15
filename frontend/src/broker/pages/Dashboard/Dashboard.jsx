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

  React.useEffect(() => {
    let cancelled = false;
    async function fetchTotals() {
      if (!token || !apiBase) return;
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
          <div className="brokerpanelDashboard-cardValue">3,567</div>
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
            <span className="brokerpanelDashboard-cardTitle">Total Sales</span>
          </div>
          <div className="brokerpanelDashboard-cardValue">₹2,45,600</div>
          <div className="brokerpanelDashboard-cardDelta brokerpanelDashboard-up">+23.1% from last month</div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;