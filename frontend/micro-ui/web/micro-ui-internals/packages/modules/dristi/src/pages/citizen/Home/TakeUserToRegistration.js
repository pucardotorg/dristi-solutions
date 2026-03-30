import { Button } from "@egovernments/digit-ui-react-components";
import React from "react";
import { useTranslation } from "react-i18next";
import { useHistory } from "react-router-dom";
import { ReactComponent as RegisterImage } from "./ImageUpload/image/register.svg";
import { ReactComponent as RightArrow } from "./ImageUpload/image/arrow_forward.svg";
import { getFileByFileStore } from "../../../Utils";
import { userTypeOptions } from "../registration/config";

function TakeUserToRegistration({ message, isRejected, isLitigantPartialRegistered, data, advocate }) {
  const { t } = useTranslation();
  const history = useHistory();

  const { data: identifierTypeData } = Digit.Hooks.useCustomMDMS(Digit.ULBService.getStateId(), "User Registration", [{ name: "IdentifierType" }], {
    select: (data) => {
      return data["User Registration"].IdentifierType;
    },
  });

  const handleRegister = async () => {
    sessionStorage.removeItem("Digit.aadharNumber");
    sessionStorage.removeItem("Digit.isAadharNumberVerified");
    sessionStorage.removeItem("userRegistrationParams");

    let params = {};
    const individual = data?.Individual?.[0];

    if (isRejected) {
      const identifierIdDetails = JSON.parse(individual?.additionalFields?.fields?.find((o) => o.key === "identifierIdDetails")?.value || "{}");

      const uri = `${window.location.origin}/filestore/v1/files/id?tenantId=${individual?.tenantId}&fileStoreId=${identifierIdDetails?.fileStoreId}`;
      const file = await getFileByFileStore(uri, identifierIdDetails?.filename);

      const barCouncilUri = `${window.location.origin}/filestore/v1/files/id?tenantId=${advocate?.tenantId}&fileStoreId=${advocate?.documents?.[0]?.fileStore}`;
      const barCouncilFile = await getFileByFileStore(barCouncilUri, advocate?.documents?.[0]?.additionalDetails?.fileName);

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

      params = {
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
            // For clerk, use stateRegnNumber; for advocate, use barRegistrationNumber
            barRegistrationNumber: advocate?.stateRegnNumber || advocate?.barRegistrationNumber || "",
          },
        },
      };
    }

    !isRejected
      ? history.push(`/${window?.contextPath}/citizen/dristi/home/registration/user-name`, {
          newParams: {
            name: {
              firstName: individual?.name?.givenName,
              middleName: individual?.name?.otherNames,
              lastName: individual?.name?.familyName,
            },
            isLitigantPartialRegistered: isLitigantPartialRegistered,
          },
          userType: {
            clientDetails: {
              selectUserType: userTypeOptions?.find((item) => item?.code === "LITIGANT"),
            },
          },
        })
      : history.push(`/${window?.contextPath}/citizen/dristi/home/registration/email`, {
          newParams: { ...data, ...params, isRejected: isRejected },
          userType: advocate?.additionalDetails?.userType,
        });
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

export default TakeUserToRegistration;
