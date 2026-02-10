package pucar.service;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ObjectNode;
import lombok.extern.slf4j.Slf4j;
import org.egov.common.contract.request.RequestInfo;
import org.egov.tracer.model.CustomException;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import pucar.util.OrderUtil;
import pucar.web.models.Order;
import pucar.web.models.OrderRequest;
import pucar.web.models.adiary.CaseDiaryEntry;

import java.util.ArrayList;
import java.util.Collections;
import java.util.List;

import static pucar.config.ServiceConstants.E_SIGN;
import static pucar.config.ServiceConstants.SCHEDULE_OF_HEARING_DATE;

@Service
@Slf4j
public class CompositeOrderService implements OrderProcessor {

    private final ObjectMapper objectMapper;
    private final OrderStrategyExecutor orderStrategyExecutor;
    private final OrderUtil orderUtil;

    @Autowired
    public CompositeOrderService(ObjectMapper objectMapper, OrderStrategyExecutor orderStrategyExecutor, OrderUtil orderUtil) {
        this.objectMapper = objectMapper;
        this.orderStrategyExecutor = orderStrategyExecutor;
        this.orderUtil = orderUtil;
    }

    @Override
    public void preProcessOrder(OrderRequest orderRequest) {

        Order order = orderRequest.getOrder();
        RequestInfo requestInfo = orderRequest.getRequestInfo();
        log.info("pre processing composite order, result= IN_PROGRESS,orderNumber:{}, orderType:{}", order.getOrderNumber(), order.getOrderType());

        String oldHearingNumber = order.getHearingNumber();
        String oldHearingType = order.getHearingType();
        List<Order> itemListFormCompositeItem = getItemListFormCompositeItem(order);
        for (Order compositeOrderItem : itemListFormCompositeItem) {

            orderStrategyExecutor.beforePublish(OrderRequest.builder()
                    .order(compositeOrderItem)
                    .requestInfo(requestInfo).build());
            // todo : need to find permanent solution for this
            if (compositeOrderItem.getHearingNumber() != null && !compositeOrderItem.getHearingNumber().equals(oldHearingNumber))
                order.setHearingNumber(compositeOrderItem.getHearingNumber());
            if (compositeOrderItem.getHearingType() != null && !compositeOrderItem.getHearingType().equals(oldHearingType))
                order.setHearingType(compositeOrderItem.getHearingType());
            if (compositeOrderItem.getScheduledHearingNumber() != null && E_SIGN.equalsIgnoreCase(order.getWorkflow().getAction()) && SCHEDULE_OF_HEARING_DATE.equalsIgnoreCase(order.getOrderType()))
                order.setScheduledHearingNumber(compositeOrderItem.getScheduledHearingNumber());

        }

        log.info("pre processing composite order, result= SUCCESS,orderNumber:{}, orderType:{}", order.getOrderNumber(), order.getOrderType());


    }

    @Override
    public List<CaseDiaryEntry> processCommonItems(OrderRequest orderRequest) {
        log.info("common processing composite order, result= IN_PROGRESS,orderNumber:{}, orderType:{}", orderRequest.getOrder().getOrderNumber(), orderRequest.getOrder().getOrderType());

        Order order = orderRequest.getOrder();
        RequestInfo requestInfo = orderRequest.getRequestInfo();

        List<Order> itemListFormCompositeItem = getItemListFormCompositeItem(order);
        List<CaseDiaryEntry> diaryEntries = new ArrayList<>();
        for (Order compositeOrderItem : itemListFormCompositeItem) {
            // here call common
            diaryEntries = orderStrategyExecutor.commonProcess(OrderRequest.builder()
                    .order(compositeOrderItem)
                    .requestInfo(requestInfo).build());
        }
        CaseDiaryEntry diaryEntry = null;
        if (!diaryEntries.isEmpty()) {
            diaryEntry = diaryEntries.get(0);
            diaryEntry.setBusinessOfDay(orderUtil.getBusinessOfTheDay(order, requestInfo));
        }
        log.info("common processing composite order, result= SUCCESS,orderNumber:{}, orderType:{}", orderRequest.getOrder().getOrderNumber(), orderRequest.getOrder().getOrderType());

        return diaryEntry == null ? new ArrayList<>() : new ArrayList<>(Collections.singletonList(diaryEntry));
    }

    @Override
    public void postProcessOrder(OrderRequest orderRequest) {
        log.info("post processing composite order, result= IN_PROGRESS,orderNumber:{}, orderType:{}", orderRequest.getOrder().getOrderNumber(), orderRequest.getOrder().getOrderType());

        Order order = orderRequest.getOrder();
        RequestInfo requestInfo = orderRequest.getRequestInfo();

        List<Order> itemListFormCompositeItem = getItemListFormCompositeItem(order);
        for (Order compositeOrderItem : itemListFormCompositeItem) {
            // here call post
            orderStrategyExecutor.afterPublish(OrderRequest.builder()
                    .order(compositeOrderItem)
                    .requestInfo(requestInfo).build());
        }
        log.info("post processing composite order, result= SUCCESS,orderNumber:{}, orderType:{}", orderRequest.getOrder().getOrderNumber(), orderRequest.getOrder().getOrderType());

    }


    public List<Order> getItemListFormCompositeItem(Order order) {
        log.info("method=getItemListFormCompositeItem , result= IN_PROGRESS,orderNumber:{}, orderType:{}", order.getOrderNumber(), order.getOrderType());


        Object compositeItems = order.getCompositeItems();
        ObjectNode orderNode = null;
        try {
            String jsonString = objectMapper.writeValueAsString(order);
            JsonNode jsonNode = objectMapper.readTree(jsonString);
            if (jsonNode.isObject()) {
                orderNode = (ObjectNode) jsonNode;
            }
        } catch (JsonProcessingException e) {
            log.error("Error while converting order to json", e);
            throw new CustomException("COMPOSITE_ORDER_CONVERSION_ERROR", "Error while converting order to json");
        }

        List<Order> compositeItemsList = new ArrayList<>();

        try {
            log.info("enriching order type ,order details and additional details");
            JsonNode compositeItemArray = objectMapper.readTree(objectMapper.writeValueAsString(compositeItems));
            for (JsonNode item : compositeItemArray) {
                String orderType = item.get("orderType").asText();
                JsonNode additionalDetails = item.get("orderSchema").get("additionalDetails");
//                if (additionalDetails.isObject()) {
                ObjectNode additionalDetailsNode = (ObjectNode) additionalDetails;
                additionalDetailsNode.put("itemId", item.get("id").asText());
//                }

                JsonNode orderDetails = item.get("orderSchema").get("orderDetails");

                assert orderNode != null;
                orderNode.put("orderType", orderType);
                orderNode.set("additionalDetails", additionalDetailsNode);
                orderNode.set("orderDetails", orderDetails);

                Order orderItem = objectMapper.convertValue(orderNode, Order.class);
                compositeItemsList.add(orderItem);
            }
            log.info("successfully enriched order type ,order details and additional details completed");


        } catch (Exception e) {
            log.error("Error while enriching order type ,order details and additional details", e);
            throw new CustomException("COMPOSITE_ORDER_ENRICHMENT_ERROR", "Error while enriching order type ,order details and additional details");
        }
        return compositeItemsList;
    }
}
