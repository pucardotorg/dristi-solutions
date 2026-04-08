package org.pucar.dristi.enrichment;


import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ArrayNode;
import com.fasterxml.jackson.databind.node.ObjectNode;
import com.jayway.jsonpath.JsonPath;
import com.jayway.jsonpath.spi.json.JacksonJsonNodeJsonProvider;
import com.jayway.jsonpath.spi.mapper.JacksonMappingProvider;
import lombok.extern.slf4j.Slf4j;
import org.egov.common.contract.models.AuditDetails;
import org.egov.common.contract.request.RequestInfo;
import org.egov.tracer.model.CustomException;
import org.pucar.dristi.config.Configuration;
import org.pucar.dristi.config.MdmsDataConfig;
import org.pucar.dristi.util.CaseUtil;
import org.pucar.dristi.util.IdgenUtil;
import org.pucar.dristi.util.LocalizationUtil;
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

import static org.pucar.dristi.config.ServiceConstants.*;

@Component
@Slf4j
public class OrderRegistrationEnrichment {

    private IdgenUtil idgenUtil;
    private Configuration configuration;
    private ObjectMapper objectMapper;
    private CaseUtil caseUtil;
    private final MdmsDataConfig mdmsDataConfig;
    private final LocalizationUtil localizationUtil;

