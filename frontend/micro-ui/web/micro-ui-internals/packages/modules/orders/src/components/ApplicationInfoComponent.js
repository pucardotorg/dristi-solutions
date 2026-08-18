import React from "react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";

const ApplicationInfoComponent = ({ infos, links, className = "" }) => {
  const { t } = useTranslation();
  return (
    <React.Fragment>
      <div className={`application-info ${className}`} style={{ flexWrap: "wrap" }}>
        <div className={`info-row-wrapper ${links && links?.length > 0 ? "with-link" : ""}`}>
          {infos &&
            infos?.map((info, index) => (
              <div className={`info-row`} key={index}>
                <div className="info-key">
                  <h3>{t(info?.key)}</h3>
                </div>
                <div className="info-value" style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <h3>{info?.key === "Received on" ? info?.value : t(info?.value)}</h3>
                  {info?.viewCaseLink && (
                    <Link
                      to={info?.viewCaseLink}
                      onClick={info?.onViewCaseClick}
                      style={{
                        color: "rgb(0, 126, 126)",
                        fontWeight: "700",
                        fontSize: "14px",
                        textDecoration: "underline",
                      }}
                    >
                      ({t("VIEW_CASE")})
                    </Link>
                  )}
                </div>
              </div>
            ))}
        </div>
      </div>
    </React.Fragment>
  );
};

export default ApplicationInfoComponent;
