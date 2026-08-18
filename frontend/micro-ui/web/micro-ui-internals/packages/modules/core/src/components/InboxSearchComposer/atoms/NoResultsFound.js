import React from "react";
import { NoResultsFoundIcon } from "./svgindex";
import { useTranslation } from "react-i18next";

const NoResultsFound = ({ messageKey = "COMMON_NO_RESULTS_FOUND" }) => {
    const {t} = useTranslation();
    return (
        <div className="no-data-found">
              <NoResultsFoundIcon />
              <span className="error-msg">{t(messageKey)}</span>
        </div>
    )
}

export default NoResultsFound;