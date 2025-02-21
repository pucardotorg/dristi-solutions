import { FormComposerV2 } from "@egovernments/digit-ui-react-components";
import React, { useEffect, useRef, useState } from "react";
import { useHistory } from "react-router-dom/cjs/react-router-dom.min";
import { getUserDetails, setCitizenDetail } from "../../../hooks/useGetAccessToken";

const TermsCondition = ({ t, config, params, setParams, pathOnRefresh }) => {
  const userInfo = JSON.parse(window.localStorage.getItem("user-info"));

  const history = useHistory();
  const tenantId = Digit.ULBService.getCurrentTenantId();

  const [showSuccess, setShowSuccess] = useState(false);
  const [isDisabled, setIsDisabled] = useState(false);

  const setFormError = useRef(null);

  const onDocumentUpload = async (fileData) => {
    const fileUploadRes = await Digit.UploadServices.Filestorage("DRISTI", fileData, tenantId);
    return { file: fileUploadRes?.data, fileType: fileData.type };
  };

  const searchIndividualUserWithUuid = async (uuid, tenantId) => {
    const individualData = await window?.Digit.DRISTIService.searchIndividualUser(
      {
        Individual: {
          userUuid: [uuid],
        },
      },
      { tenantId, limit: 1000, offset: 0 },
      "",
      uuid
    );
    return individualData;
  };

  const getFullName = (seperator, ...strings) => {
    return strings.filter(Boolean).join(seperator);
  };

  const onSubmit = async () => {
    setIsDisabled(true);
    const userType = params?.userType;
    const userTypeSelcted = params?.userType?.clientDetails?.selectUserType?.code;
    const Individual = params?.IndividualPayload ? params?.IndividualPayload : { Individual: params?.Individual?.[0] };

    const response = await searchIndividualUserWithUuid(userInfo?.uuid, tenantId);
    if (userTypeSelcted === "LITIGANT" && response?.Individual?.length > 0) {
      let IndividualData = {
        Individual: {
          ...response?.Individual?.[0],
          ...Individual?.Individual,
        },
      };
      try {
        await window?.Digit.DRISTIService.updateIndividualUser(IndividualData, { tenantId });
        const refreshToken = window.localStorage.getItem("citizen.refresh-token");
        if (refreshToken) {
          getUserDetails(refreshToken).then((res) => {
            const { ResponseInfo, UserRequest: info, ...tokens } = res;
            const user = { info, ...tokens };
            localStorage.setItem("citizen.userRequestObject", user);
            window?.Digit.UserService.setUser(user);
            setCitizenDetail(user?.info, user?.access_token, window?.Digit.ULBService.getStateId());
            history.push(`/${window?.contextPath}/citizen/dristi/home`);
          });
        }
      } catch (error) {
        history.push(`/digit-ui/citizen/dristi/home/response`, { response: "error" });
      } finally {
        setParams({});
      }
    } else if ((userTypeSelcted === "LITIGANT" || userTypeSelcted === "ADVOCATE_CLERK") && !params?.Individual?.[0]?.individualId) {
      Digit.DRISTIService.postIndividualService(Individual, tenantId)
        .then((result) => {
          if (userType?.clientDetails?.selectUserType?.apiDetails && userType?.clientDetails?.selectUserType?.apiDetails?.serviceName && result) {
            const requestBody = {
              [userType?.clientDetails?.selectUserType?.apiDetails?.requestKey]: {
                tenantId: tenantId,
                individualId: result?.Individual?.individualId,
                isActive: false,
                workflow: {
                  action: "REGISTER",
                  comments: `Applying for ${userType?.clientDetails?.selectUserType?.apiDetails?.requestKey} registration`,
                  documents: [
                    {
                      id: null,
                      documentType: null,
                      fileStore: null,
                      documentUid: "",
                      additionalDetails: {},
                    },
                  ],
                  assignes: [],
                  rating: null,
                },
                documents: [
                  {
                    id: null,
                    documentType: null,
                    fileStore: null,
                    documentUid: "",
                    additionalDetails: {},
                  },
                ],
                additionalDetails: {
                  username: getFullName(" ", params?.name?.firstName, params?.name?.middleName, params?.name?.lastName),
                  userType: userType,
                },
                ...userType?.clientDetails?.selectUserType?.apiDetails?.AdditionalFields?.reduce((res, curr) => {
                  res[curr] = "DEFAULT_VALUE";
                  return res;
                }, {}),
              },
            };
            Digit.DRISTIService.advocateClerkService(userType?.clientDetails?.selectUserType?.apiDetails?.serviceName, requestBody, tenantId, true, {
              roles: [
                {
                  name: "Citizen",
                  code: "CITIZEN",
                  tenantId: tenantId,
                },
              ],
            })
              .then(() => {
                const refreshToken = window.localStorage.getItem("citizen.refresh-token");
                if (refreshToken) {
                  getUserDetails(refreshToken).then((res) => {
                    const { ResponseInfo, UserRequest: info, ...tokens } = res;
                    const user = { info, ...tokens };
                    localStorage.setItem("citizen.userRequestObject", user);
                    window?.Digit.UserService.setUser(user);
                    setCitizenDetail(user?.info, user?.access_token, window?.Digit.ULBService.getStateId());
                    history.push(`/${window?.contextPath}/citizen/dristi/home`);
                  });
                }
              })
              .catch(() => {
                history.push(`/digit-ui/citizen/dristi/home/response`, { response: "error" });
              })
              .finally(() => {
                setParams({});
              });
          } else {
            history.push(`/digit-ui/citizen/dristi/home/response`, {
              response: "success",
              createType: params?.userType?.clientDetails?.selectUserType?.code,
            });
          }
        })
        .catch(() => {
          history.push(`/digit-ui/citizen/dristi/home/response`, { response: "error" });
        })
        .finally(() => {
          setParams({});
        });
    } else if (userTypeSelcted === "ADVOCATE_CLERK" && params?.Individual?.[0]?.individualId) {
      if (userType?.clientDetails?.selectUserType?.apiDetails && userType?.clientDetails?.selectUserType?.apiDetails?.serviceName) {
        const requestBody = {
          [userType?.clientDetails?.selectUserType?.apiDetails?.requestKey]: {
            tenantId: tenantId,
            individualId: params?.Individual?.[0]?.individualId,
            isActive: false,
            workflow: {
              action: "REGISTER",
              comments: `Applying for ${userType?.clientDetails?.selectUserType?.apiDetails?.requestKey} registration`,
              documents: [
                {
                  id: null,
                  documentType: null,
                  fileStore: null,
                  documentUid: "",
                  additionalDetails: {},
                },
              ],
              assignes: [],
              rating: null,
            },
            documents: [
              {
                id: null,
                documentType: null,
                fileStore: null,
                documentUid: "",
                additionalDetails: {},
              },
            ],
            additionalDetails: {
              username: getFullName(
                " ",
                params?.Individual?.[0]?.name?.givenName,
                params?.Individual?.[0]?.name?.otherNames,
                params?.Individual?.[0]?.name?.familyName
              ),
              userType: userType,
            },
            ...userType?.clientDetails?.selectUserType?.apiDetails?.AdditionalFields?.reduce((res, curr) => {
              res[curr] = "DEFAULT_VALUE";
              return res;
            }, {}),
          },
        };
        Digit.DRISTIService.advocateClerkService(userType?.clientDetails?.selectUserType?.apiDetails?.serviceName, requestBody, tenantId, true, {
          roles: [
            {
              name: "Citizen",
              code: "CITIZEN",
              tenantId: tenantId,
            },
          ],
        })
          .then(() => {
            const refreshToken = window.localStorage.getItem("citizen.refresh-token");
            if (refreshToken) {
              getUserDetails(refreshToken).then((res) => {
                const { ResponseInfo, UserRequest: info, ...tokens } = res;
                const user = { info, ...tokens };
                localStorage.setItem("citizen.userRequestObject", user);
                window?.Digit.UserService.setUser(user);
                setCitizenDetail(user?.info, user?.access_token, window?.Digit.ULBService.getStateId());
                history.push(`/${window?.contextPath}/citizen/dristi/home`);
              });
            }
          })
          .catch(() => {
            history.push(`/digit-ui/citizen/dristi/home/response`, { response: "error" });
          })
          .finally(() => {
            setParams({});
          });
      } else {
        history.push(`/digit-ui/citizen/dristi/home/response`, {
          response: "success",
          createType: params?.userType?.clientDetails?.selectUserType?.code,
        });
      }
    } else {
      const data = params?.userType?.clientDetails;
      const Individual = params?.IndividualPayload ? params?.IndividualPayload : { Individual: params?.Individual?.[0] };
      const oldData = params;
      const formData = params?.formData;
      if (!params?.Individual?.[0]?.individualId) {
        Digit.DRISTIService.postIndividualService(Individual, tenantId)
          .then((result) => {
            if (
              data?.selectUserType?.apiDetails &&
              data?.selectUserType?.apiDetails?.serviceName &&
              result &&
              data?.selectUserType?.role[0] === "ADVOCATE_ROLE"
            ) {
              onDocumentUpload(formData?.clientDetails?.barCouncilId[0][1]?.file, formData?.clientDetails?.barCouncilId[0][0]).then((document) => {
                const requestBody = {
                  [data?.selectUserType?.apiDetails?.requestKey]: {
                    tenantId: tenantId,
                    individualId: result?.Individual?.individualId,
                    isActive: false,
                    workflow: {
                      action: "REGISTER",
                      comments: `Applying for ${data?.selectUserType?.apiDetails?.requestKey} registration`,
                      documents: [
                        {
                          id: null,
                          documentType: document.fileType,
                          fileStore: document.file?.files?.[0]?.fileStoreId,
                          documentUid: "",
                          additionalDetails: {
                            fileName: formData?.clientDetails?.barCouncilId[0][0],
                          },
                        },
                      ],
                      assignes: [],
                      rating: null,
                    },
                    documents: [
                      {
                        id: null,
                        documentType: document.fileType,
                        fileStore: document.file?.files?.[0]?.fileStoreId,
                        documentUid: "",
                        additionalDetails: {
                          fileName: formData?.clientDetails?.barCouncilId[0][0],
                        },
                      },
                    ],
                    additionalDetails: {
                      username: getFullName(" ", oldData?.name?.firstName, oldData?.name?.middleName, oldData?.name?.lastName),
                      userType: params?.userType,
                    },
                    ...data?.selectUserType?.apiDetails?.AdditionalFields?.reduce((res, curr) => {
                      res[curr] = formData?.clientDetails?.[curr];
                      return res;
                    }, {}),
                  },
                };
                Digit.DRISTIService.advocateClerkService(data?.selectUserType?.apiDetails?.serviceName, requestBody, tenantId, true, {
                  roles: [
                    {
                      name: "Citizen",
                      code: "CITIZEN",
                      tenantId: tenantId,
                    },
                  ],
                })
                  .then(() => {
                    setShowSuccess(true);
                    const refreshToken = window.localStorage.getItem("citizen.refresh-token");
                    if (refreshToken) {
                      getUserDetails(refreshToken).then((res) => {
                        const { ResponseInfo, UserRequest: info, ...tokens } = res;
                        const user = { info, ...tokens };
                        localStorage.setItem("citizen.userRequestObject", user);
                        window?.Digit.UserService.setUser(user);
                        setCitizenDetail(user?.info, user?.access_token, window?.Digit.ULBService.getStateId());
                        history.push(`/${window?.contextPath}/citizen/dristi/home`);
                      });
                    }
                  })
                  .catch(() => {
                    history.push(`/digit-ui/citizen/dristi/home/response`, { response: "error" });
                  });
              });
            }
          })
          .catch(() => {
            history.push(`/digit-ui/citizen/dristi/home/response`, { response: "error", createType: "LITIGANT" });
          })
          .finally(() => {
            setShowSuccess(true);
            setParams({});
          });
        setParams({
          ...params,
          ...formData,
        });
      } else if (params?.Individual?.[0]?.individualId) {
        if (data?.selectUserType?.apiDetails && data?.selectUserType?.apiDetails?.serviceName && data?.selectUserType?.role[0] === "ADVOCATE_ROLE") {
          onDocumentUpload(formData?.clientDetails?.barCouncilId[0][1]?.file, formData?.clientDetails?.barCouncilId[0][0]).then((document) => {
            const requestBody = {
              [data?.selectUserType?.apiDetails?.requestKey]: {
                tenantId: tenantId,
                individualId: params?.Individual?.[0]?.individualId,
                isActive: false,
                workflow: {
                  action: "REGISTER",
                  comments: `Applying for ${data?.selectUserType?.apiDetails?.requestKey} registration`,
                  documents: [
                    {
                      id: null,
                      documentType: document.fileType,
                      fileStore: document.file?.files?.[0]?.fileStoreId,
                      documentUid: "",
                      additionalDetails: {
                        fileName: formData?.clientDetails?.barCouncilId[0][0],
                      },
                    },
                  ],
                  assignes: [],
                  rating: null,
                },
                documents: [
                  {
                    id: null,
                    documentType: document.fileType,
                    fileStore: document.file?.files?.[0]?.fileStoreId,
                    documentUid: "",
                    additionalDetails: {
                      fileName: formData?.clientDetails?.barCouncilId[0][0],
                    },
                  },
                ],
                additionalDetails: {
                  username: getFullName(
                    " ",
                    params?.Individual?.[0]?.name?.givenName,
                    params?.Individual?.[0]?.name?.otherNames,
                    params?.Individual?.[0]?.name?.familyName
                  ),
                  userType: params?.userType,
                },
                ...data?.selectUserType?.apiDetails?.AdditionalFields?.reduce((res, curr) => {
                  res[curr] = formData?.clientDetails?.[curr];
                  return res;
                }, {}),
              },
            };
            Digit.DRISTIService.advocateClerkService(data?.selectUserType?.apiDetails?.serviceName, requestBody, tenantId, true, {
              roles: [
                {
                  name: "Citizen",
                  code: "CITIZEN",
                  tenantId: tenantId,
                },
              ],
            })
              .then(() => {
                setShowSuccess(true);
                const refreshToken = window.localStorage.getItem("citizen.refresh-token");
                if (refreshToken) {
                  getUserDetails(refreshToken).then((res) => {
                    const { ResponseInfo, UserRequest: info, ...tokens } = res;
                    const user = { info, ...tokens };
                    localStorage.setItem("citizen.userRequestObject", user);
                    window?.Digit.UserService.setUser(user);
                    setCitizenDetail(user?.info, user?.access_token, window?.Digit.ULBService.getStateId());
                    history.push(`/${window?.contextPath}/citizen/dristi/home`);
                  });
                }
              })
              .catch(() => {
                history.push(`/digit-ui/citizen/dristi/home/response`, { response: "error" });
              });
          });
        }
      }
    }
  };

  if (!params?.IndividualPayload && showSuccess == false) {
    history.push(pathOnRefresh);
  }

  return (
    <div className="terms-condition" style={{ margin: "50px" }}>
      <FormComposerV2
        config={config}
        t={t}
        noBoxShadow
        inline
        label={t("CS_COMMON_CONTINUE")}
        onSubmit={async (props) => {
          if (props?.terms_condition?.length !== config?.[0]?.body?.[0]?.populators?.inputs?.[0]?.options?.length)
            setFormError.current("terms_condition", { message: "All fields are mandatory." });
          else await onSubmit();
        }}
        onFormValueChange={(setValue, formData, formState, reset, setError, clearErrors, trigger, getValues) => {
          setFormError.current = setError;
        }}
        isDisabled={isDisabled}
      ></FormComposerV2>
    </div>
  );
};

export default TermsCondition;
