import React, { useEffect, useState } from "react";
import { Route, Switch, useHistory, useRouteMatch } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Banner, Loader } from "@egovernments/digit-ui-react-components";
import SelectUserAddress from "../registration/SelectUserAddress";
import SelectId from "../Login/SelectId";
import UploadIdType from "../registration/UploadIdType";
import { newConfig } from "../registration/config";
import Modal from "../../../components/Modal";
import CustomToast from "../../../components/CustomToast";

const AdvocateProfileUpdate = ({ tenantId }) => {
  const history = useHistory();
  const { path } = useRouteMatch();
  const { t } = useTranslation();
  const userInfo = JSON.parse(window.localStorage.getItem("user-info"));

  const [individualData, setIndividualData] = useState(null);
  const [isLoadingIndividual, setIsLoadingIndividual] = useState(true);
  const [newParams, setNewParams] = useState({});
  const [isUploading, setIsUploading] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [showToast, setShowToast] = useState(null);

  useEffect(() => {
    if (!userInfo?.uuid) return;
    window.Digit.DRISTIService.searchIndividualUser({ Individual: { userUuid: [userInfo.uuid] } }, { tenantId, limit: 1, offset: 0 })
      .then((data) => {
        const individual = data?.Individual?.[0];
        if (individual) {
          setIndividualData(individual);
          setNewParams({
            name: {
              firstName: individual?.name?.givenName || "",
              middleName: individual?.name?.otherNames || "",
              lastName: individual?.name?.familyName || "",
            },
          });
        }
      })
      .catch(() => {
        setShowToast({ error: true, label: t("ERROR_FETCHING_INDIVIDUAL") });
      })
      .finally(() => setIsLoadingIndividual(false));
  }, []);

  const pathOnRefresh = `${path}/user-address`;

  const handleAddressSave = (addressData) => {
    const updated = { ...newParams, address: addressData };
    setNewParams(updated);
    history.push(`${path}/id-verification`, { newParams: updated });
  };

  const handleIdentitySave = (identity) => {
    const updated = { ...newParams, indentity: identity, adhaarNumber: "" };
    setNewParams(updated);
    history.push(`${path}/upload-id`, { newParams: updated });
  };

  const performUpdate = async ({ identifierType, identifierId, identifierIdDetails }) => {
    const address = newParams?.address;
    const permanentAddr = address?.addressDetails || {};
    const correspondenceAddr = address?.currentAddress || {};

    const updatedIndividual = {
      Individual: {
        ...individualData,
        address: [
          {
            tenantId,
            type: "PERMANENT",
            latitude: permanentAddr?.coordinates?.latitude || null,
            longitude: permanentAddr?.coordinates?.longitude || null,
            city: permanentAddr?.city || "",
            pincode: permanentAddr?.pincode || "",
            addressLine1: permanentAddr?.state || "",
            addressLine2: permanentAddr?.district || "",
            street: permanentAddr?.locality || "",
            doorNo: permanentAddr?.doorNo || "",
            buildingName: permanentAddr?.buildingName || "",
          },
          {
            tenantId,
            type: "CORRESPONDENCE",
            latitude: correspondenceAddr?.coordinates?.latitude || null,
            longitude: correspondenceAddr?.coordinates?.longitude || null,
            city: correspondenceAddr?.city || "",
            pincode: correspondenceAddr?.pincode || "",
            addressLine1: correspondenceAddr?.state || "",
            addressLine2: correspondenceAddr?.district || "",
            street: correspondenceAddr?.locality || "",
            doorNo: correspondenceAddr?.doorNo || "",
            buildingName: correspondenceAddr?.buildingName || "",
          },
        ],
        identifiers: [
          {
            ...(individualData?.identifiers?.[0] || {}),
            identifierType,
            identifierId,
          },
        ],
        additionalFields: {
          ...(individualData?.additionalFields || {}),
          fields: [
            ...(individualData?.additionalFields?.fields || []).filter((f) => f.key !== "identifierIdDetails"),
            { key: "identifierIdDetails", value: JSON.stringify(identifierIdDetails) },
          ],
        },
      },
    };

    await window.Digit.DRISTIService.updateIndividualUser(updatedIndividual, { tenantId });
  };

  const handleAadharChange = async (aadharNumber) => {
    setIsUploading(true);
    try {
      await performUpdate({
        identifierType: "AADHAR",
        identifierId: aadharNumber,
        identifierIdDetails: { identifierId: aadharNumber },
      });
      setShowSuccess(true);
    } catch {
      setShowToast({ error: true, label: t("ERROR_UPDATING_PROFILE") });
    } finally {
      setIsUploading(false);
    }
  };

  const handleDocumentUpload = async (filename, filedata, IdType) => {
    setIsUploading(true);
    try {
      const fileUploadRes = await window.Digit.UploadServices.Filestorage("DRISTI", filedata, tenantId);
      const fileStoreId = fileUploadRes?.data?.files?.[0]?.fileStoreId;
      const fileType = filedata?.type;

      await performUpdate({
        identifierType: IdType?.code || "OTHER_ID",
        identifierId: fileStoreId,
        identifierIdDetails: {
          fileStoreId,
          filename,
          documentType: fileType,
        },
      });
      setShowSuccess(true);
    } catch {
      setShowToast({ error: true, label: t("ERROR_UPDATING_PROFILE") });
    } finally {
      setIsUploading(false);
    }
  };

  if (isLoadingIndividual) {
    return <Loader />;
  }

  return (
    <div className="citizen-form-wrapper">
      <Switch>
        <React.Fragment>
          <Route path={`${path}/user-address`}>
            <SelectUserAddress config={[newConfig[1]]} t={t} params={newParams} pathOnRefresh={pathOnRefresh} onSelect={handleAddressSave} />
          </Route>
          <Route path={`${path}/id-verification`}>
            <SelectId
              t={t}
              config={[newConfig[6]]}
              params={newParams}
              history={history}
              pathOnRefresh={pathOnRefresh}
              onSelect={handleIdentitySave}
            />
          </Route>
          <Route path={`${path}/upload-id`}>
            <UploadIdType
              t={t}
              config={[newConfig[9]]}
              pathOnRefresh={pathOnRefresh}
              onDocumentUpload={handleDocumentUpload}
              onAadharChange={handleAadharChange}
              params={newParams}
              isDisabled={isUploading}
            />
          </Route>
        </React.Fragment>
      </Switch>

      {showSuccess && (
        <Modal
          actionSaveLabel={t("PROFILE_UPDATE_GO_TO_HOME")}
          actionSaveOnSubmit={() => history.push(`/${window?.contextPath}/citizen/home/home-pending-task`)}
          style={{ width: "100%" }}
        >
          <div style={{ padding: "16px 0" }}>
            <Banner
              whichSvg={"tick"}
              successful={true}
              message={t("PROFILE_DETAILS_UPDATED_SUCCESSFULLY")}
              headerStyles={{ fontSize: "32px" }}
              style={{ minWidth: "100%", marginTop: "10px" }}
            />
          </div>
        </Modal>
      )}

      {showToast && <CustomToast error={showToast?.error} label={showToast?.label} onClose={() => setShowToast(null)} duration={5000} />}
    </div>
  );
};

export default AdvocateProfileUpdate;
