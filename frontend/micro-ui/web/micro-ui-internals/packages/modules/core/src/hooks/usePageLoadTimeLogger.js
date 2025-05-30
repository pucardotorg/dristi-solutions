import { useEffect, useRef } from 'react';
import { useLocation, useHistory } from 'react-router-dom';
import { trackEvent } from '../lib/gtag';

function usePageLoadTimeLogger() {
  const location = useLocation();
  const history = useHistory();
  const startTimeRef = useRef(null);
  const isFirstRender = useRef(true);
  const prevPathRef = useRef(''); 

  // Set up history listener to capture when navigation starts
  useEffect(() => {
    // This captures the moment a navigation is triggered
    const unlisten = history.listen(() => {
      startTimeRef.current = performance.now();
      console.log(`Navigation started at ${startTimeRef.current}ms`);
    });

    return () => {
      unlisten(); // Clean up listener on unmount
    };
  }, [history]);

  // Measure when the new route is fully loaded
  useEffect(() => {
    // Skip measurement on initial render
    if (isFirstRender.current) {
      isFirstRender.current = false;
      prevPathRef.current = location.pathname;
      
      // For initial page load, use Navigation API
      const reportInitialPageLoad = () => {
        if (performance.getEntriesByType && performance.getEntriesByType("navigation").length > 0) {
          const [navigation] = performance.getEntriesByType("navigation");
          const initialLoadTime = navigation.loadEventEnd - navigation.requestStart;
          console.log(`Initial page load time: ${initialLoadTime.toFixed(2)}ms`);
          
          // Track initial page load
          trackEvent('initial_page_load_time', initialLoadTime.toFixed(2), 
                    location.pathname + location.search, 'performance', true);
        }
      };
      
      setTimeout(reportInitialPageLoad, 0);
      return;
    }

    // Only proceed if we have a start time and the path has actually changed
    if (startTimeRef.current && location.pathname !== prevPathRef.current) {
      const endTime = performance.now();
      const routeLoadTime = endTime - startTimeRef.current;
      
      console.log(`Route change from ${prevPathRef.current} to ${location.pathname} took: ${routeLoadTime.toFixed(2)}ms`);
      
      // Track route load time
      trackEvent('route_load_time', routeLoadTime.toFixed(2), 
                location.pathname + location.search, 'performance', true);
      
      // Update previous path
      prevPathRef.current = location.pathname;
      
      // Reset start time after measurement
      startTimeRef.current = null;
    }
  }, [location]);

  return null; // This hook doesn't render anything
}

export default usePageLoadTimeLogger;
