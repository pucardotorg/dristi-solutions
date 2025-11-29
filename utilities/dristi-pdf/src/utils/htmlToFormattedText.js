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


function getNestedDepth(element) {
  let depth = 0;
  let parent = element.parentElement;
  
  while (parent) {
    if (parent.tagName === "OL" || parent.tagName === "UL") {
      depth++;
    }
    parent = parent.parentElement;
  }
  
  return depth;
}

function restructureNestedLists(document) {
  
  document.querySelectorAll("li").forEach(li => {
    // Check if we're in a UL or OL
    let parentList = li.parentElement;
    if (parentList.tagName === "UL") {
      li.setAttribute("data-list", "bullet");
    } else if (parentList.tagName === "OL") {
      li.setAttribute("data-list", "ordered");
    }
  });

  
  const listItems = [...document.querySelectorAll("li")];
  
  
  const itemsByContainer = {};
  listItems.forEach(li => {
    const container = li.parentElement;
    if (!itemsByContainer[container.tagName]) {
      itemsByContainer[container.tagName] = [];
    }
    itemsByContainer[container.tagName].push(li);
  });
  
  
  const sortedItems = [...listItems].sort((a, b) => {
    const aIndent = parseInt(a.getAttribute("data-indent") || "0");
    const bIndent = parseInt(b.getAttribute("data-indent") || "0");
    return aIndent - bIndent;
  });
  
  
  const itemsByIndent = {};
  sortedItems.forEach(li => {
    const indent = parseInt(li.getAttribute("data-indent") || "0");
    if (!itemsByIndent[indent]) itemsByIndent[indent] = [];
    itemsByIndent[indent].push(li);
  });
  
  
  const indentLevels = Object.keys(itemsByIndent).map(Number).sort((a, b) => a - b);
  
  
  for (let level = Math.max(...indentLevels); level > 0; level--) {
    const items = itemsByIndent[level] || [];
    
    for (const li of items) {
      
      let parentListTag;
      
      
      const parentElement = li.parentElement;
      if (parentElement) {
        parentListTag = parentElement.tagName;
        
        li.setAttribute("data-parent-list-type", parentListTag);
      }
      
      
      if (!parentListTag) {
        const isOrderedList = li.getAttribute("data-list") === "ordered";
        parentListTag = isOrderedList ? "OL" : "UL";
      }
      
      
      li.setAttribute("data-list-type", parentListTag);
      
      
      let currentNode = li.previousElementSibling;
      let parentItem = null;
      
      while (currentNode && !parentItem) {
        const currentIndent = parseInt(currentNode.getAttribute("data-indent") || "0");
        if (currentIndent < level && currentNode.tagName === "LI") {
          parentItem = currentNode;
        }
        currentNode = currentNode.previousElementSibling;
      }
      
      if (parentItem) {
        
        let targetList = null;
        for (let i = 0; i < parentItem.children.length; i++) {
          const child = parentItem.children[i];
          if (child.tagName === parentListTag) {
            targetList = child;
            break;
          }
        }
        
        
        if (!targetList) {
          targetList = document.createElement(parentListTag);
          
          
          if (parentListTag === "OL") {
            const nestLevel = getNestedDepth(parentItem) + 1;
            switch (nestLevel % 3) {
              case 0: targetList.style.listStyleType = "decimal"; break;
              case 1: targetList.style.listStyleType = "lower-alpha"; break;
              case 2: targetList.style.listStyleType = "lower-roman"; break;
            }
          } else {
            
            targetList.style.listStyleType = "disc";
            
            targetList.setAttribute("data-original-type", "UL");
          }
          
          parentItem.appendChild(targetList);
        }
        
        
        targetList.appendChild(li);
      }
    }
  }
  
  // Set appropriate list styles for top-level lists too
  document.querySelectorAll("ol").forEach(ol => {
    if (!ol.style.listStyleType) {
      const level = getNestedDepth(ol);
      switch (level % 3) {
        case 0: ol.style.listStyleType = "decimal"; break;
        case 1: ol.style.listStyleType = "lower-alpha"; break;
        case 2: ol.style.listStyleType = "lower-roman"; break;
      }
    }
  });
  
  // Clean up - remove data attributes we added for processing
  listItems.forEach(li => {
    li.removeAttribute("data-indent");
    li.removeAttribute("data-list");
  });
}

