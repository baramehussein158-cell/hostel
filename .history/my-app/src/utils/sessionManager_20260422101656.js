/**
 * Session Manager - Handles session creation, timeout, and cleanup
 */

const SESSION_TIMEOUT = 30 * 60 * 1000; // 30 minutes in milliseconds
const SESSION_STORAGE_KEY = 'app_session_data';
const LOGIN_SESSION_KEY = 'campusStay.session';

let sessionTimeout;
let lastActivityTime = Date.now();

export const sessionManager = {
  // Initialize session and set up event listeners
  initSession: () => {
    lastActivityTime = Date.now();
    sessionStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify({
      startedAt: new Date().toISOString(),
      lastActivityAt: new Date().toISOString(),
    }));
    
    // Track user activity
    const activityEvents = ['mousedown', 'keydown', 'scroll', 'touchstart', 'click'];
    activityEvents.forEach(event => {
      document.addEventListener(event, sessionManager.updateActivity, true);
    });

    // Set up window unload listener for cleanup
    window.addEventListener('beforeunload', sessionManager.endSession);
  },

  // Update last activity time
  updateActivity: () => {
    lastActivityTime = Date.now();
    const sessionData = sessionStorage.getItem(SESSION_STORAGE_KEY);
    if (sessionData) {
      const data = JSON.parse(sessionData);
      data.lastActivityAt = new Date().toISOString();
      sessionStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(data));
    }
  },

  // Check if session is still valid
  isSessionValid: () => {
    const timeSinceLastActivity = Date.now() - lastActivityTime;
    return timeSinceLastActivity < SESSION_TIMEOUT;
  },

  // Get session timeout remaining time (in seconds)
  getSessionTimeRemaining: () => {
    const timeSinceLastActivity = Date.now() - lastActivityTime;
    const remaining = SESSION_TIMEOUT - timeSinceLastActivity;
    return Math.max(0, Math.ceil(remaining / 1000));
  },

  // Get session data
  getSessionData: () => {
    const data = sessionStorage.getItem(SESSION_STORAGE_KEY);
    return data ? JSON.parse(data) : null;
  },

  // Set up session timeout warning (2 minutes before timeout)
  setupTimeoutWarning: (callback) => {
    const warningThreshold = SESSION_TIMEOUT - (2 * 60 * 1000); // 28 minutes
    
    sessionTimeout = setInterval(() => {
      const timeSinceLastActivity = Date.now() - lastActivityTime;
      
      if (timeSinceLastActivity > warningThreshold && timeSinceLastActivity < SESSION_TIMEOUT) {
        const timeRemaining = sessionManager.getSessionTimeRemaining();
        callback(timeRemaining);
      }
    }, 5000); // Check every 5 seconds
  },

  // Clear timeout
  clearTimeoutWarning: () => {
    if (sessionTimeout) {
      clearInterval(sessionTimeout);
    }
  },

  // End session and clean up
  endSession: () => {
    // Remove event listeners
    const activityEvents = ['mousedown', 'keydown', 'scroll', 'touchstart', 'click'];
    activityEvents.forEach(event => {
      document.removeEventListener(event, sessionManager.updateActivity, true);
    });

    window.removeEventListener('beforeunload', sessionManager.endSession);
    sessionManager.clearTimeoutWarning();
    
    // Clear session storage
    sessionStorage.removeItem(SESSION_STORAGE_KEY);
  },

  // Get session info
  getSessionInfo: () => {
    const sessionData = sessionManager.getSessionData();
    if (!sessionData) {
      return null;
    }

    return {
      startedAt: new Date(sessionData.startedAt),
      lastActivityAt: new Date(sessionData.lastActivityAt),
      timeRemaining: sessionManager.getSessionTimeRemaining(),
      isValid: sessionManager.isSessionValid(),
    };
  },
};

export default sessionManager;
