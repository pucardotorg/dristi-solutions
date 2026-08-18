package org.pucar.dristi.service.bundle;

import org.egov.common.contract.models.Document;
import org.pucar.dristi.service.CaseBundleSection;
import org.pucar.dristi.web.models.BundleData;
import org.pucar.dristi.web.models.CaseBundleNode;
import org.pucar.dristi.web.models.CourtCase;
import org.pucar.dristi.web.models.docpreview.DocPreviewRequest;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.Objects;

@Component
public class ComplaintSection implements CaseBundleSection {

    @Override
    public String getOrder() {
        return "01";
    }

    @Override
    public CaseBundleNode build(BundleData data) {
        if (data == null) return null;

        CourtCase courtCase = data.getCases();
        if (courtCase == null) return null;

        List<Document> documents = courtCase.getDocuments();
        String fileStoreId = findFileStoreId(documents, "case.complaint.signed");
        if (fileStoreId == null) {
            fileStoreId = findAnyFileStoreId(documents);
        }

        if (fileStoreId == null) return null;

        return CaseBundleNode.builder()
                .id("complaint")
                .title("COMPLAINT_PDF")
                .fileStoreId(fileStoreId)
                .build();
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
