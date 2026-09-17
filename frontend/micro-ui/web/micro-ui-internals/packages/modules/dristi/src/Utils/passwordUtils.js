export const PASSWORD_MIN_LENGTH = 8;
export const PASSWORD_MAX_LENGTH = 64;

// Common/compromised passwords blocklist (case-insensitive check).
const COMMON_PASSWORD_BLOCKLIST = [
  "courts",
  "oncourts",
  "on_courts",
  "oncourts123",
  "on_courts123",
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

// All order-preserving, whitespace-free combinations of a list of words, e.g.
// ["amit", "kumar", "yadav"] -> ["amit", "kumar", "amitkumar", "yadav", "amityadav", "kumaryadav",
// "amitkumaryadav"]. This is how a multi-word name is expanded: the password must not equal any of
// these. Enumeration is bounded (2^n) - for an unusually long name we fall back to the individual
// words plus the full concatenation to avoid a combinatorial blow-up.
function wordCombinations(words) {
  const combos = new Set();
  if (words.length === 0) return combos;
  if (words.length > 10) {
    words.forEach((word) => combos.add(word));
    combos.add(words.join(""));
    return combos;
  }
  for (let mask = 1; mask < 1 << words.length; mask++) {
    let combo = "";
    for (let i = 0; i < words.length; i++) {
      if (mask & (1 << i)) combo += words[i];
    }
    if (combo) combos.add(combo);
  }
  return combos;
}

// The set of exact (lower-cased, whitespace-removed) strings a password must not equal: the user's
// mobile number, email, and every order-preserving combination of the words in their name. Sourced
// from the "user-info" object persisted in localStorage, plus any identifiers passed explicitly by
// the caller (needed during the login set-password flow, where "user-info" has not been persisted
// yet). Combination logic is applied uniformly - single-word identifiers (mobile/email) simply map
// to themselves.
function getUserIdentifierBlocklist(extraIdentifiers = []) {
  const identifiers = [...extraIdentifiers];
  try {
    const userInfo = JSON.parse(window.localStorage.getItem("user-info"));
    identifiers.push(userInfo?.mobileNumber, userInfo?.emailId, userInfo?.name);
  } catch (e) {
    /* user-info may be absent (e.g. during login); explicit identifiers still apply */
  }
  const blocklist = new Set();
  identifiers
    .filter(Boolean)
    .forEach((value) => {
      const words = String(value).toLowerCase().trim().split(/\s+/).filter(Boolean);
      wordCombinations(words).forEach((combo) => blocklist.add(combo));
    });
  return blocklist;
}

// Whether the password matches a known common/compromised password (exact match against the list).
export function isCommonPassword(password) {
  if (!password) return false;
  return COMMON_PASSWORD_BLOCKLIST.includes(password.trim().toLowerCase());
}

// Whether the password (ignoring whitespace, case-insensitive) exactly equals the user's mobile
// number, email, or any combination of their name's words.
export function matchesUserIdentifier(password, extraIdentifiers = []) {
  if (!password) return false;
  const normalized = password.toLowerCase().replace(/\s+/g, "");
  if (!normalized) return false;
  return getUserIdentifierBlocklist(extraIdentifiers).has(normalized);
}

export function isBlocklistedPassword(password, extraIdentifiers = []) {
  if (!password) return false;
  return isCommonPassword(password) || matchesUserIdentifier(password, extraIdentifiers);
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

// Returns a score for the strength meter. 0 is reserved for empty or common/compromised passwords
// (shown by the UI as "—" / "TOO_COMMON"); any other password scores between 1 (Weak) and 4
// (Strong). A password that merely contains a user identifier is NOT forced to 0 here - that case
// is surfaced by its own checklist item instead of the strength label.
export function getPasswordStrength(password) {
  if (!password) return 0;

  if (isCommonPassword(password)) return 0;

  let score = 0;
  if (password.length >= PASSWORD_MIN_LENGTH) score += 1;
  if (password.length >= 12) score += 1;
  if (password.length >= 16) score += 1;

  const varietyCount = [/[a-z]/, /[A-Z]/, /[0-9]/, /[^a-zA-Z0-9]/].filter((pattern) => pattern.test(password)).length;
  if (varietyCount >= 2) score += 1;

  return Math.max(1, Math.min(score, 4));
}

// Labels indexed by score (1-4). Index 0 is unused: empty shows "—" and blocklisted shows
// "TOO_COMMON" in the UI, so there is no separate "very weak" level.
export const PASSWORD_STRENGTH_LABELS = [
  "",
  "PASSWORD_STRENGTH_WEAK",
  "PASSWORD_STRENGTH_FAIR",
  "PASSWORD_STRENGTH_GOOD",
  "PASSWORD_STRENGTH_STRONG",
];
