import React from 'react';
import '../styles/components/Footer.css';

const Footer = () => {
  return (
    <footer className="footer">
      <div className="container">
        <div className="copyright">
          <span className="company-name">© L&T Finance Limited (formerly known as L&T Finance Holdings Limited) |</span>
          <span className="cin-number">CIN: L67120MH2008PLC181833</span>
        </div>
        <div className="social">
          <p>Connect with us</p>
          <div className="social-icons">
            <a href="https://www.facebook.com/LnTFS" target="_blank" rel="noopener noreferrer" className="social-icon">
              <i className="fab fa-facebook-f"></i>
            </a>
            <a href="https://www.instagram.com/lntfinance/?hl=en" target="_blank" rel="noopener noreferrer" className="social-icon">
              <i className="fab fa-instagram"></i>
            </a>
            <a href="https://x.com/LnTFinance" target="_blank" rel="noopener noreferrer" className="social-icon">
              <i className="fab fa-twitter"></i>
            </a>
            <a href="https://www.youtube.com/@ltfinance" target="_blank" rel="noopener noreferrer" className="social-icon">
              <i className="fab fa-youtube"></i>
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer; 