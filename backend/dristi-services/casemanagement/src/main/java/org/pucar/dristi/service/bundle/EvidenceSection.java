package org.pucar.dristi.service.bundle;

import org.egov.common.contract.models.Document;
import org.pucar.dristi.service.CaseBundleSection;
import org.pucar.dristi.web.models.Artifact;
import org.pucar.dristi.web.models.BundleData;
import org.pucar.dristi.web.models.CaseBundleNode;
import org.pucar.dristi.web.models.CourtCase;
import org.pucar.dristi.web.models.docpreview.DocPreviewRequest;
import org.springframework.stereotype.Component;

import java.util.ArrayList;
import java.util.List;

@Component
public class EvidenceSection implements CaseBundleSection {

    @Override
    public String getOrder() {
        return "08";
    }

    @Override
    public CaseBundleNode build(BundleData data, DocPreviewRequest request) {
        if (data == null || data.getEvidences() == null || data.getEvidences().isEmpty()) return null;

        List<CaseBundleNode> children = new ArrayList<>();
        int idx = 0;
        for (Artifact artifact : data.getEvidences()) {
            if (artifact == null || artifact.getFile() == null) continue;

            Document file = artifact.getFile();
            String fileStoreId = file.getFileStore();
            if (fileStoreId == null) continue;

            String title = BundleSectionUtils.firstNonBlank(
                    artifact.getArtifactNumber(),
                    artifact.getEvidenceNumber(),
                    file.getDocumentType(),
                    artifact.getArtifactType(),
                    "EVIDENCE"
            );

            children.add(CaseBundleNode.builder()
                    .id("evidence-" + idx++)
                    .title(title)
                    .fileStoreId(fileStoreId)
                    .build());
        }

        if (children.isEmpty()) return null;

        return CaseBundleNode.builder()
                .id("evidence")
                .title("ADDITIONAL_FILINGS")
                .children(children)
                .build();
    }
}
