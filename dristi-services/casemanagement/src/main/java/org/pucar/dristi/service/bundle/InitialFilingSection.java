package org.pucar.dristi.service.bundle;

import org.egov.common.contract.models.Document;
import org.pucar.dristi.service.CaseBundleSection;
import org.pucar.dristi.web.models.BundleData;
import org.pucar.dristi.web.models.CaseBundleNode;
import org.pucar.dristi.web.models.CourtCase;
import org.springframework.stereotype.Component;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.Objects;

@Component
public class InitialFilingSection implements CaseBundleSection {

    private static final Map<String, String> CASE_FILE_LABELS = Map.ofEntries(
            Map.entry("case.authorizationproof.complainant", "COMPLAINANT_AUTHORIZATION_PROOF"),
            Map.entry("case.authorizationproof.accused", "ACCUSED_AUTHORIZATION_PROOF"),
            Map.entry("case.cheque", "DISHONORED_CHEQUE"),
            Map.entry("case.cheque.depositslip", "PROOF_OF_DEPOSIT_OF_CHEQUE"),
            Map.entry("case.cheque.returnmemo", "CHEQUE_RETURN_MEMO"),
            Map.entry("case.demandnotice", "LEGAL_DEMAND_NOTICE"),
            Map.entry("case.demandnotice.proof", "PROOF_OF_DISPATCH_OF_LEGAL_DEMAND_NOTICE"),
            Map.entry("case.demandnotice.serviceproof", "PROOF_OF_ACKNOWLEDGMENT"),
            Map.entry("case.replynotice", "PROOF_OF_REPLY"),
            Map.entry("case.liabilityproof", "PROOF_OF_DEBT_LIABILITY"),
            Map.entry("case.docs", "OTHERS_DOCUMENT")
    );

    private static final List<String> DEFAULT_DOCTYPE_ORDER = new ArrayList<>(CASE_FILE_LABELS.keySet());

    @Override
    public String getOrder() {
        return "03";
    }

    @Override
    public CaseBundleNode build(BundleData data) {

        if (data == null || data.getCases() == null || data.getCases().getDocuments() == null)
            return null;

        List<String> doctypeOrder = data.getSectionDoctypeOrder() != null
                ? data.getSectionDoctypeOrder().getOrDefault("filings", List.of())
                : List.of();

        if (doctypeOrder.isEmpty()) {
            doctypeOrder = DEFAULT_DOCTYPE_ORDER;
        }

        CourtCase courtCase = data.getCases();
        List<CaseBundleNode> children = new ArrayList<>();

        for (String doctype : doctypeOrder) {
            if (!isIncludedDocumentType(doctype)) continue;

            List<Document> matching = courtCase.getDocuments().stream()
                    .filter(Objects::nonNull)
                    .filter(d -> d.getDocumentType() != null && d.getDocumentType().equalsIgnoreCase(doctype))
                    .filter(d -> d.getFileStore() != null)
                    .toList();

            if (matching.isEmpty()) continue;

            String label = getLabelForDocumentType(doctype);

            if (matching.size() == 1) {
                children.add(CaseBundleNode.builder()
                        .id(doctype)
                        .title(label)
                        .fileStoreId(matching.get(0).getFileStore())
                        .build());
            } else {
                List<CaseBundleNode> subChildren = new ArrayList<>();
                for (int i = 0; i < matching.size(); i++) {
                    subChildren.add(CaseBundleNode.builder()
                            .id(doctype + "-" + (i + 1))
                            .title(label + " " + (i + 1))
                            .fileStoreId(matching.get(i).getFileStore())
                            .build());
                }
                children.add(CaseBundleNode.builder()
                        .id(doctype)
                        .title(label)
                        .children(subChildren)
                        .build());
            }
        }

        if (children.isEmpty()) return null;

        return CaseBundleNode.builder()
                .id("initial-filing")
                .title("INITIAL_FILINGS")
                .children(children)
                .build();
    }

    private boolean isIncludedDocumentType(String documentType) {
        if (documentType == null) return false;
        return CASE_FILE_LABELS.keySet().stream()
                .anyMatch(key -> key.equalsIgnoreCase(documentType));
    }

    private String getLabelForDocumentType(String documentType) {
        if (documentType == null) return documentType;
        return CASE_FILE_LABELS.entrySet().stream()
                .filter(entry -> entry.getKey().equalsIgnoreCase(documentType))
                .map(Map.Entry::getValue)
                .findFirst()
                .orElse(documentType);
    }
}
