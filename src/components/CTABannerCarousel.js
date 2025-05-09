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
  
  // Ref for scrollable container to implement auto-scrolling
  const scrollContainerRef = useRef(null);
  
  // Update scroll position when active index changes
  useEffect(() => {
    if (scrollContainerRef.current && displayBanners.length > 0) {
      const container = scrollContainerRef.current;
      const children = Array.from(container.children);
      
      if (children[activeIndex]) {
        // Scroll the active banner into view smoothly
        children[activeIndex].scrollIntoView({
          behavior: 'smooth',
          block: 'nearest',
          inline: 'center'
        });
      }
    }
  }, [activeIndex, displayBanners.length]);
  
  return (
    <div className="cta-carousel" ref={carouselRef}>
      {/* Simple scrollable image container with auto-scrolling */}
      <div className="simple-scroll-container" ref={scrollContainerRef}>
        {displayBanners.map((banner, index) => (
          <a 
            key={banner.id || index}
            href="https://ltfbusinessloans.ltfinance.com/?utm_source=PosterWebsite&utm_medium=Apply+now&utm_campaign=Poster+Website"
            target="_blank"
            rel="noopener noreferrer"
            className={index === activeIndex ? 'active-image' : ''}
          >
            <img 
              src={`/images/cta/${banner.name}`} 
              alt={`CTA Banner ${index + 1}`} 
              draggable="false"
            />
          </a>
        ))}
      </div>
    </div>
  );
};

export default CTABannerCarousel;