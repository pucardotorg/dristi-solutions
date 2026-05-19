package org.pucar.dristi.service.bundle;

import org.pucar.dristi.service.CaseBundleSection;
import org.pucar.dristi.web.models.BundleData;
import org.pucar.dristi.web.models.CaseBundleNode;
import org.pucar.dristi.web.models.CourtCase;
import org.pucar.dristi.web.models.docpreview.DocPreviewRequest;
import org.pucar.dristi.web.models.order.Document;
import org.pucar.dristi.web.models.order.Order;
import org.springframework.stereotype.Component;

import java.util.ArrayList;
import java.util.List;
import java.util.Objects;

@Component
public class OrdersSection implements CaseBundleSection {

    @Override
    public String getOrder() {
        return "15";
    }

    @Override
    public CaseBundleNode build(BundleData data) {
        if (data == null || data.getOrders() == null || data.getOrders().isEmpty()) return null;

        String sortField = data.getSectionSortFields() != null ? data.getSectionSortFields().get("orders") : null;
        List<Order> sortedOrders = BundleSectionUtils.sortOrders(new ArrayList<>(data.getOrders()), sortField);

        List<CaseBundleNode> children = new ArrayList<>();
        int idx = 0;
        for (Order order : sortedOrders) {
            if (order == null || order.getDocuments() == null) continue;

            String fileStoreId = order.getDocuments().stream()
                    .filter(Objects::nonNull)
                    .filter(d -> "SIGNED".equalsIgnoreCase(d.getDocumentType()))
                    .map(Document::getFileStore)
                    .filter(Objects::nonNull)
                    .findFirst()
                    .orElse(null);

            if (fileStoreId == null) {
                fileStoreId = BundleSectionUtils.findAnyFileStoreId(order.getDocuments());
            }

            if (fileStoreId == null) continue;

            String title = BundleSectionUtils.firstNonBlank(order.getOrderTitle(), order.getOrderType(), order.getOrderCategory(), order.getOrderNumber(), "ORDER");

            children.add(CaseBundleNode.builder()
                    .id("order-" + idx++)
                    .title(title)
                    .fileStoreId(fileStoreId)
                    .build());
        }

        if (children.isEmpty()) return null;

        return CaseBundleNode.builder()
                .id("orders")
                .title("ORDERS_CASE_PDF")
                .children(children)
                .build();
    }
}
