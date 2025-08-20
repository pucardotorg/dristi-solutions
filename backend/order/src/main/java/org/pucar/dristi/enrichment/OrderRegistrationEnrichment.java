package org.pucar.dristi.enrichment;


import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ArrayNode;
import com.fasterxml.jackson.databind.node.ObjectNode;
import lombok.extern.slf4j.Slf4j;
import org.egov.common.contract.models.AuditDetails;
import org.egov.common.contract.request.RequestInfo;
import org.egov.tracer.model.CustomException;
import org.pucar.dristi.config.Configuration;
import org.pucar.dristi.config.MdmsDataConfig;
import org.pucar.dristi.util.ApplicationUtil;
import org.pucar.dristi.util.CaseUtil;
import org.pucar.dristi.util.IdgenUtil;
import org.pucar.dristi.web.models.*;
import org.pucar.dristi.web.models.application.Application;
import org.pucar.dristi.web.models.application.ApplicationCriteria;
import org.pucar.dristi.web.models.application.ApplicationSearchRequest;
import org.springframework.stereotype.Component;

import java.time.Duration;
import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;
import java.util.stream.StreamSupport;

import static org.pucar.dristi.config.ServiceConstants.COMPOSITE;
import static org.pucar.dristi.config.ServiceConstants.ENRICHMENT_EXCEPTION;

@Component
@Slf4j
public class OrderRegistrationEnrichment {

    private IdgenUtil idgenUtil;
    private Configuration configuration;
    private ObjectMapper objectMapper;
    private CaseUtil caseUtil;
    private final MdmsDataConfig mdmsDataConfig;
    private final ApplicationUtil applicationUtil;

    public OrderRegistrationEnrichment(IdgenUtil idgenUtil, Configuration configuration, ObjectMapper objectMapper, CaseUtil caseUtil, MdmsDataConfig mdmsDataConfig, ApplicationUtil applicationUtil) {
        this.idgenUtil = idgenUtil;
        this.configuration = configuration;
        this.objectMapper = objectMapper;
        this.caseUtil = caseUtil;
        this.mdmsDataConfig = mdmsDataConfig;
        this.applicationUtil = applicationUtil;
    }

    public void enrichOrderRegistration(OrderRequest orderRequest) {
        try {
            if (orderRequest.getRequestInfo().getUserInfo() != null) {
                String tenantId = orderRequest.getOrder().getFilingNumber().replace("-", "");
                String idName = configuration.getOrderConfig();
                String idFormat = configuration.getOrderFormat();

                List<String> orderRegistrationIdList = idgenUtil.getIdList(orderRequest.getRequestInfo(), tenantId, idName, idFormat, 1, false);
                AuditDetails auditDetails = AuditDetails.builder().createdBy(orderRequest.getRequestInfo().getUserInfo().getUuid()).createdTime(System.currentTimeMillis()).lastModifiedBy(orderRequest.getRequestInfo().getUserInfo().getUuid()).lastModifiedTime(System.currentTimeMillis()).build();
                orderRequest.getOrder().setAuditDetails(auditDetails);

                orderRequest.getOrder().setId(UUID.randomUUID());

                orderRequest.getOrder().getStatuteSection().setId(UUID.randomUUID());
                orderRequest.getOrder().getStatuteSection().setAuditdetails(auditDetails);

                if (orderRequest.getOrder().getDocuments() != null) {
                    orderRequest.getOrder().getDocuments().forEach(document -> {
                        document.setId(String.valueOf(UUID.randomUUID()));
                        document.setDocumentUid(document.getId());
                    });
                }

                String orderNumber = orderRequest.getOrder().getFilingNumber() + "-" + orderRegistrationIdList.get(0);
                orderRequest.getOrder().setOrderNumber(orderNumber);
                orderRequest.getOrder().setCourtId(getCourtId(orderRequest));
            }

        } catch (CustomException e) {
            log.error("Custom Exception occurred while enriching order :: {}", e.toString());
            throw e;
        } catch (Exception e) {
            log.error("Exception occurred while enriching order :: {}", e.toString());
            throw e;
        }
    }

    private String getCourtId(OrderRequest orderRequest) {
        CaseSearchRequest caseSearchRequest = createCaseSearchRequest(
                orderRequest.getRequestInfo(), orderRequest.getOrder()
        );

        JsonNode caseDetails = caseUtil.searchCaseDetails(caseSearchRequest);

        if (caseDetails == null || caseDetails.isEmpty()) {
            throw new CustomException("CASE_NOT_FOUND", "Case not found in case details");
        }

        return caseDetails.get("courtId").textValue();
    }


