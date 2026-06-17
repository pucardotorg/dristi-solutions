import React, { useState } from "react";
import PropTypes from "prop-types";
import Modal from "./Modal";
import { FlagIcon, LeftArrow, ZoomInIcon, ZoomOutIcon, RotateIcon, DownloadIcon } from "../icons/svgIndex";
import { CloseSvg } from "@egovernments/digit-ui-react-components";
import DocViewerWrapper from "../pages/employee/docViewerWrapper";
import useDownloadCasePdf from "../hooks/dristi/useDownloadCasePdf";

function ImageModalHeading({ label, fileName, onClose }) {
  return (
    <div className="heading-main">
      <button type="button" className="heading-back-error" onClick={onClose} style={{ background: "none", border: "none", padding: 0 }}>
        <LeftArrow />
      </button>
      <div className="heading-title">
        <h1 className="heading-m">{label}</h1>
        <p>{fileName}</p>
      </div>
    </div>
  );
}

ImageModalHeading.propTypes = {
  label: PropTypes.oneOfType([PropTypes.string, PropTypes.node]),
  fileName: PropTypes.string,
  onClose: PropTypes.func.isRequired,
};

const imageInfoPropType = PropTypes.shape({
  disableScrutiny: PropTypes.bool,
  enableScrutinyField: PropTypes.bool,
  dataError: PropTypes.object,
  inputlist: PropTypes.array,
  configKey: PropTypes.string,
  name: PropTypes.string,
  index: PropTypes.number,
  fieldName: PropTypes.string,
  data: PropTypes.shape({
    fileStore: PropTypes.string,
    fileName: PropTypes.string,
    documentName: PropTypes.string,
    docViewerStyle: PropTypes.object,
  }),
});

export const ImageModal = ({
  imageInfo,
  handleCloseModal,
  handleOpenPopup,
  t,
  anchorRef,
  showFlag,
  isPrevScrutiny,
  selectedDocs,
  headerBarMainStyle,
  popupModuleMianStyles,
  caseDetails,
}) => {
  let showFlagNew = (!imageInfo?.disableScrutiny || imageInfo?.enableScrutinyField) && showFlag;
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);
  const { downloadPdf } = useDownloadCasePdf();

  if (isPrevScrutiny && !imageInfo?.disableScrutiny) {
    showFlagNew = imageInfo?.inputlist?.some((key) => {
      return Boolean(imageInfo?.dataError?.[key]?.FSOError);
    });
  }
  const tenantId = window?.Digit.ULBService.getCurrentTenantId();

  const handleLocalDownload = (file) => {
    if (!file) return;
    const reader = new FileReader();

    reader.onload = () => {
      const a = document.createElement("a");
      a.href = reader.result;
      a.download = file.name || "document";
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    };

    reader.readAsDataURL(file);
  };

  const zoomIn = () => {
    setZoom(zoom + 0.1);
  };

  const zoomOut = () => {
    setZoom(zoom > 1 ? zoom - 0.1 : zoom);
  };

  const rotate = () => {
    setZoom(1);
    setRotation((prevRotation) => (prevRotation + 90) % 360);
  };

  const HeaderBarEnd = () => {
    return (
      <React.Fragment>
        {showFlagNew && (
          <button
            type="button"
            ref={anchorRef}
            className="flag-icon"
            onClick={() => {
              handleOpenPopup(
                null,
                imageInfo?.configKey,
                imageInfo?.name,
                imageInfo?.index,
                imageInfo?.fieldName,
                imageInfo?.inputlist,
                imageInfo?.data?.fileName
              );
            }}
            style={{ background: "none", border: "none", cursor: "pointer", padding: 0 }}
          >
            <FlagIcon />
          </button>
        )}

        <button
          type="button"
          className="close-icon"
          onClick={(e) => {
            e.stopPropagation();
            if (imageInfo?.data?.fileStore) {
              const fileName = `${caseDetails?.courtCaseNumber || caseDetails?.cmpNumber || caseDetails?.filingNumber || "Case"}_${t(
                imageInfo?.data?.documentType || "downloadedFile"
              )}`;
              downloadPdf(tenantId, imageInfo?.data?.fileStore, fileName);
            } else if (selectedDocs?.length > 0) {
              handleLocalDownload(selectedDocs[0]);
            }
          }}
          style={{ cursor: "pointer", background: "none", border: "none", padding: 0 }}
        >
          <DownloadIcon size={20} />
        </button>
        <button type="button" className="close-icon" onClick={zoomIn} style={{ cursor: "pointer", background: "none", border: "none", padding: 0 }}>
          <ZoomInIcon size={20} />
        </button>
        <button type="button" className="close-icon" onClick={zoomOut} style={{ cursor: "pointer", background: "none", border: "none", padding: 0 }}>
          <ZoomOutIcon size={20} />
        </button>
        <button type="button" className="close-icon" onClick={rotate} style={{ cursor: "pointer", background: "none", border: "none", padding: 0 }}>
          <RotateIcon size={20} />
        </button>
        <button type="button" className="close-icon" onClick={handleCloseModal} style={{ cursor: "pointer", background: "none", border: "none", padding: 0 }}>
          <CloseSvg />
        </button>
      </React.Fragment>
    );
  };
  return (
    <Modal
      headerBarEnd={<HeaderBarEnd />}
      formId="modal-action"
      headerBarMain={
        <ImageModalHeading
          label={imageInfo?.data?.fileName ? t(imageInfo?.data?.fileName) : selectedDocs?.[0]?.name}
          fileName={imageInfo?.data?.documentName}
          onClose={handleCloseModal}
        />
      }
      className="view-image-modal"
      hideSubmit
      style={{
        height: "100%",
        width: "100%",
      }}
      headerBarMainStyle={headerBarMainStyle}
      popupModuleMianStyles={popupModuleMianStyles}
    >
      <DocViewerWrapper
        fileStoreId={imageInfo?.data?.fileStore}
        selectedDocs={selectedDocs}
        tenantId={tenantId}
        docWidth="100%"
        docViewerStyle={{ ...imageInfo?.data?.docViewerStyle, overflow: "auto" }}
        docHeight="100%"
        showDownloadOption={false}
        style={{ transform: `rotate(${rotation}deg)`, transition: "transform 0.2s ease" }}
        pdfZoom={zoom}
        docViewerCardClassName="doc-viewer-card"
      />
    </Modal>
  );
};

ImageModal.propTypes = {
  imageInfo: imageInfoPropType,
  handleCloseModal: PropTypes.func.isRequired,
  handleOpenPopup: PropTypes.func.isRequired,
  t: PropTypes.func.isRequired,
  anchorRef: PropTypes.oneOfType([PropTypes.func, PropTypes.shape({ current: PropTypes.any })]),
  showFlag: PropTypes.bool,
  isPrevScrutiny: PropTypes.bool,
  selectedDocs: PropTypes.array,
  headerBarMainStyle: PropTypes.object,
  popupModuleMianStyles: PropTypes.object,
};

export default ImageModal;
