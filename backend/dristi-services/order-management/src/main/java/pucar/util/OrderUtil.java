package pucar.util;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.extern.slf4j.Slf4j;
import org.egov.common.contract.request.RequestInfo;
import org.egov.tracer.model.CustomException;
import org.jsoup.Jsoup;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestTemplate;
import pucar.config.Configuration;
import pucar.repository.ServiceRequestRepository;
import pucar.web.models.*;

import java.time.Instant;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import java.util.*;

import static pucar.config.ServiceConstants.*;

@Component
@Slf4j
public class OrderUtil {

    private final Configuration configuration;
    private final ObjectMapper objectMapper;
    private final ServiceRequestRepository serviceRequestRepository;
    private final LocalizationUtil localizationUtil;

    @Autowired
    public OrderUtil(RestTemplate restTemplate, ObjectMapper objectMapper, Configuration configuration, ServiceRequestRepository serviceRequestRepository, LocalizationUtil localizationUtil) {
        this.configuration = configuration;
        this.objectMapper = objectMapper;
        this.serviceRequestRepository = serviceRequestRepository;
        this.localizationUtil = localizationUtil;
    }

    public Boolean fetchOrderDetails(OrderExistsRequest orderExistsRequest) {
        StringBuilder uri = new StringBuilder();
        uri.append(configuration.getOrderHost()).append(configuration.getOrderExistsEndPoint());

        Object response = new HashMap<>();
        OrderExistsResponse orderExistsResponse;
        try {
            response = serviceRequestRepository.fetchResult(uri, orderExistsRequest);
            orderExistsResponse = objectMapper.convertValue(response, OrderExistsResponse.class);
        } catch (Exception e) {
            log.error(ERROR_WHILE_FETCHING_FROM_ORDER, e);
            throw new CustomException(ERROR_WHILE_FETCHING_FROM_ORDER, e.getMessage());

        }
        return orderExistsResponse.getOrder().get(0).getExists();
    }

    public OrderResponse updateOrder(OrderRequest orderRequest) {
        StringBuilder uri = new StringBuilder();
        uri.append(configuration.getOrderHost()).append(configuration.getOrderUpdateEndPoint());
        Object response;
        OrderResponse orderResponse;
        try {
            response = serviceRequestRepository.fetchResult(uri, orderRequest);
            orderResponse = objectMapper.convertValue(response, OrderResponse.class);
        } catch (Exception e) {
            log.error(ERROR_WHILE_FETCHING_FROM_ORDER, e);
            throw new CustomException(ERROR_WHILE_FETCHING_FROM_ORDER, e.getMessage());

        }
        return orderResponse;
    }

    public OrderResponse createOrder(OrderRequest orderRequest) {
        StringBuilder uri = new StringBuilder();
        uri.append(configuration.getOrderHost()).append(configuration.getOrderCreateEndPoint());
        Object response;
        OrderResponse orderResponse;
        try {
            response = serviceRequestRepository.fetchResult(uri, orderRequest);
            orderResponse = objectMapper.convertValue(response, OrderResponse.class);
        } catch (Exception e) {
            log.error(ERROR_WHILE_FETCHING_FROM_ORDER, e);
            throw new CustomException(ERROR_WHILE_FETCHING_FROM_ORDER, e.getMessage());

        }
        return orderResponse;
    }

    public OrderListResponse getOrders(OrderSearchRequest searchRequest) {
        StringBuilder uri = new StringBuilder();
        uri.append(configuration.getOrderHost()).append(configuration.getOrderSearchEndPoint());
        Object response;
        OrderListResponse orderListResponse;
        try {
            response = serviceRequestRepository.fetchResult(uri, searchRequest);
            orderListResponse = objectMapper.convertValue(response, OrderListResponse.class);
        } catch (Exception e) {
            log.error(ERROR_WHILE_FETCHING_FROM_ORDER, e);
            throw new CustomException(ERROR_WHILE_FETCHING_FROM_ORDER, e.getMessage());

        }
        return orderListResponse;
    }


    public String getReferenceId(Order order) {
        String referenceId = null;
        try {
            referenceId = (String) Optional.ofNullable(order)
                    .map(Order::getAdditionalDetails)
                    .filter(Map.class::isInstance)
                    .map(map -> (Map<?, ?>) map)
                    .map(map -> map.get("formdata"))
                    .filter(Map.class::isInstance)
                    .map(map -> (Map<?, ?>) map)
                    .map(map -> map.get("refApplicationId"))
                    .filter(String.class::isInstance).orElse(null);
        } catch (Exception e) {
            log.error("Error getting refApplicationId from order", e);
            throw new CustomException(ERROR_WHILE_FETCHING_FROM_ORDER, e.getMessage());
        }
        if (referenceId == null) {
            log.error("refApplicationId not found in order");
        }
        return referenceId;

    }

