package pucar.strategy.ordertype;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.jayway.jsonpath.JsonPath;
import lombok.extern.slf4j.Slf4j;
import org.egov.common.contract.request.RequestInfo;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;
import pucar.config.Configuration;
import pucar.strategy.OrderUpdateStrategy;
import pucar.util.*;
import pucar.web.models.Order;
import pucar.web.models.OrderRequest;
import pucar.web.models.WorkflowObject;
import pucar.web.models.adiary.CaseDiaryEntry;
import pucar.web.models.courtCase.CaseCriteria;
import pucar.web.models.courtCase.CaseSearchRequest;
import pucar.web.models.courtCase.CourtCase;
import pucar.web.models.hearing.Hearing;
import pucar.web.models.hearing.HearingCriteria;
import pucar.web.models.hearing.HearingRequest;
import pucar.web.models.hearing.HearingSearchRequest;
import pucar.web.models.scheduler.ReScheduleHearing;
import pucar.web.models.scheduler.ReScheduleHearingRequest;

import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneId;
import java.util.Arrays;
import java.util.Collections;
import java.util.List;
import java.util.Optional;

import static pucar.config.ServiceConstants.*;

@Component
@Slf4j
public class PublishAcceptRescheduleRequest implements OrderUpdateStrategy {

    private final HearingUtil hearingUtil;
    private final OrderUtil orderUtil;
    private final ApplicationUtil applicationUtil;
    private final Configuration config;
    private final SchedulerUtil schedulerUtil;
    private final CaseUtil caseUtil;
    private final DateUtil dateUtil;

    @Autowired
    public PublishAcceptRescheduleRequest(HearingUtil hearingUtil, OrderUtil orderUtil, ApplicationUtil applicationUtil, Configuration config, SchedulerUtil schedulerUtil, CaseUtil caseUtil, DateUtil dateUtil) {
        this.hearingUtil = hearingUtil;
        this.orderUtil = orderUtil;
        this.applicationUtil = applicationUtil;
        this.config = config;
        this.schedulerUtil = schedulerUtil;
        this.caseUtil = caseUtil;
        this.dateUtil = dateUtil;
    }

    @Override
    public boolean supportsPreProcessing(OrderRequest orderRequest) {
        return false;
    }

    @Override
    public boolean supportsPostProcessing(OrderRequest orderRequest) {
        Order order = orderRequest.getOrder();
        String action = order.getWorkflow().getAction();
        return order.getOrderType() != null && E_SIGN.equalsIgnoreCase(action) && ACCEPT_RESCHEDULING_REQUEST.equalsIgnoreCase(order.getOrderType());
    }

    @Override
    public OrderRequest preProcess(OrderRequest orderRequest) {
        return null;
    }

    @Override
    public OrderRequest postProcess(OrderRequest orderRequest) throws JsonProcessingException {
        RequestInfo requestInfo = orderRequest.getRequestInfo();
        Order order = orderRequest.getOrder();

        ZoneId zone = ZoneId.of(config.getZoneId());

        LocalDate hearingDate = Instant.ofEpochMilli(order.getNextHearingDate())
                .atZone(zone)
                .toLocalDate();

        LocalDate today = LocalDate.now(zone);

        boolean isSameDate = hearingDate.equals(today);
        log.info("After order publish process,result = IN_PROGRESS, orderType :{}, orderNumber:{}", order.getOrderType(), order.getOrderNumber());

        ObjectMapper mapper = new ObjectMapper();

        String json = mapper.writeValueAsString(order.getAdditionalDetails());

        String refHearingId = JsonPath.read(json, "$.refHearingId");
        List<Hearing> hearings = hearingUtil.fetchHearing(HearingSearchRequest.builder().requestInfo(requestInfo)
                .criteria(HearingCriteria.builder().filingNumber(order.getFilingNumber()).tenantId(order.getTenantId()).hearingId(refHearingId).build()).build());
        Hearing hearing = hearings.get(0);
        Long time = hearingDate.atStartOfDay(ZoneId.of(config.getZoneId())).toInstant().toEpochMilli();
        if (time != null) {
            hearing.setStartTime(time);
            hearing.setEndTime(time);
        }

        if(isSameDate) {
            WorkflowObject workflow = new WorkflowObject();
            workflow.setAction(MARK_COMPLETE);
            workflow.setComments("Update Hearing");
            hearing.setWorkflow(workflow);
            hearing.setHearingType(order.getPurposeOfNextHearing());

            hearingUtil.updateHearingSummary(orderRequest, hearing);

            StringBuilder updateUri = new StringBuilder(config.getHearingHost()).append(config.getHearingUpdateEndPoint());
            hearingUtil.createOrUpdateHearing(HearingRequest.builder().hearing(hearing).requestInfo(requestInfo).build(), updateUri);
        }else {
            WorkflowObject workflow = new WorkflowObject();
            workflow.setAction(UPDATE_DATE);
            workflow.setComments("Update Hearing");
            hearing.setWorkflow(workflow);
            hearing.setHearingType(order.getPurposeOfNextHearing());

            StringBuilder updateUri = new StringBuilder(config.getHearingHost()).append(config.getHearingUpdateEndPoint());
            hearingUtil.createOrUpdateHearing(HearingRequest.builder().hearing(hearing).requestInfo(requestInfo).build(), updateUri);
        }
        log.info("After order publish process,result = SUCCESS, orderType :{}, orderNumber:{}", order.getOrderType(), order.getOrderNumber());
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
