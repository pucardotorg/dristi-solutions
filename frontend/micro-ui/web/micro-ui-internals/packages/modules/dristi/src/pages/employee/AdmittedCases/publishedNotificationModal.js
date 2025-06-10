import { CloseSvg } from "@egovernments/digit-ui-components";
import React, { useEffect, useMemo, useState } from "react";
import Modal from "../../../components/Modal";
import useGetDiaryEntry from "../../../hooks/dristi/useGetDiaryEntry";
import { TextInput } from "@egovernments/digit-ui-react-components";

function PublishedNotificationModal({ t, notification, handleDownload, filingNumber, handleOrdersTab }) {
  const tenantId = window?.Digit.ULBService.getCurrentTenantId();
  const DocViewerWrapper = Digit?.ComponentRegistryService?.getComponent("DocViewerWrapper");
  const isCitizen = useMemo(() => Boolean(Digit?.UserService?.getUser()?.info?.type === "CITIZEN"), [Digit]);
  const courtId = localStorage.getItem("courtId");

  const Heading = (props) => {
    return <h1 className="heading-m">{props.label}</h1>;
  };

  const CloseBtn = (props) => {
    return (
      <div onClick={props?.onClick} style={{ height: "100%", display: "flex", alignItems: "center", paddingRight: "20px", cursor: "pointer" }}>
        <CloseSvg />
      </div>
    );
  };

  const { data: diaryResponse } = useGetDiaryEntry(
    {
      criteria: {
        referenceId: notification?.notificationNumber,
        tenantId,
        courtId: courtId,
        caseId: filingNumber,
      },
    },
    {},
    notification?.notificationNumber + filingNumber,
    Boolean(notification?.notificationNumber) && !Boolean(isCitizen) && Boolean(filingNumber)
  );
  const document = useMemo(() => {
    return notification?.documents?.length > 0 ? notification?.documents[notification?.documents?.length - 1] : null;
  }, [notification]);

  const showDocument = useMemo(() => {
    return (
      <div
        className="show-document-doc-container"
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          width: "100%",
          maxHeight: "60vh",
          maxWidth: "100%",
          overflowY: "auto",
          overflowX: "hidden",
        }}
      >
        <DocViewerWrapper
          key={document?.fileStore}
          docWidth={"calc(95vw * 62 / 100)"}
          docHeight={"unset"}
          fileStoreId={document?.fileStore}
          tenantId={tenantId}
          displayFilename={document?.additionalDetails?.name}
          showDownloadOption={false}
          documentName={document?.additionalDetails?.name}
          isLocalizationRequired={false}
        />
      </div>
    );
  }, [document, t, tenantId]);

  return (
    <Modal
      headerBarMain={<Heading label={t("VIEW_NOTIFICATION_HEADER")} />}
      headerBarEnd={<CloseBtn onClick={handleOrdersTab} />}
      actionCancelLabel={null}
      actionCancelOnSubmit={() => {}}
      actionSaveLabel={null}
      hideSubmit={true}
      actionSaveOnSubmit={() => {}}
      popupStyles={{ minWidth: "880px", width: "80%" }}
    >
      {showDocument}
      {!isCitizen && diaryResponse?.entries?.[0]?.businessOfDay && (
        <React.Fragment>
          {" "}
          <h3 style={{ marginTop: "24px", marginBottom: "2px" }}>{t("BUSINESS_OF_THE_DAY")} </h3>
          <div style={{ display: "flex", gap: "10px" }}>
            <TextInput
              className="field desktop-w-full"
              onChange={(e) => {}}
              disable={true}
              value={diaryResponse?.entries?.[0]?.businessOfDay}
              style={{ minWidth: "500px" }}
              textInputStyle={{ maxWidth: "100%" }}
            />
          </div>
        </React.Fragment>
      )}

      <div style={{ display: "flex", width: "100%", justifyContent: "space-between", alignItems: "center", marginTop: "16px" }}>
        <div
          onClick={() => {
            handleDownload(document?.fileStore);
          }}
          style={{ fontWeight: 700, fontSize: "16px", lineHeight: "18.75px", color: "#007E7E", cursor: "pointer" }}
        >
          {t("DOWNLOAD_NOTIFICATION")}
        </div>
      </div>
    </Modal>
  );
}

export default PublishedNotificationModal;
