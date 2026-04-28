// src/utils/imageUtils.js

// Use Vite's import.meta.env for environment variables
const BACKEND_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

// -------------------- Avatar (profile picture) helpers --------------------
export const getFullAvatarUrl = (avatarPath, timestamp = null) => {
  if (!avatarPath) return null;
  // avatarPath is stored as '/uploads/avatars/...' – just prepend backend URL
  const cache = timestamp ? `?t=${timestamp}` : '';
  return `${BACKEND_URL}${avatarPath}${cache}`;
};

// Generate a fallback avatar using UI Avatars (name-based)
export const getAvatarUrl = (name, size = 150) => {
  if (!name) return `https://ui-avatars.com/api/?name=User&background=6366f1&color=fff&size=${size}&bold=true`;
  return `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=6366f1&color=fff&size=${size}&bold=true`;
};

// -------------------- Placeholder / fallback images --------------------
export const getInitialsImage = (initials, category = 'service', size = 250) => {
  const colors = {
    cleaning: '3b82f6',
    plumbing: '10b981',
    electrical: 'f59e0b',
    painting: 'ef4444',
    gardening: '8b5cf6',
    moving: 'ec4899',
    service: '6366f1',
    person: '667eea'
  };
  const color = colors[category?.toLowerCase()] || colors.service;
  return `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='${size}' height='${size}' viewBox='0 0 100 100'%3E%3Crect width='100' height='100' fill='%23${color}'/%3E%3Ctext x='50' y='50' font-family='Arial' font-size='40' fill='%23ffffff' text-anchor='middle' dy='.3em'%3E${initials}%3C/text%3E%3C/svg%3E`;
};

export const getServiceImage = (title, id, width = 400, height = 250) => {
  return `https://picsum.photos/seed/${id || Math.floor(Math.random() * 1000)}/${width}/${height}`;
};

// -------------------- Error handler --------------------
export const handleImageError = (e, fallbackSrc) => {
  e.target.onerror = null;
  if (fallbackSrc) {
    e.target.src = fallbackSrc;
  } else {
    const alt = e.target.alt || 'Image';
    const initials = alt.split(' ').map(word => word[0]).join('').substring(0, 2).toUpperCase();
    e.target.src = getInitialsImage(initials);
  }
};