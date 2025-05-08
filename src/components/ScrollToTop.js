import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

// This component will automatically scroll to top when route changes
function ScrollToTop() {
  const { pathname } = useLocation();

  useEffect(() => {
    // Force scroll to top with multiple methods when pathname changes
    const scrollToTop = () => {
      // Method 1: Standard scrollTo
      window.scrollTo(0, 0);
      
      // Method 2: scrollTo with behavior smooth
      window.scrollTo({
        top: 0,
        left: 0,
        behavior: 'auto'
      });
      
      // Method 3: Set both body and documentElement scroll positions
      document.body.scrollTop = 0;
      document.documentElement.scrollTop = 0;
    };
    
    // Execute immediately
    scrollToTop();
    
    // Also execute after a short delay to handle any race conditions
    setTimeout(scrollToTop, 0);
    setTimeout(scrollToTop, 100);
  }, [pathname]);

  return null; // This component doesn't render anything
}

export default ScrollToTop;
