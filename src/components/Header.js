import React from 'react';
import '../styles/components/Header.css';

// Image path
const LOGO_IMAGE_PATH = process.env.PUBLIC_URL + '/images/l&tlogo.png';

const Header = () => {
  return (
    <header className="header">
      <div className="container">
        <div className="logo-container">
          <img 
            src={LOGO_IMAGE_PATH} 
            alt="L&T Finance Logo" 
            className="logo" 
          />
        </div>
      </div>
    </header>
  );
};

export default Header; 