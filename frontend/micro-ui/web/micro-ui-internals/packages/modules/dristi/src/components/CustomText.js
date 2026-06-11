import PropTypes from "prop-types";
import React, { useMemo } from "react";

function CustomText({ t, config }) {
  const inputs = useMemo(
    () =>
      config?.populators?.inputs || [
        {
          infoText: "Basic Note",
        },
      ],
    [config?.populators?.inputs]
  );

  return inputs.map((input, idx) => (
    <div key={input?.infoText ?? `custom-text-${idx}`} style={config?.styles}>
      <span style={input?.textStyles}>{t(input?.infoText)}</span>
    </div>
  ));
}

CustomText.propTypes = {
  t: PropTypes.func.isRequired,
  config: PropTypes.shape({
    styles: PropTypes.object,
    populators: PropTypes.shape({
      inputs: PropTypes.arrayOf(
        PropTypes.shape({
          infoText: PropTypes.string,
          textStyles: PropTypes.object,
        })
      ),
    }),
  }).isRequired,
};

export default CustomText;
