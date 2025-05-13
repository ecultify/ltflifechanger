import React, { useEffect, useState, lazy, Suspense } from 'react';
import { Link } from 'react-router-dom';
import '../styles/pages/LandingPage.css';
import '../styles/pages/MobileResponsiveOverrides.css'; // Added mobile responsive overrides

// Image paths - using direct relative paths from the public folder
const BG_IMAGE_PATH = '/images/section1/hero-bg.png';
const LOGO_IMAGE_PATH = '/images/LOGO.png';
const CAROUSEL_IMAGE_PATHS = [
  '/Landingpage.jpg',
  '/Landingpage-1.jpg',
  '/Landingpage-2.jpg',
  '/Landingpage-3.jpg',
];
const SECTION2_BG_IMAGE_PATH = '/images/section2/video-bg.png';
const SECTION3_BG_IMAGE = '/images/section3/section3bg.jpg';
const SECTION3_MOBILE_BG_IMAGE = '/images/section3/section3bgwithoutimage.jpg';
const SECTION3_DESKTOP_IMAGE = '/images/section3/model-copy.png';
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

// Lazy-loaded components for code splitting
const Section2 = lazy(() => import('../components/home/Section2'));
const Section3 = lazy(() => import('../components/home/Section3'));

// Fallback loader component
const LoadingFallback = () => (
  <div style={{ 
    display: 'flex', 
    justifyContent: 'center', 
    alignItems: 'center', 
    height: '200px',
    width: '100%'
  }}>
    <div style={{ 
      width: '40px', 
      height: '40px', 
      border: '4px solid #f3f3f3', 
      borderTop: '4px solid #0083B5', 
      borderRadius: '50%', 
      animation: 'spin 1s linear infinite' 
    }}></div>
  </div>
);

// Function to preload images
const preloadImage = (src) => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.src = src;
    img.onload = resolve;
    img.onerror = reject;
  });
};

