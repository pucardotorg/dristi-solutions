package pucar.strategy.ordertype;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.extern.slf4j.Slf4j;
import org.egov.common.contract.request.RequestInfo;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;
import pucar.strategy.OrderUpdateStrategy;
import pucar.util.DigitalizedDocumentUtil;
import pucar.web.models.Order;
import pucar.web.models.OrderRequest;
import pucar.web.models.adiary.CaseDiaryEntry;
import pucar.web.models.digitalizeddocument.*;

import java.util.ArrayList;
import java.util.List;

import static pucar.config.ServiceConstants.REFERRAL_CASE_TO_ADR;
import static pucar.config.ServiceConstants.SAVE_DRAFT;

@Component
@Slf4j
public class PublishOrderReferralCaseToAdr implements OrderUpdateStrategy {

    private final DigitalizedDocumentUtil digitalizedDocumentUtil;
    private final ObjectMapper objectMapper;

    @Autowired
    public PublishOrderReferralCaseToAdr(DigitalizedDocumentUtil digitalizedDocumentUtil, ObjectMapper objectMapper) {
        this.digitalizedDocumentUtil = digitalizedDocumentUtil;
        this.objectMapper = objectMapper;
    }

    @Override
    public boolean supportsPreProcessing(OrderRequest orderRequest) {
        Order order = orderRequest.getOrder();
        String action = order.getWorkflow().getAction();
        return order.getOrderType() != null && SAVE_DRAFT.equalsIgnoreCase(action) && REFERRAL_CASE_TO_ADR.equalsIgnoreCase(order.getOrderType());
    }

    @Override
    public boolean supportsPostProcessing(OrderRequest orderRequest) {
        return false;
    }

    @Override
    public boolean supportsCommon(OrderRequest orderRequest) {
        return false;
    }

    @Override
    public CaseDiaryEntry execute(OrderRequest request) {
        return null;
    }

    @Override
    public OrderRequest preProcess(OrderRequest orderRequest) {
        Order order = orderRequest.getOrder();
        RequestInfo requestInfo = orderRequest.getRequestInfo();
        Object orderDetails = order.getOrderDetails();

        log.info("Pre-processing ADR order, orderNumber: {}", order.getOrderNumber());

        try {
            JsonNode adrDetails = objectMapper.convertValue(orderDetails, JsonNode.class);

            // Check if isRequired is true
            JsonNode isRequiredNode = adrDetails.get("isRequired");
            if (isRequiredNode == null || !isRequiredNode.asBoolean()) {
                log.info("isRequired is false or null, skipping digitalized document processing");
                return null;
            }

            log.info("isRequired is true, processing digitalized document");

            // Search for existing digitalized document by orderNumber
            DigitalizedDocumentSearchCriteria criteria = DigitalizedDocumentSearchCriteria.builder()
                    .orderNumber(order.getOrderNumber())
                    .tenantId(order.getTenantId())
                    .type(TypeEnum.MEDIATION)
                    .build();

            DigitalizedDocumentSearchRequest searchRequest = DigitalizedDocumentSearchRequest.builder()
                    .requestInfo(requestInfo)
                    .criteria(criteria)
                    .build();

            List<DigitalizedDocument> existingDocuments = digitalizedDocumentUtil.searchDigitalizedDocuments(searchRequest);

            MediationDetails mediationDetails = buildMediationDetails(adrDetails);


            if (existingDocuments != null && !existingDocuments.isEmpty()) {
                // Update existing document
                log.info("Found existing digitalized document with id: {}, updating...", existingDocuments.get(0).getDocumentNumber());
                DigitalizedDocument existingDoc = existingDocuments.get(0);
                existingDoc.setMediationDetails(mediationDetails);

                DigitalizedDocumentRequest updateRequest = DigitalizedDocumentRequest.builder()
                        .requestInfo(requestInfo)
                        .digitalizedDocument(existingDoc)
                        .build();

                DigitalizedDocument digitalizedDocument = digitalizedDocumentUtil.updateDigitalizedDocument(updateRequest);
                log.info("Updated digitalized document successfully {} : ", digitalizedDocument.getDocumentNumber());
            } else {
                // Create new document
                log.info("No existing digitalized document found, creating new...");
                
                // Extract caseNumber from adrDetails
                String caseNumber = adrDetails.has("caseNumber") ? adrDetails.get("caseNumber").asText() : order.getFilingNumber();
                
                DigitalizedDocument newDocument = DigitalizedDocument.builder()
                        .type(TypeEnum.MEDIATION)
                        .caseId(caseNumber)
                        .caseFilingNumber(order.getFilingNumber())
                        .orderNumber(order.getOrderNumber())
                        .tenantId(order.getTenantId())
                        .mediationDetails(mediationDetails)
                        .build();

                DigitalizedDocumentRequest createRequest = DigitalizedDocumentRequest.builder()
                        .requestInfo(requestInfo)
                        .digitalizedDocument(newDocument)
                        .build();

                DigitalizedDocument digitalizedDocument = digitalizedDocumentUtil.createDigitalizedDocument(createRequest);
                log.info("Created digitalized document successfully {} : " , digitalizedDocument.getDocumentNumber());
            }

        } catch (Exception e) {
            log.error("Error processing digitalized document for ADR order", e);
            throw new RuntimeException("Error processing digitalized document: " + e.getMessage(), e);
        }

        return null;
    }

    /**
     * Builds MediationDetails from orderDetails JsonNode
     */
    private MediationDetails buildMediationDetails(JsonNode adrDetails) {
        List<MediationPartyDetails> partyDetailsList = new ArrayList<>();

        JsonNode partiesNode = adrDetails.get("parties");
        if (partiesNode != null && partiesNode.isArray()) {
            for (JsonNode party : partiesNode) {
                MediationPartyDetails partyDetail = MediationPartyDetails.builder()
                        .partyType(party.has("partyType") ? PartyTypeEnum.valueOf(party.get("partyType").asText()) : null)
                        .uniqueId(party.has("uniqueId") ? party.get("uniqueId").asText() : null)
                        .mobileNumber(party.has("mobileNumber") ? party.get("mobileNumber").asText() : null)
                        .partyName(party.has("partyName") ? party.get("partyName").asText() : null)
                        .partyIndex(party.has("partyIndex") ? party.get("partyIndex").asInt() : null)
                        .hasSigned(party.has("hasSigned") && party.get("hasSigned").asBoolean())
                        .build();
                partyDetailsList.add(partyDetail);
            }
        }

        Long hearingDate = adrDetails.has("dateOfMediation") ? adrDetails.get("dateOfMediation").asLong() : null;

        return MediationDetails.builder()
                .hearingDate(hearingDate)
                .partyDetails(partyDetailsList.isEmpty() ? null : partyDetailsList)
                .build();
    }

    @Override
    public OrderRequest postProcess(OrderRequest orderRequest) {
        return null;
    }
}
