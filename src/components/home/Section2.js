import React from 'react';
import { Link } from 'react-router-dom';

const Section2 = ({ style }) => {
  return (
    <section className="section-2" style={style}>
      <div className="container">
        <div className="section-2-title-container">
          <h2 className="section-2-title">
            Make Your Poster in 2 Easy Steps
          </h2>
        </div>
        
        <div className="video-container">
          <div className="play-button">
            <div className="play-icon"></div>
          </div>
        </div>
        
        <div className="start-button-container">
          <Link 
            to="/otp-verification" 
            className="btn-neo start-btn" 
            style={{ fontSize: '1.5em', padding: '15px 30px', fontWeight: 'bold' }}
          >
            Start Creating <span>&gt;</span>
          </Link>
        </div>
      </div>
    </section>
  );
};

export default Section2; 