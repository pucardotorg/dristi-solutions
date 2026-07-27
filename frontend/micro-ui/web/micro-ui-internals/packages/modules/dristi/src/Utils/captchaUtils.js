// ---------------------------------------------------------------------------
// POC: frontend-only image captcha helpers.
//
// IMPORTANT: This is a client-side prototype only. Generating AND verifying the
// captcha in the browser is cosmetic — it does not protect the login endpoint
// (a bot can POST /user/oauth/token directly, bypassing this entirely). The
// functions below are deliberately isolated so they can later be swapped for a
// backend contract (GET /captcha/_generate returning { image, captchaToken },
// verified server-side in the /oauth/token password grant) with no change to
// the calling component. See the ticket #5912 follow-up.
// ---------------------------------------------------------------------------

export const CAPTCHA_LENGTH = 5;

// Ambiguous characters (0/O, 1/I/l, etc.) are excluded so the distorted image
// stays legible.
const CAPTCHA_CHARSET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

// SWAP POINT: replace with a call to the backend `/captcha/_generate` endpoint,
// which would return the rendered image + an opaque server token instead of the
// plaintext answer.
export function generateCaptchaText(length = CAPTCHA_LENGTH) {
  let text = "";
  for (let i = 0; i < length; i++) {
    text += CAPTCHA_CHARSET.charAt(Math.floor(Math.random() * CAPTCHA_CHARSET.length));
  }
  return text;
}

// SWAP POINT: replace the local comparison with a server verify call
// (HMAC/Redis). Keep this signature so the caller stays unchanged.
export function verifyCaptcha(typed, answer) {
  if (!typed || !answer) return false;
  return typed.trim().toUpperCase() === answer.trim().toUpperCase();
}
