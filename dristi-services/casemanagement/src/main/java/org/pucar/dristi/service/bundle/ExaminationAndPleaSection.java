package org.pucar.dristi.service.bundle;

import org.pucar.dristi.service.CaseBundleSection;
import org.pucar.dristi.web.models.BundleData;
import org.pucar.dristi.web.models.CaseBundleNode;
import org.pucar.dristi.web.models.digitalizeddocument.DigitalizedDocument;
import org.pucar.dristi.web.models.digitalizeddocument.TypeEnum;
import org.springframework.stereotype.Component;

import java.util.ArrayList;
import java.util.List;
import java.util.Objects;

@Component
public class ExaminationAndPleaSection implements CaseBundleSection {

    private static final List<String> DEFAULT_DOCTYPE_ORDER = List.of("PLEA", "EXAMINATION_OF_ACCUSED");

    @Override
    public String getOrder() {
        return "14";
    }

    @Override
    public CaseBundleNode build(BundleData data) {

        if (data == null || data.getDigitalDocs() == null) return null;

        List<String> doctypeOrder = data.getSectionDoctypeOrder() != null
                ? data.getSectionDoctypeOrder().getOrDefault("digitalizedDocuments", List.of())
                : List.of();

        if (doctypeOrder.isEmpty()) {
            doctypeOrder = DEFAULT_DOCTYPE_ORDER;
        }

        List<CaseBundleNode> result = new ArrayList<>();

        for (String doctype : doctypeOrder) {
            TypeEnum type;
            try {
                type = TypeEnum.valueOf(doctype);
            } catch (IllegalArgumentException e) {
                continue;
            }

            List<CaseBundleNode> nodes = buildNodesForType(data.getDigitalDocs(), type);
            if (nodes.isEmpty()) continue;

            String groupId = type == TypeEnum.PLEA ? "plea-group" : "s351-examination-group";
            String groupTitle = type == TypeEnum.PLEA ? "PLEA" : "S351_EXAMINATION";

            result.add(CaseBundleNode.builder()
                    .id(groupId)
                    .title(groupTitle)
                    .children(nodes)
                    .build());
        }

        if (result.isEmpty()) return null;

        return CaseBundleNode.builder()
                .id("examination-plea")
                .title("EXAMINATION_OF_ACCUSED")
                .children(result)
                .build();
    }

    private List<CaseBundleNode> buildNodesForType(List<DigitalizedDocument> docs, TypeEnum type) {
        return docs.stream()
                .filter(Objects::nonNull)
                .filter(doc -> doc.getType() == type)
                .map(doc -> {
                    String fs = BundleSectionUtils.digitalizedFileStoreId(doc);
                    if (fs == null) return null;
                    String title = type == TypeEnum.PLEA
                            ? buildPleaTitle(doc)
                            : buildExamTitle(doc);
                    return CaseBundleNode.builder()
                            .id(type.name().toLowerCase() + "-" + doc.getId())
                            .title(title)
                            .fileStoreId(fs)
                            .build();
                })
                .filter(Objects::nonNull)
                .toList();
    }

    private String buildPleaTitle(DigitalizedDocument doc) {
        if (doc.getPleaDetails() != null && doc.getPleaDetails().getAccusedName() != null) {
            return "Plea (" + doc.getPleaDetails().getAccusedName() + ")";
        }
        return "PLEA";
    }

    private String buildExamTitle(DigitalizedDocument doc) {
        if (doc.getExaminationOfAccusedDetails() != null && doc.getExaminationOfAccusedDetails().getAccusedName() != null) {
            return "S351 Examination (" + doc.getExaminationOfAccusedDetails().getAccusedName() + ")";
        }
        return "S351_EXAMINATION";
    }
}
