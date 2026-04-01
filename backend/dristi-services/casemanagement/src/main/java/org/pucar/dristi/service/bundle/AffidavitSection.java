package org.pucar.dristi.service.bundle;

import org.egov.common.contract.models.Document;
import org.pucar.dristi.service.CaseBundleSection;
import org.pucar.dristi.web.models.BundleData;
import org.pucar.dristi.web.models.CaseBundleNode;
import org.springframework.stereotype.Component;

import java.util.ArrayList;
import java.util.List;
import java.util.Objects;

@Component
public class AffidavitSection implements CaseBundleSection {

    @Override
    public String getOrder() {
        return "04";
    }

    @Override
    public CaseBundleNode build(BundleData data) {

        if (data == null || data.getCases() == null || data.getCases().getDocuments() == null)
            return null;

        List<Document> docs = data.getCases().getDocuments();

        Document affidavit223 = docs.stream()
                .filter(Objects::nonNull)
                .filter(d -> "case.affidavit.223bnss".equalsIgnoreCase(d.getDocumentType()))
                .filter(d -> d.getFileStore() != null)
                .findFirst()
                .orElse(null);

        List<Document> affidavit225List = docs.stream()
                .filter(Objects::nonNull)
                .filter(d -> "case.affidavit.225bnss".equalsIgnoreCase(d.getDocumentType()))
                .filter(d -> d.getFileStore() != null)
                .toList();

        List<CaseBundleNode> children = new ArrayList<>();

        if (affidavit223 != null) {
            children.add(CaseBundleNode.builder()
                    .id("affidavit-223bnss")
                    .title("AFFIDAVIT_UNDER_SECTION_223_BNSS")
                    .fileStoreId(affidavit223.getFileStore())
                    .build());
        }

        if (!affidavit225List.isEmpty()) {
            List<CaseBundleNode> subChildren = new ArrayList<>();
            for (int i = 0; i < affidavit225List.size(); i++) {
                Document d = affidavit225List.get(i);
                subChildren.add(CaseBundleNode.builder()
                        .id("affidavit-225-" + (i + 1))
                        .title("AFFIDAVIT " + (i + 1))
                        .fileStoreId(d.getFileStore())
                        .build());
            }

            children.add(CaseBundleNode.builder()
                    .id("affidavit-225bnss")
                    .title("AFFIDAVIT_UNDER_225")
                    .children(subChildren)
                    .build());
        }

        if (children.isEmpty()) return null;

        return CaseBundleNode.builder()
                .id("affidavits")
                .title("AFFIDAVITS_PDF")
                .children(children)
                .build();
    }
}
