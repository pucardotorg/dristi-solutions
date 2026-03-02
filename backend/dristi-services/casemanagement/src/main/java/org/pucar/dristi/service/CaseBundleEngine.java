package org.pucar.dristi.service;

import lombok.RequiredArgsConstructor;
import org.pucar.dristi.web.models.BundleData;
import org.pucar.dristi.web.models.CaseBundleNode;
import org.springframework.stereotype.Service;

import java.util.Comparator;
import java.util.List;

@Service
@RequiredArgsConstructor
public class CaseBundleEngine {

    private final List<CaseBundleSection> sections;

    public List<CaseBundleNode> build(BundleData data) {

        return sections.stream()
                .sorted(Comparator.comparing(CaseBundleSection::getOrder))
                .map(section -> section.build(data))
                .filter(this::isValidNode)
                .toList();
    }

    private boolean isValidNode(CaseBundleNode node) {

        if (node == null) return false;

        if (node.getChildren() != null && !node.getChildren().isEmpty())
            return true;

        return node.getFileStoreId() != null;
    }
}
