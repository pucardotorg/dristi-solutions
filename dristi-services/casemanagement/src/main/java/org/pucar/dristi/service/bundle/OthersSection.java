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

    private static final List<String> DEFAULT_DOCTYPE_ORDER = List.of("MEDIATION");

    @Override
    public String getOrder() {
        return "16";
    }

    @Override
    public CaseBundleNode build(BundleData data) {

        if (data == null || data.getDigitalDocs() == null) return null;

        List<String> doctypeOrder = data.getSectionDoctypeOrder() != null
                ? data.getSectionDoctypeOrder().getOrDefault("others", List.of())
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

            AtomicInteger idx = new AtomicInteger(1);
            List<CaseBundleNode> nodes = data.getDigitalDocs().stream()
                    .filter(Objects::nonNull)
                    .filter(doc -> doc.getType() == type)
                    .map(doc -> {
                        String fs = BundleSectionUtils.digitalizedFileStoreId(doc);
                        if (fs == null) return null;
                        int i = idx.getAndIncrement();
                        return CaseBundleNode.builder()
                                .id(type.name().toLowerCase() + "-" + doc.getId())
                                .title(type.name() + "_FORM " + i)
                                .fileStoreId(fs)
                                .build();
                    })
                    .filter(Objects::nonNull)
                    .toList();

            if (nodes.isEmpty()) continue;

            result.add(CaseBundleNode.builder()
                    .id(type.name().toLowerCase() + "-group")
                    .title(type.name() + "_FORM")
                    .children(nodes)
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
