package com.dristi.njdg_transformer.service;

import com.dristi.njdg_transformer.model.InterimOrder;
import com.dristi.njdg_transformer.model.order.Order;
import com.dristi.njdg_transformer.producer.Producer;
import com.dristi.njdg_transformer.repository.OrderRepository;
import com.dristi.njdg_transformer.utils.FileStoreUtil;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.egov.common.contract.models.Document;
import org.egov.common.contract.request.RequestInfo;
import org.springframework.core.io.Resource;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneId;
import java.util.List;

import static com.dristi.njdg_transformer.config.ServiceConstants.SIGNED_ORDER;

@Service
@Slf4j
@RequiredArgsConstructor
public class OrderService {

    private final OrderRepository orderRepository;
    private final FileStoreUtil fileStoreUtil;
    private final Producer producer;

    public InterimOrder processAndUpdateOrder(Order order, RequestInfo requestInfo) {
        String cino = order.getCnrNumber();
        String orderNumber = order.getOrderNumber();
        List<InterimOrder> interimOrders = orderRepository.getInterimOrderByCino(cino);

        if(orderNumber != null) {
            for(InterimOrder interimOrder : interimOrders) {
                if(interimOrder.getCourtOrderNumber() != null && interimOrder.getCourtOrderNumber().equalsIgnoreCase(orderNumber)){
                    log.info("Order {} already exists for CINO {}", orderNumber, cino);
                    return interimOrder;
                }
            }
        }
        // Determine next order number (handle empty list safely)
        int maxOrderNo = interimOrders.stream()
                .mapToInt(InterimOrder::getOrderNo)
                .max()
                .orElse(0);

        int nextOrderNo = maxOrderNo + 1;

        // Determine next ID (optional: sequential like before)
        int maxId = interimOrders.stream()
                .mapToInt(InterimOrder::getId)
                .max()
                .orElse(0);

        int nextId = maxId + 1;

        InterimOrder newOrder = InterimOrder.builder()
                .id(nextId)
                .cino(cino)
                .orderNo(nextOrderNo)
                .orderDate(formatDate(order.getCreatedDate()))
                .orderDetails(getOrderPdfByte(order, requestInfo))
                .courtOrderNumber(orderNumber)
                .orderType(order.getOrderType()!=null ? order.getOrderType() : "")
                .build();

        producer.push("save-order-details", newOrder);
        return newOrder;
    }



    private byte[] getOrderPdfByte(Order order, RequestInfo requestInfo) {
        String fileStoreId = null;
        for(Document document : order.getDocuments()) {
            if(SIGNED_ORDER.equalsIgnoreCase(document.getDocumentType())) {
                fileStoreId = document.getFileStore();
                break;
            }
        }
        if(fileStoreId == null) {
            log.error("No signed order document found for order: {}", order.getOrderNumber());
            return new byte[0];
        }
        try {
            Resource resource = fileStoreUtil.getFileStore(requestInfo, order.getTenantId(), fileStoreId);
            return resource.getContentAsByteArray();
        } catch (Exception e) {
            log.error("Error while fetching order PDF for order: {}", order.getOrderNumber(), e);
            return new byte[0];
        }
    }

    private LocalDate formatDate(Long timestamp) {
        if (timestamp == null) {
            return null;
        }
        return Instant.ofEpochMilli(timestamp)
                .atZone(ZoneId.systemDefault())
                .toLocalDate();
    }
}
