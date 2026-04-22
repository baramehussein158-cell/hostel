export const getInitials = (value, fallback = '??') => {
  const text = String(value ?? '').trim();
  if (!text) {
    return fallback;
  }

  const parts = text.split(/\s+/).filter(Boolean);
  if (parts.length === 0) {
    return fallback;
  }

  if (parts.length === 1) {
    return parts[0].slice(0, 2).toUpperCase();
  }

  return parts
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join('');
};

export const getTimeGreeting = (date = new Date()) => {
  const hour = date.getHours();

  if (hour < 12) {
    return 'Good morning';
  }

  if (hour < 17) {
    return 'Good afternoon';
  }

  if (hour < 21) {
    return 'Good evening';
  }

  return 'Good night';
};

export const getLocalTimeLabel = (date = new Date()) =>
  new Intl.DateTimeFormat(undefined, {
    hour: 'numeric',
    minute: '2-digit',
  }).format(date);
