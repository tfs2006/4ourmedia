export const ADMIN_SECRET_STORAGE_KEY = 'promogen_admin_secret';
export const ADMIN_ACCESS_STORAGE_KEY = 'promogen_admin_access';

export function hasAdminSessionAccess() {
  if (typeof window === 'undefined') {
    return false;
  }

  return window.sessionStorage.getItem(ADMIN_ACCESS_STORAGE_KEY) === 'granted';
}

export function grantAdminSession(secret: string) {
  if (typeof window === 'undefined') {
    return;
  }

  window.sessionStorage.setItem(ADMIN_SECRET_STORAGE_KEY, secret);
  window.sessionStorage.setItem(ADMIN_ACCESS_STORAGE_KEY, 'granted');
}

export function clearAdminSession() {
  if (typeof window === 'undefined') {
    return;
  }

  window.sessionStorage.removeItem(ADMIN_SECRET_STORAGE_KEY);
  window.sessionStorage.removeItem(ADMIN_ACCESS_STORAGE_KEY);
}