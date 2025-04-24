import React from 'react';
import { Link } from 'react-router-dom';
import '../styles/components/Header.css';

// Image path
const LOGO_IMAGE_PATH = process.env.PUBLIC_URL + '/images/l&tlogo.png';

const Header = () => {
  return (
    <header className="header">
      <div className="container">
        <div className="logo-container">
          <Link to="/">
            <img 
              src={LOGO_IMAGE_PATH} 
              alt="L&T Finance Logo" 
              className="logo" 
            />
          </Link>
        </div>
      </div>
    </header>
  );
};

export default Header; 