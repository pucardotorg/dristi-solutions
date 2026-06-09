import React, { useState } from "react";
import Modal from "./Modal";
import { FlagIcon, LeftArrow } from "../icons/svgIndex";
import { CloseSvg } from "@egovernments/digit-ui-react-components";
import DocViewerWrapper from "../pages/employee/docViewerWrapper";
import { ZoomInIcon, ZoomOutIcon, RotateIcon, DownloadIcon } from "../icons/svgIndex";
import useDownloadCasePdf from "../hooks/dristi/useDownloadCasePdf";

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

  const Heading = (props) => {
    return (
      <div className="heading-main">
        <div className="heading-back-error" onClick={handleCloseModal}>
          <LeftArrow />
        </div>
        <div className="heading-title">
          <h1 className="heading-m">{props.label}</h1>
          <p>{props.fileName}</p>
        </div>
      </div>
    );
  };
  const HeaderBarEnd = () => {
    return (
      <React.Fragment>
        {showFlagNew && (
          <div
            ref={anchorRef}
            className="flag-icon"
            onClick={(e) => {
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
          >
            <FlagIcon />
          </div>
        )}

        <div
          className="close-icon"
          onClick={(e) => {
            e.stopPropagation();
            if (imageInfo?.data?.fileStore) {
              downloadPdf(tenantId, imageInfo?.data?.fileStore);
            } else if (selectedDocs?.length > 0) {
              handleLocalDownload(selectedDocs[0]);
            }
          }}
          style={{ cursor: "pointer" }}
        >
          <DownloadIcon size={20} />
        </div>
        <div className="close-icon" onClick={zoomIn} style={{ cursor: "pointer" }}>
          <ZoomInIcon size={20} />
        </div>
        <div className="close-icon" onClick={zoomOut} style={{ cursor: "pointer" }}>
          <ZoomOutIcon size={20} />
        </div>
        <div className="close-icon" onClick={rotate} style={{ cursor: "pointer" }}>
          <RotateIcon size={20} />
        </div>
        <div className="close-icon" onClick={handleCloseModal} style={{ cursor: "pointer" }}>
          <CloseSvg />
        </div>
      </React.Fragment>
    );
  };
  return (
    <Modal
      headerBarEnd={<HeaderBarEnd />}
      formId="modal-action"
      headerBarMain={
        <Heading
          label={imageInfo?.data?.fileName ? t(imageInfo?.data?.fileName) : selectedDocs?.[0]?.name}
          fileName={imageInfo?.data?.documentName}
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
      />
    </Modal>
  );
};

export default ImageModal;
