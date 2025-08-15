import { useMemo, useCallback } from "react";

const useESignOpenApi = () => {
  const tenantId = window?.Digit.ULBService.getCurrentTenantId();
  const storedObj = useMemo(() => sessionStorage.getItem("signStatus"), []);
  const parsedObj = JSON.parse(storedObj) || [];
  const esignUrl = window?.globalConfigs?.getConfig("ESIGN_URL") || "https://es-staging.cdac.in/esignlevel2/2.1/form/signdoc";
  const Url = `/openapi/v1/${tenantId}/esign`;

  const handleEsign = useCallback(
    async (name, pageModule, fileStoreId, signPlaceHolder) => {
      try {
        const newSignStatuses = [...parsedObj, { name: name, isSigned: true }];
        sessionStorage.setItem("signStatus", JSON.stringify(newSignStatuses));

        const eSignResponse = await Digit.DRISTIService.eSignOpenService(Url, {
          fileStoreId: fileStoreId,
          tenantId: tenantId,
          pageModule: pageModule,
          signPlaceHolder: signPlaceHolder || "EsIIIgNNN_PlAcEholDeR_keYY",
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

  const checkSignStatus = (name, setIsSigned) => {
    const isSignSuccess = sessionStorage.getItem("isSignSuccess");
    const storedESignObj = sessionStorage.getItem("signStatus");
    const parsedESignObj = JSON.parse(storedESignObj);
    if (isSignSuccess) {
      const matchedSignStatus = parsedESignObj?.find((obj) => obj.name === name && obj.isSigned === true);
      if (isSignSuccess === "success" && matchedSignStatus) {
        setIsSigned(true);
      }

      setTimeout(() => {
        localStorage.removeItem("signStatus");
        localStorage.removeItem("name");
        sessionStorage.removeItem("isSignSuccess");
        sessionStorage.removeItem("esignProcess");
        sessionStorage.removeItem("eSignWindowObject");
      }, 2000);
    }
  };

  return { handleEsign, checkSignStatus };
};

export default useESignOpenApi;
