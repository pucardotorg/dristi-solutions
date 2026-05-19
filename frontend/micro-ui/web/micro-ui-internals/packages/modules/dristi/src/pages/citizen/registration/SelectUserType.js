import { FormComposerV2 } from "@egovernments/digit-ui-module-core";
import CustomToast from "@egovernments/digit-ui-module-dristi/src/components/CustomToast";
import React, { useMemo, useState } from "react";
import { useHistory } from "react-router-dom/cjs/react-router-dom.min";
import {
  createRegistrationPatternValidationOnChange,
  useUserRegistrationSessionRestore,
  validateRegistrationMandatoryFormData,
} from "./shared/registrationFlowShared";

const SelectUserType = ({ config, t, params = {}, setParams = () => {}, pathOnRefresh }) => {
  const Digit = window.Digit || {};
  const tenantId = Digit.ULBService.getCurrentTenantId();
  const history = useHistory();
  const [showToast, setShowToast] = useState(null);
  const userInfo = JSON.parse(window.localStorage.getItem("user-info"));

  const updatedConfig = useMemo(() => {
    return config.map((section) => ({
      ...section,
      body: section.body.map((item) => {
        if (item?.key !== "clientDetails") return item;

        return {
          ...item,
          populators: {
            ...item.populators,
            inputs: item.populators.inputs.map((input) => ({
              ...input,
              disable: params?.isRejected || params?.isLitigantPartialRegistered,
            })),
          },
        };
      }),
    }));
  }, [config, params]);

  const [isDisabled, setIsDisabled] = useState(false);
  const onFormValueChange = createRegistrationPatternValidationOnChange(config, setIsDisabled);
  const onSubmit = async (userType) => {
    const data = params;
    const userTypeSelcted = userType?.clientDetails?.selectUserType?.code;
    const uploadedDocument = params?.uploadedDocument;
    const identifierId = uploadedDocument ? uploadedDocument?.filedata?.files?.[0]?.fileStoreId : data?.adhaarNumber;
    const identifierIdDetails = uploadedDocument
      ? {
          fileStoreId: identifierId,
          filename: uploadedDocument?.filename,
        }
      : {};
    const identifierType = uploadedDocument ? uploadedDocument?.IdType?.type : "AADHAR";
    setParams({ ...params, userType });
    let Individual = {
      Individual: {
        tenantId: tenantId,
        name: {
          givenName: data?.name?.firstName,
          familyName: data?.name?.lastName,
          otherNames: data?.name?.middleName,
        },
        userDetails: {
          username: Digit.UserService.getUser()?.info?.userName,
          roles: userType?.clientDetails?.selectUserType?.role
            ? [
                {
                  code: "CITIZEN",
                  name: "Citizen",
                  tenantId: tenantId,
                },
                ...(userType?.clientDetails?.selectUserType?.role?.map((role) => ({
                  code: role,
                  name: role,
                  tenantId: tenantId,
                })) || []),
              ]
            : [
                {
                  code: "CITIZEN",
                  name: "Citizen",
                  tenantId: tenantId,
                },
              ],
          type: Digit.UserService.getUser()?.info?.type,
        },
        userUuid: Digit.UserService.getUser()?.info?.uuid,
        userId: Digit.UserService.getUser()?.info?.id,
        mobileNumber: Digit.UserService.getUser()?.info?.mobileNumber,
        email: userInfo?.emailId,
        address: [
          {
            tenantId: tenantId,
            type: "PERMANENT",
            latitude: data?.address?.addressDetails?.coordinates?.latitude,
            longitude: data?.address?.addressDetails?.coordinates?.longitude,
            city: data?.address?.addressDetails?.city,
            pincode: data?.address?.addressDetails?.pincode,
            addressLine1: data?.address?.addressDetails?.state,
            addressLine2: data?.address?.addressDetails?.district,
            street: data?.address?.addressDetails?.locality,
            doorNo: data?.address?.addressDetails?.doorNo,
            buildingName: data?.address?.addressDetails?.buildingName,
          },
          ...(data?.address?.isBothAddressSame?.code === "NO"
            ? [
                {
                  tenantId: tenantId,
                  type: "CORRESPONDENCE",
                  latitude: data?.address?.currentAddress?.coordinates?.latitude || null,
                  longitude: data?.address?.currentAddress?.coordinates?.longitude || null,
                  city: data?.address?.currentAddress?.city || "",
                  pincode: data?.address?.currentAddress?.pincode || "",
                  addressLine1: data?.address?.currentAddress?.state || "",
                  addressLine2: data?.address?.currentAddress?.district || "",
                  street: data?.address?.currentAddress?.locality || "",
                  doorNo: data?.address?.currentAddress?.doorNo || "",
                  buildingName: data?.address?.currentAddress?.buildingName || "",
                },
              ]
            : []),
        ],
        identifiers: [
          {
            identifierType: identifierType,
            identifierId: identifierId,
          },
        ],
        isSystemUser: true,
        skills: [],
        additionalFields: {
          fields: [
            { key: "userType", value: userTypeSelcted },
            { key: "userTypeDetail", value: JSON.stringify(userType?.clientDetails?.selectUserType) },
            { key: "termsAndCondition", value: true },
            { key: "identifierIdDetails", value: JSON.stringify(identifierIdDetails) },
          ],
        },

        clientAuditDetails: {},
        auditDetails: {},
      },
    };

    const permanentAddress = Individual?.Individual?.address?.find((addr) => addr.type === "PERMANENT");
    const correspondenceAddress = Individual?.Individual?.address?.find((addr) => addr.type === "CORRESPONDENCE");

    const savedPermanentAddress = params?.Individual?.[0]?.address?.find((addr) => addr.type === "PERMANENT");
    const savedCorrespondenceAddress = params?.Individual?.[0]?.address?.find((addr) => addr.type === "CORRESPONDENCE");

    const latestParams = {
      ...params,
      IndividualPayload: {
        ...Individual,
      },
      ...(params?.Individual && {
        Individual: [
          {
            ...Individual?.Individual,
            identifiers: [
              {
                ...params?.Individual?.[0]?.identifiers?.[0],
                identifierType,
                identifierId,
              },
            ],
            address: [
              {
                ...savedPermanentAddress,
                ...permanentAddress,
              },
              ...(correspondenceAddress
                ? [
                    {
                      ...savedCorrespondenceAddress,
                      ...correspondenceAddress,
                    },
                  ]
                : savedCorrespondenceAddress
                ? [
                    {
                      ...savedCorrespondenceAddress,
                      ...permanentAddress,
                      type: "CORRESPONDENCE",
                    },
                  ]
                : []),
            ],
            rowVersion: params?.Individual?.[0]?.rowVersion,
            isDeleted: params?.Individual?.[0]?.isDeleted,
            isSystemUser: params?.Individual?.[0]?.isSystemUser,
            isSystemUserActive: params?.Individual?.[0]?.isSystemUserActive,
            individualId: params?.Individual?.[0]?.individualId,
            auditDetails: params?.Individual?.[0]?.auditDetails,
            id: params?.Individual?.[0]?.id,
          },
        ],
      }),
      userType: {
        ...userType,
      },
    };
    setParams(latestParams);
    if (userTypeSelcted === "LITIGANT" && !data?.Individual?.[0]?.individualId) {
      // Litigants go directly to terms and conditions
      history.push(`/${window?.contextPath}/citizen/dristi/home/registration/terms-condition`, { newParams: latestParams });
    } else if (userTypeSelcted === "ADVOCATE" || userTypeSelcted === "ADVOCATE_CLERK") {
      // Both advocates and advocate clerks go to additional details (BAR verification)
      history.push(`/${window?.contextPath}/citizen/dristi/home/registration/additional-details`, { newParams: latestParams });
    } else {
      history.push(`/${window?.contextPath}/citizen/dristi/home/registration/additional-details`, { newParams: latestParams });
    }
  };

  useUserRegistrationSessionRestore({
    params,
    history,
    pathOnRefresh,
    shouldRestore: (p) => !p?.indentity && !p?.Individual?.[0]?.additionalFields,
    effectDeps: [params?.address, Digit.ULBService],
  });

  return (
    <div className="select-user">
      <FormComposerV2
        config={updatedConfig}
        t={t}
        noBoxShadow
        inline
        label={t("CS_COMMON_CONTINUE")}
        onSubmit={(props) => {
          if (!validateRegistrationMandatoryFormData(config, props)) {
            setShowToast({ label: t("ES_COMMON_PLEASE_ENTER_ALL_MANDATORY_FIELDS"), error: true, errorId: null });
          } else {
            onSubmit(props);
          }
          return;
        }}
        onFormValueChange={onFormValueChange}
        isDisabled={isDisabled}
        value={params?.userType || {}}
        defaultValues={params?.userType || {}}
        headingStyle={{ textAlign: "center" }}
        cardStyle={{ minWidth: "100%", padding: 20, display: "flex", flexDirection: "column" }}
        sectionHeadStyle={{ marginBottom: "20px", fontSize: "40px" }}
        buttonStyle={{ alignSelf: "center", minWidth: "50%" }}
        submitInForm
      ></FormComposerV2>
      {showToast && (
        <CustomToast
          error={showToast?.error}
          label={showToast?.label}
          errorId={showToast?.errorId}
          onClose={() => setShowToast(null)}
          duration={showToast?.errorId ? 7000 : 5000}
        />
      )}
    </div>
  );
};

export default SelectUserType;
