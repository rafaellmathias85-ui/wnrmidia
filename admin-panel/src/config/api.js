const trimTrailingSlash = (value) => value.replace(/\/+$/, '');

const isLocalHost = (hostname) =>
  hostname === 'localhost' ||
  hostname === '127.0.0.1' ||
  hostname === '[::1]';

const getDefaultApiUrl = () => {
  if (typeof window === 'undefined') {
    return 'http://localhost:5000/api';
  }

  if (isLocalHost(window.location.hostname)) {
    return 'http://localhost:5000/api';
  }

  const publicUrl = trimTrailingSlash(process.env.PUBLIC_URL || '');
  return `${window.location.origin}${publicUrl}/api`;
};

export const API_URL = trimTrailingSlash(
  process.env.REACT_APP_API_URL || getDefaultApiUrl()
);

export const API_BASE_URL = API_URL.replace(/\/api$/, '');

export const DOWNLOADS_BASE_URL = API_URL
  .replace(/\/app\/api$/, '')
  .replace(/\/api$/, '');
