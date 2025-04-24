import React from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/pages/SharePoster.css';

const SharePoster = () => {
  const navigate = useNavigate();

  const handleMakeAnother = () => {
    navigate('/add-details');
  };

  return (
    <div className="share-poster-page">
      <div className="share-poster-content">
        {/* Left side - Empty poster with neo-brutalism design */}
        <div className="poster-container">
          <div className="poster-frame">
            <div className="content-area">
              {/* Container is intentionally left empty */}
            </div>
          </div>
        </div>
        
        {/* Right side - Controls section */}
        <div className="controls-section">
          <h1 className="section-title">Here's Your Gamechanger Moment!</h1>
          <p className="section-subtitle">
            Your poster featuring Jasprit Bumrah is ready to share, print, flex, and go viral.
          </p>
          
          <button className="download-btn">
            <i className="fas fa-download"></i> Download
          </button>
          
          <div className="another-shot">
            <p className="another-shot-text">Wanna give it another shot?</p>
            <button className="make-another-btn" onClick={handleMakeAnother}>
              <i className="fas fa-redo-alt"></i> Make Another One
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SharePoster; 