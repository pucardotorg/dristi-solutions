package org.pucar.dristi.service.bundle;

import org.egov.common.contract.models.Document;
import org.pucar.dristi.web.models.Application;
import org.pucar.dristi.web.models.Artifact;
import org.pucar.dristi.web.models.digitalizeddocument.DigitalizedDocument;
import org.pucar.dristi.web.models.order.Order;

import java.util.Comparator;
import java.util.List;
import java.util.Map;
import java.util.Objects;

public class BundleSectionUtils {

    private BundleSectionUtils() {
    }

    @SuppressWarnings("unchecked")
    public static String extractEvidenceTitle(Artifact artifact) {
        if (artifact == null) return null;

        String title = null;

        // 1. artifact.additionalDetails.formdata.documentTitle
        if (artifact.getAdditionalDetails() instanceof Map) {
            Map<String, Object> ad = (Map<String, Object>) artifact.getAdditionalDetails();
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
        if (title == null && artifact.getFile() != null && artifact.getFile().getAdditionalDetails() instanceof Map) {
            Map<String, Object> fileAd = (Map<String, Object>) artifact.getFile().getAdditionalDetails();
            Object dt = fileAd.get("documentTitle");
            if (dt instanceof String && !((String) dt).isBlank()) {
                title = (String) dt;
                return title;
            }
        }

        // 3. artifact.file.additionalDetails.documentType
        if (title == null && artifact.getFile() != null && artifact.getFile().getAdditionalDetails() instanceof Map) {
            Map<String, Object> fileAd = (Map<String, Object>) artifact.getFile().getAdditionalDetails();
            Object dt = fileAd.get("documentType");
            if (dt instanceof String && !((String) dt).isBlank()) {
                title = (String) dt;
                return title;
            }
        }

        // 4. artifact.artifactType
        if (title == null) title = artifact.getArtifactType();

        return title;
    }

    @SuppressWarnings("unchecked")
    public static String extractDepositionTitle(Artifact artifact) {
        String title;
        if (artifact.getFile() != null && artifact.getFile().getAdditionalDetails() instanceof Map) {
            Map<String, Object> fileAd = (Map<String, Object>) artifact.getFile().getAdditionalDetails();
            Object name = fileAd.get("name");
            if (name instanceof String && !((String) name).isBlank()) {
                title = (String) name;
                if ("Signed_Witness_Deposition_Document.pdf".equalsIgnoreCase(title)) {
                    return "Witness Deposition (" + artifact.getTag() + ")";
                }
                return title;
            }
        }
        title = extractEvidenceTitle(artifact);
        return title != null ? title : "WITNESS_DEPOSITION";
    }

    @SuppressWarnings("unchecked")
    public static String getWitnessOwnerType(Artifact artifact) {
        if (artifact == null || artifact.getAdditionalDetails() == null) return null;
        if (!(artifact.getAdditionalDetails() instanceof Map)) return null;
        Map<String, Object> ad = (Map<String, Object>) artifact.getAdditionalDetails();
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

    public static String digitalizedFileStoreId(DigitalizedDocument digitalizedDocument) {
        if (digitalizedDocument == null || digitalizedDocument.getDocuments() == null || digitalizedDocument.getDocuments().isEmpty()) return null;
        return digitalizedDocument.getDocuments().stream()
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

    public static List<Order> sortOrders(List<Order> orders, String sortField) {
        if (orders == null || orders.isEmpty() || sortField == null || sortField.isBlank()) {
            return orders;
        }

        Comparator<Order> comparator = getOrderComparator(sortField);
        if (comparator != null) {
            orders.sort(comparator);
        }
        return orders;
    }

    private static Comparator<Order> getOrderComparator(String sortField) {
        return switch (sortField.toLowerCase()) {
            case "createddate", "created_date" -> Comparator.comparing(
                    Order::getCreatedDate,
                    Comparator.nullsLast(Comparator.naturalOrder())
            );
            case "createdtime", "created_time" -> Comparator.comparing(
                    o -> o.getAuditDetails() != null ? o.getAuditDetails().getCreatedTime() : null,
                    Comparator.nullsLast(Comparator.naturalOrder())
            );
            case "lastmodifiedtime", "last_modified_time" -> Comparator.comparing(
                    o -> o.getAuditDetails() != null ? o.getAuditDetails().getLastModifiedTime() : null,
                    Comparator.nullsLast(Comparator.naturalOrder())
            );
            case "ordernumber", "order_number" -> Comparator.comparing(
                    Order::getOrderNumber,
                    Comparator.nullsLast(Comparator.naturalOrder())
            );
            default -> null;
        };
    }

    public static List<Artifact> sortArtifacts(List<Artifact> artifacts, String sortField) {
        if (artifacts == null || artifacts.isEmpty() || sortField == null || sortField.isBlank()) {
            return artifacts;
        }

        Comparator<Artifact> comparator = getArtifactComparator(sortField);
        if (comparator != null) {
            artifacts.sort(comparator);
        }
        return artifacts;
    }

    private static Comparator<Artifact> getArtifactComparator(String sortField) {
        return switch (sortField.toLowerCase()) {
            case "createddate", "created_date" -> Comparator.comparing(
                    Artifact::getCreatedDate,
                    Comparator.nullsLast(Comparator.naturalOrder())
            );
            case "createdtime", "created_time" -> Comparator.comparing(
                    a -> a.getAuditdetails() != null ? a.getAuditdetails().getCreatedTime() : null,
                    Comparator.nullsLast(Comparator.naturalOrder())
            );
            case "lastmodifiedtime", "last_modified_time" -> Comparator.comparing(
                    a -> a.getAuditdetails() != null ? a.getAuditdetails().getLastModifiedTime() : null,
                    Comparator.nullsLast(Comparator.naturalOrder())
            );
            case "artifacttype", "artifact_type" -> Comparator.comparing(
                    Artifact::getArtifactType,
                    Comparator.nullsLast(Comparator.naturalOrder())
            );
            default -> null;
        };
    }

    public static List<Application> sortApplications(List<Application> applications, String sortField) {
        if (applications == null || applications.isEmpty() || sortField == null || sortField.isBlank()) {
            return applications;
        }

        Comparator<Application> comparator = getApplicationComparator(sortField);
        if (comparator != null) {
            applications.sort(comparator);
        }
        return applications;
    }

    private static Comparator<Application> getApplicationComparator(String sortField) {
        return switch (sortField.toLowerCase()) {
            case "createddate", "created_date" -> Comparator.comparing(
                    Application::getCreatedDate,
                    Comparator.nullsLast(Comparator.naturalOrder())
            );
            case "createdtime", "created_time" -> Comparator.comparing(
                    a -> a.getAuditDetails() != null ? a.getAuditDetails().getCreatedTime() : null,
                    Comparator.nullsLast(Comparator.naturalOrder())
            );
            case "lastmodifiedtime", "last_modified_time" -> Comparator.comparing(
                    a -> a.getAuditDetails() != null ? a.getAuditDetails().getLastModifiedTime() : null,
                    Comparator.nullsLast(Comparator.naturalOrder())
            );
            case "applicationnumber", "application_number" -> Comparator.comparing(
                    Application::getApplicationNumber,
                    Comparator.nullsLast(Comparator.naturalOrder())
            );
            case "applicationtype", "application_type" -> Comparator.comparing(
                    Application::getApplicationType,
                    Comparator.nullsLast(Comparator.naturalOrder())
            );
            default -> null;
        };
    }
}
