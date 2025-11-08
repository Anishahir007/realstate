import React from 'react';
import { Link } from 'react-router-dom';
import './Footer.css';

const Footer = () => {
  return (
    <footer>
      {/* Decorative Illustrations */}
      <div className="footer-decorative-illustrations">
        {/* Left Side: Mountains with trees and ground */}
        <svg
          className="footer-svg-decoration footer-svg-mountains"
          viewBox="0 0 300 200"
          fill="none"
          stroke="rgba(255, 255, 255, 0.6)"
          strokeWidth="2"
        >
          {/* Mountains */}
          <path d="M0 200 L80 120 L160 140 L240 80 L300 100 L300 200 Z" />
          <path d="M20 200 L100 130 L180 150 L260 90 L280 100" strokeDasharray="5,5" />
          
          {/* Ground line */}
          <line x1="0" y1="200" x2="300" y2="200" strokeDasharray="5,5" />
          
          {/* Pine trees */}
          <path d="M40 200 L50 170 L60 200" />
          <path d="M50 170 L50 150" />
          <path d="M120 200 L130 175 L140 200" />
          <path d="M130 175 L130 160" />
          <path d="M200 200 L210 180 L220 200" />
          <path d="M210 180 L210 165" />
        </svg>

        {/* Clouds above mountains */}
        <svg
          className="footer-svg-decoration footer-svg-cloud-1"
          viewBox="0 0 100 50"
          fill="none"
          stroke="rgba(255, 255, 255, 0.6)"
          strokeWidth="2"
        >
          <ellipse cx="30" cy="25" rx="25" ry="15" />
          <ellipse cx="50" cy="25" rx="20" ry="12" />
          <ellipse cx="70" cy="25" rx="25" ry="15" />
        </svg>

        <svg
          className="footer-svg-decoration footer-svg-cloud-2"
          viewBox="0 0 100 50"
          fill="none"
          stroke="rgba(255, 255, 255, 0.6)"
          strokeWidth="2"
        >
          <ellipse cx="30" cy="25" rx="20" ry="12" />
          <ellipse cx="50" cy="25" rx="18" ry="10" />
          <ellipse cx="70" cy="25" rx="20" ry="12" />
        </svg>

        {/* Right Side: Circular arrow with paper airplane */}
        <svg
          className="footer-svg-decoration footer-svg-circle-arrow"
          viewBox="0 0 150 150"
          fill="none"
          stroke="rgba(255, 255, 255, 0.6)"
          strokeWidth="2"
        >
          {/* Dashed circle */}
          <circle cx="75" cy="75" r="60" strokeDasharray="8,5" />
          
          {/* Paper airplane in center */}
          <path d="M75 75 L95 55 M95 55 L110 50 M95 55 L100 70" strokeWidth="2.5" />
        </svg>

        {/* Cloud above circular arrow */}
        <svg
          className="footer-svg-decoration footer-svg-cloud-3"
          viewBox="0 0 100 50"
          fill="none"
          stroke="rgba(255, 255, 255, 0.6)"
          strokeWidth="2"
        >
          <ellipse cx="30" cy="25" rx="22" ry="13" />
          <ellipse cx="50" cy="25" rx="20" ry="11" />
          <ellipse cx="70" cy="25" rx="22" ry="13" />
        </svg>
      </div>

      <div className="footer-container">
        {/* Main CTA Section */}
        <div className="footer-cta-section">
          <h2 className="footer-heading">
            Get Cratio Sales CRM Software for Your Business
          </h2>

          <Link
            to="/contact"
            className="footer-cta-button"
          >
            Request Demo & Trial
          </Link>
        </div>

        {/* Cityscape Line Art */}
        <div className="footer-cityscape-container">
          <svg
            className="footer-cityscape-svg"
            viewBox="0 0 1300 150"
            fill="none"
            stroke="rgba(255, 255, 255, 0.6)"
            strokeWidth="2"
            preserveAspectRatio="none"
          >
            {/* Cityscape buildings with varying heights */}
            <rect x="0" y="100" width="45" height="50" />
            <line x1="5" y1="100" x2="5" y2="150" />
            <line x1="15" y1="100" x2="15" y2="150" />
            <line x1="25" y1="100" x2="25" y2="150" />
            <line x1="35" y1="100" x2="35" y2="150" />
            
            <rect x="55" y="80" width="40" height="70" />
            <line x1="60" y1="80" x2="60" y2="150" />
            <line x1="70" y1="80" x2="70" y2="150" />
            <line x1="80" y1="80" x2="80" y2="150" />
            <line x1="90" y1="80" x2="90" y2="150" />
            
            <rect x="105" y="90" width="35" height="60" />
            <line x1="110" y1="90" x2="110" y2="150" />
            <line x1="120" y1="90" x2="120" y2="150" />
            <line x1="130" y1="90" x2="130" y2="150" />
            
            {/* Building with clock tower */}
            <rect x="150" y="70" width="50" height="80" />
            <rect x="160" y="40" width="30" height="30" />
            <circle cx="175" cy="55" r="8" />
            <line x1="175" y1="55" x2="182" y2="55" />
            <line x1="175" y1="55" x2="168" y2="55" />
            <line x1="175" y1="55" x2="175" y2="62" />
            <line x1="175" y1="55" x2="175" y2="48" />
            <line x1="160" y1="70" x2="190" y2="70" />
            <line x1="165" y1="70" x2="165" y2="150" />
            <line x1="175" y1="70" x2="175" y2="150" />
            <line x1="185" y1="70" x2="185" y2="150" />
            
            <rect x="210" y="85" width="38" height="65" />
            <line x1="215" y1="85" x2="215" y2="150" />
            <line x1="225" y1="85" x2="225" y2="150" />
            <line x1="235" y1="85" x2="235" y2="150" />
            
            {/* Building with satellite dish */}
            <rect x="258" y="60" width="55" height="90" />
            <ellipse cx="285" cy="60" rx="12" ry="6" />
            <line x1="285" y1="60" x2="285" y2="70" />
            <line x1="265" y1="60" x2="305" y2="60" />
            <line x1="270" y1="60" x2="270" y2="150" />
            <line x1="280" y1="60" x2="280" y2="150" />
            <line x1="290" y1="60" x2="290" y2="150" />
            <line x1="300" y1="60" x2="300" y2="150" />
            
            <rect x="323" y="75" width="32" height="75" />
            <line x1="328" y1="75" x2="328" y2="150" />
            <line x1="338" y1="75" x2="338" y2="150" />
            <line x1="348" y1="75" x2="348" y2="150" />
            
            <rect x="365" y="95" width="40" height="55" />
            <line x1="370" y1="95" x2="370" y2="150" />
            <line x1="380" y1="95" x2="380" y2="150" />
            <line x1="390" y1="95" x2="390" y2="150" />
            
            <rect x="415" y="80" width="42" height="70" />
            <line x1="420" y1="80" x2="420" y2="150" />
            <line x1="430" y1="80" x2="430" y2="150" />
            <line x1="440" y1="80" x2="440" y2="150" />
            <line x1="450" y1="80" x2="450" y2="150" />
            
            <rect x="467" y="90" width="35" height="60" />
            <line x1="472" y1="90" x2="472" y2="150" />
            <line x1="482" y1="90" x2="482" y2="150" />
            <line x1="492" y1="90" x2="492" y2="150" />
            
            <rect x="512" y="65" width="48" height="85" />
            <line x1="517" y1="65" x2="517" y2="150" />
            <line x1="527" y1="65" x2="527" y2="150" />
            <line x1="537" y1="65" x2="537" y2="150" />
            <line x1="547" y1="65" x2="547" y2="150" />
            <line x1="557" y1="65" x2="557" y2="150" />
            
            <rect x="570" y="85" width="30" height="65" />
            <line x1="575" y1="85" x2="575" y2="150" />
            <line x1="585" y1="85" x2="585" y2="150" />
            
            <rect x="610" y="70" width="52" height="80" />
            <line x1="615" y1="70" x2="615" y2="150" />
            <line x1="625" y1="70" x2="625" y2="150" />
            <line x1="635" y1="70" x2="635" y2="150" />
            <line x1="645" y1="70" x2="645" y2="150" />
            <line x1="655" y1="70" x2="655" y2="150" />
            
            <rect x="672" y="95" width="36" height="55" />
            <line x1="677" y1="95" x2="677" y2="150" />
            <line x1="687" y1="95" x2="687" y2="150" />
            <line x1="697" y1="95" x2="697" y2="150" />
            
            <rect x="718" y="75" width="44" height="75" />
            <line x1="723" y1="75" x2="723" y2="150" />
            <line x1="733" y1="75" x2="733" y2="150" />
            <line x1="743" y1="75" x2="743" y2="150" />
            <line x1="753" y1="75" x2="753" y2="150" />
            
            <rect x="772" y="60" width="54" height="90" />
            <line x1="777" y1="60" x2="777" y2="150" />
            <line x1="787" y1="60" x2="787" y2="150" />
            <line x1="797" y1="60" x2="797" y2="150" />
            <line x1="807" y1="60" x2="807" y2="150" />
            <line x1="817" y1="60" x2="817" y2="150" />
            
            <rect x="836" y="85" width="34" height="65" />
            <line x1="841" y1="85" x2="841" y2="150" />
            <line x1="851" y1="85" x2="851" y2="150" />
            <line x1="861" y1="85" x2="861" y2="150" />
            
            <rect x="880" y="50" width="50" height="100" />
            <line x1="885" y1="50" x2="885" y2="150" />
            <line x1="895" y1="50" x2="895" y2="150" />
            <line x1="905" y1="50" x2="905" y2="150" />
            <line x1="915" y1="50" x2="915" y2="150" />
            <line x1="925" y1="50" x2="925" y2="150" />
            
            <rect x="940" y="70" width="33" height="80" />
            <line x1="945" y1="70" x2="945" y2="150" />
            <line x1="955" y1="70" x2="955" y2="150" />
            <line x1="965" y1="70" x2="965" y2="150" />
            
            <rect x="983" y="45" width="50" height="105" />
            <line x1="988" y1="45" x2="988" y2="150" />
            <line x1="998" y1="45" x2="998" y2="150" />
            <line x1="1008" y1="45" x2="1008" y2="150" />
            <line x1="1018" y1="45" x2="1018" y2="150" />
            <line x1="1028" y1="45" x2="1028" y2="150" />
            
            <rect x="1043" y="65" width="30" height="85" />
            <line x1="1048" y1="65" x2="1048" y2="150" />
            <line x1="1058" y1="65" x2="1058" y2="150" />
            <line x1="1068" y1="65" x2="1068" y2="150" />
            
            <rect x="1083" y="55" width="38" height="95" />
            <line x1="1088" y1="55" x2="1088" y2="150" />
            <line x1="1098" y1="55" x2="1098" y2="150" />
            <line x1="1108" y1="55" x2="1108" y2="150" />
            <line x1="1118" y1="55" x2="1118" y2="150" />
            
            <rect x="1131" y="75" width="26" height="75" />
            <line x1="1136" y1="75" x2="1136" y2="150" />
            <line x1="1146" y1="75" x2="1146" y2="150" />
            
            <rect x="1167" y="40" width="54" height="110" />
            <line x1="1172" y1="40" x2="1172" y2="150" />
            <line x1="1182" y1="40" x2="1182" y2="150" />
            <line x1="1192" y1="40" x2="1192" y2="150" />
            <line x1="1202" y1="40" x2="1202" y2="150" />
            <line x1="1212" y1="40" x2="1212" y2="150" />
            
            <rect x="1231" y="60" width="34" height="90" />
            <line x1="1236" y1="60" x2="1236" y2="150" />
            <line x1="1246" y1="60" x2="1246" y2="150" />
            <line x1="1256" y1="60" x2="1256" y2="150" />
            
            <rect x="1275" y="50" width="25" height="100" />
            <line x1="1280" y1="50" x2="1280" y2="150" />
            <line x1="1290" y1="50" x2="1290" y2="150" />
          </svg>
        </div>

        {/* Copyright */}
        <div className="footer-copyright-section">
          <p className="footer-copyright">
            Copyright © 2024. CRATIO CRM. All Rights Reserved.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
