import { Loader } from "@egovernments/digit-ui-components";
import { CloseSvg } from "@egovernments/digit-ui-react-components";
import React, { useContext, useEffect, useMemo, useState } from "react";
import { useHistory, useRouteMatch } from "react-router-dom/cjs/react-router-dom.min";
import Button from "../../../components/Button";
import CustomDetailsCard from "../../../components/CustomDetailsCard";
import Modal from "../../../components/Modal";
import SelectCustomNote from "../../../components/SelectCustomNote";
import useGetStatuteSection from "../../../hooks/dristi/useGetStatuteSection";
import { FileDownloadIcon } from "../../../icons/svgIndex";
import { DRISTIService } from "../../../services";
import downloadPdfWithLink from "../../../Utils/downloadPdfWithLink";
import { userTypeOptions } from "../registration/config";
import CustomDetailsDropdownCard from "../../../components/CustomDetailsDropdownCard";
import { AdvocateDataContext } from "@egovernments/digit-ui-module-core";

const customNoteConfig = {
  populators: {
    inputs: [
      {
        infoHeader: "CS_COMMON_NOTE",
        infoText: "ES_BANNER_LABEL",
        infoTooltipMessage: "CS_NOTE_TOOLTIP_CASE_TYPE",
      },
    ],
  },
};

export const formatDate = (date) => {
  const day = String(date.getDate()).padStart(2, "0");
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const year = date.getFullYear();
  return `${day}-${month}-${year}`;
};

const removeYearFromName = (name = "") => name.replace(/,\s*\d{4}$/, "");

const DEFAULT_SELECTION_RULES = {
  CASE_CATEGORY: (item) => item?.category?.toLowerCase() === "criminal",
  CS_STATUS_ACT: (item) => item?.name?.toLowerCase()?.includes("negotiable"),
  CS_SECTION: (item) => item?.sectionCode === "138" || item?.sectionHeading?.includes("138"),
};

