export class DocumentUploadError extends Error {
  constructor(message, documentType, code) {
    super(message);
    this.documentType = documentType;
    this.name = "DocumentUploadError";
    this.code = code;
  }
}
