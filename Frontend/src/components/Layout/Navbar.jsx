// src/components/Layout/Navbar.jsx
import React from 'react';

const Navbar = () => {
  // Meaningful, self‑explained smart building & maintenance messages
  const tickerText = 
    "🏢 Smart Building Platform – Centralized control for HVAC, lighting, security, and energy • " +
    "🔧 Remote Diagnostics – Real‑time equipment health monitoring from any device • " +
    "📱 Mobile Work Orders – Technicians receive instant alerts and repair instructions • " +
    "🎯 Asset Lifecycle Management – Track maintenance history and plan replacements • "
    
  return (
    <>
      <div className="professional-ticker">
        <div className="ticker-track">
          <div className="ticker-content">
           
            <span className="ticker-message">{tickerText}</span>
            <span className="ticker-message">{tickerText}</span>
            <span className="ticker-message">{tickerText}</span>
          </div>
        </div>
      </div>

      <style>{`
        .professional-ticker {
          background: linear-gradient(135deg, #0a2b3b 0%, #1e4a6e 100%);
          color: #ffffff;
          padding: 14px 0;
          overflow: hidden;
          font-family: 'Inter', 'Segoe UI', system-ui, sans-serif;
          border-bottom: 1px solid rgba(255, 255, 255, 0.2);
          box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
          position: relative;
          z-index: 1030;
        }

        .ticker-track {
          width: 100%;
          overflow: hidden;
          white-space: nowrap;
        }

        .ticker-content {
          display: inline-flex;
          gap: 3rem;  /* Increased gap between message blocks */
          animation: scrollLeftToRight 20s linear infinite;  /* Slower animation */
          will-change: transform;
        }

        .ticker-message {
          display: inline-block;
          font-size: 1rem;
          font-weight: 600;
          letter-spacing: 0.3px;
          text-shadow: 0 1px 2px rgba(0, 0, 0, 0.2);
          white-space: nowrap;
          padding: 0 0.75rem;
        }

        /* Left‑to‑right scrolling animation – slower speed */
        @keyframes scrollLeftToRight {
          0% {
            transform: translateX(17%);
          }
          100% {
            transform: translateX(-16.666%);
          }
        }

        /* Pause on hover for readability */
        .professional-ticker:hover .ticker-content {
          animation-play-state: paused;
        }

        /* Responsive adjustments – slower on mobile too */
        @media (max-width: 768px) {
          .professional-ticker {
            padding: 10px 0;
          }
          .ticker-message {
            font-size: 0.85rem;
          }
          .ticker-content {
            gap: 2.5rem;
            animation-duration: 35s;
          }
        }

        @media (max-width: 576px) {
          .professional-ticker {
            padding: 8px 0;
          }
          .ticker-message {
            font-size: 0.75rem;
            letter-spacing: 0.2px;
          }
          .ticker-content {
            gap: 1.8rem;
            animation-duration: 30s;
          }
        }

        /* Subtle glass shine effect */
        .professional-ticker::after {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background: linear-gradient(90deg, transparent, rgba(255,255,255,0.06), transparent);
          pointer-events: none;
        }
      `}</style>
    </>
  );
};

export default Navbar;