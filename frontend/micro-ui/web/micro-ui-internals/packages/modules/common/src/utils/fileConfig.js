/**
 * Centralized file upload configurations and utilities.
 * Used by UploadModal and parent components that need the internal config format (e.g., for checkSignStatus).
 */

// Preset configurations for common upload scenarios
export const SIGNATURE_UPLOAD_CONFIG = {
  // title: "CS_ADD_SIGNATURE",
  // headerLabel: "YOUR_SIGNATURE",
  multiUpload: false,
  allowedFormats: ["JPG", "PNG", "JPEG", "PDF"],
  maxFileSizeMB: 10,
  // submitLabel: "CS_SUBMIT",
};

export const SIGNATURE_PDF_ONLY_CONFIG = {
  title: "CS_ADD_SIGNATURE",
  headerLabel: "YOUR_SIGNATURE",
  multiUpload: false,
  allowedFormats: ["PDF"],
  maxFileSizeMB: 10,
  submitLabel: "CS_SUBMIT_SIGNATURE",
};

export const DOCUMENT_UPLOAD_CONFIG = {
  title: "Upload Document",
  headerLabel: "UPLOAD_DOCUMENT",
  multiUpload: false,
  allowedFormats: ["PDF"],
  maxFileSizeMB: 10,
  submitLabel: "ADD_SIGNATURE",
};

/**
 * Builds the internal uploadModalConfig structure expected by SelectCustomDragDrop
 * from a simplified config object.
 *
 * @param {string} name - The field name (e.g., "Signature")
 * @param {object} config - Simplified config with allowedFormats, maxFileSizeMB, multiUpload, note
 * @returns {object} Internal config for SelectCustomDragDrop
 */
export const buildUploadModalConfig = (name, config = {}, uploadGuidelines = null) => {
  const { multiUpload = false, allowedFormats = ["JPG", "PNG", "JPEG", "PDF"], maxFileSizeMB = 10 } = config;

  return {
    key: "uploadSignature",
    populators: {
      inputs: [
        {
          name,
          type: "DragDropComponent",
          uploadGuidelines,
          maxFileSize: maxFileSizeMB,
          maxFileErrorMessage: `CS_FILE_LIMIT_${maxFileSizeMB}_MB`,
          fileTypes: allowedFormats,
          isMultipleUpload: multiUpload,
        },
      ],
      validation: {},
    },
  };
};
