package com.dristi.njdg_transformer.service;

import com.dristi.njdg_transformer.config.TransformerProperties;
import com.dristi.njdg_transformer.model.DesignationMaster;
import com.dristi.njdg_transformer.model.InterimOrder;
import com.dristi.njdg_transformer.model.JudgeDetails;
import com.dristi.njdg_transformer.model.cases.CaseCriteria;
import com.dristi.njdg_transformer.model.cases.CaseSearchRequest;
import com.dristi.njdg_transformer.model.order.Order;
import com.dristi.njdg_transformer.producer.Producer;
import com.dristi.njdg_transformer.repository.CaseRepository;
import com.dristi.njdg_transformer.repository.OrderRepository;
import com.dristi.njdg_transformer.utils.CaseUtil;
import com.dristi.njdg_transformer.utils.FileStoreUtil;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
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

import static com.dristi.njdg_transformer.config.ServiceConstants.*;

@Service
@Slf4j
@RequiredArgsConstructor
public class OrderService {

    private final OrderRepository orderRepository;
    private final FileStoreUtil fileStoreUtil;
    private final Producer producer;
    private final TransformerProperties properties;
    private final CaseUtil caseUtil;
    private final ObjectMapper objectMapper;
    private final CaseRepository caseRepository;

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

        DesignationMaster designationMaster = caseRepository.getDesignationMaster(JUDGE_DESIGNATION);
        LocalDate searchDate = formatDate(order.getCreatedDate());
        List<JudgeDetails> judgeDetailsList = caseRepository.getJudge(searchDate);
        JudgeDetails judgeDetails = judgeDetailsList.isEmpty() ? null : judgeDetailsList.get(0);
        InterimOrder newOrder = InterimOrder.builder()
                .cino(cino)
                .orderNo(nextOrderNo)
                .orderDate(formatDate(order.getCreatedDate()))
                .orderDetails(getOrderPdfByte(order, requestInfo))
                .courtOrderNumber(orderNumber)
                .orderType(properties.getJudgementOrderType()) //Judgement:1, Decree:2, Interim Order:3
                .docType(properties.getJudgementOrderDocumentType())//hard-coded for judgement
                .courtNo(judgeDetails != null ? judgeDetails.getCourtNo() : 0)
                .joCode(judgeDetails != null ? judgeDetails.getJocode() : null)
                .judgeCode(judgeDetails != null ? judgeDetails.getJudgeCode() : null)
                .desigCode(designationMaster.getDesgCode())
                .dispReason(getDisposalReason(order))
                .build();

