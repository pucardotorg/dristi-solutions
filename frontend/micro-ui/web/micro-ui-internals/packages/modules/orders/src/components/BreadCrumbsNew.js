/**
 * @fileoverview Custom breadcrumb component that supports dynamic navigation
 * and handles external API redirections through breadcrumbs
 */

import React from "react";
import PropTypes from "prop-types";
import { Link } from "react-router-dom";

/**
 * Enhanced breadcrumb component that supports dynamic navigation based on case context
 * @param {Object} props - Component props
 * @param {Array} props.crumbs - Array of breadcrumb items with content and path
 * @param {string} props.className - Optional CSS class for styling
 * @param {Object} props.style - Optional inline styles for breadcrumb items
 * @param {Object} props.spanStyle - Optional inline styles for text spans
 */
const Breadcrumb = (props) => {
  /**
   * Determines if the current crumb is the last one in the list
   * @param {number} index - Current crumb index
   * @returns {boolean} - True if this is the last crumb
   */
  function isLast(index) {
    return index === props.crumbs.length - 1;
  }
  /**
   * Handles redirection for breadcrumb navigation
   * This method is specifically added to handle external API redirections through breadcrumbs
   * It constructs the full URL using the current origin and the crumb's path
   *
   * @param {Event} ev - Click event
   * @param {Object} crumb - Breadcrumb item with path information
   */
  function handleRedirect(ev, crumb) {
    ev.preventDefault();
    const host = window.location.origin; // Dynamically get the base URL
    window.location.href = `${host}${crumb.path}`;
  }

  return (
    <ol className={`bread-crumb ${props?.className ? props?.className : ""}`}>
      {props?.crumbs?.map((crumb, ci) => {
        return (
          <li key={ci} style={{ ...props.style }} className="bread-crumb--item">
            {/* Render as plain text if it's the last item or has no path */}
            {isLast(ci) || !crumb?.path ? (
              <span style={props?.spanStyle ? { ...props?.spanStyle, color: "#0B0C0C" } : { color: "#0B0C0C" }}>{crumb.content}</span>
            ) : (
              /* Otherwise render as a link with the custom redirect handler */
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

/**
 * PropTypes for type checking
 */
Breadcrumb.propTypes = {
  crumbs: PropTypes.array,
};

/**
 * Default props
 */
Breadcrumb.defaultProps = {
  successful: true,
};

export default Breadcrumb;
