import React, { useCallback, useMemo, useState } from "react";
import Button from "./Button";
import Modal from "./Modal";
import { CloseBtn, Heading } from "./ModalComponents";
import SelectCustomFormatterTextArea from "./SelectCustomFormatterTextArea";
import useSearchCaseService from "../hooks/dristi/useSearchCaseService";
import { transformCaseDataForFetching } from "../pages/citizen/FileCase/EfilingValidationUtils";
import { generateSynopsisTemplate } from "../Utils/generateSynopsisTemplate";

/**
 * Returns true when the rich text editor currently holds something other than empty markup.
 */
const hasExistingText = (html) => {
  if (!html) return false;
  const textOnly = String(html)
    .replace(/<[^>]*>/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/\u00A0/g, " ")
    .replace(/[\u200B-\u200D\uFEFF]/g, "")
    .trim();
  return textOnly.length > 0;
};

/**
 * Rich text area for the Synopsis, with a "Generate Template" button that prefills the
 * editor from the details already captured on the earlier e-filing pages.
 * Any field that has not been filled yet is printed as "_____".
 */
const SelectSynopsisTemplateTextArea = ({ t, config, formData = {}, onSelect, errors, ...restProps }) => {
  const tenantId = window?.localStorage?.getItem("tenant-id");
  const urlParams = new URLSearchParams(window.location.search);
  const caseId = urlParams.get("caseId");

  const [showOverwriteModal, setShowOverwriteModal] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);

  const configKey = config?.key;
  const inputName = config?.populators?.inputs?.[0]?.name || "text";
  const generateButtonLabel = config?.populators?.generateButtonLabel || "SYNOPSIS_GENERATE_TEMPLATE";

  const { data: caseData, refetch } = useSearchCaseService(
    {
      criteria: [
        {
          caseId: caseId,
          defaultFields: false,
        },
      ],
      tenantId,
    },
    {},
    `synopsis-template-${caseId}`,
    caseId,
    Boolean(caseId)
  );

  const currentText = useMemo(() => formData?.[configKey]?.[inputName], [formData, configKey, inputName]);

  const applyTemplate = useCallback(async () => {
    setIsGenerating(true);
    try {
      // The earlier pages are persisted as draft on navigation, so pull the latest copy.
      let response = caseData;
      try {
        const refetched = await refetch();
        response = refetched?.data || caseData;
      } catch (error) {
        response = caseData;
      }
      const caseDetails = transformCaseDataForFetching(response?.criteria?.[0]?.responseList?.[0] || {}, ["advocateDetails"]);
      const generatedHtml = generateSynopsisTemplate({ caseDetails, t });
      onSelect(configKey, { ...(formData?.[configKey] || {}), [inputName]: generatedHtml }, { shouldValidate: true });
    } finally {
      setIsGenerating(false);
    }
  }, [caseData, refetch, t, onSelect, configKey, inputName, formData]);

  const onGenerateClick = useCallback(() => {
    if (hasExistingText(currentText)) {
      setShowOverwriteModal(true);
      return;
    }
    applyTemplate();
  }, [currentText, applyTemplate]);

  const onConfirmOverwrite = useCallback(() => {
    setShowOverwriteModal(false);
    applyTemplate();
  }, [applyTemplate]);

  return (
    <React.Fragment>
      <SelectCustomFormatterTextArea t={t} config={config} formData={formData} onSelect={onSelect} errors={errors} {...restProps} />
      <div className="synopsis-generate-template-action">
        <Button
          className="generate-template-btn"
          variation="secondary"
          label={t(generateButtonLabel, "Generate Template")}
          onButtonClick={onGenerateClick}
          isDisabled={isGenerating || config?.disable}
          type="button"
        />
      </div>
      {showOverwriteModal && (
        <Modal
          headerBarEnd={<CloseBtn onClick={() => setShowOverwriteModal(false)} />}
          actionCancelLabel={t("CS_COMMON_CANCEL")}
          actionCancelOnSubmit={() => setShowOverwriteModal(false)}
          actionSaveLabel={t("CS_COMMON_CONFIRM")}
          actionSaveOnSubmit={onConfirmOverwrite}
          // formId="modal-action"
          headerBarMain={<Heading label={t("SYNOPSIS_OVERWRITE_WARNING_HEADER", "Are you sure?")} />}
          className="synopsis-overwrite-modal"
        >
          <div className="synopsis-overwrite-modal-main">
            <p>{t("SYNOPSIS_OVERWRITE_WARNING_TEXT", "Generating the template will overwrite the text already entered in the Synopsis.")}</p>
          </div>
        </Modal>
      )}
    </React.Fragment>
  );
};

export default SelectSynopsisTemplateTextArea;
