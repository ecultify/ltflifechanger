import React, { useEffect, useState } from 'react';
import '../styles/components/Loader.css';

const Loader = ({ fullScreen = true, message = "Loading..." }) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const logoPath = process.env.PUBLIC_URL + '/images/landtfinancelogo.png';
  
  useEffect(() => {
    // Set loader as loaded after a short delay to trigger animations
    const timer = setTimeout(() => {
      setIsLoaded(true);
    }, 100);
    
    return () => clearTimeout(timer);
  }, []);
  
  return (
    <div className={`loader-container ${!fullScreen ? 'loader-inline' : ''}`}>
      <div className={`logo-loader-wrapper ${isLoaded ? 'loaded' : ''}`}>
        {/* Animated outline border */}
        <div className="logo-outline-container">
          <div className="logo-outline top"></div>
          <div className="logo-outline right"></div>
          <div className="logo-outline bottom"></div>
          <div className="logo-outline left"></div>
        </div>
        
        {/* Logo image */}
        <div className="logo-image-container">
          <img 
            src={logoPath} 
            alt="L&T Finance Logo" 
            className="logo-loader"
            onError={(e) => {
              console.error("Error loading logo in loader");
              e.target.src = process.env.PUBLIC_URL + '/images/l&tlogo.png'; // Fallback logo
            }}
          />
        </div>
        
        {/* Pulsing effect */}
        <div className="logo-pulse"></div>
      </div>
      
      {message && <p className="loading-text">{message}</p>}
    </div>
  );
};

export default Loader;