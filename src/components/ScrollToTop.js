import { useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';

// This component will automatically scroll to top when route changes
function ScrollToTop() {
  const { pathname } = useLocation();
  const prevPathRef = useRef(pathname);

  useEffect(() => {
    // Skip ScrollToTop behavior on the SharePoster page to avoid disrupting user experience
    if (pathname.includes('/share-poster') || pathname.includes('/SharePoster')) {
      console.log('Skipping automatic scroll to top on SharePoster page');
      return;
    }
    
    // Skip ScrollToTop if the path hasn't changed (same page)
    if (prevPathRef.current === pathname) {
      console.log('Skipping automatic scroll since we are on the same page');
      return;
    }
    
    // Update the previous path reference
    prevPathRef.current = pathname;
    
    // Force scroll to top with multiple methods when pathname changes
    const scrollToTop = () => {
      // Reset both body and documentElement scroll positions - do this first
      document.body.scrollTop = 0;
      document.documentElement.scrollTop = 0;
      
      // Method 1: Standard scrollTo with immediate effect
      window.scrollTo(0, 0);
      
      // Method 2: scrollTo with auto behavior to avoid smooth scroll conflicts
      window.scrollTo({
        top: 0,
        left: 0,
        behavior: 'auto'
      });
    };
    
    // Execute immediately
    scrollToTop();
    
    // Also execute after a sequence of delays to ensure it works in all browser conditions
    // and after any dynamic content is loaded
    setTimeout(scrollToTop, 0);
    setTimeout(scrollToTop, 100);
    
    // Create a MutationObserver to detect when content changes might affect scroll position
    const observer = new MutationObserver((mutations) => {
      // Only observe for a brief period, then disconnect to avoid unnecessary scrolling
      setTimeout(() => {
        observer.disconnect();
      }, 500);
      
      // When mutations happen, scroll to top again
      scrollToTop();
    });
    
    // Start observing the document with the configured parameters
    observer.observe(document.body, { 
      childList: true, // observe direct children
      subtree: true // and lower descendants too
    });
    
    // Clean up the observer when component unmounts or route changes
    return () => observer.disconnect();
  }, [pathname]);

  return null; // This component doesn't render anything
}

export default ScrollToTop;
