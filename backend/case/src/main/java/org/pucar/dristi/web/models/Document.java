package org.pucar.dristi.web.models;

import com.fasterxml.jackson.annotation.JsonProperty;

public class Document {
    
    @JsonProperty("id")
    private String id = null;
    
    @JsonProperty("documentType")
    private String documentType = null;
    
    @JsonProperty("fileStore")
    private String fileStore = null;
    
    @JsonProperty("documentUid")
    private String documentUid = null;

    @JsonProperty("isActive")
    private Boolean isActive = true;
    
    @JsonProperty("additionalDetails")
    private Object additionalDetails = null;

    public static DocumentBuilder builder() {
        return new DocumentBuilder();
    }

    public String getId() {
        return this.id;
    }

    public String getDocumentType() {
        return this.documentType;
    }

    public String getFileStore() {
        return this.fileStore;
    }

    public String getDocumentUid() {
        return this.documentUid;
    }

    public Object getAdditionalDetails() {
        return this.additionalDetails;
    }

    public Boolean getActive() {
        return isActive;
    }

    @JsonProperty("isActive")
    public void setActive(final Boolean active) {
        this.isActive = active;
    }

    @JsonProperty("id")
    public void setId(final String id) {
        this.id = id;
    }

    @JsonProperty("documentType")
    public void setDocumentType(final String documentType) {
        this.documentType = documentType;
    }

    @JsonProperty("fileStore")
    public void setFileStore(final String fileStore) {
        this.fileStore = fileStore;
    }

    @JsonProperty("documentUid")
    public void setDocumentUid(final String documentUid) {
        this.documentUid = documentUid;
    }

    @JsonProperty("additionalDetails")
    public void setAdditionalDetails(final Object additionalDetails) {
        this.additionalDetails = additionalDetails;
    }

    public Document(final String id, final String documentType, final Boolean isActive, final String fileStore, final String documentUid, final Object additionalDetails) {
        this.id = id;
        this.documentType = documentType;
        this.fileStore = fileStore;
        this.documentUid = documentUid;
        this.isActive = isActive;
        this.additionalDetails = additionalDetails;
    }

    public Document() {
    }

    public static class DocumentBuilder {
        private String id;
        private String documentType;
        private String fileStore;
        private String documentUid;
        private Boolean isActive;
        private Object additionalDetails;

        DocumentBuilder() {
        }

        @JsonProperty("id")
        public DocumentBuilder id(final String id) {
            this.id = id;
            return this;
        }

        @JsonProperty("documentType")
        public DocumentBuilder documentType(final String documentType) {
            this.documentType = documentType;
            return this;
        }

        @JsonProperty("fileStore")
        public DocumentBuilder fileStore(final String fileStore) {
            this.fileStore = fileStore;
            return this;
        }

        @JsonProperty("documentUid")
        public DocumentBuilder documentUid(final String documentUid) {
            this.documentUid = documentUid;
            return this;
        }

        @JsonProperty("isActive")
        public DocumentBuilder isActive(final Boolean isActive) {
            this.isActive = isActive;
            return this;
        }

        @JsonProperty("additionalDetails")
        public DocumentBuilder additionalDetails(final Object additionalDetails) {
            this.additionalDetails = additionalDetails;
            return this;
        }

        public Document build() {
            return new Document(this.id, this.documentType, this.isActive, this.fileStore, this.documentUid, this.additionalDetails);
        }

        public String toString() {
            return "Document.DocumentBuilder(id=" + this.id + ", documentType=" + this.documentType + ", isActive=" + this.isActive+ ", fileStore=" + this.fileStore + ", documentUid=" + this.documentUid + ", additionalDetails=" + this.additionalDetails + ")";
        }
    }
}

