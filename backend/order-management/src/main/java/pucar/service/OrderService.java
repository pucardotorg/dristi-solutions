package pucar.service;

import jakarta.validation.Valid;
import lombok.extern.slf4j.Slf4j;
import org.egov.common.contract.request.RequestInfo;
import org.egov.tracer.model.CustomException;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.util.CollectionUtils;
import pucar.config.Configuration;
import pucar.factory.OrderFactory;
import pucar.factory.OrderServiceFactoryProvider;
import pucar.util.ADiaryUtil;
import pucar.util.CaseUtil;
import pucar.util.HearingUtil;
import pucar.util.OrderUtil;
import pucar.web.models.*;
import pucar.web.models.adiary.BulkDiaryEntryRequest;
import pucar.web.models.adiary.CaseDiaryEntry;
import pucar.web.models.courtCase.CaseCriteria;
import pucar.web.models.courtCase.CaseListResponse;
import pucar.web.models.courtCase.CaseSearchRequest;
import pucar.web.models.courtCase.CourtCase;
import pucar.web.models.hearing.*;

import java.util.Collections;
import java.util.List;

import static pucar.config.ServiceConstants.*;


@Service
@Slf4j
public class OrderService {

    private final OrderUtil orderUtil;
    private final OrderServiceFactoryProvider factoryProvider;
    private final ADiaryUtil aDiaryUtil;
    private final HearingUtil hearingUtil;
    private final CaseUtil caseUtil;
    private final Configuration configuration;

    @Autowired
    public OrderService(OrderUtil orderUtil, OrderServiceFactoryProvider factoryProvider, ADiaryUtil aDiaryUtil, HearingUtil hearingUtil, CaseUtil caseUtil, Configuration configuration) {
        this.orderUtil = orderUtil;
        this.factoryProvider = factoryProvider;
        this.aDiaryUtil = aDiaryUtil;
        this.hearingUtil = hearingUtil;
        this.caseUtil = caseUtil;
        this.configuration = configuration;
    }


    public Order createOrder(@Valid OrderRequest request) {
        log.info("creating order, result= IN_PROGRESS,orderNumber:{}, orderType:{}", request.getOrder().getOrderNumber(), request.getOrder().getOrderType());
        OrderResponse orderResponse = orderUtil.createOrder(request);
        updateHearingSummary(request);
        log.info("created order, result= SUCCESS");
        return orderResponse.getOrder();
    }

    private void updateHearingSummary(OrderRequest request) {

        Order order = request.getOrder();
        RequestInfo requestInfo = request.getRequestInfo();

        //If attendance is present then attendance and item text will go in hearing summary
        if (order.getAttendance() != null) {
            String hearingNumber = hearingUtil.getHearingNumberFormApplicationAdditionalDetails(order.getAdditionalDetails());
            List<Hearing> hearings = hearingUtil.fetchHearing(HearingSearchRequest.builder().requestInfo(requestInfo)
                    .criteria(HearingCriteria.builder().hearingId(hearingNumber).tenantId(order.getTenantId()).build()).build());
            Hearing hearing = hearings.get(0);
            hearingUtil.updateHearingSummary(request, hearing);
        }

    }

    public Order updateOrder(@Valid OrderRequest request) {
        Order order = request.getOrder();
        log.info("updating order, result= IN_PROGRESS,orderNumber:{}, orderType:{}", order.getOrderNumber(), order.getOrderType());

        OrderFactory orderFactory = factoryProvider.getFactory(order.getOrderCategory());
        OrderProcessor orderProcessor = orderFactory.createProcessor();

        orderProcessor.preProcessOrder(request);

        if(E_SIGN.equalsIgnoreCase(request.getOrder().getWorkflow().getAction()) && request.getOrder().getNextHearingDate()!=null){
            hearingUtil.preProcessScheduleNextHearing(request);
        }

        OrderResponse orderResponse = orderUtil.updateOrder(request);

        List<CaseDiaryEntry> diaryEntries = orderProcessor.processCommonItems(request);

        orderProcessor.postProcessOrder(request);

        log.info("creating diary entry, result= IN_PROGRESS,orderNumber:{}, orderType:{}, entryCount:{}", order.getOrderNumber(), order.getOrderType(), diaryEntries.size());

        // create diary entry
        if (!diaryEntries.isEmpty()) {
            aDiaryUtil.createBulkADiaryEntry(BulkDiaryEntryRequest.builder()
                    .requestInfo(request.getRequestInfo())
                    .caseDiaryList(diaryEntries).build());
        }

        log.info("updated order and created diary entry, result= SUCCESS");

        updateHearingSummary(request);

        return orderResponse.getOrder();
    }

    public Order createDraftOrder(String hearingNumber, String tenantId, String filingNumber, String cnrNumber, RequestInfo requestInfo) {

        if(cnrNumber==null){
            cnrNumber = getCnrNumber(tenantId, filingNumber, requestInfo);
        }

        OrderCriteria criteria = OrderCriteria.builder()
                .filingNumber(filingNumber)
                .hearingNumber(hearingNumber)
                .tenantId(tenantId)
                .build();

                OrderSearchRequest searchRequest = OrderSearchRequest.builder()
                .criteria(criteria)
                .pagination(Pagination.builder().limit(100.0).offSet(0.0).build())
                .build();

                OrderResponse orderResponse;

        OrderListResponse response = orderUtil.getOrders(searchRequest);
        if (response != null && !CollectionUtils.isEmpty(response.getList())) {
            log.info("Found order associated with Hearing Number: {}", hearingNumber);
            if("PUBLISHED".equalsIgnoreCase(response.getList().get(0).getStatus())){
                throw new CustomException("ORDER_ALREADY_PUBLISHED","Order is already published for hearing number: " + hearingNumber);
            }
            return response.getList().get(0);
        } else {
                    Order order = Order.builder()
                    .hearingNumber(hearingNumber)
                    .filingNumber(filingNumber)
                    .cnrNumber(cnrNumber)
                    .tenantId(tenantId)
                    .orderCategory("INTERMEDIATE")
                    .orderTitle("Schedule of Next Hearing Date")
                    .orderType("")
                    .isActive(true)
                    .status("")
                    .statuteSection(StatuteSection.builder().tenantId(tenantId).build())
                    .build();

                    WorkflowObject workflow = new WorkflowObject();
            workflow.setAction("SAVE_DRAFT");
            workflow.setDocuments(List.of(new org.egov.common.contract.models.Document()));
            order.setWorkflow(workflow);

                    OrderRequest orderRequest = OrderRequest.builder()
                    .requestInfo(requestInfo).order(order).build();
            orderResponse = orderUtil.createOrder(orderRequest);
            log.info("Order created for Hearing ID: {}, orderNumber:: {}", hearingNumber, orderResponse.getOrder().getOrderNumber());
        }

        return orderResponse.getOrder();
    }

    private String getCnrNumber(String tenantId, String filingNumber, RequestInfo requestInfo) {
        CaseListResponse caseListResponse = caseUtil.searchCaseDetails(CaseSearchRequest.builder()
                .criteria(Collections.singletonList(CaseCriteria.builder().filingNumber(filingNumber).tenantId(tenantId).defaultFields(false).build()))
                .requestInfo(requestInfo).build());

        List<CourtCase> cases = caseListResponse.getCriteria().get(0).getResponseList();

        // add validation here
        CourtCase courtCase = cases.get(0);
        return courtCase.getCnrNumber();
    }
}
