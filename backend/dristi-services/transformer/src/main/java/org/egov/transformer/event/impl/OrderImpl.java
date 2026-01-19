package org.egov.transformer.event.impl;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.jayway.jsonpath.JsonPath;
import lombok.extern.slf4j.Slf4j;
import org.egov.common.contract.request.RequestInfo;
import org.egov.common.producer.Producer;
import org.egov.tracer.model.CustomException;
import org.egov.transformer.config.TransformerProperties;
import org.egov.transformer.event.EventListener;
import org.egov.transformer.models.CourtCase;
import org.egov.transformer.models.Order;
import org.egov.transformer.models.OrderAndNotification;
import org.egov.transformer.models.OrderNotificationRequest;
import org.egov.transformer.service.CaseService;
import org.egov.transformer.util.LocalizationUtil;
import org.json.JSONArray;
import org.json.JSONException;
import org.jsoup.Jsoup;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;

import java.time.Instant;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import java.util.*;

import static org.egov.transformer.config.ServiceConstants.COMPOSITE;
import static org.egov.transformer.config.ServiceConstants.DOT;

@Component
@Slf4j
public class OrderImpl implements EventListener<Order, RequestInfo> {

    private final Producer producer;
    private final TransformerProperties properties;
    private final ObjectMapper objectMapper;
    private final CaseService caseService;
    private final LocalizationUtil localizationUtil;

    @Autowired
    public OrderImpl(Producer producer, TransformerProperties properties, ObjectMapper objectMapper, CaseService caseService, LocalizationUtil localizationUtil) {
        this.producer = producer;
        this.properties = properties;
        this.objectMapper = objectMapper;
        this.caseService = caseService;
        this.localizationUtil = localizationUtil;
    }

    @Override
    public void process(Order event, RequestInfo requestInfo) {

        CourtCase courtCase = caseService.getCase(event.getFilingNumber(), event.getTenantId(), requestInfo);

        String businessOfTheDay = getBusinessOfTheDay(event, requestInfo);

        OrderAndNotification orderAndNotification = OrderAndNotification.builder()
                .type(COMPOSITE.equalsIgnoreCase(event.getOrderCategory()) ? event.getOrderCategory() : event.getOrderType())  // if its composite then order type is order category
                .id(event.getOrderNumber())
                .courtId(courtCase.getCourtId())  // no court id
                .parties(getParties(event))
                .status(event.getStatus())
                .date((event.getCreatedDate() == null) ? null : Long.valueOf(event.getCreatedDate()))
                .entityType("Order")
                .title(event.getOrderTitle())
                .businessOfTheDay(businessOfTheDay)
                .tenantId(event.getTenantId())
                .filingNumbers(event.getFilingNumber() != null ? Collections.singletonList(event.getFilingNumber()) : new ArrayList<>())
                .caseNumbers(event.getFilingNumber() != null ? Collections.singletonList(event.getFilingNumber()) : new ArrayList<>())
                .judgeIds(new ArrayList<>())/// there is judge id in issued by but its UUID
                .documents(event.getDocuments())
                .createdTime(event.getAuditDetails().getCreatedTime())
                .caseTitle(enrichCaseTitle(courtCase))
                .caseSTNumber(enrichCaseSTNumber(courtCase))
                .build();

        OrderNotificationRequest request = OrderNotificationRequest.builder()
                .requestInfo(requestInfo).orderAndNotification(orderAndNotification).build();

        producer.push(properties.getOrderAndNotificationTopic(), request);

    }

    private String enrichCaseSTNumber(CourtCase courtCase) {
        if (courtCase.getIsLPRCase()) {
            return courtCase.getLprNumber();
        } else {
            return courtCase.getCourtCaseNumber() != null ? courtCase.getCourtCaseNumber() : courtCase.getCmpNumber();
        }
    }

    private List<Map<String, Object>> getParties(Order event) {

        String orderCategory = event.getOrderCategory();

        if (COMPOSITE.equalsIgnoreCase(orderCategory)) {
            Set<String> partyNames = new HashSet<>();
            List<Map<String, Object>> partyList = new ArrayList<>();
            Object compositeItems = event.getCompositeItems();
            try {
                String jsonString = objectMapper.writeValueAsString(compositeItems);
                if (isValidJsonArray(jsonString)) {
                    JSONArray jsonArray = new JSONArray(jsonString);
                    List<List<Map<String, Object>>> allParties = JsonPath.read(jsonArray, "$[*].orderSchema.orderDetails.parties");

                    for (List<Map<String, Object>> parties : allParties) {
                        for (Map<String, Object> party : parties) {
                            String key = party.get("partyName").toString() + party.get("partyType").toString();
                            if (partyNames.contains(key)) {
                                continue;
                            }
                            partyList.add(party);
                            partyNames.add(key);

                        }
                    }

                } else {
                    log.error("compositeItems is not a valid json array");
                }
            } catch (Exception e) {
                log.error("Error occurred while serializing compositeItems", e);

            }
            return partyList;

        } else {
            Object orderDetails = event.getOrderDetails();
            try {
                String jsonString = objectMapper.writeValueAsString(orderDetails);
                List<Map<String, Object>> parties = JsonPath.read(jsonString, "$.parties");
                return parties;
            } catch (Exception e) {
                log.error("Error occurred while serializing orderDetails", e);
            }

        }
        return new ArrayList<>();

    }

