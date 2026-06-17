import { CheckBox } from "@egovernments/digit-ui-react-components";
import PropTypes from "prop-types";
import React, { Fragment } from "react";

function CheckboxItem({ name, checked, onToggle, t }) {
  return (
    <CheckBox
      onChange={onToggle}
      checked={checked}
      value={t(name)}
      label={name}
      name={"Checkbox"}
      styles={{ alignItems: "center", textAlign: "center" }}
    />
  );
}

CheckboxItem.propTypes = {
  name: PropTypes.string.isRequired,
  checked: PropTypes.bool.isRequired,
  onToggle: PropTypes.func.isRequired,
  t: PropTypes.func.isRequired,
};

function DependentFields({ t, option, selectedValues, handleInputChange }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", margin: "10px 0px" }}>
      <span style={{ display: "flex", flexDirection: "row", gap: "5px", alignItems: "center" }}>
        <h2>{t("SELECT_ONE_OR_MORE")}</h2>
        <span style={{ fontWeight: "700" }}>{t(option.dependentText)}</span>
      </span>
      <div style={{ display: "flex", flexDirection: "row", gap: "30px", maxHeight: "40px" }}>
        {option?.dependentFields?.map((field) => (
          <div key={`${field.name}-${field.individualId}`} style={{ display: "flex", flexDirection: "row", gap: "40px", justifyContent: "flex-start" }}>
            <label>
              <CheckBox
                value={JSON.stringify(field)}
                label={field.name}
                name={"Checkbox"}
                checked={
                  (selectedValues?.attendees?.map((attendee) => JSON.parse(attendee).individualId).includes(field.individualId) &&
                    selectedValues?.attendees?.map((attendee) => JSON.parse(attendee).name).includes(field.name)) ||
                  false
                }
                onChange={(e) => handleInputChange(e, option?.name)}
                styles={{ alignItems: "center", textAlign: "center" }}
              />
            </label>
          </div>
        ))}
      </div>
    </div>
  );
}

const optionShape = PropTypes.shape({
  name: PropTypes.string,
  dependentText: PropTypes.string,
  dependentFields: PropTypes.array,
});

const selectedAttendeesShape = PropTypes.shape({
  attendees: PropTypes.arrayOf(PropTypes.string),
});

DependentFields.propTypes = {
  t: PropTypes.func.isRequired,
  option: optionShape.isRequired,
  selectedValues: selectedAttendeesShape,
  handleInputChange: PropTypes.func.isRequired,
};

function DependentCheckBoxComponent({ t, options, onInputChange, selectedValues }) {
  const toggleCheckbox = (option) => {
    const updatedValues = {
      ...selectedValues,
      [option]: selectedValues[option] ? null : { attendees: [] },
    };
    onInputChange(updatedValues);
  };

  const handleInputChange = (e, option) => {
    const { value, checked } = e.target;
    const attendeeIds = selectedValues[option].attendees.map((attendee) => JSON.parse(attendee).individualId);
    const index = attendeeIds.indexOf(JSON.parse(value).individualId);
    const newSelectedValues = {
      ...selectedValues,
      [option]: {
        attendees: checked
          ? [...selectedValues[option].attendees, value]
          : [...selectedValues[option].attendees.slice(0, index), ...selectedValues[option].attendees.slice(index + 1)],
      },
    };
    onInputChange(newSelectedValues);
  };

  return (
    <div className="select-checkbox-dependent">
      <div className="select-checkbox-dependent-child">
        <div className="select-between-compl-or-resp" style={{ display: "flex", flexDirection: "row", gap: "30px", maxHeight: "40px" }}>
          {options?.checkBoxes
            ?.filter((option) => option?.dependentFields?.length)
            .map((option) => (
              <div key={option?.name} style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
                <CheckboxItem t={t} name={t(option?.name)} checked={!!selectedValues[option?.name]} onToggle={() => toggleCheckbox(option?.name)} />
              </div>
            ))}
        </div>
        <div className="compl-resp-combined-div">
          {options?.checkBoxes?.map(
            (option) =>
              option?.dependentFields && (
                <Fragment key={option?.name}>
                  {selectedValues[option?.name] && (
                    <DependentFields t={t} option={option} selectedValues={selectedValues[option?.name]} handleInputChange={handleInputChange} />
                  )}
                </Fragment>
              )
          )}
        </div>
      </div>
    </div>
  );
}

DependentCheckBoxComponent.propTypes = {
  t: PropTypes.func.isRequired,
  options: PropTypes.shape({
    checkBoxes: PropTypes.arrayOf(optionShape),
  }),
  onInputChange: PropTypes.func.isRequired,
  selectedValues: PropTypes.object,
};

export default DependentCheckBoxComponent;
