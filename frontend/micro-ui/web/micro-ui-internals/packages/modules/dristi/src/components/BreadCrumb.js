import React from "react";
import PropTypes from "prop-types";
import { Link } from "react-router-dom";

const Breadcrumb = (props) => {
  function isLastCrumb(index) {
    return index === props.crumbs.length - 1;
  }

  return (
    <ol className={`bread-crumb ${props?.className ? props?.className : ""}`} style={props?.breadcrumbStyle}>
      {props?.crumbs?.map((crumb, ci) => {
        const { isLast } = crumb;
        if (!crumb?.show) return;
        if (crumb?.isBack)
          return (
            <li key={ci} style={{ ...props.style }} className="bread-crumb--item">
              <span style={{ cursor: "pointer" }} onClick={() => window.history.back()}>
                {crumb.content}
              </span>
            </li>
          );
        return (
          <li key={ci} style={isLast ? { color: "#0B0C0C" } : { color: "#007E7E" }} className="bread-crumb--item">
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
};

Breadcrumb.defaultProps = {
  successful: true,
};

export default Breadcrumb;
