import {
  SYNOPSIS_FORM_SOURCES,
  SYNOPSIS_MISSING_VALUE_PLACEHOLDER,
  SYNOPSIS_PARTIES_SECTION,
  SYNOPSIS_PARTY_MAPPING,
  SYNOPSIS_SECTION_MAPPING,
} from "../pages/citizen/FileCase/Config/synopsisTemplateMapping";

const MONTH_NAMES = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

const getValueAtPath = (object, path) => {
  if (!object || !path) return undefined;
  return path.split(".").reduce((acc, key) => (acc === null || acc === undefined ? undefined : acc[key]), object);
};

const escapeHtml = (value) => String(value).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

const isBlank = (value) => value === null || value === undefined || (typeof value === "string" && value.trim() === "");

const formatDateValue = (value) => {
  if (isBlank(value)) return "";
  // Date inputs store "YYYY-MM-DD"; epoch numbers may come from already submitted cases.
  const dateObject = typeof value === "number" ? new Date(value) : new Date(`${String(value).split("T")[0]}T00:00:00`);
  if (isNaN(dateObject.getTime())) return String(value);
  return `${String(dateObject.getDate()).padStart(2, "0")} ${MONTH_NAMES[dateObject.getMonth()]} ${dateObject.getFullYear()}`;
};

const formatAmountValue = (value) => {
  if (isBlank(value)) return "";
  const numericValue = Number(String(value).replace(/,/g, ""));
  if (isNaN(numericValue)) return String(value);
  return `₹${numericValue.toLocaleString("en-IN")}`;
};

const formatOptionValue = (value) => {
  if (isBlank(value)) return "";
  if (typeof value === "object") return value?.name || value?.code || "";
  return String(value);
};

const formatFieldValue = (value, type) => {
  switch (type) {
    case "date":
      return formatDateValue(value);
    case "amount":
      return formatAmountValue(value);
    case "option":
      return formatOptionValue(value);
    default:
      return isBlank(value) ? "" : String(typeof value === "object" ? formatOptionValue(value) : value);
  }
};

const joinName = (...parts) =>
  parts
    .filter((part) => !isBlank(part))
    .join(" ")
    .trim();

/**
 * Returns the usable `formdata` entries of a source page, i.e. entries that are enabled
 * and actually carry some data.
 */
const getFormDataList = (caseDetails, sourceKey) => {
  const source = SYNOPSIS_FORM_SOURCES[sourceKey];
  if (!source) return [];
  const formdata = caseDetails?.[source.section]?.[source.formKey]?.formdata || [];
  return formdata.filter((form) => form?.isenabled !== false && Object.keys(form?.data || {}).length > 0);
};

const buildPartyNames = (caseDetails, partyConfig) => {
  const formDataList = getFormDataList(caseDetails, partyConfig?.source);
  const names = [];

  formDataList.forEach((form) => {
    const entries = partyConfig?.listPath ? getValueAtPath(form?.data, partyConfig.listPath) || [] : [form?.data];
    (Array.isArray(entries) ? entries : [entries]).forEach((entry) => {
      if (!entry) return;
      const individualName = joinName(
        getValueAtPath(entry, partyConfig?.firstName),
        getValueAtPath(entry, partyConfig?.middleName),
        getValueAtPath(entry, partyConfig?.lastName)
      );
      const companyName = partyConfig?.companyName ? getValueAtPath(entry, partyConfig.companyName) : "";
      const name = individualName || (isBlank(companyName) ? "" : String(companyName).trim());
      if (name && !names.includes(name)) names.push(name);
    });
  });

  return names;
};

const heading = (text) => `<p><strong>${escapeHtml(text)}</strong></p>`;
// Labels that are already phrased as a question keep their "?" instead of taking a colon.
const line = (label, value) => `<p>${escapeHtml(label)}${String(label).trim().endsWith("?") ? "" : ":"} ${escapeHtml(value)}</p>`;
const blankLine = () => `<p><br></p>`;

/**
 * Builds the Synopsis template as sanitiser friendly HTML for the rich text editor.
 *
 * @param {object} caseDetails case object (already run through transformCaseDataForFetching)
 * @param {function} t localisation function
 * @returns {string} HTML string
 */
export const generateSynopsisTemplate = ({ caseDetails = {}, t = (key, fallback) => fallback || key }) => {
  const label = (labelKey, defaultLabel) => (labelKey ? t(labelKey, defaultLabel) : defaultLabel || "");
  const blocks = [];

  // ---- Parties ----
  blocks.push(heading(label(SYNOPSIS_PARTIES_SECTION.label, SYNOPSIS_PARTIES_SECTION.defaultLabel)));
  SYNOPSIS_PARTY_MAPPING.forEach((partyConfig) => {
    const names = buildPartyNames(caseDetails, partyConfig);
    blocks.push(line(label(partyConfig.label, partyConfig.defaultLabel), names.length ? names.join(", ") : SYNOPSIS_MISSING_VALUE_PLACEHOLDER));
  });

  // ---- Remaining sections ----
  SYNOPSIS_SECTION_MAPPING.forEach((section) => {
    const sectionHeading = label(section.label, section.defaultLabel);
    const formDataList = getFormDataList(caseDetails, section.source);

    if (!section.fields?.length) {
      // Heading only section (e.g. "Prayer/ Relief sought").
      if (sectionHeading) {
        blocks.push(blankLine());
        blocks.push(heading(sectionHeading));
      }
      return;
    }

    // A section repeats only when its source page holds more than one form.
    const repeatCount = section.repeatPerForm ? Math.max(formDataList.length, 1) : 1;

    for (let index = 0; index < repeatCount; index++) {
      const data = formDataList[index]?.data || {};
      blocks.push(blankLine());
      if (sectionHeading) {
        blocks.push(heading(repeatCount > 1 ? `${sectionHeading} ${index + 1}` : sectionHeading));
      }
      section.fields.forEach((field) => {
        const formattedValue = field.path ? formatFieldValue(getValueAtPath(data, field.path), field.type) : "";
        blocks.push(line(label(field.label, field.defaultLabel), isBlank(formattedValue) ? SYNOPSIS_MISSING_VALUE_PLACEHOLDER : formattedValue));
      });
    }
  });

  return blocks.join("");
};

export default generateSynopsisTemplate;
