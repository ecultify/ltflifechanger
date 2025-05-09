import React, { useState, useEffect, useRef } from 'react';

const CTABannerCarousel = ({ banners = [] }) => {
  const [activeIndex, setActiveIndex] = useState(0);
  const carouselRef = useRef(null);
  const timerRef = useRef(null);
  
  // Use the actual images from the CTA folder
  const defaultBanners = [
    { id: 'banner1', name: '1copy.png' },
    { id: 'banner2', name: '2copy.png' },
    { id: 'banner3', name: '3copy.png' },
    { id: 'banner4', name: '4copy.png' },
    { id: 'banner5', name: '5copy.png' }
  ];
  
  const displayBanners = banners.length > 0 ? banners : defaultBanners;
  
  // Function to rotate to the next banner
  const rotateNext = () => {
    setActiveIndex((prevIndex) => (prevIndex + 1) % displayBanners.length);
  };
  
  // Initialize and handle auto-rotation
  useEffect(() => {
    // Don't auto-rotate if there's only one banner
    if (displayBanners.length <= 1) return;
    
    console.log('CTABannerCarousel: Initializing auto-rotation');
    
    // Clear any existing timer
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }
    
    // Start rotation timer
    timerRef.current = setInterval(() => {
      console.log('CTABannerCarousel: Auto-rotating to next banner');
      rotateNext();
    }, 3000);
    
    // Cleanup on unmount
    return () => {
      console.log('CTABannerCarousel: Cleaning up rotation timer');
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [displayBanners.length]);
  
  // Manual navigation functions
  const goToSlide = (index) => {
    setActiveIndex(index);
    
    // Reset timer after manual navigation
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }
    
    timerRef.current = setInterval(rotateNext, 3000);
  };
  
  return (
    <div className="cta-carousel" ref={carouselRef}>
      <div className="banners-container">
        {displayBanners.map((banner, index) => (
          <div 
            className={`cta-banner ${index === activeIndex ? 'active' : ''}`} 
            key={banner.id || index}
            style={{
              display: index === activeIndex ? 'flex' : 'none',
              opacity: index === activeIndex ? 1 : 0,
              transition: 'opacity 0.5s ease-in-out'
            }}
          >
            <a 
              href="https://ltfbusinessloans.ltfinance.com/?utm_source=PosterWebsite&utm_medium=Apply+now&utm_campaign=Poster+Website"
              target="_blank"
              rel="noopener noreferrer"
              title="Apply now for LTF Business Loans"
            >
              <img 
                src={`/images/cta/${banner.name}`} 
                alt={`CTA Banner ${index + 1}`} 
                draggable="false"
              />
            </a>
          </div>
        ))}
      </div>
      
      {/* Carousel indicators */}
      <div className="carousel-indicators">
        {displayBanners.map((_, index) => (
          <button
            key={index}
            onClick={() => goToSlide(index)}
            className={`indicator ${index === activeIndex ? 'active' : ''}`}
            aria-label={`Go to slide ${index + 1}`}
          />
        ))}
      </div>
    </div>
  );
};

export default CTABannerCarousel;