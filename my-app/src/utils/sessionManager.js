/**
 * Session Manager - Handles session creation, timeout, and cleanup
 */

const SESSION_TIMEOUT = 30 * 60 * 1000; // 30 minutes in milliseconds
const SESSION_STORAGE_KEY = 'app_session_data';
const LOGIN_SESSION_KEY = 'campusStay.session';
const ACTIVITY_EVENTS = ['mousedown', 'keydown', 'scroll', 'touchstart', 'click'];

let sessionTimeout;
let lastActivityTime = Date.now();
let listenersAttached = false;

const attachListeners = () => {
  if (listenersAttached || typeof document === 'undefined' || typeof window === 'undefined') {
    return;
  }

  ACTIVITY_EVENTS.forEach((event) => {
    document.addEventListener(event, sessionManager.updateActivity, true);
  });

  window.addEventListener('beforeunload', sessionManager.destroySession);
  listenersAttached = true;
};

const detachListeners = () => {
  if (!listenersAttached || typeof document === 'undefined' || typeof window === 'undefined') {
    return;
  }

  ACTIVITY_EVENTS.forEach((event) => {
    document.removeEventListener(event, sessionManager.updateActivity, true);
  });

  window.removeEventListener('beforeunload', sessionManager.destroySession);
  listenersAttached = false;
};

export const sessionManager = {
  // Start session and set up event listeners
  startSession: () => {
    sessionManager.destroySession();
    lastActivityTime = Date.now();
    sessionStorage.setItem(
      SESSION_STORAGE_KEY,
      JSON.stringify({
        startedAt: new Date().toISOString(),
        lastActivityAt: new Date().toISOString(),
      })
    );

    attachListeners();
    return sessionManager.getSessionInfo();
  },

  // Backwards-compatible alias
  initSession: () => {
    sessionManager.startSession();
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
    const warningThreshold = SESSION_TIMEOUT - 2 * 60 * 1000; // 28 minutes

    sessionManager.clearTimeoutWarning();
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
      sessionTimeout = undefined;
    }
  },

  // Destroy session and clean up
  destroySession: () => {
    detachListeners();
    sessionManager.clearTimeoutWarning();
    sessionStorage.removeItem(SESSION_STORAGE_KEY);
  },

  // Backwards-compatible alias
  endSession: () => {
    sessionManager.destroySession();
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
