import PropTypes from "prop-types";
import React, { useEffect, useState } from "react";
import Modal from "./Modal";
import { FormComposerV2 } from "@egovernments/digit-ui-react-components";
import isEqual from "lodash/isEqual";
import { runComprehensiveSanitizer } from "../Utils";
import { CloseBtn, Heading } from "./ModalComponents";

const UploadDocument = ({ config, t, handleCancelUpload, handleUploadProceed, formUploadData, setData }) => {
  const [isDisable, setIsDisable] = useState(true);
  const onFormValueChange = (
    setValue,
    nextFormData,
    _formState,
    _reset,
    _setError,
    _clearErrors,
    _trigger,
    _getValues
  ) => {
    runComprehensiveSanitizer({ formData: nextFormData, setValue });
    if (!isEqual(nextFormData, formUploadData)) {
      setData(nextFormData);
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

UploadDocument.propTypes = {
  config: PropTypes.object.isRequired,
  t: PropTypes.func.isRequired,
  handleCancelUpload: PropTypes.func.isRequired,
  handleUploadProceed: PropTypes.func.isRequired,
  formUploadData: PropTypes.object,
  setData: PropTypes.func.isRequired,
};

export default UploadDocument;
