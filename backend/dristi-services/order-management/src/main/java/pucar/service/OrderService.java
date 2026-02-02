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
import pucar.util.DateUtil;
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

import java.time.LocalDate;
import java.time.ZoneId;
import java.util.*;

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
    private final DateUtil dateUtil;

    @Autowired
    public OrderService(OrderUtil orderUtil, OrderServiceFactoryProvider factoryProvider, ADiaryUtil aDiaryUtil, HearingUtil hearingUtil, CaseUtil caseUtil, Configuration configuration, DateUtil dateUtil) {
        this.orderUtil = orderUtil;
        this.factoryProvider = factoryProvider;
        this.aDiaryUtil = aDiaryUtil;
        this.hearingUtil = hearingUtil;
        this.caseUtil = caseUtil;
        this.configuration = configuration;
        this.dateUtil = dateUtil;
    }


    public Order createOrder(@Valid OrderRequest request) {
        log.info("creating order, result= IN_PROGRESS,orderNumber:{}, orderType:{}", request.getOrder().getOrderNumber(), request.getOrder().getOrderType());
        LocalDate today = LocalDate.now(ZoneId.of(configuration.getZoneId()));
        Long now = dateUtil.getEPochFromLocalDate(today);
        request.getOrder().setCreatedDate(now);
        OrderResponse orderResponse = orderUtil.createOrder(request);
        log.info("created order, result= SUCCESS");
        return orderResponse.getOrder();
    }

    private void updateHearingSummary(OrderRequest request) {

        Order order = request.getOrder();
        RequestInfo requestInfo = request.getRequestInfo();

        //If attendance is present then attendance and item text will go in hearing summary
        String hearingNumber = hearingUtil.getHearingNumberFormApplicationAdditionalDetails(order.getAdditionalDetails());
        List<Hearing> hearings = hearingUtil.fetchHearing(HearingSearchRequest.builder().requestInfo(requestInfo)
                .criteria(HearingCriteria.builder().hearingId(hearingNumber).tenantId(order.getTenantId()).build()).build());
        Hearing hearing = hearings.get(0);
        hearingUtil.updateHearingSummary(request, hearing);

    }

    public Order updateOrder(@Valid OrderRequest request) {
        Order order = request.getOrder();
        log.info("updating order, result= IN_PROGRESS,orderNumber:{}, orderType:{}", order.getOrderNumber(), order.getOrderType());

        OrderFactory orderFactory = factoryProvider.getFactory(order.getOrderCategory());
        OrderProcessor orderProcessor = orderFactory.createProcessor();

        orderProcessor.preProcessOrder(request);

        boolean isRescheduleRequest = Optional.ofNullable(order.getCompositeItems())
                .map(obj -> (List<Map<String, Object>>) obj)
                .orElse(List.of())
                .stream()
                .anyMatch(item -> ACCEPT_RESCHEDULING_REQUEST.equals(String.valueOf(item.get("orderType"))));

        if (E_SIGN.equalsIgnoreCase(request.getOrder().getWorkflow().getAction())
                && request.getOrder().getNextHearingDate() != null
                && !ACCEPT_RESCHEDULING_REQUEST.equalsIgnoreCase(order.getOrderType()) && !isRescheduleRequest) {
            hearingUtil.preProcessScheduleNextHearing(request);
        }

        if (DELETE.equalsIgnoreCase(request.getOrder().getWorkflow().getAction())
                && request.getOrder().getHearingNumber() != null) {
            hearingUtil.updateOpenHearingOrderStatusForDeletedOrder(request.getOrder());
        }

        if (SUBMIT_BULK_ESIGN.equalsIgnoreCase(request.getOrder().getWorkflow().getAction())
                && request.getOrder().getHearingNumber() != null) {
            hearingUtil.updateOpenHearingOrderStatusForPendingSignOrder(request.getOrder());
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

        if (E_SIGN.equalsIgnoreCase(request.getOrder().getWorkflow().getAction()) && order.getHearingNumber() != null) {
            updateHearingSummary(request);
            hearingUtil.updateOpenHearingIndex(request.getOrder());
        }

        return orderResponse.getOrder();
    }

    public Order createDraftOrder(String hearingNumber, String hearingType, String tenantId, String filingNumber, String cnrNumber, RequestInfo requestInfo) {

        if (cnrNumber == null) {
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
            if ("PUBLISHED".equalsIgnoreCase(response.getList().get(0).getStatus())) {
                throw new CustomException("ORDER_ALREADY_PUBLISHED", "Order is already published for hearing number: " + hearingNumber);
            }
            return response.getList().get(0);
        } else {
            Order order = Order.builder()
                    .hearingNumber(hearingNumber)
                    .hearingType(hearingType)
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
            hearingUtil.updateOpenHearingOrderStatusForDraftOrder(order);

            log.info("Order created for Hearing ID: {}, orderNumber:: {}", hearingNumber, orderResponse.getOrder().getOrderNumber());
        }

        return orderResponse.getOrder();
    }

    public BotdOrderListResponse getBotdOrders(String tenantId, String filingNumber, String orderNumber, Pagination pagination, RequestInfo requestInfo) {
        OrderCriteria criteria = OrderCriteria.builder()
                .filingNumber(filingNumber)
                .status("PUBLISHED")
                .orderNumber(orderNumber)
                .tenantId(tenantId)
                .build();

        if (pagination == null) {
            pagination = Pagination.builder().limit(100.0).offSet(0.0).build();
        }

        OrderSearchRequest searchRequest = OrderSearchRequest.builder()
                .criteria(criteria)
                .pagination(pagination)
                .build();

        OrderListResponse orderListResponse = orderUtil.getOrders(searchRequest);
        List<BotdOrderSummary> botdOrders = new ArrayList<>();

        if (orderListResponse != null && orderListResponse.getList() != null) {
            for (Order order : orderListResponse.getList()) {
                BotdOrderSummary botdOrderSummary = buildBotdOrderSummary(order, requestInfo);
                botdOrders.add(botdOrderSummary);
            }
        }

        Integer totalCount = orderListResponse != null ? orderListResponse.getTotalCount() : 0;
        Pagination responsePagination = orderListResponse != null && orderListResponse.getPagination() != null
                ? orderListResponse.getPagination()
                : pagination;

        if (responsePagination != null) {
            responsePagination.setTotalCount(totalCount.doubleValue());
        }

        return BotdOrderListResponse.builder()
                .botdOrderList(botdOrders)
                .totalCount(totalCount)
                .pagination(responsePagination)
                .build();
    }

    private BotdOrderSummary buildBotdOrderSummary(Order order, RequestInfo requestInfo) {
        String businessOfTheDay = orderUtil.getBusinessOfTheDay(order, requestInfo);

        return BotdOrderSummary.builder()
                .orderNumber(order.getOrderNumber())
                .orderTitle(order.getOrderTitle())
                .orderType(order.getOrderType())
                .orderCategory(order.getOrderCategory())
                .status(order.getStatus())
                .createdDate(order.getCreatedDate())
                .tenantId(order.getTenantId())
                .filingNumber(order.getFilingNumber())
                .hearingNumber(order.getHearingNumber())
                .hearingType(order.getHearingType())
                .itemText(order.getItemText())
                .purposeOfNextHearing(order.getPurposeOfNextHearing())
                .nextHearingDate(order.getNextHearingDate())
                .businessOfTheDay(businessOfTheDay)
                .build();
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

    public Order addItem(@Valid OrderRequest request) {
        Order order = request.getOrder();
        log.info("adding item to order, result= IN_PROGRESS, orderNumber:{}, orderType:{}", order.getOrderNumber(), order.getOrderType());

        OrderFactory orderFactory = factoryProvider.getFactory(order.getOrderCategory());
        OrderProcessor orderProcessor = orderFactory.createProcessor();

        OrderResponse orderResponse = orderUtil.addOrderItem(request);
        request.setOrder(orderResponse.getOrder());

        // TODO : this is temporary solution need to have proper implementation
        orderProcessor.preProcessOrder(request);

        return orderResponse.getOrder();
    }
}
