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

    @Override
    public String getOrder() {
        return "14";
    }

    @Override
    public CaseBundleNode build(BundleData data) {

        if (data == null || data.getDigitalDocs() == null) return null;

        List<CaseBundleNode> result = new ArrayList<>();

        List<CaseBundleNode> pleaNodes = data.getDigitalDocs().stream()
                .filter(Objects::nonNull)
                .filter(doc -> doc.getType() == TypeEnum.PLEA)
                .map(doc -> {
                    String fs = BundleSectionUtils.digitalizedFileStoreId(doc);
                    if (fs == null) return null;
                    String partyName = extractPleaPartyName(doc);
                    return CaseBundleNode.builder()
                            .id("plea-" + doc.getId())
                            .title(partyName != null ? partyName : "PLEA")
                            .fileStoreId(fs)
                            .build();
                })
                .filter(Objects::nonNull)
                .toList();

        if (!pleaNodes.isEmpty()) {
            result.add(CaseBundleNode.builder()
                    .id("plea-group")
                    .title("PLEA")
                    .children(pleaNodes)
                    .build());
        }

        List<CaseBundleNode> examNodes = data.getDigitalDocs().stream()
                .filter(Objects::nonNull)
                .filter(doc -> doc.getType() == TypeEnum.EXAMINATION_OF_ACCUSED)
                .map(doc -> {
                    String fs = BundleSectionUtils.digitalizedFileStoreId(doc);
                    if (fs == null) return null;
                    String partyName = extractExamPartyName(doc);
                    return CaseBundleNode.builder()
                            .id("exam-" + doc.getId())
                            .title(partyName != null ? partyName : "S351_EXAMINATION")
                            .fileStoreId(fs)
                            .build();
                })
                .filter(Objects::nonNull)
                .toList();

        if (!examNodes.isEmpty()) {
            result.add(CaseBundleNode.builder()
                    .id("s351-examination-group")
                    .title("S351_EXAMINATION")
                    .children(examNodes)
                    .build());
        }

        if (result.isEmpty()) return null;

        return CaseBundleNode.builder()
                .id("examination-plea")
                .title("EXAMINATION_OF_ACCUSED")
                .children(result)
                .build();
    }

    private String extractPleaPartyName(DigitalizedDocument doc) {
        if (doc.getPleaDetails() != null && doc.getPleaDetails().getAccusedName() != null) {
            return doc.getPleaDetails().getAccusedName();
        }
        return null;
    }

    private String extractExamPartyName(DigitalizedDocument doc) {
        if (doc.getExaminationOfAccusedDetails() != null && doc.getExaminationOfAccusedDetails().getAccusedName() != null) {
            return doc.getExaminationOfAccusedDetails().getAccusedName();
        }
        return null;
    }
}
