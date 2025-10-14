import React, { useEffect, useRef, useState } from 'react';
import './header.css';
import { useBroker } from '../../../context/BrokerContext.jsx';
import { useNavigate } from 'react-router-dom';
import { FiSearch, FiChevronDown } from 'react-icons/fi';

const BrokerPanelHeader = () => {
  const broker = useBroker();
  const displayName = broker?.name;
  const displayEmail = broker?.email;
  const navigate = useNavigate();

  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuRef = useRef(null);

  function toggleMenu() { setIsMenuOpen((v) => !v); }

  useEffect(() => {
    function onDocClick(e) {
      if (!menuRef.current) return;
      if (!menuRef.current.contains(e.target)) setIsMenuOpen(false);
    }
    document.addEventListener('click', onDocClick);
    return () => document.removeEventListener('click', onDocClick);
  }, []);

  return (
    <header className="brokerpanelheader-header">
      <div className="brokerpanelheader-left">
        <div className="brokerpanelheader-search" role="search">
          <FiSearch className="brokerpanelheader-search-icon" />
          <input className="brokerpanelheader-search-input" placeholder="Search..." />
        </div>
      </div>
      <div className="brokerpanelheader-right">
        <div className="brokerpanelheader-profile" onClick={toggleMenu} ref={menuRef}>
          {(() => {
            const p = broker?.photo;
            if (!p) return null;
            const isHttp = p.startsWith('http://') || p.startsWith('https://');
            const src = isHttp ? p : `${broker.apiBase}${p.startsWith('/') ? p : `/${p}`}`;
            return <img src={src} alt="Avatar" className="brokerpanelheader-avatar" />;
          })()}
          <div className="brokerpanelheader-profile-text">
            <div className="brokerpanelheader-name">{displayName}</div>
            <div className="brokerpanelheader-email">{displayEmail}</div>
          </div>
          <FiChevronDown className="brokerpanelheader-caret" />

          {isMenuOpen && (
            <div className="brokerpanelheader-menu" role="menu">
              <button
                className="brokerpanelheader-menu-item"
                onClick={() => {
                  setIsMenuOpen(false);
                  navigate('/broker/settings/view-profile');
                }}
              >
                View Profile
              </button>
              <button
                className="brokerpanelheader-menu-item"
                onClick={() => {
                  try { broker?.logout?.(); } catch {}
                  setIsMenuOpen(false);
                  navigate('/auth', { replace: true });
                }}
              >
                Logout
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default BrokerPanelHeader;


