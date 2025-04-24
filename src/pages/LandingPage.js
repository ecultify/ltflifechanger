import React from 'react';
import { Link } from 'react-router-dom';
import '../styles/pages/LandingPage.css';

// Image paths - using direct relative paths from the public folder
const BG_IMAGE_PATH = '/images/section1/hero-bg.png';
const LOGO_IMAGE_PATH = '/images/section1/logo.png';
const CAROUSEL_IMAGE_PATHS = [
  '/images/section1/carousel1.png',
  '/images/section1/carousel2.png',
  '/images/section1/carousel3.png',
  '/images/section1/carousel4.png',
];
const SECTION2_BG_IMAGE_PATH = '/images/section2/video-bg.png';
const SECTION3_DESK_IMAGE = '/images/section3/section3deskimage.png';

const LandingPage = () => {
  const [activeIndex, setActiveIndex] = React.useState(0);
  const [isMobile, setIsMobile] = React.useState(false);

  // Check if device is mobile
  React.useEffect(() => {
    const checkIfMobile = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    
    checkIfMobile();
    window.addEventListener('resize', checkIfMobile);
    
    return () => {
      window.removeEventListener('resize', checkIfMobile);
    };
  }, []);

  // Auto-advance carousel
  React.useEffect(() => {
    const interval = setInterval(() => {
      nextSlide();
    }, 4000);
    
    return () => clearInterval(interval);
  }, [activeIndex]);

  // Create hero section style with background
  const heroStyle = {
    backgroundImage: `url(${BG_IMAGE_PATH})`,
  };

  // Create section2 background style
  const section2Style = {
    backgroundImage: `url(${SECTION2_BG_IMAGE_PATH})`,
  };

  // Create section3 background style
  const section3Style = {
    backgroundImage: `url(${BG_IMAGE_PATH})`,
  };

  // Create carousel image styles
  const cardStyles = CAROUSEL_IMAGE_PATHS.map(path => ({
    backgroundImage: `url(${path})`,
  }));

  // Carousel navigation handlers
  const nextSlide = React.useCallback(() => {
    setActiveIndex((prev) => (prev === CAROUSEL_IMAGE_PATHS.length - 1 ? 0 : prev + 1));
  }, []);

  const prevSlide = React.useCallback(() => {
    setActiveIndex((prev) => (prev === 0 ? CAROUSEL_IMAGE_PATHS.length - 1 : prev - 1));
  }, []);

  const goToSlide = React.useCallback((index) => {
    setActiveIndex(index);
  }, []);

  // Mobile carousel transformation
  const getTransformStyle = () => {
    return {
      transform: `translateX(-${activeIndex * 100}%)`,
    };
  };

  // Get card style for mobile with active state
  const getCardStyle = (index) => {
    const baseStyle = cardStyles[index];
    const isActive = index === activeIndex;
    
    return {
      ...baseStyle,
      transform: isActive ? 'scale(1)' : 'scale(0.9)',
      opacity: isActive ? 1 : 0.5,
    };
  };

  return (
    <div className="landing-page">
      {/* Hero Section */}
      <section className="hero-section" style={heroStyle}>
        <div className="hero-content">
          <img 
            src={LOGO_IMAGE_PATH} 
            alt="Business Loan Game Changer" 
            className="hero-logo" 
          />
          
          <div className="hero-text-container">
            <h2 className="hero-subtitle">Get Your</h2>
            
            <div className="neo-highlight poster-text">
              Free Personalised
            </div>
            
            <div className="neo-highlight poster-text">
              Business Poster
            </div>
            
            <Link to="/otp-verification" className="btn-neo poster-btn">
              Make My Poster Now <span>&gt;</span>
            </Link>
          </div>
          
          {!isMobile ? (
            <div className="testimonial-container">
              {cardStyles.map((style, index) => (
                <div key={index} className="testimonial-card" style={style}>
                  <div className="neo-extension"></div>
                </div>
              ))}
            </div>
          ) : (
            <div className="testimonial-container">
              <div className="testimonial-wrapper" style={getTransformStyle()}>
                {CAROUSEL_IMAGE_PATHS.map((_, index) => (
                  <div key={index} className="testimonial-card" style={getCardStyle(index)}>
                    <div className="neo-extension"></div>
                  </div>
                ))}
              </div>
              
              <div className="carousel-dots">
                {CAROUSEL_IMAGE_PATHS.map((_, index) => (
                  <div 
                    key={index} 
                    className={`carousel-dot ${index === activeIndex ? 'active' : ''}`}
                    onClick={() => goToSlide(index)}
                  ></div>
                ))}
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Section 2 */}
      <section className="section-2" style={section2Style}>
        <div className="container">
          <div className="section-2-title-container">
            <h2 className="section-2-title">Make Your Poster in 2 easy Steps</h2>
          </div>
          
          <div className="video-container">
            <div className="play-button">
              <div className="play-icon"></div>
            </div>
          </div>
          
          <div className="start-button-container">
            <Link to="/otp-verification" className="btn-neo start-btn">
              Start Creating <span>&gt;</span>
            </Link>
          </div>
        </div>
      </section>

      {/* Section 3 */}
      <section className="section-3" style={section3Style}>
        <div className="container">
          <div className="section-3-content">
            <div className="loan-disbursement-container">
              <img src={LOGO_IMAGE_PATH} alt="L&T Finance Logo" className="logo-image" />
              
              <h2 className="loan-title">Get Your Loan Disbursed</h2>
              <h3 className="in-minutes">In Minutes.</h3>
              
              <Link to="/otp-verification" className="btn-neo start-btn">
                Apply Today <span>&gt;</span>
              </Link>
            </div>
          </div>
          <div className="section-3-desk-image">
            <img src={SECTION3_DESK_IMAGE} alt="Desk" />
          </div>
        </div>
      </section>
    </div>
  );
};

export default LandingPage; 