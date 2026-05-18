/**
 * Shared breadcrumb implementation used by hearings / orders / submissions module wrappers.
 *
 * The wrappers customise only:
 *   - `liColor`  → the `<li>` text color (hearings + submissions tint cyan, orders does not).
 *   - `formatContent` → an optional transform applied to non-link crumb text (submissions uses
 *     this to title-case dash-separated tokens).
 *
 * The link rendering, last-item handling and `handleRedirect` logic are identical across the
 * three previous copies, so they live here once.
 */

import React from "react";
import PropTypes from "prop-types";
import { Link } from "react-router-dom";

const AppBreadcrumb = ({ crumbs, className, style, spanStyle, liColor, formatContent }) => {
  const isLast = (index) => index === crumbs.length - 1;

  const handleRedirect = (ev, crumb) => {
    ev.preventDefault();
    const host = window.location.origin;
    window.location.href = `${host}${crumb.path}`;
  };

  return (
    <ol className={`bread-crumb ${className ? className : ""}`}>
      {crumbs?.map((crumb, ci) => {
        const liStyle = liColor ? { ...style, color: liColor } : { ...style };
        const text = formatContent ? formatContent(crumb.content) : crumb.content;
        return (
          <li key={ci} style={liStyle} className="bread-crumb--item">
            {isLast(ci) || !crumb?.path ? (
              <span style={spanStyle ? { ...spanStyle, color: "#0B0C0C" } : { color: "#0B0C0C" }}>{text}</span>
            ) : (
              <Link to={{ pathname: crumb.path }} onClick={(ev) => handleRedirect(ev, crumb)}>
                {crumb.content}
              </Link>
            )}
          </li>
        );
      })}
    </ol>
  );
};

AppBreadcrumb.propTypes = {
  crumbs: PropTypes.array,
};

AppBreadcrumb.defaultProps = {
  successful: true,
};

export default AppBreadcrumb;
