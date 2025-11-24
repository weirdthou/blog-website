/**
 * Generate a placeholder avatar SVG
 */
export const generatePlaceholderAvatar = (name?: string): string => {
  const initials = name
    ? name
        .split(' ')
        .map((n) => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2)
    : 'U';

  const colors = [
    '#FF6B6B',
    '#4ECDC4',
    '#45B7D1',
    '#96CEB4',
    '#FFEAA7',
    '#DDA0DD',
    '#98D8C8',
    '#F7DC6F',
    '#BB8FCE',
    '#85C1E9',
  ];

  const colorIndex = name
    ? name.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0) %
      colors.length
    : 0;

  const backgroundColor = colors[colorIndex];

  return `data:image/svg+xml,${encodeURIComponent(`
    <svg width="100" height="100" xmlns="http://www.w3.org/2000/svg">
      <rect width="100" height="100" fill="${backgroundColor}"/>
      <text x="50" y="50" font-family="Arial, sans-serif" font-size="36" font-weight="bold" 
            text-anchor="middle" dominant-baseline="middle" fill="white">
        ${initials}
      </text>
    </svg>
  `)}`;
};

/**
 * Utility function to get the full avatar URL with fallback to placeholder
 */
export const getAvatarUrl = (
  avatarPath?: string | null,
  userName?: string
): string => {
  // If no avatar path, return generated placeholder
  if (!avatarPath) {
    return generatePlaceholderAvatar(userName);
  }

  // If it's already a full URL, return as is
  if (avatarPath.startsWith('http') || avatarPath.startsWith('data:')) {
    return avatarPath;
  }

  // If it starts with a slash, it's a relative path from the media server
  if (avatarPath.startsWith('/')) {
    return `http://localhost:8000${avatarPath}`;
  }

  // Otherwise, assume it's a relative path that needs media prefix
  return `http://localhost:8000/media/${avatarPath}`;
};