const LandingPage = () => {
  const [activeIndex, setActiveIndex] = useState(0);
  const [isMobile, setIsMobile] = useState(false);
  const [profileImageIndex, setProfileImageIndex] = useState(0);
  const [loanTextIndex, setLoanTextIndex] = useState(0);
  const [imagesLoaded, setImagesLoaded] = useState(false);
  const [criticalImagesLoaded, setCriticalImagesLoaded] = useState(false);
  
  // Loan text carousel content
  const loanTextContent = [
    {
      topLine: "Get loan up to",
      bottomLine: "₹75 Lakh*"
    },
    {
      topLine: "Enjoy interest rates starting at",
      bottomLine: "15%* p.a."
    },
    {
      topLine: "Repay easily over",
      bottomLine: "60 months*"
    },
    {
      topLine: "Track loan status",
      bottomLine: "In Real Time"
    },
    {
      topLine: "Collateral-Free",
      bottomLine: "Loans*"
    }
  ];

  // Preload critical images in parallel
  useEffect(() => {
    const loadCriticalImages = async () => {
      try {
        // Only preload the essential images for first render
        await Promise.all([
          preloadImage(LOGO_IMAGE_PATH),
          preloadImage(BG_IMAGE_PATH),
          preloadImage(PROFILE_IMAGES[0])
        ]);
        setCriticalImagesLoaded(true);
        
        // Preload the rest in the background
        setTimeout(async () => {
          await Promise.all([
            preloadImage(CAROUSEL_IMAGE_PATHS[0]),
            preloadImage(GROUP_30A_IMAGE),
            ...PROFILE_IMAGES.slice(1).map(src => preloadImage(src))
          ]);
          setImagesLoaded(true);
        }, 1000);
      } catch (error) {
        console.error('Failed to preload images:', error);
        // Set loaded anyway to prevent blocking the UI
        setCriticalImagesLoaded(true);
        setImagesLoaded(true);
      }
    };
    
    loadCriticalImages();
  }, []);

  // Check if device is mobile
  useEffect(() => {
    const checkIfMobile = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    
    checkIfMobile();
    
    // Throttle resize event for better performance
    let resizeTimer;
    const handleResize = () => {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(checkIfMobile, 100);
    };
    
    window.addEventListener('resize', handleResize);
    
    return () => {
      window.removeEventListener('resize', handleResize);
      clearTimeout(resizeTimer);
    };
  }, []);

  // Carousel navigation handlers
  const nextSlide = React.useCallback(() => {
    setActiveIndex((prev) => (prev === CAROUSEL_IMAGE_PATHS.length - 1 ? 0 : prev + 1));
  }, []);

  // Profile image carousel - automatic rotation
  useEffect(() => {
    if (!criticalImagesLoaded) return;
    
    const interval = setInterval(() => {
      setProfileImageIndex((prev) => (prev === PROFILE_IMAGES.length - 1 ? 0 : prev + 1));
    }, 3000); // Change image every 3 seconds
    
    return () => clearInterval(interval);
  }, [criticalImagesLoaded]);
  
  // Loan text carousel - automatic rotation
  useEffect(() => {
    if (!criticalImagesLoaded) return;
    
    const interval = setInterval(() => {
      setLoanTextIndex((prev) => (prev === loanTextContent.length - 1 ? 0 : prev + 1));
    }, 4000); // Change text every 4 seconds
    
    return () => clearInterval(interval);
  }, [criticalImagesLoaded]);

  // Auto-advance carousel - only start when critical images are loaded
  useEffect(() => {
    if (!criticalImagesLoaded) return;
    
    const interval = setInterval(() => {
      nextSlide();
    }, 4000);
    
    return () => clearInterval(interval);
  }, [activeIndex, nextSlide, criticalImagesLoaded]);

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

  const goToSlide = React.useCallback((index) => {
    setActiveIndex(index);
  }, []);

  // Use srcSet for responsive images
  const getResponsiveImage = (src, alt, className, style = {}) => (
    <img 
      src={src} 
      alt={alt} 
      className={className}
      loading="lazy" 
      style={style}
    />
  );

  if (!criticalImagesLoaded) {
    return <LoadingFallback />;
  }

  return (
    <div className="landing-page">
      {/* Hero Section */}
      <section className="hero-section" style={heroStyle}>
        <div className="hero-content">
          <Link to="/">
            <img 
              src={LOGO_IMAGE_PATH} 
              alt="Business Loan Game Changer" 
              className="hero-logo" 
              style={{ alignSelf: 'flex-start', marginLeft: '-35px' }}
            />
          </Link>
          
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
            
            <div className="neo-highlight poster-text line-1">
              Free Personalised
            </div>
            
            <div className="neo-highlight poster-text line-2">
              Business Poster
            </div>
            
            <Link to="/otp-verification" className="btn-neo poster-btn" style={{ alignSelf: 'flex-start', marginLeft: '45px' }}>
              <strong>Make My Poster Now</strong> <span>&gt;</span>
            </Link>
          </div>
          
          {!isMobile ? (
            <div className="testimonial-container">
              {/* First three testimonial cards */}
              {cardStyles.slice(0, 3).map((style, index) => (
                <div key={index} className="testimonial-card" style={style}>
                  <div className="neo-extension"></div>
                </div>
              ))}
              
              {/* Fourth card with Group 30a image attached to it */}
              <div className="fourth-card-container">
                {/* Group 30a image positioned relative to the 4th card */}
                <img 
                  src={GROUP_30A_IMAGE} 
                  alt="Group 30a" 
                  className="group-30a-image"
                  loading="lazy"
                />
                
                {/* The fourth testimonial card */}
                <div className="testimonial-card" style={cardStyles[3]}>
                  <div className="neo-extension"></div>
                </div>
              </div>
            </div>
          ) : (
            <>
              {/* Mobile layout with profile image */}
              <div className="mobile-frame-container">
                <div className="profile-image-container">
                  <img 
                    src={PROFILE_IMAGES[profileImageIndex]} 
                    alt="Profile" 
                    className={`profile-carousel-image ${
                      profileImageIndex === 0 ? 'mask-group-base' :
                      profileImageIndex === 4 ? 'mask-group-4' :
                      profileImageIndex === 5 ? 'mask-group-5' : ''
                    }`} 
                  />
                </div>
                
                <img 
                  src={GROUP_30A_IMAGE} 
                  alt="Game Changer" 
                  className="group-30a-image"
                  loading="lazy"
                />
              </div>
              
              {/* Auto-scrolling carousel with one card per view */}
              <div className="testimonial-container">
                {/* Show only the active card */}
                <div 
                  className="testimonial-card active"
                  style={{ backgroundImage: `url(${CAROUSEL_IMAGE_PATHS[activeIndex]})` }}
                >
                  <div className="neo-extension"></div>
                </div>
              </div>
              
              {/* Separate container for dots below the testimonial card */}
              <div className="carousel-dots-container">
                {CAROUSEL_IMAGE_PATHS.map((_, index) => (
                  <div 
                    key={index}
                    className={`carousel-dot ${index === activeIndex ? 'active' : ''}`}
                    onClick={() => goToSlide(index)}
                  />
                ))}
              </div>
            </>
          )}
        </div>
      </section>

      {/* Lazy-loaded sections */}
      <Suspense fallback={<LoadingFallback />}>
        <Section2 style={section2Style} />
      </Suspense>
      
      <Suspense fallback={<LoadingFallback />}>
        <Section3 
          style={{
            ...section3Style,
            backgroundImage: `url(${isMobile ? SECTION3_MOBILE_BG_IMAGE : '/images/section3/section3bg.jpg'})`
          }}
          logoImagePath={LOGO_IMAGE_PATH}
          desktopImagePath={SECTION3_DESKTOP_IMAGE}
          loanTextContent={loanTextContent}
          loanTextIndex={loanTextIndex}
          isMobile={isMobile}
        />
      </Suspense>
    </div>
  );
};

export default LandingPage;