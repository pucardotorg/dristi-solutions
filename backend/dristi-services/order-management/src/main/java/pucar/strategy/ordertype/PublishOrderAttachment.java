package pucar.strategy.ordertype;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.extern.slf4j.Slf4j;
import org.egov.common.contract.request.RequestInfo;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;
import pucar.strategy.OrderUpdateStrategy;
import pucar.util.CaseUtil;
import pucar.util.JsonUtil;
import pucar.util.TaskUtil;
import pucar.web.models.Order;
import pucar.web.models.OrderRequest;
import pucar.web.models.adiary.CaseDiaryEntry;
import pucar.web.models.courtCase.CaseCriteria;
import pucar.web.models.courtCase.CaseSearchRequest;
import pucar.web.models.courtCase.CourtCase;
import pucar.web.models.task.TaskRequest;

import java.util.Arrays;
import java.util.Collections;
import java.util.List;
import java.util.Map;

import static pucar.config.ServiceConstants.*;

@Component
@Slf4j
public class PublishOrderAttachment implements OrderUpdateStrategy {

    private final TaskUtil taskUtil;
    private final ObjectMapper objectMapper;
    private final CaseUtil caseUtil;
    private final JsonUtil jsonUtil;

    @Autowired
    public PublishOrderAttachment(TaskUtil taskUtil, ObjectMapper objectMapper, CaseUtil caseUtil, JsonUtil jsonUtil) {
        this.taskUtil = taskUtil;
        this.objectMapper = objectMapper;
        this.caseUtil = caseUtil;
        this.jsonUtil = jsonUtil;
    }

    @Override
    public boolean supportsPreProcessing(OrderRequest orderRequest) {
        return false;
    }

    @Override
    public boolean supportsPostProcessing(OrderRequest orderRequest) {
        Order order = orderRequest.getOrder();
        String action = order.getWorkflow().getAction();
        return order.getOrderType() != null && E_SIGN.equalsIgnoreCase(action) && ATTACHMENT.equalsIgnoreCase(order.getOrderType());
    }

    @Override
    public OrderRequest preProcess(OrderRequest orderRequest) {
        return null;
    }

    @Override
    public OrderRequest postProcess(OrderRequest orderRequest) {

        // create task base on no of task details item
        Order order = orderRequest.getOrder();
        RequestInfo requestInfo = orderRequest.getRequestInfo();
        log.info("After order publish process,result = IN_PROGRESS, orderType :{}, orderNumber:{}", order.getOrderType(), order.getOrderNumber());

        // case search and update
        List<CourtCase> cases = caseUtil.getCaseDetailsForSingleTonCriteria(CaseSearchRequest.builder()
                .criteria(Collections.singletonList(CaseCriteria.builder().filingNumber(order.getFilingNumber()).tenantId(order.getTenantId()).defaultFields(false).build()))
                .requestInfo(requestInfo).build());

        // add validation here
        CourtCase courtCase = cases.get(0);

        String taskDetails = jsonUtil.getNestedValue(order.getAdditionalDetails(), List.of("taskDetails"), String.class);
        try {
            JsonNode taskDetailsArray = objectMapper.readTree(taskDetails);
            log.info("taskDetailsArray:{}", taskDetailsArray.size());

            for (JsonNode taskDetail : taskDetailsArray) {

                String taskDetailString = objectMapper.writeValueAsString(taskDetail);
                Map<String, Object> jsonMap = objectMapper.readValue(taskDetailString, new TypeReference<>() {
                });
                String channel = jsonUtil.getNestedValue(jsonMap, Arrays.asList("deliveryChannels", "channelCode"), String.class);

                TaskRequest taskRequest = taskUtil.createTaskRequest(requestInfo, order, taskDetail, courtCase, channel);
                taskUtil.callCreateTask(taskRequest);

                // No court fee is applicable for attachment irrespective of case stage (#5906),
                // so no payment-pending task or fee-payment notification is created.

            }

        } catch (JsonProcessingException e) {
            throw new RuntimeException(e);
        }

        return null;
    }

    @Override
    public boolean supportsCommon(OrderRequest orderRequest) {
        return false;
    }

    @Override
    public CaseDiaryEntry execute(OrderRequest request) {
        return null;
    }

}
