import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import { useHistory } from "react-router-dom";
import {
  Header,
  Button,
  LabelFieldPair,
  CardHeader,
  CardLabel,
  CustomDropdown,
  TextInput,
  ActionBar,
  SubmitBar,
} from "@egovernments/digit-ui-react-components";
import { CustomAddIcon } from "../../../../dristi/src/icons/svgIndex";

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

  const orderTypeConfig = {
    isMandatory: true,
    key: "orderType",
    type: "dropdown",
    label: "CHOOSE_ITEM",
    schemaKeyPath: "orderType",
    transformer: "mdmsDropdown",
    disable: false,
    populators: {
      name: "orderType",
      optionsKey: "name",
      error: "required ",
      styles: { maxWidth: "100%" },
      mdmsConfig: {
        moduleName: "Order",
        masterName: "OrderType",
        localePrefix: "ORDER_TYPE",
        select:
          "(data) => {return data['Order'].OrderType?.filter((item)=>[`SUMMONS`, `NOTICE`, `SECTION_202_CRPC`, `MANDATORY_SUBMISSIONS_RESPONSES`, `REFERRAL_CASE_TO_ADR`, `SCHEDULE_OF_HEARING_DATE`, `WARRANT`, `OTHERS`, `JUDGEMENT`, `ACCEPT_BAIL`, `PROCLAMATION`, `ATTACHMENT`].includes(item.type)).map((item) => {return { ...item, name: 'ORDER_TYPE_'+item.code };});}",
      },
    },
  };

  const purposeOfHearingConfig = {
    label: "HEARING_PURPOSE",
    isMandatory: true,
    key: "hearingPurpose",
    schemaKeyPath: "orderDetails.purposeOfHearing",
    transformer: "mdmsDropdown",
    type: "dropdown",
    populators: {
      name: "hearingPurpose",
      optionsKey: "code",
      error: "CORE_REQUIRED_FIELD_ERROR",
      styles: { maxWidth: "100%" },
      required: true,
      isMandatory: true,
      hideInForm: false,
      mdmsConfig: {
        masterName: "HearingType",
        moduleName: "Hearing",
        localePrefix: "HEARING_PURPOSE",
      },
    },
  };

  const nextDateOfHearing = {
    label: "NEXT_DATE_OF_HEARING",
    isMandatory: true,
    key: "hearingDate",
    schemaKeyPath: "orderDetails.hearingDate",
    transformer: "date",
    type: "date",
    labelChildren: "OutlinedInfoIcon",
    tooltipValue: "ONLY_CURRENT_AND_FUTURE_DATES_ARE_ALLOWED",
    populators: {
      name: "hearingDate",
      error: "CORE_REQUIRED_FIELD_ERROR",
    },
  };

  return (
    <div className="generate-orders-v2-content">
      <Header className="generate-orders-v2-header">{t("Order : Case Ashutosh vs Ranjit")}</Header>

      <div className="generate-orders-v2-columns">
        {/* Left Column */}
        <div className="generate-orders-v2-column">
          <LabelFieldPair style={{ width: "100%", display: "flex", flexDirection: "column", alignItems: "left" }}>
            <CardHeader styles={{ fontSize: "16px", fontWeight: "bold" }}>Mark Who Is Present</CardHeader>

            <div className="checkbox-group">
              {options?.map((option, index) => (
                <div className="checkbox-item" key={index}>
                  <input
                    id={`present-${option.code}`}
                    type="checkbox"
                    className="custom-checkbox"
                    onChange={(e) => {
                      let tempData = value;
                      const isFound = value?.some((val) => val?.code === option?.code);
                      if (isFound) tempData = value?.filter((val) => val?.code !== option?.code);
                      else tempData.push(option);
                      setValue(tempData);
                    }}
                    checked={value?.find((val) => val?.code === option?.code)}
                    style={{ cursor: "pointer", width: "20px", height: "20px" }}
                  />
                  <label htmlFor={`present-${option.code}`}>{t(option?.name)}</label>
                </div>
              ))}
            </div>
          </LabelFieldPair>

          <LabelFieldPair style={{ width: "100%", display: "flex", flexDirection: "column", alignItems: "left", marginTop: "12px" }}>
            <CardHeader styles={{ fontSize: "16px", fontWeight: "bold" }}>Mark Who Is Absent</CardHeader>

            <div className="checkbox-group">
              {options?.map((option, index) => (
                <div className="checkbox-item" key={index}>
                  <input
                    id={`present-${option.code}`}
                    type="checkbox"
                    className="custom-checkbox"
                    onChange={(e) => {
                      let tempData = value;
                      const isFound = value?.some((val) => val?.code === option?.code);
                      if (isFound) tempData = value?.filter((val) => val?.code !== option?.code);
                      else tempData.push(option);
                      setValue(tempData);
                    }}
                    checked={value?.find((val) => val?.code === option?.code)}
                    style={{ cursor: "pointer", width: "20px", height: "20px" }}
                  />
                  <label htmlFor={`present-${option.code}`}>{t(option?.name)}</label>
                </div>
              ))}
            </div>
          </LabelFieldPair>

          <LabelFieldPair style={{ alignItems: "flex-start", fontSize: "16px", fontWeight: 400 }}>
            <CardLabel style={{ fontSize: "16px", fontWeight: "400", marginBottom: "5px" }}>{t(orderTypeConfig?.label)}</CardLabel>
            <CustomDropdown
              t={t}
              // onChange={(e) => {
              //   setModeOfPayment(e);
              //   setAdditionalDetails("");
              // }}
              // value={modeOfPayment}
              config={orderTypeConfig?.populators}
            ></CustomDropdown>

            <div style={{ marginBottom: "10px" }}>
              <Button
                variation="secondary"
                // onButtonClick={handleAddForm}
                className="add-new-form"
                icon={<CustomAddIcon width="16px" height="16px" />}
                label={t("ADD_ITEM")}
                style={{ border: "none" }}
              ></Button>
            </div>
          </LabelFieldPair>

          <div className="checkbox-item">
            <input
              id="skip-scheduling"
              type="checkbox"
              className="custom-checkbox"
              // onChange={() => {
              //   setChecked(!checked);
              //   colData?.updateOrderFunc(rowData, !checked);
              // }}
              // checked={checked}
              style={{ cursor: "pointer", width: "20px", height: "20px" }}
            />
            <label htmlFor="skip-scheduling">Skip Scheduling Next Hearing</label>
          </div>

          <LabelFieldPair style={{ alignItems: "flex-start", fontSize: "16px", fontWeight: 400 }}>
            <CardLabel style={{ fontSize: "16px", fontWeight: "400", marginBottom: "5px" }}>{t(purposeOfHearingConfig?.label)}</CardLabel>
            <CustomDropdown
              t={t}
              // onChange={(e) => {
              //   setModeOfPayment(e);
              //   setAdditionalDetails("");
              // }}
              // value={modeOfPayment}
              config={purposeOfHearingConfig?.populators}
            ></CustomDropdown>
          </LabelFieldPair>

          <LabelFieldPair style={{ alignItems: "flex-start", fontSize: "16px", fontWeight: 400 }}>
            <CardLabel style={{ fontSize: "16px", fontWeight: "400", marginBottom: "5px" }}>Next Date of Hearing</CardLabel>
            <TextInput
              className="field desktop-w-full"
              key={nextDateOfHearing.key}
              type={"date"}
              // value={formData && formData[config.key] ? formData[config.key][input.name] : undefined}
              // onChange={(e) => {
              //   setValue(e.target.value, nextDateOfHearing.key, nextDateOfHearing);
              // }}
              min={new Date().toISOString().split("T")[0]}
              // disable={input.isDisabled}
              // textInputStyle={input?.textInputStyle}
              style={{ paddingRight: "3px" }}
              defaultValue={undefined}
              // errorStyle={errors?.[input.name]}
              // customIcon={input?.customIcon}
              // {...input.validation}
            />
          </LabelFieldPair>

          <div className="checkbox-item">
            <input
              id="bail-bond-required"
              type="checkbox"
              className="custom-checkbox"
              // onChange={() => {
              //   setChecked(!checked);
              //   colData?.updateOrderFunc(rowData, !checked);
              // }}
              // checked={checked}
              style={{ cursor: "pointer", width: "20px", height: "20px" }}
            />
            <label htmlFor="bail-bond-required">Bail Bond Required</label>
          </div>
        </div>

        {/* Right Column */}
        <div className="generate-orders-v2-column">
          <div className="section-header">Order Text</div>
          <div>
            <div style={{ fontSize: "16px", fontWeight: "400", marginBottom: "5px", marginTop: "12px" }}>Attendance</div>
            <textarea
              // value={formdata?.[config.key]?.[input.name]}
              // onChange={(data) => {
              //   handleChange(data, input);
              // }}
              rows={3}
              maxLength={1000}
              className={`custom-textarea-style`}
              // placeholder={t(input?.placeholder)}
              // disabled={config.disable}
            ></textarea>
            {/* {errors[config.key] && <CardLabelError style={input?.errorStyle}>{t(errors[config.key].msg || "CORE_REQUIRED_FIELD_ERROR")}</CardLabelError>} */}
          </div>

          <div>
            <div style={{ fontSize: "16px", fontWeight: "400", marginBottom: "5px", marginTop: "12px" }}>Item Text</div>
            <textarea
              // value={formdata?.[config.key]?.[input.name]}
              // onChange={(data) => {
              //   handleChange(data, input);
              // }}
              rows={8}
              maxLength={1000}
              className={`custom-textarea-style`}
              // placeholder={t(input?.placeholder)}
              // disabled={config.disable}
            ></textarea>
            {/* {errors[config.key] && <CardLabelError style={input?.errorStyle}>{t(errors[config.key].msg || "CORE_REQUIRED_FIELD_ERROR")}</CardLabelError>} */}
          </div>

          <div>
            <div style={{ fontSize: "16px", fontWeight: "400", marginBottom: "5px", marginTop: "12px" }}>Next Hearing</div>
            <textarea
              // value={formdata?.[config.key]?.[input.name]}
              // onChange={(data) => {
              //   handleChange(data, input);
              // }}
              rows={3}
              maxLength={1000}
              className={`custom-textarea-style`}
              // placeholder={t(input?.placeholder)}
              // disabled={config.disable}
            ></textarea>
            {/* {errors[config.key] && <CardLabelError style={input?.errorStyle}>{t(errors[config.key].msg || "CORE_REQUIRED_FIELD_ERROR")}</CardLabelError>} */}
          </div>
        </div>
      </div>
      <ActionBar
        style={{
          position: "fixed",
          bottom: 0,
          left: 0,
          right: 0,
          backgroundColor: "#fff",
          padding: "16px 24px",
          boxShadow: "none",
          borderTop: "1px solid #BBBBBD",
        }}
      >
        <div style={{ display: "flex", justifyContent: "flex-end", width: "100%" }}>
          <Button
            label={t("EDIT_A_CASE")}
            variation={"secondary"}
            // onButtonClick={() => {
            //   setEditCaseModal(true);
            // }}
            style={{ boxShadow: "none", backgroundColor: "#fff", padding: "10px", width: "240px", marginRight: "20px" }}
            textStyles={{
              fontFamily: "Roboto",
              fontSize: "16px",
              fontWeight: 700,
              lineHeight: "18.75px",
              textAlign: "center",
              color: "#007E7E",
            }}
          />
          <SubmitBar
            label={t("CS_GENERATE_RECEIPT")}
            // disabled={
            //   Object.keys(!modeOfPayment ? {} : modeOfPayment).length === 0 ||
            //   (["CHEQUE", "DD"].includes(modeOfPayment?.code) ? additionDetails.length !== 6 : false) ||
            //   isDisabled
            // }
            // onSubmit={() => {
            //   onSubmitCase();
            // }}
          />
        </div>
      </ActionBar>
    </div>
  );
};

export default GenerateOrdersV2;
