import React from "react";
import { LabelFieldPair, CardHeader, CardLabelError } from "@egovernments/digit-ui-react-components";

/**
 * Renders the "Mark who is present" and "Mark who is absent" checkbox groups
 * with attendance error display.
 * Extracted from GenerateOrdersV2.js for maintainability.
 */
const AttendanceSection = ({
  t,
  attendeesOptions,
  presentAttendees,
  absentAttendees,
  setPresentAttendees,
  setAbsentAttendees,
  setErrors,
  setCurrentOrder,
  currentOrder,
  ErrorAttendeesKey,
  errors,
}) => {
  return (
    <React.Fragment>
      <LabelFieldPair style={{ width: "100%", display: "flex", flexDirection: "column", alignItems: "left" }}>
        <CardHeader styles={{ fontSize: "16px", fontWeight: "bold" }}>{t("MARK_WHO_IS_PRESENT")}</CardHeader>

        <div className="checkbox-group">
          {attendeesOptions?.map((option, index) => (
            <div className="checkbox-item" key={index}>
              <input
                id={`present-${option.code}`}
                type="checkbox"
                className="custom-checkbox"
                onChange={(e) => {
                  let updatedPresentAttendees;
                  let updatedAbsentAttendees;
                  if (e.target.checked) {
                    // Add to present attendees
                    updatedPresentAttendees = [...presentAttendees, option];
                    setPresentAttendees(updatedPresentAttendees);

                    // Remove from absent attendees if present there
                    updatedAbsentAttendees = absentAttendees.filter((item) => item.code !== option.code);
                    setAbsentAttendees(updatedAbsentAttendees);
                    setErrors((prevErrors) => {
                      const newErrors = { ...prevErrors };
                      delete newErrors[ErrorAttendeesKey];
                      return newErrors;
                    });
                  } else {
                    // Remove from present attendees
                    updatedPresentAttendees = presentAttendees.filter((item) => item.code !== option.code);
                    setPresentAttendees(updatedPresentAttendees);
                    updatedAbsentAttendees = absentAttendees;
                  }

                  // Update currentOrder.attendance
                  setCurrentOrder({
                    ...currentOrder,
                    attendance: {
                      Present: updatedPresentAttendees.map((item) => item.code),
                      Absent: updatedAbsentAttendees.map((item) => item.code),
                    },
                  });
                }}
                checked={presentAttendees.some((item) => item.code === option.code)}
                disabled={absentAttendees.some((item) => item.code === option.code)}
                style={{ cursor: "pointer", width: "20px", height: "20px" }}
              />
              <label htmlFor={`present-${option.code}`}>{t(option?.name)}</label>
            </div>
          ))}
        </div>
      </LabelFieldPair>

      <LabelFieldPair style={{ width: "100%", display: "flex", flexDirection: "column", alignItems: "left", marginTop: "12px" }}>
        <CardHeader styles={{ fontSize: "16px", fontWeight: "bold" }}>{t("MARK_WHO_IS_ABSENT")}</CardHeader>

        <div className="checkbox-group">
          {attendeesOptions?.map((option, index) => (
            <div className="checkbox-item" key={index}>
              <input
                id={`absent-${option.code}`}
                type="checkbox"
                className="custom-checkbox"
                onChange={(e) => {
                  let updatedPresentAttendees;
                  let updatedAbsentAttendees;

                  if (e.target.checked) {
                    // Add to absent attendees
                    updatedAbsentAttendees = [...absentAttendees, option];
                    setAbsentAttendees(updatedAbsentAttendees);

                    // Remove from present attendees if present there
                    updatedPresentAttendees = presentAttendees?.filter((item) => item?.code !== option?.code);
                    setPresentAttendees(updatedPresentAttendees);
                    setErrors((prevErrors) => {
                      const newErrors = { ...prevErrors };
                      delete newErrors[ErrorAttendeesKey];
                      return newErrors;
                    });
                  } else {
                    // Remove from absent attendees
                    updatedAbsentAttendees = absentAttendees?.filter((item) => item?.code !== option?.code);
                    setAbsentAttendees(updatedAbsentAttendees);
                    updatedPresentAttendees = presentAttendees;
                  }

                  // Update currentOrder.attendance
                  setCurrentOrder({
                    ...currentOrder,
                    attendance: {
                      Present: updatedPresentAttendees.map((item) => item.code),
                      Absent: updatedAbsentAttendees.map((item) => item.code),
                    },
                  });
                }}
                checked={absentAttendees?.some((item) => item?.code === option?.code)}
                disabled={presentAttendees?.some((item) => item?.code === option?.code)}
                style={{ cursor: "pointer", width: "20px", height: "20px" }}
              />
              <label htmlFor={`absent-${option.code}`}>{t(option?.name)}</label>
            </div>
          ))}
        </div>
        {errors[ErrorAttendeesKey] && <CardLabelError> {t(errors[ErrorAttendeesKey]?.msg || "CORE_REQUIRED_FIELD_ERROR")} </CardLabelError>}
      </LabelFieldPair>
    </React.Fragment>
  );
};

export default AttendanceSection;
