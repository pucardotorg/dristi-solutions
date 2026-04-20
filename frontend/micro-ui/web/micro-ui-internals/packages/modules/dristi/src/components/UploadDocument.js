import React, { useEffect, useState } from "react";
import Modal from "./Modal";
import { CardLabel, LabelFieldPair, TextInput } from "@egovernments/digit-ui-react-components";
import { FormComposerV2, Toast } from "@egovernments/digit-ui-react-components";
import isEqual from "lodash/isEqual";
import { runComprehensiveSanitizer } from "../Utils";
import { CloseBtn, Heading } from "./ModalComponents";
const UploadDocument = ({ config, t, handleCancelUpload, handleUploadProceed, formUploadData, setData }) => {
  const [isDisable, setIsDisable] = useState(true);
  const onFormValueChange = (setValue, formData, formState, reset, setError, clearErrors, trigger, getValues) => {
    runComprehensiveSanitizer({ formData, setValue });
    if (!isEqual(formData, formUploadData)) {
      setData(formData);
    }
  };

  useEffect(() => {
    const { SelectUserTypeComponent } = formUploadData || {};

    if (SelectUserTypeComponent?.doc?.length > 0 && SelectUserTypeComponent?.selectIdType?.code === "EVIDENCE") {
      setIsDisable(true);
    } else {
      setIsDisable(false);
    }
  }, [formUploadData]);

  return (
    <Modal
      headerBarEnd={<CloseBtn onClick={handleCancelUpload} isMobileView={true} />}
      headerBarMain={<Heading label={t("Upload Document")} />}
      actionSaveLabel={t("ADD_SIGNATURE")}
      actionSaveOnSubmit={handleUploadProceed}
      isDisabled={!isDisable}
    >
      <div className="advocate-additional-details upload-id">
        <FormComposerV2
          config={config}
          t={t}
          onFormValueChange={onFormValueChange}
          noBoxShadow
          inline
          defaultValues={formUploadData}
        ></FormComposerV2>
      </div>
    </Modal>
  );
};

export default UploadDocument;
