package org.pucar.dristi.service.bundle;

import org.egov.common.contract.models.Document;
import org.pucar.dristi.web.models.Artifact;
import org.pucar.dristi.web.models.digitalizeddocument.DigitalizedDocument;

import java.util.List;
import java.util.Map;
import java.util.Objects;

public class BundleSectionUtils {

    private BundleSectionUtils() {
    }

    @SuppressWarnings("unchecked")
    public static String extractEvidenceTitle(Artifact a) {
        if (a == null) return null;

        String title = null;

        // 1. artifact.additionalDetails.formdata.documentTitle
        if (a.getAdditionalDetails() instanceof Map) {
            Map<String, Object> ad = (Map<String, Object>) a.getAdditionalDetails();
            Object formdata = ad.get("formdata");
            if (formdata instanceof Map) {
                Object dt = ((Map<String, Object>) formdata).get("documentTitle");
                if (dt instanceof String && !((String) dt).isBlank()) {
                    title = (String) dt;
                    return title;
                }
            }
        }

        // 2. artifact.file.additionalDetails.documentTitle
        if (title == null && a.getFile() != null && a.getFile().getAdditionalDetails() instanceof Map) {
            Map<String, Object> fileAd = (Map<String, Object>) a.getFile().getAdditionalDetails();
            Object dt = fileAd.get("documentTitle");
            if (dt instanceof String && !((String) dt).isBlank()) {
                title = (String) dt;
                return title;
            }
        }

        // 3. artifact.file.additionalDetails.documentType
        if (title == null && a.getFile() != null && a.getFile().getAdditionalDetails() instanceof Map) {
            Map<String, Object> fileAd = (Map<String, Object>) a.getFile().getAdditionalDetails();
            Object dt = fileAd.get("documentType");
            if (dt instanceof String && !((String) dt).isBlank()) {
                title = (String) dt;
                return title;
            }
        }

        // 4. artifact.file.additionalDetails.name
        if (title == null && a.getFile() != null && a.getFile().getAdditionalDetails() instanceof Map) {
            Map<String, Object> fileAd = (Map<String, Object>) a.getFile().getAdditionalDetails();
            Object name = fileAd.get("name");
            if (name instanceof String && !((String) name).isBlank()) {
                title = (String) name;
                return title;
            }
        }

        // 4. artifact.artifactType
        if (title == null) title = a.getArtifactType();

        return title;
    }

    @SuppressWarnings("unchecked")
    public static String extractDepositionTitle(Artifact a) {
        String title = extractEvidenceTitle(a);
        return title != null ? title : "WITNESS_DEPOSITION";
    }

    @SuppressWarnings("unchecked")
    public static String getWitnessOwnerType(Artifact a) {
        if (a == null || a.getAdditionalDetails() == null) return null;
        if (!(a.getAdditionalDetails() instanceof Map)) return null;
        Map<String, Object> ad = (Map<String, Object>) a.getAdditionalDetails();
        Object wd = ad.get("witnessDetails");
        if (wd instanceof Map) {
            Object ownerType = ((Map<String, Object>) wd).get("ownerType");
            if (ownerType instanceof String) return (String) ownerType;
        }
        return null;
    }

    public static String firstNonBlank(String... values) {
        if (values == null) return null;
        for (String v : values) {
            if (v != null && !v.isBlank()) return v;
        }
        return null;
    }

    public static String findAnyFileStoreId(List<org.pucar.dristi.web.models.order.Document> documents) {
        if (documents == null || documents.isEmpty()) return null;
        return documents.stream()
                .filter(Objects::nonNull)
                .map(org.pucar.dristi.web.models.order.Document::getFileStore)
                .filter(Objects::nonNull)
                .findFirst()
                .orElse(null);
    }

    public static String digitalizedFileStoreId(DigitalizedDocument dd) {
        if (dd == null || dd.getDocuments() == null || dd.getDocuments().isEmpty()) return null;
        return dd.getDocuments().stream()
                .filter(Objects::nonNull)
                .map(org.pucar.dristi.web.models.digitalizeddocument.Document::getFileStore)
                .filter(Objects::nonNull)
                .findFirst()
                .orElse(null);
    }

    public static String findFileStoreId(List<Document> documents, String expectedDocumentType) {
        if (documents == null || documents.isEmpty() || expectedDocumentType == null) return null;
        return documents.stream()
                .filter(Objects::nonNull)
                .filter(d -> expectedDocumentType.equalsIgnoreCase(d.getDocumentType()))
                .map(Document::getFileStore)
                .filter(Objects::nonNull)
                .findFirst()
                .orElse(null);
    }

    public static String findAnyFileStoreIdEg(List<Document> documents) {
        if (documents == null || documents.isEmpty()) return null;
        return documents.stream()
                .filter(Objects::nonNull)
                .map(Document::getFileStore)
                .filter(Objects::nonNull)
                .findFirst()
                .orElse(null);
    }
}
