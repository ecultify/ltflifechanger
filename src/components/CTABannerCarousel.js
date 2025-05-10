import React, { useState, useEffect, useRef } from 'react';

const CTABannerCarousel = ({ banners = [] }) => {
  const [activeIndex, setActiveIndex] = useState(0);
  const carouselRef = useRef(null);
  const timerRef = useRef(null);
  // Add a flag to track user scrolling
  const userScrollingRef = useRef(false);
  const lastScrollTimeRef = useRef(0);
  
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
  
  // Add event listeners to detect user scrolling
  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) return;
    
    const handleScroll = () => {
      // Mark that user is scrolling and set timestamp
      userScrollingRef.current = true;
      lastScrollTimeRef.current = Date.now();
      
      // After 2 seconds, allow auto-scrolling again
      setTimeout(() => {
        if (Date.now() - lastScrollTimeRef.current >= 2000) {
          userScrollingRef.current = false;
        }
      }, 2000);
    };
    
    // Add touch and scroll event listeners
    container.addEventListener('scroll', handleScroll);
    container.addEventListener('touchmove', handleScroll);
    
    // Add manual click handler for mobile view
    const handleClick = (e) => {
      const children = Array.from(container.children);
      const clickedIndex = children.findIndex(child => child.contains(e.target));
      
      if (clickedIndex !== -1) {
        e.preventDefault(); // Prevent default link behavior
        goToSlide(clickedIndex);
        
        // Manually trigger scroll if on mobile
        if (window.innerWidth <= 768) {
          setTimeout(() => {
            if (children[clickedIndex]) {
              children[clickedIndex].scrollIntoView({
                behavior: 'smooth',
                block: 'nearest',
                inline: 'center'
              });
            }
          }, 50);
        }
      }
    };
    
    container.addEventListener('click', handleClick);
    
    return () => {
      container.removeEventListener('scroll', handleScroll);
      container.removeEventListener('touchmove', handleScroll);
      container.removeEventListener('click', handleClick);
    };
  }, []);
  
  // Update scroll position when active index changes with modified behavior for mobile
  useEffect(() => {
    // Check if we're on mobile
    const isMobile = window.innerWidth <= 768;
    
    // For mobile, use a more reliable scrolling method
    if (isMobile) {
      if (scrollContainerRef.current && displayBanners.length > 0) {
        // Allow some time for the DOM to update
        setTimeout(() => {
          const container = scrollContainerRef.current;
          if (!container) return;
          
          const children = Array.from(container.children);
          const activeChild = children[activeIndex];
          
          if (activeChild && !userScrollingRef.current) {
            // Calculate scroll position to center the active item
            const containerWidth = container.offsetWidth;
            const activeChildWidth = activeChild.offsetWidth;
            const activeChildLeft = activeChild.offsetLeft;
            const scrollLeft = activeChildLeft - (containerWidth - activeChildWidth) / 2;
            
            // Use scrollTo instead of scrollIntoView for more control
            container.scrollTo({
              left: scrollLeft,
              behavior: 'smooth'
            });
          }
        }, 50);
      }
      return;
    }
    
    // Desktop behavior remains the same
    if (scrollContainerRef.current && displayBanners.length > 0) {
      const container = scrollContainerRef.current;
      const children = Array.from(container.children);
      
      // Only scroll into view if user isn't currently scrolling
      if (children[activeIndex] && !userScrollingRef.current) {
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
            onClick={(e) => {
              // For mobile view, prevent default and handle manually
              if (window.innerWidth <= 768) {
                e.preventDefault();
                goToSlide(index);
              }
            }}
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