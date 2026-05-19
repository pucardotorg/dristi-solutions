package org.pucar.dristi.service.bundle;

import lombok.extern.slf4j.Slf4j;
import org.egov.common.contract.models.Document;
import org.pucar.dristi.web.models.Application;
import org.pucar.dristi.web.models.order.Order;
import org.pucar.dristi.service.CaseBundleSection;
import org.pucar.dristi.web.models.BundleData;
import org.pucar.dristi.web.models.CaseBundleNode;
import org.springframework.stereotype.Component;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.stream.Collectors;

@Component
@Slf4j
public class MandatorySubmissionsSection implements CaseBundleSection {

    @Override
    public String getOrder() {
        return "07";
    }

    @Override
    public CaseBundleNode build(BundleData data) {

        if (data == null || data.getOrders() == null) return null;

        String sortField = data.getSectionSortFields() != null ? data.getSectionSortFields().get("mandatorysubmissions") : null;

        List<Order> mandatoryOrders = data.getOrders().stream()
                .filter(Objects::nonNull)
                .filter(o -> "MANDATORY_SUBMISSIONS_RESPONSES".equalsIgnoreCase(o.getOrderType()))
                .toList();

        if (mandatoryOrders.isEmpty()) return null;

        List<Application> completedApps = data.getApplications() != null
                ? data.getApplications().stream()
                .filter(Objects::nonNull)
                .filter(a -> "COMPLETED".equalsIgnoreCase(a.getStatus()))
                .filter(a -> "PRODUCTION_DOCUMENTS".equalsIgnoreCase(a.getApplicationType()))
                .collect(Collectors.toCollection(ArrayList::new))
                : new ArrayList<>();

        BundleSectionUtils.sortApplications(completedApps, sortField);

        List<CaseBundleNode> children = new ArrayList<>();
        int applicationCounter = 0;

        for (Order order : mandatoryOrders) {
            String orderId = order.getId() != null ? order.getId().toString() : null;
            if (orderId == null) continue;

            List<Application> matchingApps = completedApps.stream()
                    .filter(a -> a.getReferenceId() != null && orderId.equals(a.getReferenceId().toString()))
                    .toList();

            for (Application application : matchingApps) {
                if (application.getDocuments() == null || application.getDocuments().isEmpty()) continue;

                applicationCounter++;
                List<CaseBundleNode> prodDocChildren = new ArrayList<>();

                List<Document> signedDocs = application.getDocuments().stream()
                        .filter(Objects::nonNull)
                        .filter(d -> "SIGNED".equalsIgnoreCase(d.getDocumentType()) && d.getFileStore() != null)
                        .toList();

                for (int idx = 0; idx < signedDocs.size(); idx++) {
                    prodDocChildren.add(CaseBundleNode.builder()
                            .id(application.getApplicationNumber() + "-signed-" + idx)
                            .title("APPLICATION_PDF_HEADING")
                            .fileStoreId(signedDocs.get(idx).getFileStore())
                            .build());
                }

                List<Document> otherDocs = application.getDocuments().stream()
                        .filter(Objects::nonNull)
                        .filter(d -> !"SIGNED".equalsIgnoreCase(d.getDocumentType()) && d.getFileStore() != null)
                        .toList();

                if (!otherDocs.isEmpty()) {
                    List<CaseBundleNode> otherChildren = new ArrayList<>();
                    for (int idx = 0; idx < otherDocs.size(); idx++) {
                        Document doc = otherDocs.get(idx);
                        String docTitle = extractDocTitle(doc);
                        otherChildren.add(CaseBundleNode.builder()
                                .id(application.getApplicationNumber() + "-other-" + idx)
                                .title(docTitle)
                                .fileStoreId(doc.getFileStore())
                                .build());
                    }
                    prodDocChildren.add(CaseBundleNode.builder()
                            .id(application.getApplicationNumber() + "-others")
                            .title("OTHER_DOCUMENTS_HEADING")
                            .children(otherChildren)
                            .build());
                }

                if (!prodDocChildren.isEmpty()) {
                    children.add(CaseBundleNode.builder()
                            .id(application.getApplicationNumber() + "-prod-" + applicationCounter)
                            .title(application.getApplicationType() + " " + applicationCounter)
                            .children(prodDocChildren)
                            .build());
                }
            }
        }

        if (children.isEmpty()) return null;

        return CaseBundleNode.builder()
                .id("mandatory-submissions-responses")
                .title("MANDATORY_SUBMISSIONS")
                .children(children)
                .build();
    }

    private String extractDocTitle(Document doc) {

        try {
            if (doc == null) return "DOCUMENT";

            Object additionalDetails = doc.getAdditionalDetails();
            if (additionalDetails instanceof Map<?, ?> additionalDetailsObject) {
                Object dt = additionalDetailsObject.get("documentTitle");
                if (dt instanceof String title && !title.isBlank()) return title;

                dt = additionalDetailsObject.get("documentType");
                if (dt instanceof String type && !type.isBlank()) return type;

                Object nameObj = additionalDetailsObject.get("name");
                if (nameObj instanceof String name && !name.isBlank()) {
                    int dotIdx = name.lastIndexOf('.');
                    return dotIdx > 0 ? name.substring(0, dotIdx) : name;
                }
            }

            String docType = doc.getDocumentType();
            if (docType != null && !docType.isBlank()) return docType;
            return "DOCUMENT";
        } catch (Exception e) {
            log.error("Failed to extract document title", e);
            return "DOCUMENT";
        }
    }
}
