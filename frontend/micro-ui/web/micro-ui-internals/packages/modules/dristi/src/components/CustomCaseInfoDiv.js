import React, { useState } from "react";
import { CardSubHeader } from "@egovernments/digit-ui-react-components";
import { CopyIcon } from "../icons/svgIndex";

function fallbackCopyTextToClipboard(text) {
  const textArea = document.createElement("textarea");
  textArea.value = text;

  // Avoid scrolling to bottom
  textArea.style.top = "0";
  textArea.style.left = "0";
  textArea.style.position = "fixed";

  document.body.appendChild(textArea);
  textArea.focus();
  textArea.select();

  try {
    document.execCommand("copy");
  } catch (err) {
    throw err;
  }

  document.body.removeChild(textArea);
}

const copyToClipboard = (text) => {
  if (!navigator.clipboard) {
    fallbackCopyTextToClipboard(text);
    return;
  }
  navigator.clipboard.writeText(text);
};

const CustomCaseInfoDiv = ({ t, data, column = 3, children, style, ...props }) => {
  const [copied, setCopied] = useState({ isCopied: false, text: "Copied" });
  // Function to partition the data into rows of three items each
  const partitionData = (data) => {
    const result = [];
    for (let i = 0; i < data.length; i += column) {
      result.push(data.slice(i, i + column));
    }
    return result;
  };

  const dataCopy = (isCopied, message, duration = 3000) => {
    setCopied({ isCopied: isCopied, text: message });
    setTimeout(() => {
      setCopied({ isCopied: false, text: "Copied" });
    }, duration);
  };

  return (
    <React.Fragment>
      {data && data.length > 0 && (
        <div className="custom-case-info-div">
          <table>
            <tbody>
              {partitionData(data).map((row, rowIndex) => (
                <tr key={rowIndex}>
                  {row.map(({ key, value, prefix, copyData }, cellIndex) => (
                    <td key={cellIndex} className={`${props?.tableDataClassName} column-${column}`}>
                      <h2 className="case-info-title">{t(key)}</h2>
                      <div className={"case-info-value"}>
                        <span className={props?.tableValueClassName}>{t(prefix ? prefix + value : value)}</span>{" "}
                        {copyData && (
                          <button
                            className="case-info-button"
                            onClick={() => {
                              copyToClipboard(value);
                              dataCopy(true, "Copied");
                            }}
                          >
                            <CopyIcon />
                            {copied.isCopied ? copied.text : "Copy"}
                          </button>
                        )}
                      </div>
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
          {children}
        </div>
      )}
    </React.Fragment>
  );
};

export default CustomCaseInfoDiv;
