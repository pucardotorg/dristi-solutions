import { Button, CloseSvg, InboxSearchComposer, Loader } from "@egovernments/digit-ui-react-components";
import React, { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import Modal from "../../../dristi/src/components/Modal";
import { preHearingConfig } from "../configs/PreHearingConfig";
// import { ReschedulingPurpose } from "../pages/employee/ReschedulingPurpose";
import BulkReschedule from "../pages/employee/BulkReschedule";
import { useHistory } from "react-router-dom/cjs/react-router-dom.min";
import { DateUtils } from "@egovernments/digit-ui-module-dristi/src/Utils";

function PreHearingModal({ onCancel, hearingData, courtData, individualId, userType, events }) {
  const { t } = useTranslation();
  // const roles = Digit.UserService.getUser()?.info?.roles;
  const tenantId = useMemo(() => window?.Digit.ULBService.getCurrentTenantId(), []);
  // const [totalCount, setTotalCount] = useState(count);
  const [purposeModalOpen, setPurposeModalOpen] = useState(false);
  const [purposeModalData, setPurposeModalData] = useState({});
  const [rescheduleAll, setRescheduleAll] = useState(false);
  const [stepper, setStepper] = useState(0);
  const courtId = localStorage.getItem("courtId");
  const userInfo = Digit?.UserService?.getUser()?.info;
  const roles = useMemo(() => userInfo?.roles, [userInfo]);
  const isEmployee = useMemo(() => userInfo?.type === "EMPLOYEE", [userInfo]);
  const history = useHistory();

  const DateFormat = "DD-MM-YYYY";

  const Heading = (props) => {
    return <h1 className="heading-m">{props.label}</h1>;
  };

  const CloseBtn = (props) => {
    return (
      <div onClick={props.onClick} style={{ height: "100%", display: "flex", alignItems: "center", paddingRight: "20px", cursor: "pointer" }}>
        <CloseSvg />
      </div>
    );
  };

  const openRescheduleModal = (caseDetails) => {
    setPurposeModalData(caseDetails);
    setPurposeModalOpen(true);
  };

  const updatedPreHearingConfig = useMemo(() => {
    const configCopy = structuredClone(preHearingConfig);

    // Filter out Actions column for employees
    if (isEmployee) {
      configCopy.sections.searchResult.uiConfig.columns = configCopy.sections.searchResult.uiConfig.columns?.filter(
        (column) => column.label !== "Actions"
      );
    }

    return configCopy;
  }, [isEmployee]);

  const updatedConfig = useMemo(() => {
    const configCopy = structuredClone(updatedPreHearingConfig);
    configCopy.apiDetails.requestParam = {
      ...configCopy.apiDetails.requestParam,
      fromDate: hearingData.fromDate,
      toDate: hearingData.toDate,
      slot: hearingData.slot,
      tenantId: tenantId,
    };
    configCopy.apiDetails.requestBody = {
      ...configCopy.apiDetails.requestBody,
      courtId: courtId,
    };
    configCopy.additionalDetails = {
      attendeeIndividualId: userType === "citizen" && individualId,
    };
    configCopy.sections.searchResult.uiConfig.columns = [
      ...configCopy.sections.searchResult.uiConfig.columns.map((column) => {
        return column.label === "Actions"
          ? {
              ...column,
              openRescheduleDialog: openRescheduleModal,
            }
          : column;
      }),
    ];
    return configCopy;
  }, [updatedPreHearingConfig, hearingData.fromDate, hearingData.toDate, hearingData.slot, tenantId, courtId, userType, individualId]);

  // const getTotalCount = useCallback(
  //   async function () {
  //     const response = await hearingService
  //       .searchHearings(
  //         {
  //           criteria: {
  //             ...updatedConfig?.apiDetails?.requestBody?.criteria?.[0],
  //             tenantId,
  //             fromDate: hearingData.fromDate,
  //             toDate: hearingData.toDate,
  //             slot: hearingData.slot,
  //             attendeeIndividualId: individualId,
  //           },
  //         },
  //         {
  //           tenantId: tenantId,
  //         }
  //       )
  //       .catch(() => {
  //         return {};
  //       });
  //     setTotalCount(response?.TotalCount);
  //   },
  //   [updatedConfig, tenantId]
  // );

  // useEffect(() => {
  //   getTotalCount();
  // }, [updatedConfig, tenantId]);

  useEffect(() => {
    if (stepper === 4) {
      onCancel();
    }
  }, [onCancel, stepper]);
  const popUpStyle = {
    width: "70%",
    height: "fit-content",
    borderRadius: "0.3rem",
  };

  // const onRescheduleAllClick = () => {
  //   setRescheduleAll(true);
  //   openRescheduleModal(hearingData);
  // };

  const closeFunc = () => {
    setPurposeModalOpen(false);
    setPurposeModalData({});
  };

  // if (!totalCount && totalCount !== 0) {
  //   return null;
  // }
  if (!hearingData?.count || hearingData?.count === 0) {
    return null;
  }
  if (userType === "citizen" && !individualId) {
    return <Loader />;
  }
  const selectedSlot = events?.filter((slot) => slot?.id === parseInt(hearingData?.slotId));

  return (
    <Modal
      headerBarEnd={<CloseBtn onClick={onCancel} />}
      actionCancelOnSubmit={onCancel}
      actionSaveLabel={t("Reschedule All Hearings")}
      formId="modal-action"
      headerBarMain={<Heading label={`${t("TOTAL_HEARINGS")} (${hearingData.count})`} />}
      className="pre-hearings"
      popupStyles={popUpStyle}
      popupModuleActionBarStyles={{
        display: "none",
      }}
    >
      <div style={{ minHeight: "80vh" }}>
        <InboxSearchComposer configs={updatedConfig} />
      </div>
      <div
        style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "1rem 0 0 0", borderTop: "1px solid lightgray" }}
      >
        <div>
          <strong>{DateUtils.getFormattedDate(new Date(hearingData.fromDate), DateFormat)}</strong>, {hearingData.slot}
        </div>
        {Digit.UserService.getType() === "employee" && (
          <Button
            className="border-none dristi-font-bold"
            onButtonClick={() => {
              history.push(`/${window?.contextPath}/employee/home/home-screen`, { homeActiveTab: "CS_HOME_BULK_RESCHEDULE" });
            }}
            label={t("BULK_RESCHEDULE")}
            variation={"secondary"}
          />
        )}
      </div>
      {/* {purposeModalOpen && (
        <ReschedulingPurpose rescheduleAll={rescheduleAll} courtData={courtData} closeFunc={closeFunc} caseDetails={purposeModalData} />
      )} */}
      <BulkReschedule
        stepper={stepper}
        setStepper={setStepper}
        selectedDate={new Date(hearingData?.fromDate).setHours(0, 0, 0, 0)}
        selectedSlot={selectedSlot || []}
      />
    </Modal>
  );
}

export default PreHearingModal;
