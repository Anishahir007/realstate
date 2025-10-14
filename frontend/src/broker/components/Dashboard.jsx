import React from 'react';
import { useBroker } from '../../context/BrokerContext.jsx';

export default function BrokerDashboard() {
  const broker = useBroker();
  const logout = broker?.logout;
  return (
    <div style={{ padding: 24 }}>
      <h2>Broker Dashboard</h2>
      <p>Logged in as: {broker?.email}</p>
      <p>Broker ID: {broker?.brokerId || '-'}</p>
      <button onClick={logout}>Logout</button>
    </div>
  );
}


