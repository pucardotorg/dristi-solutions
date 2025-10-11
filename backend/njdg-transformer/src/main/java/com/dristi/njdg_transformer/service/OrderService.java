package com.dristi.njdg_transformer.service;

import com.dristi.njdg_transformer.model.NJDGTransformRecord;
import com.dristi.njdg_transformer.model.order.Order;
import com.dristi.njdg_transformer.model.order.OrderCriteria;
import com.dristi.njdg_transformer.model.order.OrderListResponse;
import com.dristi.njdg_transformer.model.order.OrderSearchRequest;
import com.dristi.njdg_transformer.repository.NJDGRepository;
import com.dristi.njdg_transformer.utils.FileStoreUtil;
import com.dristi.njdg_transformer.utils.OrderUtil;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ObjectNode;
import lombok.extern.slf4j.Slf4j;
import org.egov.common.contract.models.Document;
import org.egov.common.contract.request.RequestInfo;
import org.egov.tracer.model.CustomException;
import org.springframework.core.io.Resource;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.time.ZoneId;
import java.util.ArrayList;
import java.util.Base64;

import static com.dristi.njdg_transformer.config.ServiceConstants.DATE_FORMATTER;

@Service
@Slf4j
public class OrderService {

    private final NJDGRepository repository;
    private final FileStoreUtil fileStoreUtil;
    private final OrderUtil orderUtil;
    private final ObjectMapper objectMapper;

    public OrderService(NJDGRepository repository, FileStoreUtil fileStoreUtil, OrderUtil orderUtil, ObjectMapper objectMapper) {
        this.repository = repository;
        this.fileStoreUtil = fileStoreUtil;
        this.orderUtil = orderUtil;
        this.objectMapper = objectMapper;
    }

    public void updateDataForOrder(Order order, RequestInfo requestInfo) {
        try {
            String cnrNumber = order.getCnrNumber();

            NJDGTransformRecord record = repository.findByCino(cnrNumber);
            if (record == null) {
                log.warn("No record found for CNR: {}", cnrNumber);
                return;
            }

            if (record.getInterimOrder() == null) {
                record.setInterimOrder(new ArrayList<>());
            } else {
                record.getInterimOrder().clear();
            }

            // Search for all orders by filing number
            OrderSearchRequest searchRequest = OrderSearchRequest.builder()
                    .requestInfo(requestInfo)
                    .criteria(OrderCriteria.builder()
                            .filingNumber(order.getFilingNumber())
                            .build())
                    .build();

            OrderListResponse response = orderUtil.getOrders(searchRequest);
            if (response == null || response.getList() == null || response.getList().isEmpty()) {
                log.info("No orders found for filing number: {}", order.getFilingNumber());
                return;
            }

            // Rebuild interim orders from the response
            int serialNo = 1;
            for (Order orderItem : response.getList()) {
                ObjectNode orderDetails = objectMapper.createObjectNode();
                
                // Process document if available
                if (orderItem.getDocuments() != null && !orderItem.getDocuments().isEmpty()) {
                    String base64Content = processDocument(orderItem, requestInfo);
                    if (base64Content != null) {
                        orderDetails.put("order_details", base64Content);
                    }
                }

                orderDetails.put("sr_no", serialNo);
                orderDetails.put("order_date", formatDate(order.getCreatedDate()));
                orderDetails.put("order_number", order.getOrderNumber());
                // Add to interim orders
                record.getInterimOrder().add(orderDetails);
                serialNo++;
            }

            // Save the updated record
            repository.updateData(record);
            log.info("Successfully processed {} orders for CNR: {}", 
                    response.getList().size(), cnrNumber);
        } catch (Exception e) {
            log.error("Error updating order data for CNR {}: {}", 
                    order.getCnrNumber(), e.getMessage(), e);
            throw new CustomException("ORDER_UPDATE_ERROR",
                    "Error updating order data: " + e.getMessage());
        }
    }
    
    private String processDocument(Order order, RequestInfo requestInfo) {
        try {
            Document document = order.getDocuments().get(0);
            Resource resource = fileStoreUtil.getFileStore(
                requestInfo, 
                order.getTenantId(), 
                document.getFileStore()
            );
            
            if (resource != null) {
                byte[] fileContent = resource.getContentAsByteArray();
                return Base64.getEncoder().encodeToString(fileContent);
            } else {
                log.warn("Failed to fetch file from file store for order {}", order.getOrderNumber());
            }
        } catch (Exception e) {
            log.error("Error processing document for order {}: {}", order.getOrderNumber(), e.getMessage(), e);
        }
        return null;
    }
    
    /**
     * Formats a timestamp to dd/MM/yyyy string
     */
    private String formatDate(Long timestamp) {
        if (timestamp == null) {
            return null;
        }
        return Instant.ofEpochMilli(timestamp)
                .atZone(ZoneId.systemDefault())
                .toLocalDate()
                .format(DATE_FORMATTER);
    }
}
