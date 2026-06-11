import React from "react";
import PropTypes from "prop-types";
import { Link } from "react-router-dom";

const Breadcrumb = (props) => {
  return (
    <ol className={`bread-crumb ${props?.className ? props?.className : ""}`} style={props?.breadcrumbStyle}>
      {props?.crumbs?.map((crumb, ci) => {
        const { isLast } = crumb;
        if (!crumb?.show) return null;
        if (crumb?.isBack)
          return (
            <li key={crumb.content || ci} style={{ ...props.style }} className="bread-crumb--item">
              <button
                type="button"
                style={{ cursor: "pointer", background: "none", border: "none", padding: 0 }}
                onClick={() => globalThis.history.back()}
              >
                {crumb.content}
              </button>
            </li>
          );
        return (
          <li key={crumb.path || ci} style={isLast ? { color: "#0B0C0C" } : { color: "#007E7E" }} className="bread-crumb--item">
            {isLast || !crumb?.path ? (
              <span style={props?.spanStyle ? { ...props?.spanStyle } : {}}>{crumb.content}</span>
            ) : (
              <Link
                to={{
                  pathname: crumb.path,
                  state: { count: crumb?.count, homeFilteredData: crumb?.homeFilteredData, homeActiveTab: crumb?.homeActiveTab },
                  search: crumb?.query,
                }}
              >
                {crumb.content}
              </Link>
            )}
          </li>
        );
      })}
    </ol>
  );
};

Breadcrumb.propTypes = {
  crumbs: PropTypes.array,
  className: PropTypes.string,
  breadcrumbStyle: PropTypes.object,
  style: PropTypes.object,
  spanStyle: PropTypes.object,
};

export default Breadcrumb;
