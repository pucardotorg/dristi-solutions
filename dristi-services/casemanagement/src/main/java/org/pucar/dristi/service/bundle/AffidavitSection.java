package org.pucar.dristi.service.bundle;

import org.egov.common.contract.models.Document;
import org.pucar.dristi.service.CaseBundleSection;
import org.pucar.dristi.web.models.BundleData;
import org.pucar.dristi.web.models.CaseBundleNode;
import org.springframework.stereotype.Component;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.Objects;

@Component
public class AffidavitSection implements CaseBundleSection {

    private static final List<String> DEFAULT_DOCTYPE_ORDER = List.of(
            "case.affidavit.223bnss",
            "case.affidavit.225bnss"
    );

    private static final Map<String, String> DOCTYPE_TITLES = Map.of(
            "case.affidavit.223bnss", "AFFIDAVIT_UNDER_SECTION_223_BNSS",
            "case.affidavit.225bnss", "AFFIDAVIT_UNDER_225"
    );

    @Override
    public String getOrder() {
        return "04";
    }

    @Override
    public CaseBundleNode build(BundleData data) {

        if (data == null || data.getCases() == null || data.getCases().getDocuments() == null)
            return null;

        List<String> doctypeOrder = data.getSectionDoctypeOrder() != null
                ? data.getSectionDoctypeOrder().getOrDefault("affidavit", List.of())
                : List.of();

        if (doctypeOrder.isEmpty()) {
            doctypeOrder = DEFAULT_DOCTYPE_ORDER;
        }

        List<Document> allDocs = data.getCases().getDocuments();
        List<CaseBundleNode> children = new ArrayList<>();

        for (String doctype : doctypeOrder) {
            List<Document> matching = allDocs.stream()
                    .filter(Objects::nonNull)
                    .filter(d -> doctype.equalsIgnoreCase(d.getDocumentType()))
                    .filter(d -> d.getFileStore() != null)
                    .toList();

            if (matching.isEmpty()) continue;

            String title = DOCTYPE_TITLES.getOrDefault(doctype, doctype);
            String idBase = "affidavit-" + doctype.replace(".", "-");

            if (matching.size() == 1) {
                children.add(CaseBundleNode.builder()
                        .id(idBase)
                        .title(title)
                        .fileStoreId(matching.get(0).getFileStore())
                        .build());
            } else {
                List<CaseBundleNode> subChildren = new ArrayList<>();
                for (int i = 0; i < matching.size(); i++) {
                    subChildren.add(CaseBundleNode.builder()
                            .id(idBase + "-" + (i + 1))
                            .title("AFFIDAVIT " + (i + 1))
                            .fileStoreId(matching.get(i).getFileStore())
                            .build());
                }
                children.add(CaseBundleNode.builder()
                        .id(idBase)
                        .title(title)
                        .children(subChildren)
                        .build());
            }
        }

        if (children.isEmpty()) return null;

        return CaseBundleNode.builder()
                .id("affidavits")
                .title("AFFIDAVITS_PDF")
                .children(children)
                .build();
    }
}
