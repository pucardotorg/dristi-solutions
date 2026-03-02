package org.pucar.dristi.service.bundle;

import org.pucar.dristi.service.CaseBundleSection;
import org.pucar.dristi.web.models.BundleData;
import org.pucar.dristi.web.models.CaseBundleNode;
import org.pucar.dristi.web.models.digitalizeddocument.DigitalizedDocument;
import org.springframework.stereotype.Component;

import java.util.ArrayList;
import java.util.List;

@Component
public class DigitalizedDocumentsSection implements CaseBundleSection {

    @Override
    public String getOrder() {
        return "19";
    }

    @Override
    public CaseBundleNode build(BundleData data) {
        if (data == null || data.getDigitalDocs() == null || data.getDigitalDocs().isEmpty()) return null;

        List<CaseBundleNode> children = new ArrayList<>();
        int idx = 0;
        for (DigitalizedDocument dd : data.getDigitalDocs()) {
            String fileStoreId = BundleSectionUtils.digitalizedFileStoreId(dd);
            if (fileStoreId == null) continue;

            String title = dd.getType() != null ? dd.getType().toString() : "DIGITALIZED_DOCUMENT";

            children.add(CaseBundleNode.builder()
                    .id("digital-doc-" + idx++)
                    .title(title)
                    .fileStoreId(fileStoreId)
                    .build());
        }

        if (children.isEmpty()) return null;

        return CaseBundleNode.builder()
                .id("digitalized-documents")
                .title("DIGITALIZED_DOCUMENTS")
                .children(children)
                .build();
    }
}
