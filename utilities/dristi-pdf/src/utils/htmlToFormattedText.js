const { convert } = require("html-to-text");
const createDOMPurify = require("dompurify");
const { JSDOM } = require("jsdom");

const window = new JSDOM("").window;
const DOMPurify = createDOMPurify(window);

/**
 * Removes hidden Unicode characters that pdfmake can't render
 * (avoids tofu boxes in PDF)
 *
 * @param {string} str - Input text
 * @returns {string} Clean text
 */
function cleanUnsupportedChars(str) {
  return str
    .replace(/\uFFFC/g, "")     // object replacement char
    .replace(/\u2028/g, "\n")   // line separator → newline
    .replace(/\u2029/g, "\n")   // paragraph separator → newline
    .replace(/\u00A0/g, " ")    // non-breaking space → normal space
    .replace(/[^\S\n]+/g, " "); // collapse weird spaces but keep \n
}

/**
 * Converts HTML or plain text to safe formatted text
 * Supports **bold**, *italic*, and keeps bullet points for unordered lists
 *
 * @param {string} input - The HTML or plain text input
 * @returns {string} Formatted plain text
 */
function htmlToFormattedText(input) {
  const isHtml = /<\/?[a-z][\s\S]*>/i.test(input);

  if (isHtml) {
    const cleanHtml = DOMPurify.sanitize(input);

    let result = convert(cleanHtml, {
      wordwrap: false,
      format: {
        strong: "asterisk", // **bold**
        em: "underscore",   // _italic_
      },
      selectors: [
        { selector: "a", options: { ignoreHref: true } },
        {
          selector: "ul",
          options: {
            itemPrefix: "• ", // Use bullet point for unordered lists
          },
        },
        {
          selector: "ol",
          options: {
            itemPrefix: "1. ", // Keep numbers for ordered lists (will auto-increment)
          },
        },
      ],
    });

    // Trim trailing whitespace and empty lines
    result = result.replace(/\s+$/g, "");

    // ✅ Clean unsupported characters (fixes PDF boxes)
    return cleanUnsupportedChars(result);
  }

  // Plain text path → also clean it
  return cleanUnsupportedChars(input.replace(/\s+$/g, ""));
}

module.exports = {
  htmlToFormattedText,
};