function preprocessQuillHtml(html) {
  const dom = new JSDOM(html);
  const document = dom.window.document;

  // Process Quill styling classes
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

  // Preserve leading spaces in paragraphs
  document.querySelectorAll("p").forEach(p => {
    // Only preserve spaces if the paragraph is not empty
    if (p.textContent.trim().length > 0) {
      // Set white-space CSS property to preserve spaces
      p.style.whiteSpace = "pre-wrap";
    }
  });

  // First, ensure all list items have proper list-style-type
  document.querySelectorAll("ol").forEach(ol => {
    
    let nestingLevel = 0;
    let parent = ol.parentElement;
    while (parent) {
      if (parent.tagName === "OL" || parent.tagName === "UL") {
        nestingLevel++;
      }
      parent = parent.parentElement;
    }
    
    // Set list style based on nesting level
    switch (nestingLevel % 3) {
      case 0: ol.style.listStyleType = "decimal"; break;
      case 1: ol.style.listStyleType = "lower-alpha"; break;
      case 2: ol.style.listStyleType = "lower-roman"; break;
    }
  });
  
  document.querySelectorAll("ul").forEach(ul => {
    
    let nestingLevel = 0;
    let parent = ul.parentElement;
    while (parent) {
      if (parent.tagName === "OL" || parent.tagName === "UL") {
        nestingLevel++;
      }
      parent = parent.parentElement;
    }
    
    
    ul.style.listStyleType = "disc";
  });

  
  restructureNestedLists(document);
  
  return document.body.innerHTML;
}

