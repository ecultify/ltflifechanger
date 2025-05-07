import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import '../styles/pages/LandingPage.css';

// Image paths - using direct relative paths from the public folder
const BG_IMAGE_PATH = '/images/section1/hero-bg.png';
const LOGO_IMAGE_PATH = '/LOGO(3).png';
const CAROUSEL_IMAGE_PATHS = [
  '/Frame15161.png',
  '/Frame15162.png',
  '/Frame15163.png',
  '/Frame15164.png',
];
const SECTION2_BG_IMAGE_PATH = '/images/section2/video-bg.png';
const SECTION3_DESK_IMAGE = '/images/section3/section3deskimage.png';
const GROUP_30A_IMAGE = '/images/section1/Group 30a (1).png';
const FRAME_162422_IMAGE = '/images/section1/Frame 162422.png';
const PROFILE_IMAGES = [
  '/Mask group.png',
  '/Mask group-1.png',
  '/Mask group-2.png',
  '/Mask group-3.png',
  '/Mask group-4.png',
  '/Mask group-5.png',
  '/Mask group-6.png',
  '/Mask group (42).png'
];

const LandingPage = () => {
  const [activeIndex, setActiveIndex] = useState(0);
  const [isMobile, setIsMobile] = useState(false);
  const [profileImageIndex, setProfileImageIndex] = useState(0);

  // Check if device is mobile
  useEffect(() => {
    const checkIfMobile = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    
    checkIfMobile();
    window.addEventListener('resize', checkIfMobile);
    
    return () => {
      window.removeEventListener('resize', checkIfMobile);
    };
  }, []);

  // Carousel navigation handlers
  const nextSlide = React.useCallback(() => {
    setActiveIndex((prev) => (prev === CAROUSEL_IMAGE_PATHS.length - 1 ? 0 : prev + 1));
  }, []);

  // Profile image carousel - automatic rotation
  useEffect(() => {
    const interval = setInterval(() => {
      setProfileImageIndex((prev) => (prev === PROFILE_IMAGES.length - 1 ? 0 : prev + 1));
    }, 3000); // Change image every 3 seconds
    
    return () => clearInterval(interval);
  }, []);

  // Auto-advance carousel
  useEffect(() => {
    const interval = setInterval(() => {
      nextSlide();
    }, 4000);
    
    return () => clearInterval(interval);
  }, [activeIndex, nextSlide]);

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

  // eslint-disable-next-line no-unused-vars
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
            {/* Profile image carousel - left side */}
            <div className="profile-image-container">
              <img 
                src={PROFILE_IMAGES[profileImageIndex]} 
                alt="Profile" 
                className="profile-carousel-image" 
              />
            </div>
          
            <h2 className="hero-subtitle">Get Your</h2>
            
            <div className="neo-highlight poster-text free-personalised">
              Free Personalised
            </div>
            
            <div className="neo-highlight poster-text business-poster">
              Business Poster
            </div>
            
            <Link to="/otp-verification" className="btn-neo poster-btn">
              Make My Poster Now <span>&gt;</span>
            </Link>
          </div>
          
          {!isMobile ? (
            <div className="testimonial-container">
              {/* Group 30a image above the 4th card */}
              <img 
                src={GROUP_30A_IMAGE} 
                alt="Group 30a" 
                className="group-30a-image" 
              />
              
              {cardStyles.map((style, index) => (
                <div key={index} className="testimonial-card" style={style}>
                  <div className="neo-extension"></div>
                </div>
              ))}
            </div>
          ) : (
            <>
              {/* Mobile layout with profile image */}
              <div className="mobile-frame-container">
                <div className="profile-image-container">
                  <img 
                    src={PROFILE_IMAGES[profileImageIndex]} 
                    alt="Profile" 
                    className="profile-carousel-image" 
                  />
                </div>
                
                <img 
                  src={GROUP_30A_IMAGE} 
                  alt="Game Changer" 
                  className="group-30a-image" 
                />
              </div>
              
              {/* Horizontally scrollable carousel */}
              <div className="testimonial-container">
                <div className="testimonial-wrapper">
                  {CAROUSEL_IMAGE_PATHS.map((path, index) => (
                    <div 
                      key={index} 
                      className="testimonial-card" 
                      style={{ backgroundImage: `url(${path})` }}
                    >
                      <div className="neo-extension"></div>
                    </div>
                  ))}
                </div>
              </div>
            </>
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