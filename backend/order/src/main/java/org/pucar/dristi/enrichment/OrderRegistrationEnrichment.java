package org.pucar.dristi.enrichment;


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
import org.pucar.dristi.util.CaseUtil;
import org.pucar.dristi.util.IdgenUtil;
import org.pucar.dristi.web.models.*;
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

    public OrderRegistrationEnrichment(IdgenUtil idgenUtil, Configuration configuration, ObjectMapper objectMapper, CaseUtil caseUtil, MdmsDataConfig mdmsDataConfig) {
        this.idgenUtil = idgenUtil;
        this.configuration = configuration;
        this.objectMapper = objectMapper;
        this.caseUtil = caseUtil;
        this.mdmsDataConfig = mdmsDataConfig;
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
                                    String itemTextMdms = processOrderText(orderType, orderDetailsNode);
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
                order.setItemText(processOrderText(order.getOrderType(), orderDetailsNode));
            }
        } catch (Exception e) {
            log.error("Error enriching composite order item :: {}", e.toString());
            throw new CustomException(ENRICHMENT_EXCEPTION,
                    "Error in order enrichment service during add item: " + e.getMessage());
        }
    }


    public String processOrderText(String orderType, JsonNode orderDetailsNode) {

        List<ItemTextMdms> matches = mdmsDataConfig.getItemTextMdmsData().stream()
                .filter(mdms -> mdms.getOrderType().equalsIgnoreCase(orderType))
                .toList();

        if (matches.size() == 1) {
            String text = matches.get(0).getItemText();
            List<String> paths = matches.get(0).getPath();

            return switch (orderType.toUpperCase()) {
                case "ADVOCATE_REPLACEMENT_APPROVAL" ->
                        handleAdvocateReplacementApproval(text, orderDetailsNode, paths);
                case "APPROVAL_REJECTION_LITIGANT_DETAILS_CHANGE" ->
                        handleLitigantDetailsChange(text, orderDetailsNode, paths);
                case "TAKE_COGNIZANCE" -> handleTakeCognizance(text, orderDetailsNode, paths);
                case "NOTICE" -> handleNotice(text, orderDetailsNode, paths);
                case "WARRANT" -> handleWarrant(text, orderDetailsNode, paths);
                case "SUMMONS" -> handleSummons(text, orderDetailsNode, paths);
                case "APPROVE_VOLUNTARY_SUBMISSIONS", "REJECT_VOLUNTARY_SUBMISSIONS" ->
                        handleVoluntarySubmissions(text, orderDetailsNode, paths);
                case "REFERRAL_CASE_TO_ADR" -> handleReferralCaseToAdr(text, orderDetailsNode, paths);
                case "MANDATORY_SUBMISSIONS_RESPONSES" -> handleMandatorySubmissions(text, orderDetailsNode, paths);
                default -> "";
            };

        } else if (matches.size() == 2) {
            if ("EXTENSION_OF_DOCUMENT_SUBMISSION_DATE".equalsIgnoreCase(matches.get(0).getOrderType())) {
                return handleExtensionOfDocumentSubmissionDate(matches, orderDetailsNode);
            }
        }

        return null;
    }

    private String handleAdvocateReplacementApproval(String text, JsonNode node, List<String> paths) {
        String advocateName = node.path("advocateName").asText();
        String status = node.path("replaceAdvocateStatus").asText();

        text = text.replace("[advocateName]", advocateName);
        text = text.replace("[replaceAdvocateStatus]", "GRANT".equalsIgnoreCase(status) ? "GRANTED" : "REJECTED");
        return text;
    }

    private String handleLitigantDetailsChange(String text, JsonNode node, List<String> paths) {
        String applicantName = node.path("applicantName").asText();
        String status = node.path("applicationGrantedRejected").asText();

        text = text.replace("[applicantName]", applicantName);
        text = text.replace("[applicationGrantedRejected]",
                "GRANTED".equalsIgnoreCase(status) ? "Approved" : "Rejected");
        return text;
    }

    private String handleTakeCognizance(String text, JsonNode node, List<String> paths) {
        String caseNumber = node.path("caseNumber").asText();
        return text.replace("[caseNumber]", caseNumber);
    }

    private String handleNotice(String text, JsonNode node, List<String> paths) {
        String parties = extractPartyNames(node.path("parties"));
        return text.replace("[name]", parties);
    }

    private String handleWarrant(String text, JsonNode node, List<String> paths) {
        String type = node.path("warrantType").asText();
        String parties = extractPartyNames(node.path("parties"));

        text = text.replace("[type]", type);
        return text.replace("[name]", parties);
    }

    private String handleSummons(String text, JsonNode node, List<String> paths) {
        String parties = extractPartyNames(node.path("parties"));
        return text.replace("[name]", parties);
    }

    private String handleVoluntarySubmissions(String text, JsonNode node, List<String> paths) {
        String title = node.path("applicationTitle").asText();
        return text.replace("[applicationTitle]", title);
    }

    private String handleReferralCaseToAdr(String text, JsonNode node, List<String> paths) {
        String adrMode = node.path("adrModeName").asText();
        return text.replace("[adrModeName]", adrMode);
    }

    private String handleMandatorySubmissions(String text, JsonNode node, List<String> paths) {
        String docType = node.path("documentType").path("value").asText();
        text = text.replace("[type]", docType);

        String partyToMakeSubmission = extractPartyToMakeSubmission(node.path("partyDetails").path("partyToMakeSubmission"));
        text = text.replace("[partyToMakeSubmission]", partyToMakeSubmission);

        long submissionMillis = node.path("dates").path("submissionDeadlineDate").asLong();
        LocalDate submissionDate = Instant.ofEpochMilli(submissionMillis).atZone(ZoneId.systemDefault()).toLocalDate();
        long daysRemaining = Duration.between(LocalDate.now().atStartOfDay(), submissionDate.atStartOfDay()).toDays();

        return text.replace("[days]", Long.toString(daysRemaining));
    }

    private String handleExtensionOfDocumentSubmissionDate(List<ItemTextMdms> matches, JsonNode node) {

        String applicationStatus = node.path("applicationStatus").asText();
        String action = "APPROVED".equalsIgnoreCase(applicationStatus) ? "APPROVE" : "REJECT";
        ItemTextMdms itemTextMdms = matches.stream().filter(mdms -> mdms.getAction() != null && mdms.getAction().equalsIgnoreCase(action)).findFirst().orElse(null);
        assert itemTextMdms != null;

        String text = itemTextMdms.getItemText().replace("[type]", node.path("documentName").asText(""));

        if ("APPROVE".equalsIgnoreCase(itemTextMdms.getAction())) {
            long submissionMillis = node.path("newSubmissionDate").asLong(0);
            LocalDate newDate = submissionMillis > 0 ? Instant.ofEpochMilli(submissionMillis).atZone(ZoneId.systemDefault()).toLocalDate() : null;

            DateTimeFormatter formatter = DateTimeFormatter.ofPattern("dd-MM-yyyy");
            text = text.replace("[date]", newDate != null ? newDate.format(formatter) : "");

            String parties = extractPartyNames(node.path("parties"));
            text = text.replace("[partyName]", parties);
        }

        return text;
    }

    private String extractPartyNames(JsonNode partiesNode) {
        if (partiesNode == null || !partiesNode.isArray()) return "";
        return StreamSupport.stream(partiesNode.spliterator(), false)
                .map(p -> p.path("partyName").asText())
                .filter(name -> name != null && !name.isEmpty())
                .collect(Collectors.joining(", "));
    }

    private String extractPartyToMakeSubmission(JsonNode arrayNode) {
        if (arrayNode == null || !arrayNode.isArray()) return "";
        return StreamSupport.stream(arrayNode.spliterator(), false)
                .map(JsonNode::asText)
                .filter(s -> s != null && !s.isEmpty())
                .collect(Collectors.joining(", "));
    }


}