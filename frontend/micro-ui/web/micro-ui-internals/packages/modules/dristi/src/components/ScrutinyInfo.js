import React from "react";
import PropTypes from "prop-types";
import { FSOErrorIcon } from "../icons/svgIndex";

function ScrutinyInfo({ config, t }) {
  return (
    <div style={{ backgroundColor: config?.populators?.isWarning ? "#FDF2DE" : "#fce8e8", marginBottom: 8, padding: 6, borderRadius: 5 }}>
      <div style={{ display: "flex", justifyContent: "flex-start", alignItems: "center", gap: "10px", marginBottom: 8 }}>
        <FSOErrorIcon color={config?.populators?.isWarning ? "#443627" : "#BB2C2F"} />
        <div style={{ fontWeight: 700 }}>{config?.populators?.isWarning ? t("WARNING") : t("CS_FSO_MARKED_ERROR")}</div>
      </div>
      {t(config.populators.scrutinyMessage)}
    </div>
  );
}

ScrutinyInfo.propTypes = {
  config: PropTypes.shape({
    populators: PropTypes.shape({
      isWarning: PropTypes.bool,
      scrutinyMessage: PropTypes.string.isRequired,
    }).isRequired,
  }).isRequired,
  t: PropTypes.func.isRequired,
};

export default ScrutinyInfo;
