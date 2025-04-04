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
      <div style={styles.header} onClick={toggleAccordion}>
        <h3 style={styles.title}>{title}</h3>
        <span style={styles.icon}>{isOpen ? "−" : "+"}</span>
      </div>

      {/* Divider (optional) */}
      <hr style={styles.divider} />

      {/* Accordion Body (visible only if isOpen is true) */}
      {isOpen && <div style={styles.body}>{children}</div>}
    </div>
  );
}

export default NoticeAccordion;
