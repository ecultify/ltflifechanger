import React, { useRef, useEffect } from 'react';

const CTABannerCarousel = ({ banners = [] }) => {
  const scrollContainerRef = useRef(null);
  // Create a ref to store the interval and allow updates in event handlers
  const scrollIntervalRef = useRef(null);
  
  // Use the actual images from the CTA folder
  const defaultBanners = [
    { id: 'banner1', name: '1copy.png' },
    { id: 'banner2', name: '2copy.png' },
    { id: 'banner3', name: '3copy.png' },
    { id: 'banner4', name: '4copy.png' },
    { id: 'banner5', name: '5copy.png' }
  ];
  
  const displayBanners = banners.length > 0 ? banners : defaultBanners;
  
  // Auto-scroll effect with improved horizontal scrolling
  useEffect(() => {
    const scrollContainer = scrollContainerRef.current;
    if (!scrollContainer) return;
    
    let currentIndex = 0;
    const bannerCount = displayBanners.length;
    
    if (bannerCount <= 1) return; // Don't auto-scroll if there's only one banner
    
    // Get child elements to determine exact scroll positions
    const bannerElements = Array.from(scrollContainer.querySelectorAll('.cta-banner'));
    if (bannerElements.length === 0) return;
    
    // Set up auto-scrolling
    const autoScroll = () => {
      if (!scrollContainer) return;
      
      // Increment index and loop back if needed
      currentIndex = (currentIndex + 1) % bannerCount;
      
      // Calculate the scroll position based on the actual element width
      if (bannerElements[currentIndex]) {
        const offsetLeft = bannerElements[currentIndex].offsetLeft;
        
        // Scroll to the next banner with smooth animation
        scrollContainer.scrollTo({
          left: offsetLeft,
          behavior: 'smooth'
        });
      }
    };
    
    // Initial scroll to ensure first banner is visible
    scrollContainer.scrollTo({
      left: 0,
      behavior: 'auto'
    });
    
    // Start auto-scrolling with interval - 3 seconds to give users time to see content
    scrollIntervalRef.current = setInterval(autoScroll, 3000); // Change banner every 3 seconds
    
    // Also handle manual scrolling - if user scrolls, stop auto-scrolling temporarily
    let scrollTimeout;
    const handleManualScroll = () => {
      // Clear the existing interval when user manually scrolls
      if (scrollIntervalRef.current) {
        clearInterval(scrollIntervalRef.current);
        scrollIntervalRef.current = null;
      }
      
      // After user stops scrolling, resume auto-scrolling after a delay
      clearTimeout(scrollTimeout);
      scrollTimeout = setTimeout(() => {
        // Find the closest banner to determine new currentIndex
        const scrollLeft = scrollContainer.scrollLeft;
        let closestIndex = 0;
        let minDistance = Infinity;
        
        bannerElements.forEach((banner, index) => {
          const distance = Math.abs(banner.offsetLeft - scrollLeft);
          if (distance < minDistance) {
            minDistance = distance;
            closestIndex = index;
          }
        });
        
        currentIndex = closestIndex;
        // Resume auto-scrolling from new position
        scrollIntervalRef.current = setInterval(autoScroll, 3000);
      }, 2000); // Resume auto-scroll after 2 seconds of inactivity
    };
    
    // Add scroll event listener
    scrollContainer.addEventListener('scroll', handleManualScroll);
    
    // Clean up interval and event listener when component unmounts
    return () => {
      if (scrollIntervalRef.current) {
        clearInterval(scrollIntervalRef.current);
      }
      clearTimeout(scrollTimeout);
      scrollContainer.removeEventListener('scroll', handleManualScroll);
    };
  }, [displayBanners.length]);
  
  return (
    <div className="cta-carousel">
      <div className="banners-container" ref={scrollContainerRef}>
        {displayBanners.map((banner, index) => (
          <div className="cta-banner" key={banner.id || index}>
            <a 
              href="https://ltfbusinessloans.ltfinance.com/?utm_source=PosterWebsite&utm_medium=Apply+now&utm_campaign=Poster+Website"
              target="_blank"
              rel="noopener noreferrer"
              title="Apply now for LTF Business Loans"
            >
              <img 
                src={`/images/cta/${banner.name}`} 
                alt={`CTA Banner ${index + 1}`} 
                draggable="false" // Prevent default image dragging
              />
            </a>
          </div>
        ))}
      </div>
      {/* Removed scroll indicator */}
    </div>
  );
};

export default CTABannerCarousel;