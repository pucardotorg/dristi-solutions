import PropTypes from "prop-types";
import React, { useState } from "react";

function NoticeAccordion({ title, children }) {
  const [isOpen, setIsOpen] = useState(false);

  const toggleAccordion = () => {
    setIsOpen((prev) => !prev);
  };

  const styles = {
    container: {
      border: "1px solid #ddd",
      borderRadius: "4px",
      overflow: "hidden",
      fontFamily: "sans-serif", // Optional: choose your font
    },
    header: {
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      cursor: "pointer",
      padding: "0.5rem 1rem",
      backgroundColor: "#fce8e8",
      width: "100%",
      border: "none",
      textAlign: "left",
      font: "inherit",
    },
    title: {
      margin: 0,
      fontSize: "1rem",
      flex: 1,
    },
    icon: {
      fontWeight: "bold",
      marginLeft: "1rem",
      fontSize: "1.2rem",
    },
    divider: {
      margin: 0,
      border: "none",
      borderBottom: "1px solid #ddd",
    },
    body: {
      padding: "1rem",
      backgroundColor: "#fff",
    },
  };

  return (
    <div style={styles.container}>
      {/* Accordion Header */}
      <button type="button" aria-expanded={isOpen} style={styles.header} onClick={toggleAccordion}>
        <span style={styles.title}>{title}</span>
        <span style={styles.icon} aria-hidden="true">{isOpen ? "−" : "+"}</span>
      </button>

      {/* Divider (optional) */}
      <hr style={styles.divider} />

      {/* Accordion Body (visible only if isOpen is true) */}
      {isOpen && <div style={styles.body}>{children}</div>}
    </div>
  );
}

NoticeAccordion.propTypes = {
  title: PropTypes.node.isRequired,
  children: PropTypes.node,
};

NoticeAccordion.defaultProps = {
  children: null,
};

export default NoticeAccordion;