        producer.push("save-order-details", newOrder);
        return newOrder;
    }

    /**
     * Extracts disposal nature from order based on order category
     * @param order The order to extract disposal nature from
     * @return Integer representing disposal status, 0 if not found or error occurs
     */
    private Integer getDisposalReason(Order order) {
        log.info("Extracting disposal nature for order category: {}", order.getOrderCategory());
        
        try {
            if (INTERMEDIATE.equalsIgnoreCase(order.getOrderCategory())) {
                return extractDisposalNatureFromIntermediate(order);
            } else if (COMPOSITE.equalsIgnoreCase(order.getOrderCategory())) {
                return extractDisposalNatureFromComposite(order);
            }
            
            log.warn("Unknown order category: {}, returning default disposal nature: 0", order.getOrderCategory());
            return 0;
            
        } catch (Exception e) {
            log.error("Error extracting disposal nature from order category: {}", order.getOrderCategory(), e);
            return 0;
        }
    }

    /**
     * Extracts disposal nature from intermediate order
     * @param order The intermediate order
     * @return Integer representing disposal status
     */
    private Integer extractDisposalNatureFromIntermediate(Order order) {
        log.info("Processing intermediate order for disposal nature extraction");
        
        JsonNode additionalDetails = objectMapper.convertValue(order.getAdditionalDetails(), JsonNode.class);
        String outcomeCode = extractOutcomeCodeFromFormData(additionalDetails);
        
        if (outcomeCode != null) {
            Integer disposalStatus = caseRepository.getDisposalStatus(outcomeCode);
            log.info("Found disposal status: {} for outcome code: {}", disposalStatus, outcomeCode);
            return disposalStatus;
        }
        
        log.warn("No outcome code found in intermediate order, returning default: 0");
        return 0;
    }

    /**
     * Extracts disposal nature from composite order
     * @param order The composite order
     * @return Integer representing disposal status
     */
    private Integer extractDisposalNatureFromComposite(Order order) {
        log.info("Processing composite order for disposal nature extraction");
        
        JsonNode compositeItems = objectMapper.convertValue(order.getCompositeItems(), JsonNode.class);
        
        if (compositeItems == null || !compositeItems.isArray()) {
            log.warn("Composite items is null or not an array");
            return 0;
        }
        
        for (JsonNode compositeItem : compositeItems) {
            if (isJudgementOrderType(compositeItem)) {
                String outcomeCode = extractOutcomeCodeFromCompositeItem(compositeItem);
                if (outcomeCode != null) {
                    Integer disposalStatus = caseRepository.getDisposalStatus(outcomeCode);
                    log.info("Found disposal status: {} for outcome code: {} in composite item", disposalStatus, outcomeCode);
                    return disposalStatus;
                }
            }
        }
        
        log.warn("No judgement order type found in composite order, returning default: 0");
        return 0;
    }

    /**
     * Checks if the composite item is of judgement order type
     * @param compositeItem The composite item to check
     * @return true if it's a judgement order type, false otherwise
     */
    private boolean isJudgementOrderType(JsonNode compositeItem) {
        if (compositeItem == null) {
            return false;
        }
        
        JsonNode orderTypeNode = compositeItem.get("orderType");
        if (orderTypeNode == null) {
            return false;
        }
        
        return JUDGEMENT.equalsIgnoreCase(orderTypeNode.asText());
    }

    /**
     * Extracts outcome code from form data in additional details
     * @param additionalDetails The additional details JsonNode
     * @return String outcome code or null if not found
     */
    private String extractOutcomeCodeFromFormData(JsonNode additionalDetails) {
        if (additionalDetails == null) {
            log.warn("Additional details is null");
            return null;
        }
        
        JsonNode formDataNode = additionalDetails.get("formdata");
        if (formDataNode == null) {
            log.warn("Form data node is null");
            return null;
        }
        
        JsonNode findings = formDataNode.get("findings");
        if (findings == null) {
            log.warn("Findings node is null");
            return null;
        }
        
        JsonNode outcome = findings.get("code");
        if (outcome == null) {
            log.warn("Outcome code node is null");
            return null;
        }
        
        return outcome.asText();
    }

    /**
     * Extracts outcome code from composite item
     * @param compositeItem The composite item JsonNode
     * @return String outcome code or null if not found
     */
    private String extractOutcomeCodeFromCompositeItem(JsonNode compositeItem) {
        if (compositeItem == null) {
            return null;
        }
        
        JsonNode orderSchema = compositeItem.get("orderSchema");
        if (orderSchema == null) {
            log.warn("Order schema is null in composite item");
            return null;
        }
        
        JsonNode additionalDetails = orderSchema.get("additionalDetails");
        return extractOutcomeCodeFromFormData(additionalDetails);
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

    public CaseSearchRequest createCaseSearchRequest(RequestInfo requestInfo, String filingNumber) {
        CaseSearchRequest caseSearchRequest = new CaseSearchRequest();
        caseSearchRequest.setRequestInfo(requestInfo);
        CaseCriteria caseCriteria = CaseCriteria.builder().filingNumber(filingNumber).defaultFields(false).build();
        caseSearchRequest.addCriteriaItem(caseCriteria);
        return caseSearchRequest;
    }
}
