const { convert } = require("html-to-text");
const createDOMPurify = require("dompurify");
const { JSDOM } = require("jsdom");

const window = new JSDOM("").window;
const DOMPurify = createDOMPurify(window);

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
        em: "underscore", // _italic_
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

    return result;
  }

  return input;
}

module.exports = {
  htmlToFormattedText,
};