    public CaseSearchRequest createCaseSearchRequest(RequestInfo requestInfo, Order order) {
        CaseSearchRequest caseSearchRequest = new CaseSearchRequest();
        caseSearchRequest.setRequestInfo(requestInfo);
        CaseCriteria caseCriteria = CaseCriteria.builder().filingNumber(order.getFilingNumber()).defaultFields(false).build();
        caseSearchRequest.addCriteriaItem(caseCriteria);
        return caseSearchRequest;
    }

    public void enrichOrderRegistrationUponUpdate(OrderRequest orderRequest) {
        try {

            enrichAuditDetails(orderRequest);

            if (orderRequest.getOrder().getDocuments() != null) {
                orderRequest.getOrder().getDocuments().forEach(document -> {
                    if (document.getId() == null)
                        document.setId(String.valueOf(UUID.randomUUID()));
                });
            }
        } catch (Exception e) {
            log.error("Error enriching order application upon update :: {}", e.toString());
            throw new CustomException(ENRICHMENT_EXCEPTION, "Error in order enrichment service during order update process: " + e.getMessage());
        }
    }

    public void enrichAuditDetails(OrderRequest orderRequest) {
        // Enrich lastModifiedTime and lastModifiedBy in case of update
        orderRequest.getOrder().getAuditDetails().setLastModifiedTime(System.currentTimeMillis());
        orderRequest.getOrder().getAuditDetails().setLastModifiedBy(orderRequest.getRequestInfo().getUserInfo().getUuid());
    }

    public void enrichCompositeOrderItemIdOnAddItem(OrderRequest orderRequest) {
        try {
            if (orderRequest.getOrder().getCompositeItems() != null) {
                Object compositeOrderItem = orderRequest.getOrder().getCompositeItems();
                ArrayNode arrayNode = objectMapper.convertValue(compositeOrderItem, ArrayNode.class);

                if (arrayNode != null && !arrayNode.isEmpty()) {
                    for (int i = 0; i < arrayNode.size(); i++) {
                        ObjectNode itemNode = (ObjectNode) arrayNode.get(i);
                        if (!itemNode.has("id")) {
                            String newId = UUID.randomUUID().toString();
                            itemNode.put("id", newId);
                            log.info("Enriched CompositeItem ID with new value: {}", newId);
                        }
                    }
                }
                orderRequest.getOrder().setCompositeItems(arrayNode);
            }
        } catch (Exception e) {
            log.error("Error enriching composite order item id add item :: {}", e.toString());
            throw new CustomException(ENRICHMENT_EXCEPTION, "Error in order enrichment service during add item: " + e.getMessage());
        }
    }

    public void enrichItemText(OrderRequest orderRequest) {
        try {
            Order order = orderRequest.getOrder();
            RequestInfo requestInfo = orderRequest.getRequestInfo();

            if (COMPOSITE.equalsIgnoreCase(order.getOrderCategory()) && order.getCompositeItems() != null) {
                ArrayNode arrayNode = objectMapper.convertValue(order.getCompositeItems(), ArrayNode.class);
                if (arrayNode != null && !arrayNode.isEmpty()) {
                    List<String> itemText = new ArrayList<>();
                    for (int i = 0; i < arrayNode.size(); i++) {
                        ObjectNode itemNode = (ObjectNode) arrayNode.get(i);

                        if (itemNode.has("orderType")) {
                            String orderType = itemNode.get("orderType").asText();

                            if (itemNode.has("orderSchema")) {
                                JsonNode orderSchemaNode = itemNode.get("orderSchema");
                                if (orderSchemaNode.has("orderDetails")) {
                                    JsonNode orderDetailsNode = orderSchemaNode.get("orderDetails");
                                    String itemTextMdms = getItemTextByOrderType(orderType, orderDetailsNode, order, requestInfo);
                                    if (itemTextMdms != null) {
                                        itemText.add(itemTextMdms);
                                    }
                                }
                            }
                        }
                    }
                    order.setItemText(String.join(" ", itemText));
                }
            } else {
                JsonNode orderDetailsNode = objectMapper.convertValue(order.getOrderDetails(), JsonNode.class);
                order.setItemText(getItemTextByOrderType(order.getOrderType(), orderDetailsNode, order, requestInfo));
            }
        } catch (Exception e) {
            log.error("Error enriching composite order item :: {}", e.toString());
            throw new CustomException(ENRICHMENT_EXCEPTION,
                    "Error in order enrichment service during add item: " + e.getMessage());
        }
    }

