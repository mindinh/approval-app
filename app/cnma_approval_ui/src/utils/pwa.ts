/**
 * Check if the application is running in standalone mode (installed as a PWA / added to Home Screen).
 */
export function isRunningStandalone(): boolean {
  if (typeof window === "undefined") return false;
  
  const isStandaloneDisplayMode = window.matchMedia("(display-mode: standalone)").matches;
  const isIosStandalone = (window.navigator as any).standalone === true;

  return isStandaloneDisplayMode || isIosStandalone;
}

/**
 * Check if the user agent is iOS (iPhone, iPad, or iPod).
 */
export function isIos(): boolean {
  if (typeof window === "undefined") return false;
  return /iphone|ipad|ipod/i.test(window.navigator.userAgent);
}

/**
 * Check if the user agent is Android.
 */
export function isAndroid(): boolean {
  if (typeof window === "undefined") return false;
  return /android/i.test(window.navigator.userAgent);
}
