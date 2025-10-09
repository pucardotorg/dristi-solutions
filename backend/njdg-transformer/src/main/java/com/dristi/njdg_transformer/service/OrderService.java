package com.dristi.njdg_transformer.service;

import com.dristi.njdg_transformer.model.NJDGTransformRecord;
import com.dristi.njdg_transformer.model.order.Order;
import com.dristi.njdg_transformer.repository.NJDGRepository;
import com.dristi.njdg_transformer.utils.FileStoreUtil;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ObjectNode;
import lombok.extern.slf4j.Slf4j;
import org.egov.common.contract.models.Document;
import org.egov.common.contract.request.RequestInfo;
import org.springframework.core.io.Resource;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.time.ZoneId;
import java.util.ArrayList;
import java.util.Base64;
import java.util.List;

import static com.dristi.njdg_transformer.config.ServiceConstants.DATE_FORMATTER;

@Service
@Slf4j
@Transactional
public class OrderService {

    private final NJDGRepository repository;
    private final FileStoreUtil fileStoreUtil;

    public OrderService(NJDGRepository repository, FileStoreUtil fileStoreUtil) {
        this.repository = repository;
        this.fileStoreUtil = fileStoreUtil;
    }

    @Transactional
    public void updateDataForOrder(Order order, RequestInfo requestInfo) {
        String cnrNumber = order.getCnrNumber();
        String orderNumber = order.getOrderNumber();
        
        // Find or create the record for the CNR number
        NJDGTransformRecord record = repository.findByCino(cnrNumber);
        // Process the document if present
        String base64Content = null;
        if (order.getDocuments() != null && !order.getDocuments().isEmpty()) {
            base64Content = processDocument(order, requestInfo);
        }

        // Find existing order or create new one
        ObjectNode orderDetails = findOrCreateOrderDetails(record, orderNumber);
        
        // Update order details with base64 content if available
        if (base64Content != null) {
            orderDetails.put("order_details", base64Content);
        }
        
        // Update common order fields
        updateCommonOrderFields(order, orderDetails);

        // Save the updated record
        repository.updateData(record);
        log.info("Successfully processed order {} for cnr {}", orderNumber, cnrNumber);
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
    
    private ObjectNode findOrCreateOrderDetails(NJDGTransformRecord record, String orderNumber) {
        List<JsonNode> interimOrders = record.getInterimOrder();
        ObjectMapper mapper = new ObjectMapper();
        
        // First, ensure all existing orders have serial numbers
        updateSerialNumbers(interimOrders);
        
        // Find existing order
        for (JsonNode interimOrder : interimOrders) {
            if (orderNumber.equalsIgnoreCase(interimOrder.path("order_no").asText())) {
                return (ObjectNode) interimOrder;
            }
        }
        
        // Create new order details if not found
        ObjectNode newOrder = mapper.createObjectNode();
        newOrder.put("order_no", orderNumber);
        
        // Add to list first to include in serial number calculation
        interimOrders.add(newOrder);
        
        // Update all serial numbers including the new order
        updateSerialNumbers(interimOrders);
        
        return newOrder;
    }
    
    private void updateCommonOrderFields(Order order, ObjectNode orderDetails) {
        // Update any common fields from the order to orderDetails
        if (order.getCreatedDate() != null) {
            orderDetails.put("order_date", formatDate(order.getCreatedDate()));
        }
        
        // Ensure sr_no is set (in case it was missing from existing records)
        if (!orderDetails.has("sr_no") || orderDetails.get("sr_no").isNull()) {
            orderDetails.put("sr_no", 1);
        }
    }

    /**
     * Formats a timestamp to dd/MM/yyyy string
     */
    /**
     * Updates serial numbers for all orders in the list to maintain sequential numbering
     * Orders are sorted by order_date if available, otherwise by insertion order
     */
    private void updateSerialNumbers(List<JsonNode> orders) {
        if (orders == null || orders.isEmpty()) {
            return;
        }
        
        // Create a list of orders with their indices for sorting
        List<java.util.Map.Entry<JsonNode, Integer>> ordersWithIndices = new ArrayList<>();
        for (int i = 0; i < orders.size(); i++) {
            ordersWithIndices.add(new java.util.AbstractMap.SimpleEntry<>(orders.get(i), i));
        }
        
        // Sort by order_date if available, otherwise by original order
        ordersWithIndices.sort((a, b) -> {
            JsonNode nodeA = a.getKey();
            JsonNode nodeB = b.getKey();
            
            // Try to sort by date if both have dates
            if (nodeA.has("order_date") && nodeB.has("order_date")) {
                try {
                    String dateA = nodeA.get("order_date").asText();
                    String dateB = nodeB.get("order_date").asText();
                    return dateA.compareTo(dateB);
                } catch (Exception e) {
                    log.warn("Error comparing dates for sorting: {}", e.getMessage());
                }
            }
            
            // Fall back to original order if dates are not available or invalid
            return Integer.compare(a.getValue(), b.getValue());
        });
        
        // Update serial numbers based on sorted order
        int serialNo = 1;
        for (java.util.Map.Entry<JsonNode, Integer> entry : ordersWithIndices) {
            ObjectNode orderNode = (ObjectNode) entry.getKey();
            orderNode.put("sr_no", serialNo++);
        }
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
