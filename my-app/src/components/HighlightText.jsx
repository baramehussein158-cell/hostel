import React from 'react';

const escapeRegExp = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const HighlightText = ({ text, query, className = 'search-highlight' }) => {
  const value = String(text ?? '');
  const trimmedQuery = String(query ?? '').trim();

  if (!trimmedQuery) {
    return value;
  }

  const parts = value.split(new RegExp(`(${escapeRegExp(trimmedQuery)})`, 'ig'));

  return parts.map((part, index) => {
    const isMatch = part.toLowerCase() === trimmedQuery.toLowerCase();

    if (!isMatch) {
      return <React.Fragment key={`${part}-${index}`}>{part}</React.Fragment>;
    }

    return (
      <span key={`${part}-${index}`} className={className}>
        {part}
      </span>
    );
  });
};

export default HighlightText;