    public OrderRegistrationEnrichment(IdgenUtil idgenUtil, Configuration configuration, ObjectMapper objectMapper, CaseUtil caseUtil, MdmsDataConfig mdmsDataConfig, LocalizationUtil localizationUtil) {
        this.idgenUtil = idgenUtil;
        this.configuration = configuration;
        this.objectMapper = objectMapper;
        this.caseUtil = caseUtil;
        this.mdmsDataConfig = mdmsDataConfig;
        this.localizationUtil = localizationUtil;
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
            if (COMPOSITE.equalsIgnoreCase(orderRequest.getOrder().getOrderCategory()) && orderRequest.getOrder().getCompositeItems() != null) {
                Object compositeOrderItem = orderRequest.getOrder().getCompositeItems();
                ArrayNode arrayNode = objectMapper.convertValue(compositeOrderItem, ArrayNode.class);

                if (arrayNode != null && !arrayNode.isEmpty()) {
                    for (int i = 0; i < arrayNode.size(); i++) {
                        ObjectNode itemNode = (ObjectNode) arrayNode.get(i);
                        if (!itemNode.has("id")) {
                            String newId = UUID.randomUUID().toString();
                            itemNode.put("id", newId);
                            log.info("Enriched CompositeItem ID with new value: {}", newId);

                            if (itemNode.has("orderType")) {
                                String orderType = itemNode.get("orderType").asText();

                                if (orderType != null && !orderType.equalsIgnoreCase(orderRequest.getOrder().getOrderType()) && itemNode.has("orderSchema")) {
                                    JsonNode orderSchemaNode = itemNode.get("orderSchema");
                                    String itemTextMdms = processOrderText(orderType, orderSchemaNode.toString(), orderRequest.getRequestInfo(), orderRequest.getOrder().getTenantId());
                                    if (itemTextMdms != null) {
                                        String itemText = orderRequest.getOrder().getItemText();
                                        if (itemText != null) {
                                            itemText = itemText + " " + itemTextMdms;
                                        } else {
                                            itemText = itemTextMdms;
                                        }
                                        orderRequest.getOrder().setItemText(itemText);
                                    }
                                }
                            }
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

    public void enrichItemTextForIntermediateOrder(OrderRequest orderRequest) {
        if (INTERMEDIATE.equalsIgnoreCase(orderRequest.getOrder().getOrderCategory()) && orderRequest.getOrder().getCompositeItems() == null) {
            JsonNode orderNode = objectMapper.convertValue(orderRequest.getOrder(), JsonNode.class);
            String itemTextMdms = processOrderText(orderRequest.getOrder().getOrderType(), orderNode.toString(), orderRequest.getRequestInfo(), orderRequest.getOrder().getTenantId());
            if (itemTextMdms != null) {
                String itemText = orderRequest.getOrder().getItemText();
                if ("<p></p>\n".equalsIgnoreCase(itemText) || itemText == null)
                    orderRequest.getOrder().setItemText("<p>" + itemTextMdms + "</p>\n");
            }
    }
}

public String processOrderText(String orderType, String orderSchema, RequestInfo requestInfo, String tenantId) {

    List<ItemTextMdms> itemTextMdmsMatches = mdmsDataConfig.getItemTextMdmsData().stream()
            .filter(mdms -> mdms.getOrderType().equalsIgnoreCase(orderType))
            .toList();

    try {

        if (itemTextMdmsMatches.size() == 1) {
            String text = itemTextMdmsMatches.get(0).getItemText();
            List<String> paths = itemTextMdmsMatches.get(0).getPath();

            if (paths == null || paths.isEmpty()) {
                return text;
            }
            return getText(orderSchema, paths, text, requestInfo, tenantId);

        } else if (itemTextMdmsMatches.size() == 2) {
            String action = JsonPath.read(orderSchema, "$.orderDetails.action");
            ItemTextMdms itemTextMdms = itemTextMdmsMatches.stream().filter(mdms -> mdms.getAction().equalsIgnoreCase(action)).findFirst().get();
            String text = itemTextMdms.getItemText();
            List<String> paths = itemTextMdms.getPath();
            if (paths == null || paths.isEmpty()) {
                return text;
            }
            return getText(orderSchema, paths, text, requestInfo, tenantId);
        }
    } catch (Exception e) {
        log.error("Error enriching item text :: {}", e.toString());
    }

    return null;
}

    private String getText(String orderSchema, List<String> paths, String text,RequestInfo requestInfo,String tenantId) {
        for (String path : paths) {
            if (path.startsWith("GET_DUE_DATE")) {
                Long dueDateInMilliSecond = JsonPath.read(orderSchema, path.substring("GET_DUE_DATE".length()));
                if (dueDateInMilliSecond != null) {
                    LocalDate dueDate = Instant.ofEpochMilli(dueDateInMilliSecond).atZone(ZoneId.of(configuration.getZoneId())).toLocalDate();
                    long daysRemaining = Duration.between(LocalDate.now(ZoneId.of(configuration.getZoneId())).atStartOfDay(), dueDate.atStartOfDay()).toDays();
                    text = text.replace("[" + path + "]", Long.toString(daysRemaining));
                }
            } else if (path.startsWith("GET_LOCAL_DATE")) {
                Long dateInMilliSecond = JsonPath.read(orderSchema, path.substring("GET_LOCAL_DATE".length()));
                if (dateInMilliSecond != null) {
                    LocalDate date = Instant.ofEpochMilli(dateInMilliSecond).atZone(ZoneId.of(configuration.getZoneId())).toLocalDate();
                    DateTimeFormatter formatter = DateTimeFormatter.ofPattern("dd/MM/yyyy");
                    text = text.replace("[" + path + "]", date.format(formatter));
                }
            } else if (path.startsWith("CONCAT_STRING")) {
                List<String> parties = JsonPath.read(orderSchema, path.substring("CONCAT_STRING".length()));
                if (parties != null && !parties.isEmpty()) {
                    String partyToMakeSubmission = String.join(", ", parties);
                    text = text.replace("[" + path + "]", partyToMakeSubmission);
                }
            }else if (path.startsWith("LOCALIZATION")) {
                String value = JsonPath.read(orderSchema, path.substring("LOCALIZATION".length()));
                String localizedValue = localizationUtil.callLocalization(requestInfo, tenantId, value);
                if (value != null && !value.isEmpty()) {
                    text = text.replace("[" + path + "]", localizedValue);
                }
            }
            else {
                String pathValue = JsonPath.read(orderSchema, path);
                if (pathValue != null) {
                    text = text.replace("[" + path + "]", pathValue);
                }
            }
        }
        return text;
    }

}