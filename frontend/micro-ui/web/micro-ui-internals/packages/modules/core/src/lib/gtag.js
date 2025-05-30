
const isProd = process.env.NODE_ENV === "production";


// Event tracking
export const trackEvent = (eventName, eventValue, url, eventCategory, non_interaction) => {
  //if (isProd) {
    // Only run this in production
    window.gtag('event', eventName, {
      eventValue: eventValue,
      page_path: url,
      ...(eventCategory && { event_category: eventCategory }),
      non_interaction: non_interaction === false || non_interaction === 'false' ? false : true
    });
  //}
};

