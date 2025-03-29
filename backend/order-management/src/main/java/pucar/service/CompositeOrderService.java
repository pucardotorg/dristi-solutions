package pucar.service;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ObjectNode;
import lombok.extern.slf4j.Slf4j;
import org.egov.common.contract.request.RequestInfo;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import pucar.web.models.Order;
import pucar.web.models.OrderRequest;
import pucar.web.models.adiary.CaseDiaryEntry;

import java.util.ArrayList;
import java.util.Collections;
import java.util.List;

@Service
@Slf4j
public class CompositeOrderService implements OrderProcessor {

    private final ObjectMapper objectMapper;
    private final OrderStrategyExecutor orderStrategyExecutor;

    @Autowired
    public CompositeOrderService(ObjectMapper objectMapper, OrderStrategyExecutor orderStrategyExecutor) {
        this.objectMapper = objectMapper;
        this.orderStrategyExecutor = orderStrategyExecutor;
    }

    @Override
    public void preProcessOrder(OrderRequest orderRequest) {

        Order order = orderRequest.getOrder();
        RequestInfo requestInfo = orderRequest.getRequestInfo();

        List<Order> itemListFormCompositeItem = getItemListFormCompositeItem(order);
        for (Order compositeOrderItem : itemListFormCompositeItem) {

            orderStrategyExecutor.beforePublish(OrderRequest.builder()
                    .order(compositeOrderItem)
                    .requestInfo(requestInfo).build());

            order.setHearingNumber(compositeOrderItem.getHearingNumber());

        }

    }

    @Override
    public List<CaseDiaryEntry> processCommonItems(OrderRequest orderRequest) {

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

        return new ArrayList<>(Collections.singletonList(diaryEntries.get(0)));

    }

    @Override
    public void postProcessOrder(OrderRequest orderRequest) {

        Order order = orderRequest.getOrder();
        RequestInfo requestInfo = orderRequest.getRequestInfo();

        List<Order> itemListFormCompositeItem = getItemListFormCompositeItem(order);
        for (Order compositeOrderItem : itemListFormCompositeItem) {
            // here call post
            orderStrategyExecutor.afterPublish(OrderRequest.builder()
                    .order(compositeOrderItem)
                    .requestInfo(requestInfo).build());
        }

    }


    public List<Order> getItemListFormCompositeItem(Order order) {


        Object compositeItems = order.getCompositeItems();
        ObjectNode orderNode = null;
        try {
            String jsonString = objectMapper.writeValueAsString(order);
            JsonNode jsonNode = objectMapper.readTree(jsonString);
            if (jsonNode.isObject()) {
                orderNode = (ObjectNode) jsonNode;
            }
        } catch (JsonProcessingException e) {
            throw new RuntimeException(e);
        }

        List<Order> compositeItemsList = new ArrayList<>();

        try {
            JsonNode compositeItemArray = objectMapper.readTree(compositeItems.toString());
            for (JsonNode item : compositeItemArray) {
                String orderType = item.get("orderType").toString();
                JsonNode additionalDetails = item.get("orderSchema").get("additionalDetails");
//                if (additionalDetails.isObject()) {
                ObjectNode additionalDetailsNode = (ObjectNode) additionalDetails;
                additionalDetailsNode.put("itemId", item.get("id").toString());
//                }

                JsonNode orderDetails = item.get("orderSchema").get("orderDetails");

                assert orderNode != null;
                orderNode.put("orderType", orderType);
                orderNode.set("additionalDetails", additionalDetailsNode);
                orderNode.set("orderDetails", orderDetails);

                Order orderItem = objectMapper.convertValue(orderNode, Order.class);
                compositeItemsList.add(orderItem);
            }


        } catch (Exception e) {
            throw new RuntimeException(e);
        }
        return compositeItemsList;
    }
}
