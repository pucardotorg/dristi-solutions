const isProd = process.env.NODE_ENV === "production";

/**
 * Robust mobile device detection function
 * @param options - Configuration options
 * @param options.includeTablets - Whether to consider tablets as mobile (default: true)
 * @param options.checkTouch - Whether to include touch capability check (default: true)
 * @param options.maxWidth - Maximum screen width to consider mobile (default: 768)
 * @returns Detection results with detailed information
 */
const isMobileDevice = (options = {}) => {
  const {
    includeTablets = true,
    checkTouch = true,
    maxWidth = 768
  } = options;

  // User Agent patterns for mobile devices
  const mobilePatterns = [
    /android/i,
    /webos/i,
    /iphone/i,
    /ipad/i,
    /ipod/i,
    /blackberry/i,
    /windows phone/i,
    /mobile/i,
    /opera mini/i,
    /iemobile/i
  ];

  // Tablet-specific patterns
  const tabletPatterns = [
    /ipad/i,
    /android(?!.*mobile)/i,
    /tablet/i,
    /kindle/i,
    /silk/i,
    /playbook/i
  ];

  const userAgent = navigator.userAgent || '';
  
  // Check user agent for mobile patterns
  const isMobileUserAgent = mobilePatterns.some(pattern => pattern.test(userAgent));
  
  // Check user agent for tablet patterns
  const isTabletUserAgent = tabletPatterns.some(pattern => pattern.test(userAgent));
  
  // Check screen dimensions
  const screenWidth = window.screen.width;
  const screenHeight = window.screen.height;
  const isSmallScreen = Math.min(screenWidth, screenHeight) <= maxWidth;
  
  // Check viewport dimensions
  const viewportWidth = window.innerWidth || document.documentElement.clientWidth;
  const isSmallViewport = viewportWidth <= maxWidth;
  
  // Check touch capability
  const hasTouch = checkTouch && (
    'ontouchstart' in window ||
    navigator.maxTouchPoints > 0 ||
    navigator.maxTouchPoints > 0
  );
  
  // Check device pixel ratio (high DPI often indicates mobile)
  // Removed unused variable
  
  // Check for mobile-specific APIs
  const hasMobileAPIs = 'orientation' in window || 'DeviceOrientationEvent' in window;
  
  // Check CSS media queries support
  let matchesMediaQuery = false;
  if (window.matchMedia) {
    matchesMediaQuery = window.matchMedia('(max-width: ' + maxWidth + 'px)').matches ||
                       window.matchMedia('(pointer: coarse)').matches ||
                       window.matchMedia('(hover: none)').matches;
  }
  
  // Determine if it's a phone
  const isPhone = isMobileUserAgent && !isTabletUserAgent && (isSmallScreen || isSmallViewport);
  
  // Determine if it's a tablet
  const isTablet = isTabletUserAgent || (hasTouch && !isPhone && (screenWidth > maxWidth || screenHeight > maxWidth));
  
  // Final mobile determination
  let isMobile;
  if (includeTablets) {
    isMobile = isPhone || isTablet;
  } else {
    isMobile = isPhone;
  }
  
  // Fallback detection using multiple indicators
  if (!isMobile && !isTablet) {
    const mobileIndicators = [
      isSmallScreen,
      isSmallViewport,
      hasTouch && hasMobileAPIs,
      matchesMediaQuery
    ].filter(Boolean).length;
    
    // If we have multiple mobile indicators, likely mobile
    isMobile = mobileIndicators >= 2;
  }
  
  // Determine device type
  let deviceType;
  if (isPhone) {
    deviceType = 'phone';
  } else if (isTablet) {
    deviceType = 'tablet';
  } else {
    deviceType = 'desktop';
  }

  return deviceType;
}

// Event tracking
export const trackEvent = (eventName, eventValue, eventCategory, extraParams) => {
  if (isProd) {
  //Only run this in production
    window.gtag('event', eventName, {
      ...(eventValue && { value: eventValue }),
      page_path: window.location.pathname,
      ...(eventCategory && { event_category: eventCategory }),
      ...(extraParams && { ...extraParams }),
      deviceType: isMobileDevice()
    });
  }
};