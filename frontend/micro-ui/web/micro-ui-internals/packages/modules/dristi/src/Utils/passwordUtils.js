export const PASSWORD_MIN_LENGTH = 8;
export const PASSWORD_MAX_LENGTH = 64;

// Common/compromised passwords blocklist (case-insensitive check).
const COMMON_PASSWORD_BLOCKLIST = [
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
  "iloveyou",
  "changeme",
  "1q2w3e4r",
  "trustno1",
  "sunshine",
  "princess",
  "football",
  "baseball",
  "dragon123",
  "monkey123",
  "master123",
];

export function isBlocklistedPassword(password) {
  if (!password) return false;
  const normalized = password.trim().toLowerCase();
  return COMMON_PASSWORD_BLOCKLIST.includes(normalized);
}

export function validatePassword(password) {
  if (!password || password.length < PASSWORD_MIN_LENGTH) {
    return { isValid: false, errorKey: "PASSWORD_TOO_SHORT" };
  }
  if (password.length > PASSWORD_MAX_LENGTH) {
    return { isValid: false, errorKey: "PASSWORD_TOO_LONG" };
  }
  if (isBlocklistedPassword(password)) {
    return { isValid: false, errorKey: "PASSWORD_TOO_COMMON" };
  }
  return { isValid: true, errorKey: null };
}

// Returns a score from 0 (very weak) to 4 (very strong) purely to drive the strength meter UI.
export function getPasswordStrength(password) {
  if (!password) return 0;

  if (isBlocklistedPassword(password)) return 0;

  let score = 0;
  if (password.length >= PASSWORD_MIN_LENGTH) score += 1;
  if (password.length >= 12) score += 1;
  if (password.length >= 16) score += 1;

  const varietyCount = [/[a-z]/, /[A-Z]/, /[0-9]/, /[^a-zA-Z0-9]/].filter((pattern) => pattern.test(password)).length;
  if (varietyCount >= 2) score += 1;

  return Math.min(score, 4);
}

export const PASSWORD_STRENGTH_LABELS = ["PASSWORD_STRENGTH_VERY_WEAK", "PASSWORD_STRENGTH_WEAK", "PASSWORD_STRENGTH_FAIR", "PASSWORD_STRENGTH_GOOD", "PASSWORD_STRENGTH_STRONG"];
