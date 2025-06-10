const isProd = process.env.NODE_ENV === "production";


// Event tracking
export const trackEvent = (eventName, eventValue, url, eventCategory) => {
  if (isProd) {
    //Only run this in production
    window.gtag('event', eventName, {
      page_path: url,
      value: eventValue,
      category: eventCategory
    });
  }
};