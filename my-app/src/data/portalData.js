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

export const PAYMENT_STATUS_LABELS = {
  pending: 'Awaiting Verification',
  verified: 'Verified',
  rejected: 'Rejected',
};

export const ROOM_TYPE_LABELS = {
  single: 'Single Room',
  shared: 'Shared Room',
  suite: 'Suite',
};

export const HOSTEL_RENT_BY_ROOM_TYPE = {
  single: 180000,
  shared: 120000,
  suite: 260000,
};

export const PAYMENT_METHODS = [
  { value: 'mobile_money', label: 'Mobile Money' },
  { value: 'bank_transfer', label: 'Bank Transfer' },
  { value: 'debit_card', label: 'Debit or Credit Card' },
];

export const GENDER_OPTIONS = [
  { value: 'female', label: 'Female' },
  { value: 'male', label: 'Male' },
  { value: 'non_binary', label: 'Non-binary' },
  { value: 'prefer_not_to_say', label: 'Prefer not to say' },
];

export const ADMIN_UPDATE_ACCESS_LABELS = {
  true: 'Allowed',
  false: 'Not allowed',
};

export const STUDY_CAMPUSES = {
  UR: ['UR Campus Huye', 'UR Campus KICT', 'UR Campus KIE'],
  RP: [
    'RP Karongi College',
    'RP Kicukiro College',
    'RP Tumba College',
    'RP Musanze College',
    'RP Ngoma College',
    'RP Huye College',
  ],
};

export const createId = (prefix) => `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

export const getUserAccountKey = (user) => {
  if (!user) {
    return '';
  }

  const email = user.email?.trim().toLowerCase() ?? '';
  const regNumber = user.regNumber?.trim().toLowerCase() ?? '';
  const campus = user.campus?.trim().toUpperCase() ?? '';
  return `${campus}::${regNumber}::${email}`;
};

export const getUserRecencyScore = (user) =>
  Math.max(
    new Date(user?.profileImageUpdatedAt ?? 0).getTime() || 0,
    new Date(user?.createdAt ?? 0).getTime() || 0
  );

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

export const formatCurrency = (amount) =>
  new Intl.NumberFormat('en-RW', {
    style: 'currency',
    currency: 'RWF',
    maximumFractionDigits: 0,
  }).format(Number(amount) || 0);
