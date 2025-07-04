import React, { useMemo, useState, useEffect } from "react";
import { useTranslation } from "react-i18next";

import { useHistory } from "react-router-dom";
import { Loader, CloseSvg } from "@egovernments/digit-ui-react-components";

const CloseBtn = (props) => {
  return (
    <div
      onClick={props?.onClick}
      style={{
        height: "100%",
        display: "flex",
        alignItems: "center",
        paddingRight: "20px",
        cursor: "pointer",
        ...(props?.backgroundColor && { backgroundColor: props.backgroundColor }),
      }}
    >
      <CloseSvg />
    </div>
  );
};

const Heading = (props) => {
  return <h1 className="heading-m">{props.label}</h1>;
};

const BailBondModal = ({ row }) => {
  const { t } = useTranslation();
  const history = useHistory();
  const tenantId = Digit.ULBService.getCurrentTenantId();
  const userInfo = JSON.parse(window.localStorage.getItem("user-info"));
  const [loader, setLoader] = useState(false);
  const [toastMsg, setToastMsg] = useState(null);
  const [showBailModal, setShowBailModal] = useState(false);
  const [showBailConfirmationModal, setShowBailConfirmationModal] = useState(false);

  const roles = useMemo(() => userInfo?.roles, [userInfo]);
  const Modal = window?.Digit?.ComponentRegistryService?.getComponent("Modal");

  const isJudge = useMemo(() => roles?.some((role) => role?.code === "JUDGE_ROLE"), [roles]);
  const isBenchClerk = useMemo(() => roles?.some((role) => role?.code === "BENCH_CLERK"), [roles]);
  const isTypist = useMemo(() => roles?.some((role) => role?.code === "TYPIST_ROLE"), [roles]);
  const today = new Date();

  const todayStr = new Date(today.getTime() - today.getTimezoneOffset() * 60000).toISOString().split("T")[0];

  const userType = useMemo(() => {
    if (!userInfo) return "employee";
    return userInfo?.type === "CITIZEN" ? "citizen" : "employee";
  }, [userInfo]);

  useEffect(() => {
    if (!isJudge && !isBenchClerk && !isTypist) {
      history.push(`/${window?.contextPath}/${userType}/home/home-pending-task`);
    }
  }, [isJudge, isBenchClerk, userType, history, isTypist]);

  const showToast = (type, message, duration = 5000) => {
    setToastMsg({ key: type, action: message });
    setTimeout(() => {
      setToastMsg(null);
    }, duration);
  };

  const bailBonds = [
    {
      name: "Bail Bond 1",
      advocate: "Diwakar on behalf of Aparna",
      date: "23 Mar 2024",
    },
    {
      name: "Bail Bond 2",
      advocate: "Diwakar on behalf of Aparna",
      date: "23 Feb 2024",
    },
    {
      name: "Bail Bond 3",
      advocate: "Sharma on behalf of Gupta",
      date: "15 Jan 2024",
    },
    {
      name: "Bail Bond 4",
      advocate: "Reddy on behalf of Patel",
      date: "10 Dec 2023",
    },
    {
      name: "Bail Bond 5",
      advocate: "Mehta on behalf of Sharma",
      date: "05 Nov 2023",
    },
  ];
  console.log(row);

  return (
    <React.Fragment>
      {" "}
      <div onClick={() => setShowBailModal(true)}>{row?.caseTitle}</div>
      {loader && (
        <div
          style={{
            width: "100vw",
            height: "100vh",
            zIndex: "10001",
            position: "fixed",
            right: "0",
            display: "flex",
            top: "0",
            background: "rgb(234 234 245 / 50%)",
            alignItems: "center",
            justifyContent: "center",
          }}
          className="submit-loader"
        >
          <Loader />
        </div>
      )}
      {showBailModal && (
        <Modal
          headerBarEnd={
            <CloseBtn
              onClick={() => {
                setShowBailModal(false);
              }}
            />
          }
          actionSaveLabel={t("Close Task")}
          actionSaveOnSubmit={() => {
            setShowBailModal(false);
            setShowBailConfirmationModal(true);
          }}
          style={{ width: "50%" }}
          actionCancelStyle={{ width: "50%" }}
          actionCancelLabel={t("Issue Warrant")}
          actionCancelOnSubmit={() => {
            setShowBailModal(false);
          }}
          formId="modal-action"
          headerBarMain={<Heading label={t("View Bail Bonds")} />}
          className="upload-signature-modal"
          submitTextClassName="upload-signature-button"
          popupModuleActionBarStyles={{ padding: "0 8px 8px 8px" }}
        >
          <div>
            {Array.isArray(bailBonds) && bailBonds.length > 0 ? (
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  padding: "24px",
                  gap: "20px",
                  maxHeight: "360px",
                  overflowY: "auto",
                  fontFamily: "Roboto",
                }}
              >
                {bailBonds.map((bond, index) => (
                  <div
                    key={index}
                    style={{
                      display: "flex",
                      margin: "8px 0",
                      width: "100%",
                      height: "147px",
                      justifyContent: "space-between",
                      padding: "16px 24px",
                      backgroundColor: "#ECF3FD66",
                    }}
                  >
                    <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                      <div>
                        <span style={{ fontWeight: "700", fontSize: "16px" }}>{bond?.name}</span>
                      </div>
                      <div>
                        {" "}
                        <span style={{ fontWeight: "600", fontSize: "14px" }}>Litigant :</span> {bond?.litigant}
                      </div>
                      <div>
                        <span style={{ fontWeight: "600", fontSize: "14px" }}>Advocate: </span>
                        {bond?.advocate}
                      </div>
                      <div>
                        <span style={{ fontWeight: "600", fontSize: "14px" }}>Date:</span> {bond?.date}
                      </div>
                    </div>
                    <div style={{ display: "flex", justifyContent: "center", alignItems: "center" }}>
                      <button
                        style={{
                          backgroundColor: "transparent",
                          fontWeight: "500",
                          color: "#0A5757",
                          border: "none",
                          padding: "8px 16px",
                          borderRadius: "4px",
                          fontSize: "16px",
                          fontFamily: "Roboto",
                        }}
                        onClick={() => console.log("gfgdf")}
                      >
                        View
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "start",
                  padding: "24px",
                  gap: "20px",
                  maxHeight: "360px",
                  overflowY: "auto",
                  fontFamily: "Roboto",
                }}
              >
                <span style={{ fontSize: "16px" }}>There are no bail bonds present for this case. </span>
              </div>
            )}
          </div>{" "}
        </Modal>
      )}
      {showBailConfirmationModal && (
        <Modal
          headerBarEnd={
            <CloseBtn
              onClick={() => {
                setShowBailConfirmationModal(false);
                setShowBailModal(true);
              }}
            />
          }
          actionSaveLabel={t("CS_COMMON_CONFIRM")}
          actionSaveOnSubmit={() => {
            console.log("actionSaveOnSubmit");
          }}
          // style={{ width: "50%" }}
          // actionCancelStyle={{ width: "50%" }}
          actionCancelLabel={t("CS_COMMON_CANCEL")}
          actionCancelOnSubmit={() => {
            setShowBailConfirmationModal(false);
            setShowBailModal(true);
          }}
          formId="modal-action"
          headerBarMain={<Heading label={t("View Bail Bonds")} />}
          className="upload-signature-modal"
          submitTextClassName="upload-signature-button"
          popupModuleActionBarStyles={{ padding: "0 8px 8px 8px" }}
        >
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "start",
              padding: "24px",
              gap: "20px",
              maxHeight: "360px",
              overflowY: "auto",
              fontFamily: "Roboto",
              borderBottom: "1px solid #E8E8E8",
            }}
          >
            <span style={{ fontSize: "16px" }}>There are no bail bonds present for this case. </span>
          </div>
        </Modal>
      )}
    </React.Fragment>
  );
};

export default BailBondModal;
