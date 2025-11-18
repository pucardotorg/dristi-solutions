const createDOMPurify = require("dompurify");
const { JSDOM } = require("jsdom");
const htmlToPdfmake = require("html-to-pdfmake");

const window = new JSDOM("").window;
const DOMPurify = createDOMPurify(window);

DOMPurify.setConfig({
  ALLOWED_ATTR: ["style", "class"],
  KEEP_CONTENT: true,
});

function stripFontStyles(styleString = "") {
  return styleString.replace(/font-family:[^;]+;?/gi, "").trim();
}

function cleanUnsupportedChars(str) {
  return str
    .replace(/\uFFFC/g, "")
    .replace(/\u2028/g, "\n")
    .replace(/\u2029/g, "\n")
    .replace(/\u00A0/g, " ")
    .replace(/[^\S\n]+/g, " ");
}

function removeHtmlDefaultMargins(node) {
  if (node && typeof node === "object") {
    if (node.nodeName) {
      switch (node.nodeName) {
        case "P":
          node.margin = [0, 0, 0, 8];
          break;
        case "UL":
        case "OL":
          node.margin = [20, 8, 0, 8];
          break;
        case "LI":
          node.margin = [0, 4, 0, 4];
          break;
      }
    }

    for (const key in node) {
      node[key] = removeHtmlDefaultMargins(node[key]);
    }
  }
  return node;
}

function htmlToFormattedText(input) {
  const isHtml = /<\/?[a-z][\s\S]*>/i.test(input);
  if (!isHtml) return cleanUnsupportedChars(input);

  let cleanHtml = DOMPurify.sanitize(input);

  cleanHtml = cleanHtml.replace(/style="([^"]*)"/gi, (match, p1) => {
    const filtered = stripFontStyles(p1);
    return filtered ? `style="${filtered}"` : "";
  });

  let pdfmakeContent = htmlToPdfmake(cleanHtml, { window });

  if (Array.isArray(pdfmakeContent)) {
    pdfmakeContent = pdfmakeContent.map((c) =>
      typeof c.text === "string"
        ? { ...c, text: cleanUnsupportedChars(c.text) }
        : c
    );
  } else if (pdfmakeContent?.text) {
    pdfmakeContent.text = cleanUnsupportedChars(pdfmakeContent.text);
  }

  pdfmakeContent = removeHtmlDefaultMargins(pdfmakeContent);

  if (Array.isArray(pdfmakeContent)) {
    pdfmakeContent = pdfmakeContent.filter((item) => {
      if (typeof item === "string") return true;
      if (item && typeof item === "object") return item.nodeName;
      return false;
    });
  }

  return [
    ...pdfmakeContent,
    {
      text: "",
      margin: [0, 0, 0, 20],
    },
  ];
}

module.exports = { htmlToFormattedText };
