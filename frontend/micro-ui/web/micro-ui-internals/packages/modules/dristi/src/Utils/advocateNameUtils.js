/**
 * Splits a "First Middle Last" style full name into first/middle/last parts.
 *
 * Behaviour, preserved exactly from the original copies in:
 *   - components/AdvocateNameDetails.js
 *   - components/MultipleAdvocateNameDetails.js
 *   - components/MultipleAdvocatesAndPip.js
 *
 *  - 0 parts:  all empty
 *  - 1 part:   becomes firstName only
 *  - 2 parts:  first / last
 *  - >=3:      first / (middle joined) / last
 */
export function splitNamesPartiallyFromFullName(fullName) {
  const nameParts = fullName?.trim()?.split(/\s+/);

  let firstName = "";
  let middleName = "";
  let lastName = "";

  const numParts = nameParts?.length;

  if (numParts === 1) {
    firstName = nameParts?.[0];
  } else if (numParts === 2) {
    firstName = nameParts?.[0];
    lastName = nameParts?.[1];
  } else if (numParts >= 3) {
    firstName = nameParts?.[0];
    lastName = nameParts?.[numParts - 1];
    middleName = nameParts?.slice(1, numParts - 1)?.join(" ");
  }

  return {
    firstName: firstName,
    middleName: middleName,
    lastName: lastName ? lastName : "",
  };
}
