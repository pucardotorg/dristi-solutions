package org.pucar.dristi.service.bundle;

import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import org.egov.common.contract.models.Document;
import org.pucar.dristi.service.CaseBundleSection;
import org.pucar.dristi.web.models.Application;
import org.pucar.dristi.web.models.BundleData;
import org.pucar.dristi.web.models.CaseBundleNode;
import org.pucar.dristi.web.models.Comment;
import org.springframework.stereotype.Component;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.Set;

@Component
@RequiredArgsConstructor
public class PendingApplicationsSection implements CaseBundleSection {

    private static final Set<String> PENDING_STATUSES = Set.of("PENDINGREVIEW", "PENDINGAPPROVAL", "DOCUMENT_UPLOAD");

    private final ObjectMapper objectMapper;

    @Override
    public String getOrder() {
        return "02";
    }

    @Override
    public CaseBundleNode build(BundleData data) {

        if (data == null || data.getApplications() == null)
            return null;

        String sortField = data.getSectionSortFields() != null ? data.getSectionSortFields().get("pendingapplications") : null;

        List<Application> filteredApps = data.getApplications().stream()
                .filter(Objects::nonNull)
                .filter(app -> app.getStatus() != null && PENDING_STATUSES.contains(app.getStatus().toUpperCase()))
                .collect(java.util.stream.Collectors.toCollection(ArrayList::new));

        BundleSectionUtils.sortApplications(filteredApps, sortField);

        List<CaseBundleNode> children = filteredApps.stream()
                .map(this::toNode)
                .filter(Objects::nonNull)
                .toList();

        if (children.isEmpty()) return null;

        return CaseBundleNode.builder()
                .id("pending-application")
                .title("PENDING_APPLICATION")
                .children(children)
                .build();
    }

    private CaseBundleNode toNode(Application app) {
        List<CaseBundleNode> subChildren = new ArrayList<>();

        // 1. Signed / Condonation document
        if (app.getDocuments() != null) {
            String signedFileStoreId = app.getDocuments().stream()
                    .filter(Objects::nonNull)
                    .filter(d -> "SIGNED".equalsIgnoreCase(d.getDocumentType()) || "CONDONATION_DOC".equalsIgnoreCase(d.getDocumentType()))
                    .map(Document::getFileStore)
                    .filter(Objects::nonNull)
                    .findFirst()
                    .orElse(null);

            if (signedFileStoreId != null) {
                subChildren.add(CaseBundleNode.builder()
                        .id(app.getApplicationNumber() + "-signed")
                        .title("APPLICATION_PDF_HEADING")
                        .fileStoreId(signedFileStoreId)
                        .build());
            }
        }

        // 2. Objection comments (matching UI: comment.additionalDetails.commentDocumentId)
        if (app.getComment() != null) {
            List<CaseBundleNode> objectionChildren = new ArrayList<>();
            int objIndex = 0;
            for (Comment comment : app.getComment()) {
                if (comment == null) continue;
                String commentDocId = extractCommentDocumentId(comment);
                if (commentDocId == null) continue;

                objectionChildren.add(CaseBundleNode.builder()
                        .id(app.getApplicationNumber() + "-objection-" + objIndex)
                        .title("OBJECTION_APPLICATION " + (objIndex + 1))
                        .fileStoreId(commentDocId)
                        .build());
                objIndex++;
            }

            if (!objectionChildren.isEmpty()) {
                subChildren.add(CaseBundleNode.builder()
                        .id(app.getApplicationNumber() + "-objections")
                        .title("OBJECTION_APPLICATION_HEADING")
                        .children(objectionChildren)
                        .build());
            }
        }

        if (subChildren.isEmpty()) return null;

        return CaseBundleNode.builder()
                .id(app.getApplicationNumber())
                .title(app.getApplicationType())
                .children(subChildren)
                .build();
    }

    @SuppressWarnings("unchecked")
    private String extractCommentDocumentId(Comment comment) {
        if (comment.getAdditionalDetails() == null) return null;
        if (comment.getAdditionalDetails() instanceof Map) {
            Object docId = ((Map<String, Object>) comment.getAdditionalDetails()).get("commentDocumentId");
            if (docId instanceof String && !((String) docId).isBlank()) return (String) docId;
        }
        return null;
    }
}
