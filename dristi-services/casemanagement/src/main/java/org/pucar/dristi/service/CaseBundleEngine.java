package org.pucar.dristi.service;

import lombok.RequiredArgsConstructor;
import org.pucar.dristi.web.models.BundleData;
import org.pucar.dristi.web.models.CaseBundleNode;
import org.pucar.dristi.web.models.docpreview.DocPreviewRequest;
import org.springframework.stereotype.Service;

import java.util.Comparator;
import java.util.List;
import java.util.Map;
import java.util.Set;

@Service
@RequiredArgsConstructor
public class CaseBundleEngine {

    private final List<CaseBundleSection> sections;

    public List<CaseBundleNode> build(BundleData data) {

        Map<String, String> sectionOrders = data.getSectionOrders();
        Set<String> inactiveSections = data.getInactiveSections();

        return sections.stream()
                .filter(section -> !isInactive(section, inactiveSections))
                .sorted(Comparator.comparing(section -> resolveOrder(section, sectionOrders)))
                .map(section -> section.build(data))
                .filter(this::isValidNode)
                .toList();
    }

    private boolean isInactive(CaseBundleSection section, Set<String> inactiveSections) {
        return inactiveSections != null && inactiveSections.contains(section.getSectionKey());
    }

    private String resolveOrder(CaseBundleSection section, Map<String, String> sectionOrders) {
        if (sectionOrders != null) {
            String mdmsOrder = sectionOrders.get(section.getSectionKey());
            if (mdmsOrder != null) {
                return mdmsOrder;
            }
        }
        return section.getOrder();
    }

    private boolean isValidNode(CaseBundleNode node) {

        if (node == null) return false;

        if (node.getChildren() != null && !node.getChildren().isEmpty())
            return true;

        return node.getFileStoreId() != null;
    }
}
