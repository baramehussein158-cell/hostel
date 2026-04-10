export const STORAGE_KEYS = {
  users: 'campusStay.users',
  applications: 'campusStay.applications',
  rooms: 'campusStay.rooms',
  session: 'campusStay.session',
};

export const ADMIN_ACCOUNT = {
  email: 'admin@campusstay.rw',
  password: 'Admin@2026!',
  name: 'Housing Administrator',
};

export const DEFAULT_ROOM_INVENTORY = [
  { id: 'ur-single', campus: 'UR', typeKey: 'single', label: 'Single Room', total: 48, status: 'open' },
  { id: 'ur-shared', campus: 'UR', typeKey: 'shared', label: 'Shared Room', total: 40, status: 'open' },
  { id: 'ur-suite', campus: 'UR', typeKey: 'suite', label: 'Suite', total: 20, status: 'open' },
  { id: 'rp-single', campus: 'RP', typeKey: 'single', label: 'Single Room', total: 42, status: 'open' },
  { id: 'rp-shared', campus: 'RP', typeKey: 'shared', label: 'Shared Room', total: 44, status: 'open' },
  { id: 'rp-suite', campus: 'RP', typeKey: 'suite', label: 'Suite', total: 20, status: 'open' },
];

export const APPLICATION_STATUS_LABELS = {
  pending: 'Pending Review',
  approved: 'Approved',
  waitlisted: 'Waitlisted',
  rejected: 'Rejected',
};

export const createId = (prefix) => `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

export const buildProfileImageSrc = (profileImageUrl, profileImageUpdatedAt) => {
  if (!profileImageUrl) {
    return '';
  }

  if (!profileImageUpdatedAt) {
    return profileImageUrl;
  }

  const separator = profileImageUrl.includes('?') ? '&' : '?';
  return `${profileImageUrl}${separator}v=${encodeURIComponent(profileImageUpdatedAt)}`;
};

export const readStoredValue = (key, fallback) => {
  if (typeof window === 'undefined') {
    return fallback;
  }

  try {
    const savedValue = window.localStorage.getItem(key);
    return savedValue ? JSON.parse(savedValue) : fallback;
  } catch (error) {
    console.error(`Failed to read localStorage key "${key}"`, error);
    return fallback;
  }
};

export const sortApplicationsByDate = (applications) =>
  [...applications].sort((left, right) => new Date(right.submittedAt) - new Date(left.submittedAt));
