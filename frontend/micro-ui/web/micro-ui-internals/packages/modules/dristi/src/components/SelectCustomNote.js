import PropTypes from "prop-types";
import React, { useMemo } from "react";
import CustomErrorTooltip from "./CustomErrorTooltip";
import { useHistory } from "react-router-dom/cjs/react-router-dom.min";

const inputShape = PropTypes.shape({
  infoHeader: PropTypes.string,
  infoText: PropTypes.string,
  infoTooltipMessage: PropTypes.string,
  linkText: PropTypes.string,
  key: PropTypes.string,
  caseId: PropTypes.string,
  filingNumber: PropTypes.string,
  tab: PropTypes.string,
  customFunction: PropTypes.func,
  showTooltip: PropTypes.bool,
  children: PropTypes.node,
});

function SelectCustomNote({ t, config, onClick = () => {} }) {
  const history = useHistory();
  const inputs = useMemo(
    () =>
      config?.populators?.inputs || [
        {
          infoHeader: "Note",
          infoText: "Basic Note",
          infoTooltipMessage: "Basic Note",
          type: "InfoComponent",
        },
      ],
    [config?.populators?.inputs]
  );

  const contextPath = typeof window !== "undefined" && window.contextPath ? window.contextPath : "";

  return inputs.map((input) => {
    const linkKey = input?.key ?? input?.infoHeader ?? input?.infoText;
    return (
      <div key={linkKey} className="custom-note-main-div" style={config?.styles}>
        <div className="custom-note-heading-div">
          <CustomErrorTooltip message={t(input?.infoTooltipMessage)} showTooltip={Boolean(input?.infoTooltipMessage) || input?.showTooltip} />
          <h2>{t(input?.infoHeader)}</h2>
        </div>
        {(input?.infoText || input?.linkText) && (
          <div className="custom-note-info-div">
            <p>
              {`${t(input?.infoText)} `}
              {!input?.key && <br />}
              {input?.linkText && (
                <button
                  type="button"
                  style={{
                    color: "#007E7E",
                    cursor: "pointer",
                    textDecoration: "underline",
                    background: "none",
                    border: "none",
                    padding: 0,
                    font: "inherit",
                  }}
                  onClick={() => {
                    if (input.key === "witnessNote" || input.key === "evidenceNote") {
                      if (input?.customFunction) {
                        input?.customFunction();
                      }
                      history.push(
                        `/${contextPath}/employee/dristi/home/view-case?caseId=${input?.caseId}&filingNumber=${input?.filingNumber}&tab=${input?.tab}`
                      );
                    } else {
                      onClick();
                    }
                  }}
                >
                  {String(t(input?.linkText))}
                </button>
              )}
            </p>
          </div>
        )}
        {input?.children}
      </div>
    );
  });
}

SelectCustomNote.propTypes = {
  t: PropTypes.func.isRequired,
  config: PropTypes.shape({
    styles: PropTypes.object,
    populators: PropTypes.shape({
      inputs: PropTypes.arrayOf(inputShape),
    }),
  }).isRequired,
  onClick: PropTypes.func,
};

export default SelectCustomNote;
