import React, { useEffect, useState } from "react";
import isEqual from "lodash/isEqual";
import CourierService from "./CourierService";
import Modal from "./Modal";
import { CloseSvg } from "@egovernments/digit-ui-react-components";

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

function ProcessCourierService({ t, config, onSelect, formData, errors, setError, clearErrors }) {
  const tenantId = window.localStorage.getItem("tenant-id");
  const urlParams = new URLSearchParams(window.location.search);
  const caseId = urlParams.get("caseId");
  // Initialize state based on formData or default values
  const [processCourierData, setProcessCourierData] = useState(formData?.[config?.key] || {});
  const [selectedAddresses, setSelectedAddresses] = useState(processCourierData?.addressDetails || []);
  const [showConfirmationModal, setShowConfirmationModal] = useState(false);
  const [active, setActive] = useState(false);
  const [checked, setChecked] = useState(false);

  // Fetch case data
  // const { data: caseData, isCaseLoading } = useSearchCaseService(
  //   {
  //     criteria: [
  //       {
  //         caseId: caseId,
  //         defaultFields: false,
  //       },
  //     ],
  //     tenantId,
  //   },
  //   {},
  //   `dristi-${caseId}`,
  //   caseId,
  //   Boolean(caseId)
  // );

  // const caseDetails = useMemo(
  //   () => ({
  //     ...caseData?.criteria?.[0]?.responseList?.[0],
  //   }),
  //   [caseData]
  // );

  // Format address for display

  // Handle changes to courier services and selected addresses
  const handleDataChange = (data) => {
    const updatedData = {
      ...processCourierData,
      ...data,
    };

    setProcessCourierData(updatedData);
    onSelect(config?.key, updatedData);
  };

  // Handle address selection
  const handleAddressSelection = (address, addressId, isSelected) => {
    const updatedAddresses = isSelected
      ? [...selectedAddresses, { addressDetails: address, id: addressId }]
      : selectedAddresses.filter((addr) => addr.id !== addressId);
    setSelectedAddresses(updatedAddresses);
  };

  // Handle courier service selection
  const handleCourierServiceChange = (value, type) => {
    if (type === "notice") {
      handleDataChange({ noticeCourierService: value });
    } else if (type === "summons") {
      // When summons is selected, update the state
      handleDataChange({ summonsCourierService: value });
    }
  };

  useEffect(() => {
    if (formData?.[config?.key] && !isEqual(processCourierData, formData?.[config?.key])) {
      setProcessCourierData(formData?.[config?.key]);
    }
  }, [formData, config?.key, processCourierData]);

  // Sync local state with formData changes
  useEffect(() => {
    if (processCourierData) {
      if (processCourierData.addressDetails) {
        setSelectedAddresses(processCourierData.addressDetails);
      }
    }
  }, [processCourierData]);

  // if (isCaseLoading) {
  //   return <Loader />;
  // }

  // Get courier options from config
  const courierOptions = config?.populators?.inputs?.find((input) => input.type === "courierOptions")?.options || [
    { code: "Registered Post", name: "Registered Post (INR 40) • 10-15 days delivery" },
    { code: "E-Post", name: "E-Post (INR 50) • 3-5 days delivery" },
  ];

  return (
    <React.Fragment>
      <CourierService
        t={t}
        config={config}
        errors={errors}
        processCourierData={processCourierData}
        courierOptions={courierOptions}
        handleCourierServiceChange={handleCourierServiceChange}
        selectedAddresses={selectedAddresses}
        handleAddressSelection={handleAddressSelection}
        active={active}
        setActive={setActive}
        checked={checked}
        setChecked={setChecked}
        setShowConfirmationModal={setShowConfirmationModal}
      />
      {showConfirmationModal && (
        <Modal
          headerBarMain={<Heading label={t("Consent for Summon")} />}
          headerBarEnd={
            <CloseBtn
              onClick={() => {
                setShowConfirmationModal(false);
              }}
            />
          }
          actionCancelLabel={t("Cancel")}
          actionCancelOnSubmit={() => setShowConfirmationModal(false)}
          actionSaveLabel={t("Confirm")}
          actionSaveOnSubmit={() => {
            setActive(true);
            setShowConfirmationModal(false);
          }}
          isDisabled={!checked}
        >
          <div className="confirmation-modal-content">
            <h3 className="consent-title" style={{ color: "#0B0C0C", marginBottom: "16px" }}>
              {t("Please Confirm")} <span style={{ color: "red" }}>*</span>
            </h3>
            <div className="consent-checkbox-container" style={{ display: "flex", alignItems: "flex-start", marginBottom: "16px" }}>
              <input
                type="checkbox"
                id="consent-checkbox"
                checked={checked}
                readOnly
                style={{ marginRight: "8px", marginTop: "4px" }}
                onChange={() => setChecked(!checked)}
              />
              <label htmlFor="consent-checkbox" style={{ color: "#0B0C0C", fontSize: "16px" }}>
                {t(
                  "I understand that I am taking the steps for the first summons to be sent to the Accused 1 in advance. For refund, I will apply through website XX."
                )}
              </label>
            </div>
          </div>
        </Modal>
      )}
    </React.Fragment>
  );
}

export default ProcessCourierService;