    public boolean isValidJsonArray(String json) {
        try {
            new JSONArray(json);
            return true;
        } catch (JSONException e) {
            return false;
        }
    }

    private String enrichCaseTitle(CourtCase courtCase) {
        if (Boolean.TRUE.equals(courtCase.getIsLPRCase())) {
            return (courtCase.getLprNumber() != null && !courtCase.getLprNumber().isEmpty())
                    ? courtCase.getCaseTitle() + " , " + courtCase.getLprNumber()
                    : courtCase.getCaseTitle();
        }
        return (courtCase.getCourtCaseNumber() != null && !courtCase.getCourtCaseNumber().isEmpty())
                ? courtCase.getCaseTitle() + " , " + courtCase.getCourtCaseNumber()
                : courtCase.getCaseTitle() + " , " + courtCase.getCmpNumber();
    }

    public String getBusinessOfTheDay(Order order, RequestInfo requestInfo) {
        StringBuilder sb = new StringBuilder();

        try {
            // Attendance
            if (order.getAttendance() != null) {

                Object attendanceObj = order.getAttendance();

                Map<String, List<String>> attendanceMap = objectMapper.convertValue(
                        attendanceObj, new TypeReference<Map<String, List<String>>>() {
                        }
                );

                List<String> rolesLocalizedPresent = new ArrayList<>();
                List<String> rolesLocalizedAbsentee = new ArrayList<>();

                // Format and append
                for (Map.Entry<String, List<String>> entry : attendanceMap.entrySet()) {
                    String status = entry.getKey(); // "Present", "Absent"
                    List<String> roles = entry.getValue();

                    if ("Present".equalsIgnoreCase(status)) {
                        if (roles != null) {
                            roles.forEach(role -> rolesLocalizedPresent.add(localizationUtil.callLocalization(requestInfo, order.getTenantId(), role)));
                        }
                    } else {
                        if (roles != null) {
                            roles.forEach(role -> rolesLocalizedAbsentee.add(localizationUtil.callLocalization(requestInfo, order.getTenantId(), role)));
                        }
                    }
                }

                if (!rolesLocalizedPresent.isEmpty()) {
                    String linePresent = "Present" + ": " + String.join(", ", rolesLocalizedPresent);
                    sb.append(linePresent).append(DOT);
                }

                if (!rolesLocalizedAbsentee.isEmpty()) {
                    String lineAbsent = "Absent" + ": " + String.join(", ", rolesLocalizedAbsentee);
                    sb.append(lineAbsent).append(DOT);
                }
            }

            // Item Text
            if (order.getItemText() != null) {
                String html = order.getItemText();
                String plainText = Jsoup.parse(html).text();
                sb.append(plainText).append(DOT);
            }

            // Purpose of Next Hearing
            if (order.getPurposeOfNextHearing() != null && !order.getPurposeOfNextHearing().isEmpty()) {
                String purpose = localizationUtil.callLocalization(requestInfo, order.getTenantId(), order.getPurposeOfNextHearing());
                sb.append("Purpose of Next Hearing: ")
                        .append(purpose).append(DOT);
            }

            // Next Hearing Date
            if (order.getNextHearingDate() != null) {
                DateTimeFormatter formatter = DateTimeFormatter.ofPattern("dd-MM-yyyy");
                String dateStr = Instant.ofEpochMilli(order.getNextHearingDate())
                        .atZone(ZoneId.of(properties.getApplicationZoneId()))
                        .toLocalDate()
                        .format(formatter);
                sb.append("Date of Next Hearing: ")
                        .append(dateStr).append(DOT);
            }

            return sb.toString().trim();

        } catch (Exception e) {
            log.error("Error extracting order text", e);
            throw new CustomException("Error extracting business of the day: ", "ERROR_BUSINESS_OF_THE_DAY");
        }
    }

}