function cleanUnsupportedChars(str) {
  return str
    .replace(/\uFFFC/g, "") // Remove object replacement character
    // Don't collapse whitespace to preserve spacing
    // .replace(/\s+/g, " ") 
    .replace(/[\u200B-\u200D\uFEFF]/g, ""); // Remove zero-width spaces
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



function getOrderedListStyleForLevel(level) {
  switch ((level - 1) % 3) {
    case 0: return "decimal";      // 1, 2, 3
    case 1: return "lower-alpha"; // a, b, c
    case 2: return "lower-roman"; // i, ii, iii
    default: return "decimal";
  }
}

// Helper function to get unordered list bullet style based on nesting level

function getUnorderedListStyleForLevel(level) {
  return "disc";
}


function fixNestedLists(pdfContent) {
  
  const processedObjects = new WeakSet();
  
  
  function fixListTypes(node, parentType = null) {
    
    if (!node) return node;
    
    
    if (typeof node !== "object") return node;
    
    
    if (processedObjects.has(node)) {
      return node; // Already processed this node, skip to avoid recursion
    }
    
    
    processedObjects.add(node);
    
    
    if (Array.isArray(node)) {
      return node.map(item => fixListTypes(item, parentType));
    }
    
    
    const isUnorderedItem = 
      (node.style && Array.isArray(node.style) && node.style.includes("html-ul")) ||
      node._isUnorderedItem ||
      (parentType === "UL");
    
    
    if (isUnorderedItem && node.ol && !node.ul) {
      
      node.ul = node.ol;
      delete node.ol;
      
      
      node.type = "disc";
      if (node.listStyleType) {
        node.listStyleType = "disc";
      }
    }
    
    
    if (node.ul) {
      node.ul = node.ul.map(item => fixListTypes(item, "UL"));
    }
    
    if (node.ol) {
      node.ol = node.ol.map(item => fixListTypes(item, "OL"));
    }
    
    
    Object.keys(node).forEach(key => {
      if (key !== "ul" && key !== "ol" && key !== "_parent" && 
          typeof node[key] === "object" && node[key] !== null) {
        node[key] = fixListTypes(node[key], parentType);
      }
    });
    
    return node;
  }
  
  return fixListTypes(pdfContent);
}

// Force correct list style type based on nesting level
function forceListStyleTypes(pdfContent) {
  if (!pdfContent) return pdfContent;
  
  
  const processedObjects = new WeakSet();
  
  
  function processWithContext(node, context = { level: 0, path: [], isOrderedList: null }) {
    if (!node) return node;
    
    // Skip if null or not an object
    if (node === null || typeof node !== "object") return node;
    
    
    if (processedObjects.has(node)) {
      return node; // Already processed this object, skip to avoid recursion
    }
    
    
    processedObjects.add(node);
    
    // Process arrays
    if (Array.isArray(node)) {
      return node.map(item => processWithContext(item, context));
    }
    
    
    const isExplicitlyUnordered = 
      
      (node.style && (
        node.style.includes("html-ul") || 
        node.style === "html-ul" || 
        (Array.isArray(node.style) && node.style.includes("html-ul"))
      )) ||
      
      node._isUnorderedItem ||
      
      node.ul != null ||
      
      context.isOrderedList === false;
    
    
    if (node.ol && !isExplicitlyUnordered) {
      
      const newLevel = context.level + 1;
      const listType = getOrderedListStyleForLevel(newLevel);
      
      
      node.type = listType;
      
      
      const newContext = { 
        level: newLevel, 
        path: [...context.path, "ol"],
        listType,
        isOrderedList: true
      };
      
      node.ol = node.ol.map(item => {
        
        if (item && typeof item === "object") {
          item._listType = listType;
          item._parentListType = "OL";
          if (item.listStyleType) {
            item.listStyleType = listType;
          }
        }
        return processWithContext(item, newContext);
      });
    } 
    
    
    else if (node.ul || isExplicitlyUnordered) {
      
      const newLevel = context.level + 1;
      const bulletType = getUnorderedListStyleForLevel(newLevel);
      
      
      node.type = bulletType;
      
      
      const newContext = { 
        level: newLevel, 
        path: [...context.path, "ul"],
        listType: bulletType,
        isOrderedList: false
      };
      
      
      if (node.ul) {
        node.ul = node.ul.map(item => {
          
          if (item && typeof item === "object") {
            item._isUnorderedItem = true;
            item._parentListType = "UL";
            
            if (item.listStyleType) {
              item.listStyleType = bulletType;
            }
          }
          return processWithContext(item, newContext);
        });
      }
      
      
      if (node.ol && isExplicitlyUnordered) {
        
        if (!node.ul) node.ul = [];
        node.ol.forEach(item => {
          if (item && typeof item === "object") {
            item._isUnorderedItem = true;
            item._parentListType = "UL";
          }
          node.ul.push(processWithContext(item, newContext));
        });
        delete node.ol;
      }
    }
    
    
    if (node.listStyleType) {
      if (context.isOrderedList === false || node._isUnorderedItem || 
          node._parentListType === "UL" || isExplicitlyUnordered) {
        
        const bulletType = getUnorderedListStyleForLevel(context.level);
        node.listStyleType = bulletType;
      } else if (context.listType) {
        node.listStyleType = context.listType;
      }
    }
    
    
    Object.keys(node).forEach(key => {
      if (key !== "ol" && key !== "ul" && key !== "_parent" && 
          key !== "style" && 
          typeof node[key] === "object" && node[key] !== null) {
        node[key] = processWithContext(node[key], context);
      }
    });
    
    
    return node;
  }
  
  return processWithContext(pdfContent);
}

// Add parent references for tracking nesting depth
function addParentReferences(pdfContent) {
  if (!pdfContent) return pdfContent;
  
  // Process arrays
  if (Array.isArray(pdfContent)) {
    return pdfContent.map(item => addParentReferences(item));
  }
  
  // Process objects
  if (typeof pdfContent === "object") {
    // Add parent references to list items
    if (pdfContent.ol) {
      pdfContent.ol = pdfContent.ol.map(item => {
        if (typeof item === "object") item._parent = pdfContent;
        return addParentReferences(item);
      });
    }
    
    if (pdfContent.ul) {
      pdfContent.ul = pdfContent.ul.map(item => {
        if (typeof item === "object") item._parent = pdfContent;
        return addParentReferences(item);
      });
    }
    
    // Process other properties
    Object.keys(pdfContent).forEach(key => {
      if (key !== "_parent" && key !== "ol" && key !== "ul" && typeof pdfContent[key] === "object") {
        pdfContent[key] = addParentReferences(pdfContent[key]);
      }
    });
  }
  
  return pdfContent;
}


function removeParentReferences(pdfContent) {
  if (!pdfContent) return pdfContent;
  
  if (Array.isArray(pdfContent)) {
    return pdfContent.map(item => removeParentReferences(item));
  }
  
  if (typeof pdfContent === "object") {
    
    if (pdfContent._parent) {
      delete pdfContent._parent;
    }
    
    
    if (pdfContent.ol && pdfContent._listType) {
      pdfContent.type = pdfContent._listType;
    }
    
    // Process all properties recursively
    Object.keys(pdfContent).forEach(key => {
      if (typeof pdfContent[key] === "object") {
        pdfContent[key] = removeParentReferences(pdfContent[key]);
      }
    });
  }
  
  return pdfContent;
}

function htmlToFormattedText(input) {
  const isHtml = /<\/?[a-z][\s\S]*>/i.test(input);
  if (!isHtml) return cleanUnsupportedChars(input);

  let cleanHtml = DOMPurify.sanitize(input);
  cleanHtml = cleanHtml.replace(/&nbsp;/g, " ").replace(/\u00A0/g, " ");

  cleanHtml = cleanHtml.replace(/style="([^"]*)"/gi, (m, p1) => {
    const filtered = stripFontStyles(p1);
    return filtered ? `style="${filtered}"` : "";
  });

  cleanHtml = preprocessQuillHtml(cleanHtml);

  // Configure html-to-pdfmake options to preserve whitespace
  const htmlToPdfmakeOptions = { 
    window,
    preserveWhitespace: true
  };

  let pdf = htmlToPdfmake(cleanHtml, htmlToPdfmakeOptions);

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
  
  
  pdf = addParentReferences(pdf);
  
  
  pdf = fixNestedLists(pdf);
  
  
  pdf = forceListStyleTypes(pdf);
  
  
  pdf = removeParentReferences(pdf);
  
  
  

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