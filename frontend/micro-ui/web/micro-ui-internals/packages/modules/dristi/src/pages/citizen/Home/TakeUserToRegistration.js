import { Button } from "@egovernments/digit-ui-react-components";
import PropTypes from "prop-types";
import React from "react";
import { useTranslation } from "react-i18next";
import { useHistory } from "react-router-dom";
import { ReactComponent as RegisterImage } from "./ImageUpload/image/register.svg";
import { ReactComponent as RightArrow } from "./ImageUpload/image/arrow_forward.svg";
import { getFileByFileStore } from "../../../Utils";
import { userTypeOptions } from "../registration/config";

async function assembleRegistrationParams({ individual, advocate, identifierTypeData }) {
  const identifierIdDetails = JSON.parse(individual?.additionalFields?.fields?.find((o) => o.key === "identifierIdDetails")?.value || "{}");

  const uri = `${globalThis.location.origin}/filestore/v1/files/id?tenantId=${individual?.tenantId}&fileStoreId=${identifierIdDetails?.fileStoreId}`;
  const file = await getFileByFileStore(uri, identifierIdDetails?.filename);

  let barCouncilFile = null;
  if (advocate) {
    const barCouncilUri = `${globalThis.location.origin}/filestore/v1/files/id?tenantId=${advocate?.tenantId}&fileStoreId=${advocate?.documents?.[0]?.fileStore}`;
    barCouncilFile = await getFileByFileStore(barCouncilUri, advocate?.documents?.[0]?.additionalDetails?.fileName);
  }

  const permanentAddress = individual?.address?.find((a) => a.type === "PERMANENT");
  const correspondenceAddress = individual?.address?.find((a) => a.type === "CORRESPONDENCE");

  const hasBothAddresses = Boolean(permanentAddress && correspondenceAddress);

  const mapAddress = (addr) => ({
    buildingName: addr?.buildingName || "",
    city: addr?.city || "",
    district: addr?.addressLine2 || "",
    doorNo: addr?.doorNo || "",
    locality: addr?.street || "",
    pincode: addr?.pincode || "",
    state: addr?.addressLine1 || "",
  });

  return {
    email: individual?.email || "",
    ...(!individual?.email && { isSkip: true }),
    name: {
      firstName: individual?.name?.givenName || "",
      middleName: individual?.name?.otherNames || "",
      lastName: individual?.name?.familyName || "",
    },

    address: {
      addressDetails: mapAddress(permanentAddress),
      currentAddress: mapAddress(hasBothAddresses ? correspondenceAddress : permanentAddress),

      isBothAddressSame: {
        code: hasBothAddresses ? "NO" : "YES",
        name: hasBothAddresses ? "NO" : "YES",
      },
    },

    indentity: {
      IdVerification: {
        selectIdType: {
          id: 2,
          code: "OTHER_ID",
          name: "CS_OTHER",
          subText: "CS_OTHER_SUB_TEXT",
        },
      },
    },
    uploadedDocument: {
      filedata: {
        files: [
          {
            fileStoreId: identifierIdDetails?.fileStoreId || "",
            tenantId: individual?.tenantId || "",
          },
        ],
      },
      file: file,
      IdType: identifierTypeData?.find((identifier) => identifier?.type === individual?.identifiers[0]?.identifierType) || {},
      filename: identifierIdDetails?.filename || "",
    },
    ...(advocate && {
      formData: {
        clientDetails: {
          barCouncilId: [
            [
              advocate?.documents?.[0]?.additionalDetails?.fileName || "",
              {
                file: barCouncilFile,
                fileStoreId: advocate?.documents?.[0]?.fileStore || "",
              },
            ],
          ],
          barRegistrationNumber: advocate?.stateRegnNumber || advocate?.barRegistrationNumber || "",
        },
      },
    }),
  };
}

function TakeUserToRegistration({ message, isRejected, isLitigantPartialRegistered, data, advocate }) {
  const { t } = useTranslation();
  const history = useHistory();

  const { data: identifierTypeData } = Digit.Hooks.useCustomMDMS(Digit.ULBService.getStateId(), "User Registration", [{ name: "IdentifierType" }], {
    select: (mdmsData) => {
      return mdmsData["User Registration"].IdentifierType;
    },
  });

  const handleRegister = async () => {
    sessionStorage.removeItem("Digit.aadharNumber");
    sessionStorage.removeItem("Digit.isAadharNumberVerified");
    sessionStorage.removeItem("userRegistrationParams");

    let params = {};
    const individual = data?.Individual?.[0];
    const userType = data?.Individual?.[0]?.additionalFields?.fields?.find((obj) => obj.key === "userType")?.value;

    if (isRejected || (userType === "ADVOCATE" && !advocate)) {
      params = await assembleRegistrationParams({ individual, advocate, identifierTypeData });
    }

    if (userType === "ADVOCATE" && !advocate) {
      history.push(`/${globalThis.window?.contextPath}/citizen/dristi/home/registration/email`, {
        newParams: {
          ...data,
          ...params,
          isRejected: true,
          userType: {
            clientDetails: {
              selectUserType: userTypeOptions?.find((item) => item?.code === userType),
            },
          },
        },
      });
    } else if (isRejected) {
      history.push(`/${globalThis.window?.contextPath}/citizen/dristi/home/registration/email`, {
        newParams: { ...data, ...params, isRejected: isRejected, refetch: Date.now(), userType: advocate?.additionalDetails?.userType },
      });
    } else {
      history.push(`/${globalThis.window?.contextPath}/citizen/dristi/home/registration/user-name`, {
        newParams: {
          name: {
            firstName: individual?.name?.givenName,
            middleName: individual?.name?.otherNames,
            lastName: individual?.name?.familyName,
          },
          isLitigantPartialRegistered: isLitigantPartialRegistered,
          userType: {
            clientDetails: {
              selectUserType: userTypeOptions?.find((item) => item?.code === "LITIGANT"),
            },
          },
        },
      });
    }
  };
  return (
    <div className="take-user-to-registration" style={{ width: "50%" }}>
      <div style={{ maxHeight: "40vh" }}>
        <RegisterImage></RegisterImage>
      </div>
      <div style={{ textAlign: "center" }}>
        <h2
          style={{
            wordWrap: "break-word",
            overflowWrap: "break-word",
            whiteSpace: "normal",
          }}
        >
          {message}
        </h2>
      </div>
      <div>
        <Button onButtonClick={handleRegister} label={t("CS_COMMON_REGISTER")}>
          <div className="svg-div">
            <RightArrow />
          </div>
        </Button>
      </div>
    </div>
  );
}

TakeUserToRegistration.propTypes = {
  advocate: PropTypes.shape({
    additionalDetails: PropTypes.shape({
      userType: PropTypes.any,
    }),
    barRegistrationNumber: PropTypes.string,
    documents: PropTypes.arrayOf(
      PropTypes.shape({
        additionalDetails: PropTypes.shape({
          fileName: PropTypes.string,
        }),
        fileStore: PropTypes.string,
      })
    ),
    stateRegnNumber: PropTypes.string,
    tenantId: PropTypes.string,
  }),
  data: PropTypes.shape({
    Individual: PropTypes.arrayOf(PropTypes.object),
  }).isRequired,
  isLitigantPartialRegistered: PropTypes.bool,
  isRejected: PropTypes.bool,
  message: PropTypes.oneOfType([PropTypes.string, PropTypes.node]),
};

export default TakeUserToRegistration;
