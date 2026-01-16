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

  return inputs.map((input) => {
    return (
      <div style={config?.styles}>
        <span style={input?.textStyles}>{t(input?.infoText)}</span>
      </div>
    );
  });
}

export default CustomText;
