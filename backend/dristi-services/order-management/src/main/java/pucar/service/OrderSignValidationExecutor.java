package pucar.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.egov.common.contract.request.RequestInfo;
import org.egov.tracer.model.CustomException;
import org.springframework.stereotype.Service;
import pucar.strategy.sign.OrderSignValidationStrategy;
import pucar.web.models.Order;

import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

import static pucar.config.ServiceConstants.ORDER_SIGN_VALIDATION_FAILED;

@Service
@RequiredArgsConstructor
@Slf4j
public class OrderSignValidationExecutor {

    private final List<OrderSignValidationStrategy> validationStrategies;
    private final ObjectMapper objectMapper;

    public void validate(Order order, RequestInfo requestInfo) {
        List<String> errors = new ArrayList<>();
        validationStrategies.stream()
                .filter(strategy -> strategy.supports(order))
                .forEach(strategy -> errors.addAll(strategy.validate(order, requestInfo)));

        if (!errors.isEmpty()) {
            log.error("Pre-sign validation failed, orderNumber:{}, errors:{}", order.getOrderNumber(), errors);
            throw new CustomException(ORDER_SIGN_VALIDATION_FAILED, String.join("; ", errors));
        }
    }

    public void validateBatch(List<Order> orders, RequestInfo requestInfo) {
        Map<String, List<String>> errorMap = new LinkedHashMap<>();

        for (Order order : orders) {
            List<String> errors = new ArrayList<>();
            validationStrategies.stream()
                    .filter(strategy -> strategy.supports(order))
                    .forEach(strategy -> errors.addAll(strategy.validate(order, requestInfo)));

            if (!errors.isEmpty()) {
                log.error("Pre-sign validation failed, orderNumber:{}, errors:{}", order.getOrderNumber(), errors);
                errorMap.put(order.getOrderNumber(), errors);
            }
        }

        if (!errorMap.isEmpty()) {
            try {
                String errorJson = objectMapper.writeValueAsString(errorMap);
                throw new CustomException(ORDER_SIGN_VALIDATION_FAILED, errorJson);
            } catch (CustomException e) {
                throw e;
            } catch (Exception e) {
                throw new CustomException(ORDER_SIGN_VALIDATION_FAILED, errorMap.toString());
            }
        }
    }
}
