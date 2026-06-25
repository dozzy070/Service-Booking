// src/utils/imageUtils.js

// Use Vite's import.meta.env for environment variables
const BACKEND_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

// ============================================================
// AVATAR (Profile Picture) Helpers
// ============================================================

// Get full URL for avatar from backend
export const getFullAvatarUrl = (avatarPath, timestamp = null) => {
  if (!avatarPath) return null;
  // avatarPath is stored as '/uploads/avatars/...' – just prepend backend URL
  const cache = timestamp ? `?t=${timestamp}` : '';
  return `${BACKEND_URL}${avatarPath}${cache}`;
};

// Generate a fallback avatar using UI Avatars (name-based)
export const getAvatarUrl = (name, size = 150, background = '6366f1') => {
  const displayName = name || 'User';
  return `https://ui-avatars.com/api/?name=${encodeURIComponent(displayName)}&background=${background}&color=fff&size=${size}&bold=true`;
};

// ============================================================
// PLACEHOLDER / FALLBACK IMAGES
// ============================================================

// Generate initials image as SVG data URI
export const getInitialsImage = (initials, category = 'service', size = 250) => {
  const colors = {
    cleaning: '3b82f6',
    plumbing: '10b981',
    electrical: 'f59e0b',
    painting: 'ef4444',
    gardening: '8b5cf6',
    moving: 'ec4899',
    service: '6366f1',
    person: '667eea',
    default: '6366f1'
  };
  const color = colors[category?.toLowerCase()] || colors.default;
  const initialText = initials || '?';
  return `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='${size}' height='${size}' viewBox='0 0 100 100'%3E%3Crect width='100' height='100' fill='%23${color}'/%3E%3Ctext x='50' y='50' font-family='Arial' font-size='40' font-weight='bold' fill='%23ffffff' text-anchor='middle' dy='.35em'%3E${initialText}%3C/text%3E%3C/svg%3E`;
};

// Generate a random service image from picsum
export const getServiceImage = (title, id, width = 400, height = 250) => {
  const seed = id || title || Math.floor(Math.random() * 1000);
  return `https://picsum.photos/seed/${encodeURIComponent(seed)}/${width}/${height}`;
};

// ============================================================
// IMAGE ERROR HANDLING
// ============================================================

// Handle image load errors - fallback to initials
export const handleImageError = (e, fallbackSrc = null) => {
  e.target.onerror = null; // Prevent infinite loop
  
  if (fallbackSrc) {
    e.target.src = fallbackSrc;
    return;
  }
  
  // Try to get initials from alt text
  const alt = e.target.alt || 'User';
  const initials = alt
    .split(' ')
    .map(word => word[0])
    .join('')
    .substring(0, 2)
    .toUpperCase() || '?';
  
  e.target.src = getInitialsImage(initials);
};

// Handle service image error specifically
export const handleServiceImageError = (e, title = 'Service') => {
  e.target.onerror = null;
  // Try to get a random image with the title as seed
  e.target.src = getServiceImage(title, title, 400, 300);
};

// ============================================================
// IMAGE VALIDATION
// ============================================================

// Check if URL is a valid image URL
export const isValidImageUrl = (url) => {
  if (!url) return false;
  return url.startsWith('http') || url.startsWith('data:image') || url.startsWith('/');
};

// Get safe image URL
export const getSafeImageUrl = (url, fallback = null) => {
  if (!url || url === 'https://via.placeholder.com/64' || url === 'https://via.placeholder.com/50' || url === 'https://via.placeholder.com/300x200') {
    return fallback;
  }
  return url;
};

// ============================================================
// EXPORTS
// ============================================================

export default {
  getFullAvatarUrl,
  getAvatarUrl,
  getInitialsImage,
  getServiceImage,
  handleImageError,
  handleServiceImageError,
  isValidImageUrl,
  getSafeImageUrl
};