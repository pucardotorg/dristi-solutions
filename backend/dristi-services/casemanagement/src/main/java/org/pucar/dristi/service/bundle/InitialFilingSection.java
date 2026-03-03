package org.pucar.dristi.service.bundle;

import org.egov.common.contract.models.Document;
import org.pucar.dristi.service.CaseBundleSection;
import org.pucar.dristi.web.models.BundleData;
import org.pucar.dristi.web.models.CaseBundleNode;
import org.pucar.dristi.web.models.CourtCase;
import org.springframework.stereotype.Component;

import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Objects;

@Component
public class InitialFilingSection implements CaseBundleSection {

    @Override
    public String getOrder() {
        return "03";
    }

    @Override
    public CaseBundleNode build(BundleData data) {

        if (data == null || data.getCases() == null || data.getCases().getDocuments() == null)
            return null;

        List<CaseBundleNode> children = new ArrayList<>();

        CourtCase courtCase = data.getCases();
        Map<String, List<Document>> byType = new LinkedHashMap<>();
        for (Document doc : courtCase.getDocuments()) {
            if (doc == null || doc.getDocumentType() == null || doc.getFileStore() == null) continue;
            byType.computeIfAbsent(doc.getDocumentType(), k -> new ArrayList<>()).add(doc);
        }

        for (Map.Entry<String, List<Document>> entry : byType.entrySet()) {
            String documentType = entry.getKey();
            List<Document> docs = entry.getValue();
            if (docs == null || docs.isEmpty()) continue;

            String label = documentType;

            if (docs.size() == 1) {
                children.add(CaseBundleNode.builder()
                        .id(documentType)
                        .title(label)
                        .fileStoreId(docs.get(0).getFileStore())
                        .build());
            } else {
                List<CaseBundleNode> subChildren = new ArrayList<>();
                for (int i = 0; i < docs.size(); i++) {
                    Document d = docs.get(i);
                    if (d == null || d.getFileStore() == null) continue;
                    subChildren.add(CaseBundleNode.builder()
                            .id(documentType + "-" + (i + 1))
                            .title(label + " " + (i + 1))
                            .fileStoreId(d.getFileStore())
                            .build());
                }

                subChildren = subChildren.stream().filter(Objects::nonNull).toList();
                if (!subChildren.isEmpty()) {
                    children.add(CaseBundleNode.builder()
                            .id(documentType)
                            .title(label)
                            .children(subChildren)
                            .build());
                }
            }
        }

        if (children.isEmpty()) return null;

        return CaseBundleNode.builder()
                .id("initial-filing")
                .title("INITIAL_FILINGS")
                .children(children)
                .build();
    }
}
