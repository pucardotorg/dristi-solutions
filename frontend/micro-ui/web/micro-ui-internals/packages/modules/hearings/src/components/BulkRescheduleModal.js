import { InfoCard } from "@egovernments/digit-ui-components";
import ButtonSelector from "@egovernments/digit-ui-module-dristi/src/components/ButtonSelector";
import { Button, CloseSvg, FormComposerV2, Loader, TextInput, Toast } from "@egovernments/digit-ui-react-components";
import React, { useState } from "react";
import { useHistory } from "react-router-dom";
import { hearingService } from "../hooks/services";
import BulkRescheduleTable from "./BulkRescheduleTable";

const CloseBtn = ({ onClick }) => {
  return (
    <div
      onClick={onClick}
      style={{
        height: "100%",
        display: "flex",
        alignItems: "center",
        paddingRight: "20px",
        cursor: "pointer",
      }}
    >
      <CloseSvg />
    </div>
  );
};
const Heading = ({ label }) => {
  return (
    <div className="evidence-title">
      <h1 className="heading-m">{label}</h1>
    </div>
  );
};

const BulkRescheduleModal = ({
  t,
  Loading,
  modifiedConfig,
  onFormValueChange,
  defaultValues,
  currentDiaryEntry,
  onCancel,
  onSumbitReschedule,
  isBulkRescheduleDisabled,
  bulkHearingsCount,
  setBusinessOfTheDay,
  handleUpdateBusinessOfDayEntry,
  bulkFromDate,
  bulkToDate,
  toastMsg,
  setToastMsg,
  setNewHearingData,
  bulkFormData,
  showToast,
  newHearingData,
  isADiarySigned,
}) => {
  const history = useHistory();
  const tenantId = window?.Digit.ULBService.getCurrentTenantId();
  const judgeId = localStorage.getItem("judgeId");
  const courtId = localStorage.getItem("courtId");
  const [isReschedule, setIsReschedule] = useState(false);
  const [isLoader, setIsLoader] = useState(false);

  const Modal = window?.Digit?.ComponentRegistryService?.getComponent("Modal");
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString();
  };

  const handleSearch = async () => {
    try {
      setIsLoader(true);
      const tentativeDates = await hearingService?.bulkReschedule({
        BulkReschedule: {
          judgeId,
          courtId,
          scheduleAfter: bulkFormData?.toDate + 24 * 60 * 60 * 1000 + 1, //we are sending next day
          tenantId,
          startTime: bulkFormData?.fromDate,
          endTime: bulkFormData?.toDate + 24 * 60 * 60 * 1000 - 1, // End of the day
          slotIds: bulkFormData?.slotIds?.map((slot) => slot?.id) || [],
          reason: bulkFormData?.reason,
        },
      });
      if (tentativeDates?.Hearings?.length === 0) {
        showToast("error", t("NO_NEW_HEARINGS_AVAILABLE"), 5000);
        return;
      }
      setIsReschedule(!isReschedule);
      setNewHearingData(tentativeDates?.Hearings);
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoader(false);
    }
  };

  return (
    <React.Fragment>
      <Modal
        headerBarEnd={<CloseBtn onClick={() => (currentDiaryEntry ? history.goBack() : onCancel())} />}
        formId="modal-action"
        headerBarMain={
          <Heading
            label={`${t("BULK_RESCHEDULE")}${
              currentDiaryEntry?.additionalDetails?.caseId ? " - " + currentDiaryEntry?.additionalDetails?.caseId : ""
            }`}
          />
        }
        actionCancelLabel={t("CS_COMMON_BACK")}
        actionCancelOnSubmit={onCancel}
        actionSaveOnSubmit={onSumbitReschedule}
        actionSaveLabel={t("RESHEDULE_BTN")}
        style={{ margin: "10px 0px" }}
        isDisabled={!(newHearingData?.length > 0 || isReschedule)}
        actionCancelStyle={{ margin: "10px 0px" }}
        hideModalActionbar={currentDiaryEntry ? true : false}
        popupStyles={{ width: "75%" }}
      >
        {Loading ? (
          <Loader />
        ) : (
          <div>
            <FormComposerV2
              key="bulk-reschedule"
              config={modifiedConfig}
              style={{ width: "100%", margin: "0px", padding: "0px !important" }}
              onFormValueChange={onFormValueChange}
              t={t}
              noBoxShadow
              inline={true}
              className={"bulk-reschedule"}
              fieldStyle={{ margin: 0, Background: "black" }}
              cardStyle={{ minWidth: "100%", Background: "blue" }}
              cardClassName={"card-shec"}
              headingStyle={{ textAlign: "center" }}
              defaultValues={defaultValues}
            />

            <div style={{ display: "flex", justifyContent: "end", margin: "0px", padding: "0px" }}>
              <ButtonSelector
                label={t("Search Case")}
                textStyles={{ margin: "0px" }}
                isDisabled={isBulkRescheduleDisabled || bulkHearingsCount === 0}
                onSubmit={handleSearch}
              />
            </div>
            {currentDiaryEntry && (
              <div style={{ padding: "10px" }}>
                <h3 style={{ marginTop: 0, marginBottom: "2px" }}>{t("BUSINESS_OF_THE_DAY")} </h3>
                <div style={{ display: "flex", gap: "10px" }}>
                  <TextInput
                    className="field desktop-w-full"
                    onChange={(e) => {
                      setBusinessOfTheDay(e.target.value);
                    }}
                    defaultValue={currentDiaryEntry?.businessOfDay}
                    style={{}}
                    textInputStyle={{ maxWidth: "100%" }}
                    disable={isADiarySigned ? true : false} //BOTD should not be editable if Adiary is already signed
                  />
                  {currentDiaryEntry && (
                    <Button
                      label={t("SAVE")}
                      variation={"primary"}
                      style={{ padding: 15, boxShadow: "none" }}
                      onButtonClick={() => {
                        handleUpdateBusinessOfDayEntry();
                      }}
                      isDisabled={isADiarySigned ? true : false} //BOTD should not be editable if Adiary is already signed
                    />
                  )}
                </div>
              </div>
            )}

            {isLoader ? (
              <Loader />
            ) : (
              newHearingData?.length > 0 && (
                <div>
                  <BulkRescheduleTable tableData={newHearingData} t={t} setNewHearingData={setNewHearingData} />
                </div>
              )
            )}

            {/* {!isBulkRescheduleDisabled && !currentDiaryEntry && bulkHearingsCount !== 0 && (
          <InfoCard
            variant={"default"}
            label={t("PLEASE_NOTE")}
            additionalElements={{}}
            inline
            text={t(`${t("BULK_INFO1")} ${bulkHearingsCount} ${t("BULK_INFO2")} ${formatDate(bulkFromDate)} and ${formatDate(bulkToDate)}`)}
            textStyle={{}}
            className={`custom-info-card`}
            style={{ margin: "15px" }}
          />
        )}
        {!isBulkRescheduleDisabled && !currentDiaryEntry && bulkHearingsCount === 0 && (
          <InfoCard
            variant={"default"}
            label={t("PLEASE_NOTE")}
            additionalElements={{}}
            inline
            text={t("BULK_NO_HEARINGS_SELECTED")}
            textStyle={{}}
            className={`custom-info-card`}
            style={{ margin: "15px" }}
          />
        )} */}
            {toastMsg && (
              <Toast
                error={toastMsg.key === "error"}
                label={t(toastMsg.action)}
                onClose={() => setToastMsg(null)}
                isDleteBtn={true}
                style={{ maxWidth: "500px" }}
              />
            )}
          </div>
        )}
      </Modal>
    </React.Fragment>
  );
};

export default BulkRescheduleModal;
