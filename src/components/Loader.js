import React from 'react';
import '../styles/components/Loader.css';

const Loader = ({ fullScreen = true, message = "Loading..." }) => {
  return (
    <div className={`loader-container ${!fullScreen ? 'loader-inline' : ''}`}>
      <div className="loading-spinner"></div>
      {message && <p className="loading-text">{message}</p>}
    </div>
  );
};

export default Loader;