package org.pucar.dristi.service.bundle;

import org.pucar.dristi.service.CaseBundleSection;
import org.pucar.dristi.web.models.BundleData;
import org.pucar.dristi.web.models.CaseBundleNode;
import org.pucar.dristi.web.models.digitalizeddocument.TypeEnum;
import org.springframework.stereotype.Component;

import java.util.ArrayList;
import java.util.List;
import java.util.Objects;
import java.util.concurrent.atomic.AtomicInteger;

@Component
public class OthersSection implements CaseBundleSection {

    @Override
    public String getOrder() {
        return "16";
    }

    @Override
    public CaseBundleNode build(BundleData data) {

        if (data == null || data.getDigitalDocs() == null) return null;

        List<CaseBundleNode> result = new ArrayList<>();

        AtomicInteger medIdx = new AtomicInteger(1);
        List<CaseBundleNode> mediationNodes = data.getDigitalDocs().stream()
                .filter(Objects::nonNull)
                .filter(doc -> doc.getType() == TypeEnum.MEDIATION)
                .map(doc -> {
                    String fs = BundleSectionUtils.digitalizedFileStoreId(doc);
                    if (fs == null) return null;
                    int idx = medIdx.getAndIncrement();
                    return CaseBundleNode.builder()
                            .id("mediation-" + doc.getId())
                            .title("MEDIATION " + idx)
                            .fileStoreId(fs)
                            .build();
                })
                .filter(Objects::nonNull)
                .toList();

        if (!mediationNodes.isEmpty()) {
            result.add(CaseBundleNode.builder()
                    .id("mediation-group")
                    .title("MEDIATION")
                    .children(mediationNodes)
                    .build());
        }

        if (result.isEmpty()) return null;

        return CaseBundleNode.builder()
                .id("others")
                .title("OTHERS")
                .children(result)
                .build();
    }
}
