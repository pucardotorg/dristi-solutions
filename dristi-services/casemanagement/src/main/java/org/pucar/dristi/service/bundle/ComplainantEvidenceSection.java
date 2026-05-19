package org.pucar.dristi.service.bundle;

import org.pucar.dristi.service.CaseBundleSection;
import org.pucar.dristi.web.models.Artifact;
import org.pucar.dristi.web.models.BundleData;
import org.pucar.dristi.web.models.CaseBundleNode;
import org.springframework.stereotype.Component;

import java.util.ArrayList;
import java.util.List;
import java.util.Objects;
import java.util.stream.Collectors;

@Component
public class ComplainantEvidenceSection implements CaseBundleSection {

    @Override
    public String getOrder() {
        return "08";
    }

    @Override
    public CaseBundleNode build(BundleData data) {

        if (data == null || data.getEvidences() == null) return null;

        String depositionSortField = data.getSectionSortFields() != null ? data.getSectionSortFields().get("complainantevidencedepositions") : null;
        String evidenceSortField = data.getSectionSortFields() != null ? data.getSectionSortFields().get("complainantevidence") : null;

        List<CaseBundleNode> result = new ArrayList<>();

        List<Artifact> depositionArtifacts = data.getEvidences().stream()
                .filter(Objects::nonNull)
                .filter(a -> "WITNESS_DEPOSITION".equalsIgnoreCase(a.getArtifactType()))
                .filter(a -> "COMPLETED".equalsIgnoreCase(a.getStatus()))
                .filter(a -> "COMPLAINANT".equalsIgnoreCase(BundleSectionUtils.getWitnessOwnerType(a)))
                .filter(a -> a.getFile() != null && a.getFile().getFileStore() != null)
                .collect(Collectors.toCollection(ArrayList::new));

        BundleSectionUtils.sortArtifacts(depositionArtifacts, depositionSortField);

        List<CaseBundleNode> depositions = depositionArtifacts.stream()
                .map(a -> CaseBundleNode.builder()
                        .id("complainant-deposition-" + a.getId())
                        .title(BundleSectionUtils.extractDepositionTitle(a))
                        .fileStoreId(a.getFile().getFileStore())
                        .build())
                .toList();

        if (!depositions.isEmpty()) {
            result.add(CaseBundleNode.builder()
                    .id("complainant-depositions")
                    .title("DEPOSITIONS_PDF_HEADING")
                    .children(depositions)
                    .build());
        }

        List<Artifact> evidenceArtifacts = data.getEvidences().stream()
                .filter(Objects::nonNull)
                .filter(a -> "COMPLAINANT".equalsIgnoreCase(a.getSourceType()))
                .filter(a -> Boolean.TRUE.equals(a.getIsEvidence()))
                .filter(a -> a.getFile() != null && a.getFile().getFileStore() != null)
                .collect(Collectors.toCollection(ArrayList::new));

        BundleSectionUtils.sortArtifacts(evidenceArtifacts, evidenceSortField);

        List<CaseBundleNode> evidences = evidenceArtifacts.stream()
                .map(a -> CaseBundleNode.builder()
                        .id("complainant-evidence-" + a.getId())
                        .title(BundleSectionUtils.extractEvidenceTitle(a))
                        .fileStoreId(a.getFile().getFileStore())
                        .build())
                .toList();

        if (!evidences.isEmpty()) {
            result.add(CaseBundleNode.builder()
                    .id("complainant-evidences")
                    .title("EVIDENCES_PDF_HEADING")
                    .children(evidences)
                    .build());
        }

        if (result.isEmpty()) return null;

        return CaseBundleNode.builder()
                .id("complaint-evidence")
                .title("EVIDENCE_OF_COMPLAINANT")
                .children(result)
                .build();
    }
}
