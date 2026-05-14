import React from "react";
import PropTypes from "prop-types";
import CustomErrorTooltip from "./CustomErrorTooltip";

const CustomNote = ({ t, infoText }) => {
  return (
    <div className="custom-note-main-div">
      <div className="custom-note-heading-div">
        <CustomErrorTooltip message={"tooltip message"} visible />
        <h2>{t("ES_COMMON_NOTE")}</h2>
      </div>
      <div className="custom-note-info-div">
        <p>{infoText}</p>
      </div>
    </div>
  );
};

CustomNote.propTypes = {
  t: PropTypes.func,
  infoText: PropTypes.string,
};

export default CustomNote;
