export const STORAGE_KEYS = {
  users: 'campusStay.users',
  applications: 'campusStay.applications',
  rooms: 'campusStay.rooms',
  session: 'campusStay.session',
};

export const ADMIN_ACCOUNT = {
  email: 'admin@campusstay.rw',
  password: 'Admin@2026!',
  name: 'Hussein Barame',
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

export const PASSWORD_RESET_REQUEST_STATUS_LABELS = {
  pending: 'Pending approval',
  approved: 'Approved',
  used: 'Unlocked',
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

export const normalizeCampusKey = (campus) => {
  const campusValue = campus?.trim().toUpperCase() ?? '';

  if (!campusValue) {
    return '';
  }

  if (
    campusValue === 'UR' ||
    campusValue.includes('UNIVERSITY OF RWANDA') ||
    campusValue.startsWith('UR ')
  ) {
    return 'UR';
  }

  if (
    campusValue === 'RP' ||
    campusValue.includes('RWANDA POLYTECHNIC') ||
    campusValue.startsWith('RP ')
  ) {
    return 'RP';
  }

  return campusValue;
};

export const normalizeIdentityValue = (value) => value?.trim().toLowerCase() ?? '';

export const normalizeGenderKey = (gender) => {
  const normalizedGender = normalizeIdentityValue(gender).replace(/[^a-z]/g, '');

  if (!normalizedGender) {
    return '';
  }

  if (normalizedGender === 'm' || normalizedGender === 'male') {
    return 'male';
  }

  if (normalizedGender === 'f' || normalizedGender === 'female') {
    return 'female';
  }

  if (normalizedGender === 'nonbinary' || normalizedGender === 'nonbin') {
    return 'non_binary';
  }

  if (normalizedGender === 'prefernottosay') {
    return 'prefer_not_to_say';
  }

  return normalizedGender;
};

export const createId = (prefix) => `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

export const getUserAccountKey = (user) => {
  if (!user) {
    return '';
  }

  const email = user.email?.trim().toLowerCase() ?? '';
  const regNumber = user.regNumber?.trim().toLowerCase() ?? '';
  const campus = normalizeCampusKey(user.campus);
  return `${campus}::${regNumber}::${email}`;
};

export const findLatestPasswordResetRequestForIdentity = (requests, identity) => {
  const normalizedEmail = normalizeIdentityValue(identity?.email);
  const normalizedRegNumber = normalizeIdentityValue(identity?.regNumber);
  const normalizedCampus = normalizeCampusKey(identity?.campus);
  const normalizedGender = normalizeGenderKey(identity?.gender);

  if (!normalizedEmail || !normalizedRegNumber || !normalizedCampus) {
    return null;
  }

  return (
    [...(requests ?? [])]
      .filter((request) => {
        const requestAccountKey =
          request.studentAccountKey ||
          getUserAccountKey({
            campus: request.campus,
            regNumber: request.regNumber,
            email: request.email,
          });

        return (
          normalizeIdentityValue(request.email) === normalizedEmail &&
          normalizeIdentityValue(request.regNumber) === normalizedRegNumber &&
          normalizeCampusKey(request.campus) === normalizedCampus &&
          (!normalizedGender || !normalizeGenderKey(request.gender) || normalizeGenderKey(request.gender) === normalizedGender) &&
          requestAccountKey
        );
      })
      .sort((left, right) => new Date(right.requestedAt ?? right.reviewedAt ?? 0) - new Date(left.requestedAt ?? left.reviewedAt ?? 0))[0] ?? null
  );
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
    if (!savedValue) {
      return fallback;
    }

    try {
      return JSON.parse(savedValue);
    } catch {
      return savedValue;
    }
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
