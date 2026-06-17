import React from "react";
import PropTypes from "prop-types";

function BoxComplainant({ formData }) {
  return (
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: "20px",
        height: "20px",
      }}
    >
      <h1 style={{ fontSize: "18px", fontWeight: "bold" }}> Complainant {formData?.boxComplainant?.index + 1}</h1>
      <h1 style={{ fontSize: "18px" }}> {formData?.boxComplainant?.firstName}</h1>
    </div>
  );
}

BoxComplainant.propTypes = {
  formData: PropTypes.shape({
    boxComplainant: PropTypes.shape({
      index: PropTypes.number,
      firstName: PropTypes.string,
    }),
  }),
};

export default BoxComplainant;