    public String getItemTextByOrderType(String orderType, JsonNode orderDetailsNode, Order order, RequestInfo requestInfo) {

        List<ItemTextMdms> matches = mdmsDataConfig.getItemTextMdmsData().stream()
                .filter(mdms -> mdms.getOrderType().equalsIgnoreCase(orderType))
                .toList();

        if (matches.size() == 1) {
            String text = matches.get(0).getItemText();
            if ("ADVOCATE_REPLACEMENT_APPROVAL".equalsIgnoreCase(orderType)) {

                String replaceAdvocateStatus = orderDetailsNode.path("replaceAdvocateStatus").asText();
                String advocateName = orderDetailsNode.path("advocateName").asText();

                text = text.replace("[Advocate Name]", advocateName);
                if ("GRANT".equalsIgnoreCase(replaceAdvocateStatus)) {
                    text = text.replace("[GRANTED/REJECTED]", "GRANTED");
                } else {
                    text = text.replace("[GRANTED/REJECTED]", "REJECTED");
                }
            }
            if ("APPROVAL_REJECTION_LITIGANT_DETAILS_CHANGE".equalsIgnoreCase(orderType)) {
                String applicationGrantedRejected = orderDetailsNode.path("applicationGrantedRejected").asText();
                String applicantName = orderDetailsNode.path("applicantName").asText();
                text = text.replace("[Applicant Name]", applicantName);

                if ("GRANTED".equalsIgnoreCase(applicationGrantedRejected)) {
                    text = text.replace("[Approved]/[Rejected]", "Approved");
                } else {
                    text = text.replace("[Approved]/[Rejected]", "Rejected");
                }
            }
            if ("TAKE_COGNIZANCE".equalsIgnoreCase(orderType)) {
                CaseSearchRequest caseSearchRequest = createCaseSearchRequest(requestInfo, order);
                JsonNode caseDetails = caseUtil.searchCaseDetails(caseSearchRequest);

                String caseNumber = "";
                if (caseDetails != null) {
                    if (caseDetails.hasNonNull("courtCaseNumber")) {
                        caseNumber = caseDetails.get("courtCaseNumber").asText("");
                    }

                    if (caseNumber.isEmpty() && caseDetails.hasNonNull("cmpNumber")) {
                        caseNumber = caseDetails.get("cmpNumber").asText("");
                    }
                }
                text = text.replace("[ST No.]", caseNumber);
            }
            if ("NOTICE".equalsIgnoreCase(orderType)) {
                JsonNode partiesNode = orderDetailsNode.path("parties");

                List<String> partyNames = new ArrayList<>();
                if (partiesNode != null && partiesNode.isArray()) {
                    for (JsonNode party : partiesNode) {
                        String partyName = party.path("partyName").asText();
                        if (partyName != null && !partyName.isEmpty()) {
                            partyNames.add(partyName);
                        }
                    }
                }

                String partiesString = String.join(", ", partyNames);
                text = text.replace("[name]", partiesString);
            }
            if ("WARRANT".equalsIgnoreCase(orderType)) {
                JsonNode partiesNode = orderDetailsNode.path("parties");
                String type = orderDetailsNode.path("warrantType").asText();
                text = text.replace("[Type]", type);

                List<String> partyNames = new ArrayList<>();
                if (partiesNode != null && partiesNode.isArray()) {
                    for (JsonNode party : partiesNode) {
                        String partyName = party.path("partyName").asText();
                        if (partyName != null && !partyName.isEmpty()) {
                            partyNames.add(partyName);
                        }
                    }
                }

                String partiesString = String.join(", ", partyNames);
                text = text.replace("[name]", partiesString);
            }
            if ("SUMMONS".equalsIgnoreCase(orderType)) {
                JsonNode partiesNode = orderDetailsNode.path("parties");

                List<String> partyNames = new ArrayList<>();
                if (partiesNode != null && partiesNode.isArray()) {
                    for (JsonNode party : partiesNode) {
                        String partyName = party.path("partyName").asText();
                        if (partyName != null && !partyName.isEmpty()) {
                            partyNames.add(partyName);
                        }
                    }
                }

                String partiesString = String.join(", ", partyNames);
                text = text.replace("[name]", partiesString);
            }
            if ("APPROVE_VOLUNTARY_SUBMISSIONS".equalsIgnoreCase(orderType) || "REJECT_VOLUNTARY_SUBMISSIONS".equalsIgnoreCase(orderType)) {
                ApplicationCriteria criteria = ApplicationCriteria.builder()
                        .tenantId(order.getTenantId())
                        .applicationNumber(order.getApplicationNumber().get(0))
                        .build();
                ApplicationSearchRequest applicationSearchRequest = ApplicationSearchRequest.builder().build();
                applicationSearchRequest.setCriteria(criteria);
                applicationSearchRequest.setRequestInfo(requestInfo);

                List<Application> application = applicationUtil.searchApplications(applicationSearchRequest);
                if (application != null && !application.isEmpty()) {
                    JsonNode applicationDetailsNode = objectMapper.convertValue(application.get(0).getApplicationDetails(), JsonNode.class);
                    if (applicationDetailsNode != null && applicationDetailsNode.has("applicationTitle")) {
                        String applicationTitle = applicationDetailsNode.path("applicationTitle").asText();
                        text = text.replace("[title of application]", applicationTitle);
                    }
                }
            }
            if ("REFERRAL_CASE_TO_ADR".equalsIgnoreCase(orderType)) {
                int adrMode = orderDetailsNode.path("adrMode").asInt();
                String modeOfAdr = "";
                if (adrMode == 1) {
                    modeOfAdr = "ARBITRATION";
                } else if (adrMode == 2) {
                    modeOfAdr = "MEDIATION";
                } else if (adrMode == 3) {
                    modeOfAdr = "CONCILIATION";
                }
                text = text.replace("[mode of ADR]", modeOfAdr);
            }
            if ("MANDATORY_SUBMISSIONS_RESPONSES".equalsIgnoreCase(orderType)) {
                String documentType = orderDetailsNode.path("documentType").path("value").asText();
                text = text.replace("[Type]", documentType);

                JsonNode partyArray = orderDetailsNode.path("partyDetails").path("partyToMakeSubmission");

                String partyToMakeSubmission = "";
                if (partyArray != null && partyArray.isArray() && !partyArray.isEmpty()) {
                    partyToMakeSubmission = StreamSupport.stream(partyArray.spliterator(), false)
                            .map(JsonNode::asText)
                            .collect(Collectors.joining(", "));
                }
                text = text.replace("[party to make submission]", partyToMakeSubmission);

                long submissionMillis = orderDetailsNode.path("dates").path("submissionDeadlineDate").asLong();
                LocalDate submissionDate = Instant.ofEpochMilli(submissionMillis)
                        .atZone(ZoneId.systemDefault())
                        .toLocalDate();

                // Current date
                LocalDate today = LocalDate.now();

                // Difference in days
                long daysRemaining = Duration.between(today.atStartOfDay(), submissionDate.atStartOfDay()).toDays();
                text = text.replace("[days]", Long.toString(daysRemaining)+" days");

            }

            return text;
        } else if (matches.size() > 1) {
            for (ItemTextMdms mdms : matches) {
                if (mdms.getAction() != null && "EXTENSION_OF_DOCUMENT_SUBMISSION_DATE".equalsIgnoreCase(mdms.getOrderType()))  {
                    String applicationStatus = orderDetailsNode.path("applicationStatus").asText();
                    String action = "APPROVED".equalsIgnoreCase(applicationStatus) ? "APPROVE" : "REJECT";

                    if (action.equalsIgnoreCase(mdms.getAction())) {
                        // Document Name
                        String documentName = orderDetailsNode.path("documentName").asText("");
                        String text = mdms.getItemText().replace("[type]", documentName);

                        if (action.equalsIgnoreCase("APPROVE")) {
                            {
                                // New Submission Date
                                long submissionMillis = orderDetailsNode.path("newSubmissionDate").asLong(0);
                                LocalDate newSubmissionDate = null;
                                if (submissionMillis > 0) {
                                    newSubmissionDate = Instant.ofEpochMilli(submissionMillis)
                                            .atZone(ZoneId.systemDefault())
                                            .toLocalDate();
                                }

                                DateTimeFormatter formatter = DateTimeFormatter.ofPattern("dd-MM-yyyy");
                                text = text.replace("[Date]", newSubmissionDate != null ? newSubmissionDate.format(formatter) : "");

                                JsonNode partiesArray = orderDetailsNode.path("parties");
                                String partyNames = "";
                                if (partiesArray != null && partiesArray.isArray() && !partiesArray.isEmpty()) {
                                    partyNames = StreamSupport.stream(partiesArray.spliterator(), false)
                                            .map(node -> node.path("partyName").asText())
                                            .collect(Collectors.joining(", "));
                                }

                                text = text.replace("[name of party]", partyNames);
                            }
                            return text;
                        }
                    }
                }
            }
        }
        return null;
    }

}