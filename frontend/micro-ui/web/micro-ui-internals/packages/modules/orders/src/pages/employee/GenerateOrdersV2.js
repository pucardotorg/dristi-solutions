import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import { useHistory } from "react-router-dom";
import { Header, Button, CheckBox, LabelFieldPair, CardHeader, CardText } from "@egovernments/digit-ui-react-components";

const GenerateOrdersV2 = () => {
  const { t } = useTranslation();
  const history = useHistory();
  // Component state and hooks can be added here as needed
  const [value, setValue] = useState([]);

  const options = [
    { code: "COMPLAINANT", name: "Complainant" },
    { code: "COMPLAINANT_ADVOCATE", name: "Complainant's Advocate" },
    { code: "ACCUSED", name: "Accused" },
    { code: "ACCUSED_ADVOCATE", name: "Accused Advocate" },
  ];
  return (
    <div className="generate-orders-v2-container">
      <Header>{t("Order : Case Ashutosh vs Ranjit")}</Header>

      <div className="generate-orders-v2-content">
        <div className="generate-orders-v2-columns">
          {/* Left Column */}
          <div className="generate-orders-v2-column">
            <div className="generate-orders-v2-section">
              <h2 className="section-header">Mark Who Is Present</h2>
              <div className="checkbox-group">
                <div className="checkbox-item">
                  <input type="checkbox" id="complainant-present" />
                  <label htmlFor="complainant-present">Complainant</label>
                </div>
                <div className="checkbox-item">
                  <input type="checkbox" id="complainant-advocate-present" />
                  <label htmlFor="complainant-advocate-present">Complainant's Advocate</label>
                </div>
                <div className="checkbox-item">
                  <input type="checkbox" id="accused-present" />
                  <label htmlFor="accused-present">Accused</label>
                </div>
                <div className="checkbox-item">
                  <input type="checkbox" id="accused-advocate-present" />
                  <label htmlFor="accused-advocate-present">Accused Advocate</label>
                </div>
              </div>
            </div>

            <LabelFieldPair style={{ width: "100%", display: "flex", flexDirection: "column", alignItems: "center" }}>
              <CardHeader style={{ fontSize: "30px" }} className="card-label-smaller">
                Mark Who Is Present
              </CardHeader>

              <div className="checkbox-group">
                {options?.map((option, index) => (
                  <CheckBox
                    onChange={(e) => {
                      let tempData = value;
                      const isFound = value?.some((val) => val?.code === option?.code);
                      if (isFound) tempData = value?.filter((val) => val?.code !== option?.code);
                      else tempData.push(option);
                      // setFormValue(tempData, input?.name);
                      setValue(tempData);
                    }}
                    key={index}
                    value={value?.find((val) => val?.code === option?.code)}
                    checked={value?.find((val) => val?.code === option?.code)}
                    label={t(option?.name)}
                  />
                ))}
              </div>
            </LabelFieldPair>

            <div className="generate-orders-v2-section">
              <h2 className="section-header">Mark Who Is Absent</h2>
              <div className="checkbox-group">
                <div className="checkbox-item">
                  <input type="checkbox" id="complainant-absent" />
                  <label htmlFor="complainant-absent">Complainant</label>
                </div>
                <div className="checkbox-item">
                  <input type="checkbox" id="complainant-advocate-absent" />
                  <label htmlFor="complainant-advocate-absent">Complainant's Advocate</label>
                </div>
                <div className="checkbox-item">
                  <input type="checkbox" id="accused-absent" />
                  <label htmlFor="accused-absent">Accused</label>
                </div>
                <div className="checkbox-item">
                  <input type="checkbox" id="accused-advocate-absent" />
                  <label htmlFor="accused-advocate-absent">Accused's Advocate</label>
                </div>
              </div>
            </div>

            <div className="generate-orders-v2-section">
              <button className="add-item-button">+ Add Item</button>
            </div>

            <div className="generate-orders-v2-section">
              <div className="checkbox-item">
                <input type="checkbox" id="skip-scheduling" />
                <label htmlFor="skip-scheduling">Skip Scheduling Next Hearing</label>
              </div>
            </div>

            <div className="generate-orders-v2-section">
              <div className="form-field">
                <label>Purpose of Next Hearing</label>
                <select className="dropdown-field">
                  <option>Choose your order</option>
                </select>
              </div>
            </div>

            <div className="generate-orders-v2-section">
              <div className="form-field">
                <label>Next Date of Hearing</label>
                <input type="date" className="date-field" />
              </div>
            </div>

            <div className="generate-orders-v2-section">
              <div className="checkbox-item">
                <input type="checkbox" id="bail-bond-required" />
                <label htmlFor="bail-bond-required">Bail Bond Required</label>
              </div>
            </div>
          </div>

          {/* Right Column */}
          <div className="generate-orders-v2-column">
            <div className="generate-orders-v2-section">
              <h2 className="section-header">Order Text</h2>
              <div className="form-field">
                <label>Attendance</label>
                <textarea className="textarea-field"></textarea>
              </div>
            </div>

            <div className="generate-orders-v2-section">
              <div className="form-field">
                <label>Item Text</label>
                <textarea className="textarea-field large"></textarea>
              </div>
            </div>

            <div className="generate-orders-v2-section">
              <div className="form-field">
                <label>Next Hearing</label>
                <textarea className="textarea-field"></textarea>
              </div>
            </div>
          </div>
        </div>

        <div className="generate-orders-v2-footer">
          <div className="footer-left">
            <Button variant="outlined" label="Back" onClick={() => history.goBack()} />
          </div>
          <div className="footer-right">
            <Button variant="outlined" label="Save as Draft" />
            <Button variant="contained" label="Preview PDF" />
          </div>
        </div>
      </div>
    </div>
  );
};

export default GenerateOrdersV2;