    public String getHearingNumberFormApplicationAdditionalDetails(Object additionalDetails) {
        return Optional.ofNullable(additionalDetails)
                .filter(Map.class::isInstance)
                .map(map -> (Map<?, ?>) map)
                .map(map -> map.get("hearingId"))
                .filter(String.class::isInstance)
                .map(String.class::cast).orElse(null);
    }

    public String getActionForApplication(Object additionalDetails) {

        String applicationStatus = Optional.ofNullable(additionalDetails)
                .filter(Map.class::isInstance)
                .map(map -> (Map<?, ?>) map)
                .map(map -> map.get("applicationStatus"))
                .filter(String.class::isInstance)
                .map(String.class::cast).orElseThrow(() -> new CustomException("", ""));

        return applicationStatusType(applicationStatus);


    }


    private String applicationStatusType(String type) {
        return switch (type) {
            case "APPROVED" -> APPROVE;
            case "SET_TERM_BAIL" -> SEND_BACK;
            default -> REJECT;
        };
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

                    if("Present".equalsIgnoreCase(status)) {
                        if (roles != null) {
                            roles.forEach(role -> rolesLocalizedPresent.add(localizationUtil.callLocalization(requestInfo, order.getTenantId(), role)));
                        }
                    }
                    else {
                        if (roles != null) {
                            roles.forEach(role -> rolesLocalizedAbsentee.add(localizationUtil.callLocalization(requestInfo, order.getTenantId(), role)));
                        }
                    }
                }

                if (!rolesLocalizedPresent.isEmpty()) {
                    String linePresent = "Present" + ": " + String.join(", ", rolesLocalizedPresent);
                    sb.append(linePresent).append(DOT);
                }

                if(!rolesLocalizedAbsentee.isEmpty()){
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
                        .atZone(ZoneId.of(configuration.getZoneId()))
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

    public String getHearingSummary(Order order, RequestInfo requestInfo) {
        StringBuilder sb = new StringBuilder();

        try {
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

                    if("Present".equalsIgnoreCase(status)) {
                        if (roles != null) {
                            roles.forEach(role -> rolesLocalizedPresent.add(localizationUtil.callLocalization(requestInfo, order.getTenantId(), role)));
                        }
                    }
                    else {
                        if (roles != null) {
                            roles.forEach(role -> rolesLocalizedAbsentee.add(localizationUtil.callLocalization(requestInfo, order.getTenantId(), role)));
                        }
                    }
                }
                if (!rolesLocalizedPresent.isEmpty()) {
                    String linePresent = "Present" + ": " + String.join(", ", rolesLocalizedPresent);
                    sb.append(linePresent).append("\n");
                }

                if(!rolesLocalizedAbsentee.isEmpty()){
                    String lineAbsent = "Absent" + ": " + String.join(", ", rolesLocalizedAbsentee);
                    sb.append(lineAbsent).append("\n");
                }
            }
            // Item Text
            if (order.getItemText() != null) {
                String html = order.getItemText();
                String plainText = Jsoup.parse(html).text();
                sb.append(plainText).append("\n");
            }

            return sb.toString().trim();
        } catch (Exception e) {
            log.error("Error extracting order text", e);
            throw new CustomException("Error extracting business of the day: ", "ERROR_BUSINESS_OF_THE_DAY");
        }
    }


    public OrderResponse removeOrderItem(@Valid OrderRequest request) {

        StringBuilder uri = new StringBuilder();
        uri.append(configuration.getOrderHost()).append(configuration.getRemoveOrderItemEndPoint());
        Object response;
        OrderResponse orderResponse;
        try {
            response = serviceRequestRepository.fetchResult(uri, request);
            orderResponse = objectMapper.convertValue(response, OrderResponse.class);
        } catch (Exception e) {
            log.error(ERROR_WHILE_FETCHING_FROM_ORDER, e);
            throw new CustomException(ERROR_WHILE_FETCHING_FROM_ORDER, e.getMessage());

        }
        return orderResponse;
    }

    public OrderResponse addOrderItem(@Valid OrderRequest request) {

        StringBuilder uri = new StringBuilder();
        uri.append(configuration.getOrderHost()).append(configuration.getAddOrderItemEndPoint());
        Object response;
        OrderResponse orderResponse;
        try {
            response = serviceRequestRepository.fetchResult(uri, request);
            orderResponse = objectMapper.convertValue(response, OrderResponse.class);
        } catch (Exception e) {
            log.error(ERROR_WHILE_FETCHING_FROM_ORDER, e);
            throw new CustomException(ERROR_WHILE_FETCHING_FROM_ORDER, e.getMessage());

        }
        return orderResponse;
    }
}
