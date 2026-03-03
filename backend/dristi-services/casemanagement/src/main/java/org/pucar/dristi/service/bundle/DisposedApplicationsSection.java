package org.pucar.dristi.service.bundle;

import org.egov.common.contract.models.Document;
import org.pucar.dristi.service.CaseBundleSection;
import org.pucar.dristi.web.models.Application;
import org.pucar.dristi.web.models.BundleData;
import org.pucar.dristi.web.models.CaseBundleNode;
import org.pucar.dristi.web.models.order.Order;
import org.springframework.stereotype.Component;

import java.util.ArrayList;
import java.util.List;
import java.util.Objects;
import java.util.Set;

@Component
public class DisposedApplicationsSection implements CaseBundleSection {

    private static final Set<String> DISPOSED_STATUSES = Set.of("COMPLETED", "REJECTED");

    @Override
    public String getOrder() {
        return "11";
    }

    @Override
    public CaseBundleNode build(BundleData data) {

        if (data == null || data.getApplications() == null)
            return null;

        List<Order> allOrders = data.getOrders() != null ? data.getOrders() : List.of();

        List<CaseBundleNode> children = data.getApplications().stream()
                .filter(Objects::nonNull)
                .filter(app -> app.getStatus() != null && DISPOSED_STATUSES.contains(app.getStatus().toUpperCase()))
                .map(app -> toNode(app, allOrders))
                .filter(Objects::nonNull)
                .toList();

        if (children.isEmpty()) return null;

        return CaseBundleNode.builder()
                .id("disposed-application")
                .title("DISPOSED_APPLICATION")
                .children(children)
                .build();
    }

    private CaseBundleNode toNode(Application app, List<Order> allOrders) {
        List<CaseBundleNode> subChildren = new ArrayList<>();

        if (app.getDocuments() != null) {
            String signedFileStoreId = app.getDocuments().stream()
                    .filter(Objects::nonNull)
                    .filter(d -> "SIGNED".equalsIgnoreCase(d.getDocumentType()) || "CONDONATION_DOC".equalsIgnoreCase(d.getDocumentType()))
                    .map(Document::getFileStore)
                    .filter(Objects::nonNull)
                    .findFirst()
                    .orElse(null);

            if (signedFileStoreId != null) {
                subChildren.add(CaseBundleNode.builder()
                        .id(app.getApplicationNumber() + "-signed")
                        .title("APPLICATION_PDF_HEADING")
                        .fileStoreId(signedFileStoreId)
                        .build());
            }
        }

        String appNumber = app.getApplicationNumber();
        if (appNumber != null) {
            List<CaseBundleNode> orderNodes = allOrders.stream()
                    .filter(Objects::nonNull)
                    .filter(o -> o.getApplicationNumber() != null && o.getApplicationNumber().contains(appNumber))
                    .map(this::orderToNode)
                    .filter(Objects::nonNull)
                    .toList();

            if (!orderNodes.isEmpty()) {
                subChildren.add(CaseBundleNode.builder()
                        .id(appNumber + "-orders")
                        .title("RELATED_ORDERS_HEADING")
                        .children(orderNodes)
                        .build());
            }
        }

        if (subChildren.isEmpty()) return null;

        return CaseBundleNode.builder()
                .id(app.getApplicationNumber())
                .title(app.getApplicationType())
                .children(subChildren)
                .build();
    }

    private CaseBundleNode orderToNode(Order order) {
        String fileStoreId = null;
        if (order.getDocuments() != null) {
            fileStoreId = order.getDocuments().stream()
                    .filter(Objects::nonNull)
                    .filter(d -> "SIGNED".equalsIgnoreCase(d.getDocumentType()))
                    .map(org.pucar.dristi.web.models.order.Document::getFileStore)
                    .filter(Objects::nonNull)
                    .findFirst()
                    .orElse(null);

            if (fileStoreId == null) {
                fileStoreId = BundleSectionUtils.findAnyFileStoreId(order.getDocuments());
            }
        }
        if (fileStoreId == null) return null;

        String title = BundleSectionUtils.firstNonBlank(order.getOrderTitle(), order.getOrderType(), order.getOrderNumber());
        return CaseBundleNode.builder()
                .id("order-" + order.getId())
                .title(title != null ? title : "ORDER")
                .fileStoreId(fileStoreId)
                .build();
    }
}
