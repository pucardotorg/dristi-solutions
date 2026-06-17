import React, { useState } from "react";
import PropTypes from "prop-types";
import { CardSubHeader } from "@egovernments/digit-ui-react-components";
import { CopyIcon } from "../icons/svgIndex";

function fallbackCopyTextToClipboard(text) {
  const textArea = document.createElement("textarea");
  textArea.value = text;

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
  const partitionData = (items) => {
    const result = [];
    for (let i = 0; i < items.length; i += column) {
      result.push(items.slice(i, i + column));
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
              {partitionData(data).map((row) => (
                <tr key={row[0]?.key}>
                  {row.map(({ key, value, prefix, copyData }) => (
                    <td key={key} className={`${props?.tableDataClassName} column-${column}`}>
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

CustomCaseInfoDiv.propTypes = {
  t: PropTypes.func,
  data: PropTypes.arrayOf(
    PropTypes.shape({
      key: PropTypes.string,
      value: PropTypes.string,
      prefix: PropTypes.string,
      copyData: PropTypes.bool,
    })
  ),
  column: PropTypes.number,
  children: PropTypes.node,
  style: PropTypes.object,
  tableDataClassName: PropTypes.string,
  tableValueClassName: PropTypes.string,
};

export default CustomCaseInfoDiv;
