import React from "react";
import PropTypes from "prop-types";
import { Link } from "react-router-dom";

// This is a React component named `BreadCrumbNew` that renders a breadcrumb navigation UI.
// It accepts props to customize the breadcrumb's appearance and behavior, including the list of crumbs, styles, and class names.

// The `handleClick` function is used to handle click events on breadcrumb links.
// It prevents the default behavior of the link and redirects the user to the URL specified in the crumb object.

// The component renders an ordered list (`<ol>`) with a class name and inline styles passed via props.
// Each breadcrumb item is rendered as a list item (`<li>`):
// 1. If the item is the last breadcrumb in the list, it is displayed as plain text with a specific style.
// 2. Otherwise, it is rendered as a clickable link using the `Link` component from `react-router-dom`.
//    - The `onClick` event for the link is handled by the `handleClick` function to perform the redirection.

// PropTypes are defined to validate the `crumbs` prop, ensuring it is an array.
// Default props are provided, including a `successful` flag set to `true` by default.

// This component is designed to be reusable and customizable, allowing developers to pass different breadcrumb data and styles.

const BreadCrumbNew = (props) => {
  console.log(props, "props");

  const handleClick = (evt,crumb) => {
    evt.preventDefault();
    window.location.href = crumb.url;
  };

  return (
    <ol className={`bread-crumb ${props?.className ? props?.className : ""}`} style={props?.breadcrumbStyle}>
      {props?.crumbs?.map((crumb, ci) => {
        const isLast = ci === props?.crumbs?.length - 1;
        return (
          <li key={crumb.label} style={isLast ? { color: "#0B0C0C" } : { color: "#007E7E" }} className="bread-crumb--item">
            {isLast ? (
              <span style={props?.spanStyle ? { ...props?.spanStyle } : {}}>{crumb.label}</span>
            ) : (
              <Link to={{ pathname: crumb.url }} onClick={(evt) => handleClick(evt,crumb)}>{crumb.label}</Link>
            )}
          </li>
        );
      })}
    </ol>
  );
};

BreadCrumbNew.propTypes = {
  crumbs: PropTypes.array,
};

BreadCrumbNew.defaultProps = {
  successful: true,
};

export default BreadCrumbNew;
