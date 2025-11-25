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

function preprocessQuillHtml(html) {
  const dom = new JSDOM(html);
  const document = dom.window.document;

  document.querySelectorAll("*").forEach((el) => {
    const classes = el.className?.split?.(/\s+/) || [];

    classes.forEach((cls) => {
      if (cls === "ql-align-center") el.style.textAlign = "center";
      if (cls === "ql-align-right") el.style.textAlign = "right";
      if (cls === "ql-align-justify") el.style.textAlign = "justify";

      if (cls.startsWith("ql-indent-")) {
        const level = Number(cls.replace("ql-indent-", ""));
        el.setAttribute("data-indent", level);
      }

      if (cls === "ql-list-bullet") el.setAttribute("data-list", "bullet");
      if (cls === "ql-list-ordered") el.setAttribute("data-list", "ordered");
    });
  });

  const listItems = [...document.querySelectorAll("li")];

  listItems.forEach((li) => {
    const indClass = [...li.classList].find((c) => c.startsWith("ql-indent-"));
    if (!indClass) return;

    const parentList = li.parentElement;
    
    if (!parentList || (parentList.tagName !== "OL" && parentList.tagName !== "UL")) {
        return;
    }

    let prevLi = li.previousElementSibling;
    while (prevLi && prevLi.tagName !== "LI") {
        prevLi = prevLi.previousElementSibling;
    }

    if (prevLi) {
        let nestedList = prevLi.lastElementChild;
        const listTag = parentList.tagName;

        if (!nestedList || (nestedList.tagName !== "OL" && nestedList.tagName !== "UL")) {
            nestedList = document.createElement(listTag);
            prevLi.appendChild(nestedList);
        } else if (nestedList.tagName !== listTag) {
            const newList = document.createElement(listTag);
            nestedList.parentElement.appendChild(newList);
            nestedList = newList;
        }

        if (li.parentElement !== nestedList) {
            nestedList.appendChild(li);
        }
    }
    
    li.classList.remove(indClass);
    li.removeAttribute("data-indent");
  });

  return document.body.innerHTML;
}

function cleanUnsupportedChars(str) {
  return str
    .replace(/\uFFFC/g, "")
    .replace(/\u2028/g, "\n")
    .replace(/\u2029/g, "\n")
    .replace(/\u00A0/g, " ")
    .replace(/[^\S\n]+/g, " ");
}

function applyIndentation(node) {
  if (!node) return node;

  if (Array.isArray(node)) {
    return node.map((item) => applyIndentation(item));
  }

  if (typeof node === "object") {
    if (node["data-indent"] !== undefined) {
      const level = Number(node["data-indent"]);
      node.margin = node.margin || [0, 0, 0, 0];
      node.margin[0] = level * 20;
    }

    Object.keys(node).forEach((key) => {
      node[key] = applyIndentation(node[key]);
    });
  }

  return node;
}


function removeHtmlDefaultMargins(node) {
  if (node && typeof node === "object") {
    if (node.nodeName) {
      if (node.nodeName === "P") node.margin = [0, 0, 0, 8];
      if (node.nodeName === "UL" || node.nodeName === "OL")
        node.margin = [20, 8, 0, 8];
      if (node.nodeName === "LI") node.margin = [0, 4, 0, 4];
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

  cleanHtml = cleanHtml.replace(/style="([^"]*)"/gi, (m, p1) => {
    const filtered = stripFontStyles(p1);
    return filtered ? `style="${filtered}"` : "";
  });

  cleanHtml = preprocessQuillHtml(cleanHtml);

  let pdf = htmlToPdfmake(cleanHtml, { window });

  if (Array.isArray(pdf)) {
    pdf = pdf.map((c) =>
      typeof c.text === "string"
        ? { ...c, text: cleanUnsupportedChars(c.text) }
        : c
    );
  } else if (pdf?.text) {
    pdf.text = cleanUnsupportedChars(pdf.text);
  }

  pdf = applyIndentation(pdf);
  pdf = removeHtmlDefaultMargins(pdf);

  if (Array.isArray(pdf)) {
    pdf = pdf.filter((item) => {
      if (typeof item === "string") return true;
      if (item && typeof item === "object") {
        return item.nodeName || item.ul || item.ol || item.text;
      }
      return false;
    });
  }

  return [...pdf, { text: "", margin: [0, 0, 0, 20] }];
}

module.exports = { htmlToFormattedText };