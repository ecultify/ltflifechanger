import React, { useRef } from 'react';

const CTABannerCarousel = ({ banners = [] }) => {
  const scrollContainerRef = useRef(null);
  
  // Use the actual images from the CTA folder
  const defaultBanners = [
    { id: 'banner1', name: '1copy.png' },
    { id: 'banner2', name: '2copy.png' },
    { id: 'banner3', name: '3copy.png' },
    { id: 'banner4', name: '4copy.png' },
    { id: 'banner5', name: '5copy.png' }
  ];
  
  const displayBanners = banners.length > 0 ? banners : defaultBanners;
  
  return (
    <div className="cta-carousel">
      <div className="banners-container" ref={scrollContainerRef}>
        {displayBanners.map((banner, index) => (
          <div className="cta-banner" key={banner.id || index}>
            <img 
              src={`/images/cta/${banner.name}`} 
              alt={`CTA Banner ${index + 1}`} 
              draggable="false" // Prevent default image dragging
            />
          </div>
        ))}
      </div>
      <div className="scroll-indicator">scroll for more</div>
    </div>
  );
};

export default CTABannerCarousel;