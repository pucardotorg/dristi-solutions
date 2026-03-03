package org.pucar.dristi.service.bundle;

import org.egov.common.contract.models.Document;
import org.pucar.dristi.service.CaseBundleSection;
import org.pucar.dristi.web.models.Application;
import org.pucar.dristi.web.models.BundleData;
import org.pucar.dristi.web.models.CaseBundleNode;
import org.springframework.stereotype.Component;

import java.util.ArrayList;
import java.util.List;
import java.util.Objects;
import java.util.Set;

@Component
public class PendingApplicationsSection implements CaseBundleSection {

    private static final Set<String> PENDING_STATUSES = Set.of("PENDINGREVIEW", "PENDINGAPPROVAL", "DOCUMENT_UPLOAD");

    @Override
    public String getOrder() {
        return "02";
    }

    @Override
    public CaseBundleNode build(BundleData data) {

        if (data == null || data.getApplications() == null)
            return null;

        List<CaseBundleNode> children = data.getApplications().stream()
                .filter(Objects::nonNull)
                .filter(app -> app.getStatus() != null && PENDING_STATUSES.contains(app.getStatus().toUpperCase()))
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

        if (subChildren.isEmpty()) return null;

        return CaseBundleNode.builder()
                .id(app.getApplicationNumber())
                .title(app.getApplicationType())
                .children(subChildren)
                .build();
    }
}
