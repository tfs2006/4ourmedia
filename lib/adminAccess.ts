interface AdminIdentity {
  id: string;
  email?: string;
}

function parseCsvEnv(value?: string) {
  return (value || '')
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);
}

export function getConfiguredAdminUserIds() {
  return parseCsvEnv(process.env.ADMIN_USER_IDS);
}

export function getConfiguredAdminEmails() {
  return parseCsvEnv(process.env.ADMIN_EMAILS).map((email) => email.toLowerCase());
}

export function hasConfiguredAdminAllowlist() {
  return getConfiguredAdminUserIds().length > 0 || getConfiguredAdminEmails().length > 0;
}

export function isAuthorizedAdmin(user: AdminIdentity | null) {
  if (!user) {
    return false;
  }

  const allowedIds = getConfiguredAdminUserIds();
  const allowedEmails = getConfiguredAdminEmails();

  if (allowedIds.length === 0 && allowedEmails.length === 0) {
    return false;
  }

  if (allowedIds.includes(user.id)) {
    return true;
  }

  if (user.email && allowedEmails.includes(user.email.toLowerCase())) {
    return true;
  }

  return false;
}