function CaseType({ t }) {
  const { path } = useRouteMatch();
  const history = useHistory();
  const tenantId = window?.Digit.ULBService.getCurrentTenantId();
  const [page, setPage] = useState(0);
  const [isDisabled, setIsDisabled] = useState(false);
  const requiredDocumentsListLink = window?.globalConfigs?.getConfig("CASE_FILE_REQUIRED_DOCUMENTS");
  const [formData, setFormData] = useState({});

  const onCancel = () => {
    history.push(`/${window?.contextPath}/citizen/home/home-pending-task`);
  };
  const onSelect = () => {
    setPage(1);
  };
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
  const { data: complainantRespondentTypeData, isLoading: isComplainantRespondentTypeLoading } = Digit.Hooks.useCustomMDMS(
    Digit.ULBService.getStateId(),
    "case",
    [{ name: "ComplainantRespondentType" }],
    {
      select: (data) => {
        return data?.case?.ComplainantRespondentType || [];
      },
    }
  );

  const { isLoading: mdmsLoading, data: statuteData } = useGetStatuteSection();

  const Submitbar = () => {
    const token = window.localStorage.getItem("token");
    const isUserLoggedIn = Boolean(token);
    const moduleCode = "DRISTI";
    const userInfo = JSON.parse(window.localStorage.getItem("user-info"));
    const { AdvocateData } = useContext(AdvocateDataContext);
    const selectedSeniorAdvocate = AdvocateData;
    const { id: selectedAdvocateId, advocateName, uuid: selectedAdvocateUuid } = selectedSeniorAdvocate || {};
    const roles = userInfo?.roles;
    const { data: individualData, isLoading, refetch, isFetching } = window?.Digit.Hooks.dristi.useGetIndividualUser(
      {
        Individual: {
          userUuid: selectedAdvocateUuid ? [selectedAdvocateUuid] : [userInfo?.uuid],
        },
      },
      { tenantId, limit: 1000, offset: 0 },
      `${moduleCode}-${userInfo?.uuid}-${selectedAdvocateUuid}`,
      "",
      userInfo?.uuid && isUserLoggedIn
    );
    const individualId = individualData?.Individual?.[0]?.individualId;

    const addressLine1 = individualData?.Individual?.[0]?.address[0]?.addressLine1 || "Telangana";
    const addressLine2 = individualData?.Individual?.[0]?.address[0]?.addressLine2 || "Rangareddy";
    const buildingName = individualData?.Individual?.[0]?.address[0]?.buildingName || "";
    const street = individualData?.Individual?.[0]?.address[0]?.street || "";
    const city = individualData?.Individual?.[0]?.address[0]?.city || "";
    const pincode = individualData?.Individual?.[0]?.address[0]?.pincode || "";
    const latitude = individualData?.Individual?.[0]?.address[0]?.latitude || "";
    const longitude = individualData?.Individual?.[0]?.address[0]?.longitude || "";
    const doorNo = individualData?.Individual?.[0]?.address[0]?.doorNo || "";
    const idType = individualData?.Individual?.[0]?.identifiers[0]?.identifierType || "";
    const identifierIdDetails = JSON.parse(
      individualData?.Individual?.[0]?.additionalFields?.fields?.find((obj) => obj.key === "identifierIdDetails")?.value || "{}"
    );
    const address = `${doorNo ? doorNo + "," : ""} ${buildingName ? buildingName + "," : ""} ${street}`.trim();

    const givenName = individualData?.Individual?.[0]?.name?.givenName || "";
    const otherNames = individualData?.Individual?.[0]?.name?.otherNames || "";
    const familyName = individualData?.Individual?.[0]?.name?.familyName || "";

    const userType = useMemo(() => individualData?.Individual?.[0]?.additionalFields?.fields?.find((obj) => obj.key === "userType")?.value, [
      individualData?.Individual,
    ]);
    const { data: searchData, isLoading: isSearchLoading } = window?.Digit.Hooks.dristi.useGetAdvocateClerk(
      {
        criteria: [{ individualId }],
        tenantId,
      },
      {},
      individualId,
      Boolean(!selectedAdvocateUuid && isUserLoggedIn && individualId && userType !== "LITIGANT"), // no need to search call if already adv mapping exists
      userType === "ADVOCATE" ? "/advocate/v1/_search" : "/advocate/clerk/v1/_search"
    );

    if (userType === "ADVOCATE" && searchData) {
      const advocateBarRegNumber = searchData?.advocates?.[0]?.responseList?.[0]?.barRegistrationNumber;
      if (advocateBarRegNumber) {
        window?.Digit.SessionStorage.set("isAdvocateAndApproved", true);
      } else {
        window?.Digit.SessionStorage.set("isAdvocateAndApproved", false);
      }
    }

    const userTypeDetail = useMemo(() => {
      return userTypeOptions.find((item) => item.code === userType) || {};
    }, [userType]);

    const searchResult = useMemo(() => {
      return searchData?.[`${userTypeDetail?.apiDetails?.requestKey}s`];
    }, [searchData, userTypeDetail?.apiDetails?.requestKey]);

    const advocateId = useMemo(() => {
      return userType === "ADVOCATE" ? searchResult?.[0]?.responseList?.[0]?.id : null;
    }, [searchResult, userType]);

    if (isLoading || isFetching || isSearchLoading || mdmsLoading || isComplainantRespondentTypeLoading) {
      return <Loader />;
    }
    return (
      <div className="submit-bar-div">
        <Button
          icon={<FileDownloadIcon />}
          className="download-button"
          label={t("CS_COMMON_DOWNLOAD")}
          onButtonClick={async () => await downloadPdfWithLink(requiredDocumentsListLink, "RequiredDocuments")}
        />
        <div className="right-div">
          <Button
            className="cancel-button"
            label={t("CS_COMMON_BACK")}
            onButtonClick={() => {
              setPage(0);
            }}
          />
          <Button
            className="start-filling-button"
            label={t("CS_START_FILLING")}
            isDisabled={isDisabled}
            onButtonClick={() => {
              setIsDisabled(true);
              const cases = {
                tenantId,
                resolutionMechanism: "COURT",
                caseDescription: "Case description",
                linkedCases: [],
                caseDetails: {},
                caseCategory: "CRIMINAL",
                statutesAndSections: [
                  {
                    tenantId,
                    statute: statuteData?.name,
                    sections: [removeYearFromName(formData?.CS_STATUS_ACT?.name)],
                    subsections: [formData?.CS_SECTION?.sectionHeading],
                  },
                ],
                litigants: [],
                representatives: selectedAdvocateId
                  ? [
                      {
                        advocateId: selectedAdvocateId,
                        tenantId,
                        representing: [],
                        advocateFilingStatus: "caseOwner",
                      },
                    ]
                  : [],
                documents: [],
                workflow: {
                  action: "SAVE_DRAFT",
                  comments: null,
                  assignes: null,
                  documents: [
                    {
                      documentType: null,
                      fileStore: null,
                      documentUid: null,
                      additionalDetails: null,
                    },
                  ],
                },
                additionalDetails: {
                  payerMobileNo: individualData?.Individual?.[0]?.mobileNumber,
                  payerName: `${givenName} ${familyName}`,
                  ...(selectedAdvocateId
                    ? {
                        advocateDetails: {
                          formdata: [
                            {
                              isenabled: true,
                              displayindex: 0,
                              data: {},
                            },
                          ],
                        },
                      }
                    : {
                        complainantDetails: {
                          formdata: [
                            {
                              isenabled: true,
                              data: {
                                complainantType: complainantRespondentTypeData.find((item) => item.id === 1),
                                "addressDetails-select": {
                                  pincode: pincode,
                                  district: addressLine2,
                                  city: city,
                                  state: addressLine1,
                                  locality: address,
                                },
                                complainantId: { complainantId: true },
                                firstName: givenName,
                                middleName: otherNames,
                                lastName: familyName,
                                complainantVerification: {
                                  mobileNumber: userInfo?.userName,
                                  otpNumber: "123456",
                                  individualDetails: {
                                    individualId: individualId,
                                    document: identifierIdDetails?.fileStoreId
                                      ? [
                                          {
                                            fileName: idType,
                                            fileStore: identifierIdDetails?.fileStoreId,
                                            documentName: identifierIdDetails?.filename,
                                          },
                                        ]
                                      : null,
                                    "addressDetails-select": {
                                      pincode: pincode,
                                      district: addressLine2,
                                      city: city,
                                      state: addressLine1,
                                      locality: address,
                                    },
                                    addressDetails: {
                                      pincode: pincode,
                                      district: addressLine2,
                                      city: city,
                                      state: addressLine1,
                                      coordinates: {
                                        longitude: longitude,
                                        latitude: latitude,
                                      },
                                      locality: address,
                                    },
                                  },
                                  isUserVerified: true,
                                },
                                addressDetails: {
                                  pincode: pincode,
                                  district: addressLine2,
                                  city: city,
                                  state: addressLine1,
                                  coordinates: {
                                    longitude: longitude,
                                    latitude: latitude,
                                  },
                                  locality: address,
                                },
                              },
                              displayindex: 0,
                            },
                          ],
                        },
                      }),
                },
              };
              DRISTIService.caseCreateService({ cases, tenantId })
                .then((res) => {
                  history.push(`${path}/case?caseId=${res?.cases[0]?.id}`);
                })
                .finally(() => setIsDisabled(false));
            }}
          />
        </div>
      </div>
    );
  };

  const detailsCardList = useMemo(() => {
    if (page !== 0) {
      return [
        {
          header: "CS_PROOF_OF_IDENTITY",
          subtext: "TAX_RECORDS_DESCRIPTION",
          subnote: "UPLOAD_DOC_10",
          serialNumber: "01.",
        },
        {
          header: "CS_BOUNCED_CHEQUE",
          subtext: "CS_BOUNCE_DESCRIPTION",
          subnote: "UPLOAD_DOC_10",
          serialNumber: "02.",
        },
        {
          header: "CHEQUE_RETURN_MEMO",
          subtext: "CS_RETURN_MEMO_DESC",
          subnote: "UPLOAD_DOC_10",
          serialNumber: "03.",
        },
        {
          header: "CS_DEMAND_NOTICE",
          subtext: "CS_DEMAND_DESC",
          subnote: "UPLOAD_DOC_10",
          serialNumber: "04",
        },
        {
          header: "CS_POSTAL_ISSUE_NOTICE",
          subtext: "CS_POSTAL_ISSUE_DESC",
          subnote: "UPLOAD_DOC_10",
          serialNumber: "05",
        },
        {
          header: "CS_POSTAL_DELIVERY_NOTICE",
          subtext: "CS_POSTAL_DELIVERY_DESC",
          subnote: "UPLOAD_DOC_10",
          serialNumber: "06",
        },
        {
          header: "CS_SWORN_STATEMENT",
          subtext: "CS_AFFADAVIT_DESC",
          subnote: "UPLOAD_DOC_10",
          serialNumber: "07",
        },
        {
          header: "CS_ANY_OTHER_DOC",
          subtext: "CS_ADDTIONAL_DOC_DESC",
          subnote: "UPLOAD_DOC_10",
          serialNumber: "08",
        },
      ];
    }

    return [
      {
        header: "CASE_CATEGORY",
        subtext:
          statuteData?.CaseCategory?.filter((c) => c.isactive)?.map((c) => {
            return {
              ...c,
              label: t(c.category),
            };
          }) || [],
      },
      {
        header: "CS_STATUS_ACT",
        subtext:
          statuteData?.Statute?.filter((s) => s.isActive).map((s) => {
            return {
              ...s,
              label: removeYearFromName(s?.name),
            };
          }) || [],
      },
      {
        header: "CS_SECTION",
        subtext:
          statuteData?.Section?.filter((s) => s.isActive)?.map((s) => {
            return {
              ...s,
              label: s?.sectionHeading,
            };
          }) || [],
      },
    ];
  }, [page, statuteData]);

  useEffect(() => {
    if (page !== 0) return;

    setFormData((prev) => {
      if (Object.keys(prev || {}).length) return prev;
      const initialData = {};
      detailsCardList?.forEach((item) => {
        if (item?.subtext?.length) {
          const matcher = DEFAULT_SELECTION_RULES[item.header];
          const matchedValue = matcher ? item.subtext.find(matcher) : null;
          initialData[item?.header] = matchedValue || item?.subtext?.[0];
        }
      });

      return initialData;
    });
  }, [page, detailsCardList]);

  if (mdmsLoading) {
    return <Loader />;
  }

  return (
    <Modal
      headerBarEnd={<CloseBtn onClick={onCancel} />}
      actionCancelLabel={page === 0 ? t("CORE_LOGOUT_CANCEL") : null}
      actionCancelOnSubmit={onCancel}
      actionSaveLabel={t("CS_CORE_WEB_PROCEED")}
      hideSubmit={page !== 0}
      actionSaveOnSubmit={onSelect}
      formId="modal-action"
      headerBarMain={<Heading label={page === 0 ? t("CS_SELECT_CASETYPE_HEADER") : t("CS_LIST_DOCUMENTS") + ` (${detailsCardList.length})`} />}
      // style={{ height: "3vh" }}
      className="case-types"
    >
      <div className="case-types-main-div">
        {detailsCardList.map((item) =>
          page === 0 ? (
            <CustomDetailsDropdownCard
              key={item.header}
              header={item.header}
              options={item.subtext}
              value={formData[item.header]}
              onChange={(data) => {
                setFormData((prev) => ({
                  ...prev,
                  [item.header]: data,
                }));
              }}
            />
          ) : (
            <CustomDetailsCard
              key={item.header}
              header={item.header}
              subtext={item.subtext}
              serialNumber={item.serialNumber}
              subnote={item.subnote}
              style={{ width: "100%" }}
            />
          )
        )}
        {page === 0 && <SelectCustomNote t={t} config={customNoteConfig}></SelectCustomNote>}
      </div>

      {page === 1 && <Submitbar />}
    </Modal>
  );
}

export default CaseType;
