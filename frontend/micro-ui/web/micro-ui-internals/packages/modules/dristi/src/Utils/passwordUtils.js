export const PASSWORD_MIN_LENGTH = 8;
export const PASSWORD_MAX_LENGTH = 64;

// Common/compromised passwords blocklist (case-insensitive check).
const COMMON_PASSWORD_BLOCKLIST = [
  "oncourts",
  "on_courts",
  "oncourts@123",
  "on_courts@123",
  "onCourts247",
  "on_courts247",
  "onCourts@123",
  "24*7oncourts",
  "24*7_oncourts",
  "24*7_on_courts",
  "247oncourts",
  "24/7oncourts",
  "247_oncourts",
  "on_courts@1234",
  "on_courts@12345",
  "password",
  "password1",
  "password123",
  "12345678",
  "123456789",
  "1234567890",
  "qwerty",
  "qwerty123",
  "qwertyuiop",
  "11111111",
  "00000000",
  "letmein",
  "welcome",
  "welcome1",
  "admin123",
  "abc12345",
  "changeme",
  "1q2w3e4r",
  "trustno1",
  "sunshine",
  "dragon123",
  "monkey123",
  "master123",
];

// Identifiers unique to the signed-in user (their mobile number and email) must not be reusable as
// a password. Sourced from the "user-info" object persisted in localStorage, plus any identifiers
// passed explicitly by the caller (needed during the login set-password flow, where "user-info"
// has not been persisted yet).
function getUserIdentifierBlocklist(extraIdentifiers = []) {
  const identifiers = [...extraIdentifiers];
  try {
    const userInfo = JSON.parse(window.localStorage.getItem("user-info"));
    identifiers.push(userInfo?.mobileNumber, userInfo?.emailId);
  } catch (e) {
    /* user-info may be absent (e.g. during login); explicit identifiers still apply */
  }
  return identifiers.filter(Boolean).map((value) => String(value).trim().toLowerCase());
}

export function isBlocklistedPassword(password, extraIdentifiers = []) {
  if (!password) return false;
  const normalized = password.trim().toLowerCase();
  if (COMMON_PASSWORD_BLOCKLIST.includes(normalized)) return true;
  // Reject if the password contains the user's mobile/email, or is itself contained within them,
  // so neither can be reused as (or embedded in) the password in either direction.
  return getUserIdentifierBlocklist(extraIdentifiers).some((identifier) => normalized.includes(identifier) || identifier.includes(normalized));
}

export function validatePassword(password, extraIdentifiers = []) {
  if (!password || password.length < PASSWORD_MIN_LENGTH) {
    return { isValid: false, errorKey: "PASSWORD_TOO_SHORT" };
  }
  if (password.length > PASSWORD_MAX_LENGTH) {
    return { isValid: false, errorKey: "PASSWORD_TOO_LONG" };
  }
  if (isBlocklistedPassword(password, extraIdentifiers)) {
    return { isValid: false, errorKey: "PASSWORD_TOO_COMMON" };
  }
  return { isValid: true, errorKey: null };
}

// Returns a score from 0 (very weak) to 4 (very strong) purely to drive the strength meter UI.
export function getPasswordStrength(password, extraIdentifiers = []) {
  if (!password) return 0;

  if (isBlocklistedPassword(password, extraIdentifiers)) return 0;

  let score = 0;
  if (password.length >= PASSWORD_MIN_LENGTH) score += 1;
  if (password.length >= 12) score += 1;
  if (password.length >= 16) score += 1;

  const varietyCount = [/[a-z]/, /[A-Z]/, /[0-9]/, /[^a-zA-Z0-9]/].filter((pattern) => pattern.test(password)).length;
  if (varietyCount >= 2) score += 1;

  return Math.min(score, 4);
}

export const PASSWORD_STRENGTH_LABELS = [
  "PASSWORD_STRENGTH_VERY_WEAK",
  "PASSWORD_STRENGTH_WEAK",
  "PASSWORD_STRENGTH_FAIR",
  "PASSWORD_STRENGTH_GOOD",
  "PASSWORD_STRENGTH_STRONG",
];
