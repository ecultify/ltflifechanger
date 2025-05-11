import React from 'react';
import { Link } from 'react-router-dom';

const Section3 = ({ 
  style, 
  logoImagePath, 
  desktopImagePath, 
  loanTextContent, 
  loanTextIndex, 
  isMobile 
}) => {
  return (
    <section className="section-3" style={style}>
      <div className="container">
        <div className="section-3-content">
          <div className="loan-disbursement-container">
            <Link to="/">
              <img 
                src={logoImagePath} 
                alt="L&T Finance Logo" 
                className="logo-image" 
                style={{ alignSelf: 'flex-start', marginLeft: '-150px' }} 
                loading="lazy"
              />
            </Link>
            
            <div className="loan-text-carousel">
              <h2 
                className="loan-title" 
                key={`title-${loanTextIndex}`}
                style={{ fontWeight: 400 }}
              >
                {loanTextContent[loanTextIndex].topLine}
              </h2>
              <h3 
                className="in-minutes" 
                key={`minutes-${loanTextIndex}`}
                style={{ fontWeight: 700 }}
              >
                {loanTextContent[loanTextIndex].bottomLine}
              </h3>
            </div>
            
            <a 
              href="https://ltfbusinessloans.ltfinance.com/?utm_source=PosterWebsite&utm_medium=Apply+now&utm_campaign=Poster+Website" 
              className="btn-neo start-btn" 
              target="_blank"
              rel="noopener noreferrer"
            >
              Apply Today <span>&gt;</span>
            </a>
          </div>
        </div>
        
        {/* Desktop image is shown in mobile/tablet view at the very bottom */}
        {isMobile && (
          <div className="section-3-desktop-image">
            <img 
              src={desktopImagePath} 
              alt="Desktop" 
              loading="lazy"
            />
          </div>
        )}
      </div>
    </section>
  );
};

export default Section3; 