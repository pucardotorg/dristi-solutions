package org.pucar.dristi.service.bundle;

import org.pucar.dristi.service.CaseBundleSection;
import org.pucar.dristi.web.models.BundleData;
import org.pucar.dristi.web.models.CaseBundleNode;
import org.springframework.stereotype.Component;

import java.util.ArrayList;
import java.util.List;
import java.util.Objects;

@Component
public class AccusedEvidenceSection implements CaseBundleSection {

    @Override
    public String getOrder() {
        return "09";
    }

    @Override
    public CaseBundleNode build(BundleData data) {

        if (data == null || data.getEvidences() == null) return null;

        List<CaseBundleNode> result = new ArrayList<>();

        List<CaseBundleNode> depositions = data.getEvidences().stream()
                .filter(Objects::nonNull)
                .filter(a -> "WITNESS_DEPOSITION".equalsIgnoreCase(a.getArtifactType()))
                .filter(a -> "COMPLETED".equalsIgnoreCase(a.getStatus()))
                .filter(a -> "ACCUSED".equalsIgnoreCase(BundleSectionUtils.getWitnessOwnerType(a)))
                .filter(a -> a.getFile() != null && a.getFile().getFileStore() != null)
                .map(a -> CaseBundleNode.builder()
                        .id("accused-deposition-" + a.getId())
                        .title(BundleSectionUtils.extractDepositionTitle(a))
                        .fileStoreId(a.getFile().getFileStore())
                        .build())
                .toList();

        if (!depositions.isEmpty()) {
            result.add(CaseBundleNode.builder()
                    .id("accused-depositions")
                    .title("DEPOSITIONS_PDF_HEADING")
                    .children(depositions)
                    .build());
        }

        List<CaseBundleNode> evidences = data.getEvidences().stream()
                .filter(Objects::nonNull)
                .filter(a -> "ACCUSED".equalsIgnoreCase(a.getSourceType()))
                .filter(a -> Boolean.TRUE.equals(a.getIsEvidence()))
                .filter(a -> a.getFile() != null && a.getFile().getFileStore() != null)
                .map(a -> CaseBundleNode.builder()
                        .id("accused-evidence-" + a.getId())
                        .title(BundleSectionUtils.extractEvidenceTitle(a))
                        .fileStoreId(a.getFile().getFileStore())
                        .build())
                .toList();

        if (!evidences.isEmpty()) {
            result.add(CaseBundleNode.builder()
                    .id("accused-evidences")
                    .title("EVIDENCES_PDF_HEADING")
                    .children(evidences)
                    .build());
        }

        if (result.isEmpty()) return null;

        return CaseBundleNode.builder()
                .id("accused-evidence")
                .title("EVIDENCE_OF_ACCUSED")
                .children(result)
                .build();
    }
}
