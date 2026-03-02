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

@Component
public class ApplicationsSection implements CaseBundleSection {

    @Override
    public String getOrder() {
        return "04";
    }

    @Override
    public CaseBundleNode build(BundleData data) {
        if (data == null || data.getApplications() == null || data.getApplications().isEmpty()) return null;

        List<CaseBundleNode> children = new ArrayList<>();
        for (Application application : data.getApplications()) {
            if (application == null) continue;

            String fileStoreId = null;
            List<Document> docs = application.getDocuments();
            if (docs != null) {
                fileStoreId = docs.stream()
                        .filter(Objects::nonNull)
                        .filter(d -> "SIGNED".equalsIgnoreCase(d.getDocumentType()) || "CONDONATION_DOC".equalsIgnoreCase(d.getDocumentType()))
                        .map(Document::getFileStore)
                        .filter(Objects::nonNull)
                        .findFirst()
                        .orElse(null);

                if (fileStoreId == null) {
                    fileStoreId = findAnyFileStoreId(docs);
                }
            }

            if (fileStoreId == null) continue;

            String id = application.getApplicationNumber() != null ? application.getApplicationNumber() : String.valueOf(application.getId());
            String title = BundleSectionUtils.firstNonBlank(application.getApplicationType(), "APPLICATION");

            children.add(CaseBundleNode.builder()
                    .id(id)
                    .title(title)
                    .fileStoreId(fileStoreId)
                    .build());
        }

        if (children.isEmpty()) return null;

        return CaseBundleNode.builder()
                .id("applications")
                .title("APPLICATIONS")
                .children(children)
                .build();
    }

    public static String findAnyFileStoreId(List<Document> documents) {
        if (documents == null || documents.isEmpty()) return null;
        return documents.stream()
                .filter(Objects::nonNull)
                .map(Document::getFileStore)
                .filter(Objects::nonNull)
                .findFirst()
                .orElse(null);
    }
}
