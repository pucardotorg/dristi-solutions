import { useMemo, useCallback } from "react";

const useESign = () => {
  const tenantId = window?.Digit.ULBService.getCurrentTenantId();
  const storedObj = useMemo(() => sessionStorage.getItem("signStatus"), []);
  const parsedObj = JSON.parse(storedObj) || [];
  const esignUrl = window?.globalConfigs?.getConfig("ESIGN_URL") || "https://es-staging.cdac.in/esignlevel2/2.1/form/signdoc";

  const handleEsign = useCallback(
    async (name, pageModule, fileStoreId, signPlaceHolder, multiPageSigning, applyToAllPages) => {
      try {
        const newSignStatuses = [...parsedObj, { name: name, isSigned: true }];
        sessionStorage.setItem("signStatus", JSON.stringify(newSignStatuses));

        const eSignResponse = await Digit.DRISTIService.eSignService({
          ESignParameter: {
            uidToken: "3456565",
            consent: "6564",
            authType: "6546",
            fileStoreId: fileStoreId,
            tenantId: tenantId,
            pageModule: pageModule,
            signPlaceHolder: signPlaceHolder || "EsIIIgNNN_PlAcEholDeR_keYY",
            ...(multiPageSigning && { multiPageSigning: true }),
            ...(applyToAllPages && { applyToAllPages: true }),
          },
        });
        if (eSignResponse) {
          const eSignData = {
            path: window.location.pathname,
            param: window.location.search,
            isEsign: true,
          };
          sessionStorage.setItem("eSignWindowObject", JSON.stringify(eSignData));
          sessionStorage.setItem("esignProcess", true);
          const form = document.createElement("form");
          form.method = "POST";
          form.action = esignUrl;
          const eSignRequestInput = document.createElement("input");
          eSignRequestInput.type = "hidden";
          eSignRequestInput.name = "eSignRequest";
          eSignRequestInput.value = eSignResponse?.ESignForm?.eSignRequest;
          const aspTxnIDInput = document.createElement("input");
          aspTxnIDInput.type = "hidden";
          aspTxnIDInput.name = "aspTxnID";
          aspTxnIDInput.value = eSignResponse?.ESignForm?.aspTxnID;
          const contentTypeInput = document.createElement("input");
          contentTypeInput.type = "hidden";
          contentTypeInput.name = "Content-Type";
          contentTypeInput.value = "application/xml";
          form.appendChild(eSignRequestInput);
          form.appendChild(aspTxnIDInput);
          form.appendChild(contentTypeInput);
          document.body.appendChild(form);
          form.submit();
          document.body.removeChild(form);
        }
      } catch (error) {
        console.error("API call failed:", error);
      }
    },
    [parsedObj]
  );

  const checkSignStatus = (name, formData, uploadModalConfig, onSelect, setIsSigned, setIsSignedHeading) => {
    const setValue = (value, input) => {
      if (Array.isArray(input)) {
        onSelect(uploadModalConfig.key, {
          ...formData[uploadModalConfig.key],
          ...input.reduce((res, curr) => {
            res[curr] = value[curr];
            return res;
          }, {}),
        });
      } else {
        onSelect(uploadModalConfig.key, { ...formData[uploadModalConfig.key], [input]: value });
      }
    };

    const isSignSuccess = sessionStorage.getItem("isSignSuccess");
    const storedESignObj = sessionStorage.getItem("signStatus");
    const parsedESignObj = JSON.parse(storedESignObj);

    if (isSignSuccess) {
      const matchedSignStatus = parsedESignObj?.find((obj) => obj.name === name && obj.isSigned === true);
      if (isSignSuccess === "success" && matchedSignStatus) {
        setValue({ aadharsignature: name }, ["aadharsignature"]);
        setIsSigned(true);
        setIsSignedHeading && setIsSignedHeading(true);
      }

      setTimeout(() => {
        localStorage.removeItem("signStatus");
        localStorage.removeItem("name");
        sessionStorage.removeItem("isSignSuccess");
        sessionStorage.removeItem("esignProcess");
      }, 200);
    }
  };

  const checkJoinACaseESignStatus = (setIsSignedAdvocate, setIsSignedParty) => {
    const isSignSuccess = sessionStorage.getItem("isSignSuccess");
    const storedESignObj = sessionStorage.getItem("signStatus");
    const parsedESignObj = JSON.parse(storedESignObj);

    if (isSignSuccess) {
      if (isSignSuccess === "success") {
        const joinCaseData = JSON.parse(sessionStorage.getItem("appState"));
        parsedESignObj?.forEach((sign) => {
          if (sign?.name === "Advocate" && sign?.isSigned) {
            setIsSignedAdvocate(true);
            if (joinCaseData) {
              joinCaseData.isSignedAdvocate = true;
            }
          } else if (sign?.name === "Party" && sign?.isSigned) {
            setIsSignedParty(true);
            if (joinCaseData) {
              joinCaseData.isSignedParty = true;
            }
          }
        });
        if (joinCaseData) {
          sessionStorage.setItem("appState", JSON.stringify(joinCaseData));
        }
      }

      setTimeout(() => {
        localStorage.removeItem("signStatus");
        localStorage.removeItem("name");
        sessionStorage.removeItem("isSignSuccess");
        sessionStorage.removeItem("esignProcess");
      }, 200);
    }
  };

  return { handleEsign, checkSignStatus, checkJoinACaseESignStatus };
};

export default useESign;
