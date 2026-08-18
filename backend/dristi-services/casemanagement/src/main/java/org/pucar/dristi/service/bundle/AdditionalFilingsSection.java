package org.pucar.dristi.service.bundle;

import org.pucar.dristi.service.CaseBundleSection;
import org.pucar.dristi.web.models.BundleData;
import org.pucar.dristi.web.models.CaseBundleNode;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.Objects;

@Component
public class AdditionalFilingsSection implements CaseBundleSection {

    @Override
    public String getOrder() {
        return "06";
    }

    @Override
    public CaseBundleNode build(BundleData data) {

        if (data == null || data.getAdditionalFilingEvidences() == null) return null;

        // Uses the dedicated list fetched with filingType=DIRECT + APPLICATION, evidenceStatus=false
        List<CaseBundleNode> children = data.getAdditionalFilingEvidences().stream()
                .filter(Objects::nonNull)
                .filter(a -> a.getFile() != null && a.getFile().getFileStore() != null)
                .map(a -> {
                    String title = BundleSectionUtils.extractEvidenceTitle(a);
                    return CaseBundleNode.builder()
                            .id("evidence-" + a.getId())
                            .title(title)
                            .fileStoreId(a.getFile().getFileStore())
                            .build();
                })
                .toList();

        if (children.isEmpty()) return null;

        return CaseBundleNode.builder()
                .id("evidence")
                .title("ADDITIONAL_FILINGS")
                .children(children)
                .build();
    }
}
