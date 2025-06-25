package org.pucar.dristi.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.extern.slf4j.Slf4j;
import org.egov.tracer.model.CustomException;
import org.pucar.dristi.config.Configuration;
import org.pucar.dristi.repository.ServiceRequestRepository;
import org.pucar.dristi.util.DateUtil;
import org.pucar.dristi.util.FileStoreUtil;
import org.pucar.dristi.util.HrmsUtil;
import org.pucar.dristi.util.InboxUtil;
import org.pucar.dristi.web.models.*;
import org.pucar.dristi.web.models.inbox.*;
import org.springframework.core.io.Resource;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.util.CollectionUtils;

import java.time.Instant;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.stream.Collectors;

import static org.pucar.dristi.config.ServiceConstants.*;

@Service
@Slf4j
public class OpenApiService {

    private final Configuration configuration;

    private final ServiceRequestRepository serviceRequestRepository;

    private final ObjectMapper objectMapper;

    private final DateUtil dateUtil;

    private final InboxUtil inboxUtil;

    private final HrmsUtil hrmsUtil;

    private final FileStoreUtil fileStoreUtil;

    public OpenApiService(Configuration configuration, ServiceRequestRepository serviceRequestRepository, ObjectMapper objectMapper, DateUtil dateUtil, InboxUtil inboxUtil, HrmsUtil hrmsUtil, FileStoreUtil fileStoreUtil) {
        this.configuration = configuration;
        this.serviceRequestRepository = serviceRequestRepository;
        this.objectMapper = objectMapper;
        this.dateUtil = dateUtil;
        this.inboxUtil = inboxUtil;
        this.hrmsUtil = hrmsUtil;
        this.fileStoreUtil = fileStoreUtil;
    }

    public CaseSummaryResponse getCaseByCnrNumber(String tenantId, String cnrNumber) {
        if (configuration.getIsElasticSearchEnabled()) {
            log.info("Fetching case summary from elastic search");
            throw new RuntimeException("Fetching from ElasticSearch is not yet implemented for case summary");
        } else {
            log.info("Fetching cases from Case Service");
            StringBuilder uri = new StringBuilder(configuration.getCaseServiceHost()).append(configuration.getCaseServiceSearchByCnrNumberEndpoint());
            OpenApiCaseSummaryRequest request = OpenApiCaseSummaryRequest.builder().tenantId(tenantId).cnrNumber(cnrNumber).build();
            Object response = serviceRequestRepository.fetchResult(uri, request);
            CaseSummaryResponse caseSummaryResponse = objectMapper.convertValue(response, CaseSummaryResponse.class);
            CaseSummary caseSummary = caseSummaryResponse.getCaseSummary();
            caseSummary.setJudgeName(configuration.getJudgeName());
            caseSummary.setNextHearingDate(enrichNextHearingDate(caseSummary.getFilingNumber()));
            caseSummaryResponse.setCaseSummary(caseSummary);
            return caseSummaryResponse;
        }
    }

    public CaseListResponse getCaseListByCaseType(String tenantId, Integer year, String caseType, Integer offset, Integer limit, String sort) {
        if (configuration.getIsElasticSearchEnabled()) {
            log.info("Fetching case list from elastic search");
            throw new RuntimeException("Fetching from ElasticSearch is not yet implemented for case summary");
        } else {
            log.info("Fetching cases from Case Service");
            StringBuilder uri = new StringBuilder(configuration.getCaseServiceHost()).append(configuration.getCaseServiceSearchByCaseTypeEndpoint());
            Pagination pagination = Pagination.builder().offSet(Double.valueOf(offset)).limit(Double.valueOf(limit)).build();
            boolean isCaseTypeValid = validCaseType(caseType);
            if (!isCaseTypeValid) {
                throw new CustomException(CASE_TYPE_EXCEPTION, "Invalid case type");
            }
            if (sort != null) {
                List<String> sortList = List.of(sort.split(","));
                if (sortList.size() == 2) {
                    pagination.setSortBy(sortList.get(0));
                    pagination.setOrder(Order.fromValue(sortList.get(1)));
                } else {
                    pagination.setSortBy(REGISTRATION_DATE);
                    pagination.setOrder(Order.DESC);
                }
            }
            OpenApiCaseSummaryRequest request = OpenApiCaseSummaryRequest.builder().tenantId(tenantId).year(year).caseType(caseType).pagination(pagination).build();
            List<Long> years = dateUtil.getYearInSeconds(year);
            request.setStartYear(years.get(0));
            request.setEndYear(years.get(1));
            Object response = serviceRequestRepository.fetchResult(uri, request);
            return objectMapper.convertValue(response, CaseListResponse.class);
        }
    }

    public CaseSummaryResponse getCaseByCaseNumber(String tenantID, Integer year, String caseType, Integer caseNumber) {
        if (configuration.getIsElasticSearchEnabled()) {
            log.info("Fetching case summary from elastic search");
            throw new RuntimeException("Fetching from ElasticSearch is not yet implemented for case summary");
        } else {
            log.info("Fetching cases from Case Service");
            StringBuilder uri = new StringBuilder(configuration.getCaseServiceHost()).append(configuration.getCaseServiceSearchByCaseNumberEndpoint());
            boolean isCaseTypeValid = validCaseType(caseType);
            if (!isCaseTypeValid) {
                throw new CustomException(CASE_TYPE_EXCEPTION, "Invalid case type");
            }
            OpenApiCaseSummaryRequest request = OpenApiCaseSummaryRequest.builder().tenantId(tenantID).year(year).caseType(caseType).caseNumber(caseNumber).build();
            Object response = serviceRequestRepository.fetchResult(uri, request);
            CaseSummaryResponse caseSummaryResponse = objectMapper.convertValue(response, CaseSummaryResponse.class);
            CaseSummary caseSummary = caseSummaryResponse.getCaseSummary();
            caseSummary.setJudgeName(configuration.getJudgeName());
            caseSummary.setNextHearingDate(enrichNextHearingDate(caseSummary.getFilingNumber()));
            caseSummaryResponse.setCaseSummary(caseSummary);
            return caseSummaryResponse;
        }
    }

    public Long enrichNextHearingDate(String filingNumber) {
        StringBuilder uri = new StringBuilder(configuration.getHearingServiceHost()).append(configuration.getHearingSearchEndpoint());
        HearingCriteria criteria = HearingCriteria.builder().filingNumber(filingNumber).build();
        HearingSearchRequest request = HearingSearchRequest.builder().criteria(criteria).build();
        Object response = serviceRequestRepository.fetchResult(uri, request);
        List<Hearing> hearingList = objectMapper.convertValue(response, HearingListResponse.class).getHearingList();
        if (hearingList != null && !hearingList.isEmpty()) {
            List<Hearing> hearings = hearingList.stream()
                    .filter(hearing -> hearing.getStatus() != null && hearing.getStatus().equalsIgnoreCase(HEARING_SCHEDULED_STATUS)).toList();
            if (!hearings.isEmpty()) {
                if (hearings.size() == 1) {
                    return hearings.get(0).getStartTime();
                } else {
                    throw new CustomException(HEARING_SERVICE_EXCEPTION, "Multiple scheduled hearings found for the case");
                }
            }
        } else {
            log.info("No hearings found for the case");
        }
        return null;
    }

    public boolean validCaseType(String CaseType) {
        return CaseType.equals(CASE_TYPE_CMP) || CaseType.equals(CASE_TYPE_ST);
    }

    public List<OpenHearing> getHearings(OpenAPiHearingRequest body) {
        String tenantId = body.getTenantId();
        String searchText = body.getSearchText();
        Long fromDate = body.getFromDate();
        Long toDate = body.getToDate();

        InboxRequest inboxRequest = inboxUtil.getInboxRequestForOpenHearing(tenantId, fromDate, toDate, searchText);
        return inboxUtil.getOpenHearings(inboxRequest);
    }

    public String getMagistrateName(String courtId, String tenantId) {
        return hrmsUtil.getJudgeName(courtId, tenantId);
    }

    public ResponseEntity<Resource> getFile(String fileStore, String tenantId) {
        return fileStoreUtil.getFilesByFileStore(fileStore, tenantId);
    }

    public OpenApiOrderTaskResponse getOrdersAndPaymentTasks(OpenApiOrdersTaskIRequest openApiOrdersTaskIRequest) {
        OpenApiOrderTaskResponse openApiOrderTaskResponse = new OpenApiOrderTaskResponse();

        if (openApiOrdersTaskIRequest.getForOrders()) {
            getOrderIndexResponse(openApiOrdersTaskIRequest, openApiOrderTaskResponse);
        } else if (openApiOrdersTaskIRequest.getForPaymentTask()) {
            getPendingTaskIndexResponse(openApiOrdersTaskIRequest, openApiOrderTaskResponse);
        }

        return openApiOrderTaskResponse;
    }

    private void getPendingTaskIndexResponse(OpenApiOrdersTaskIRequest openApiOrdersTaskIRequest, OpenApiOrderTaskResponse openApiOrderTaskResponse) {
        SearchRequest searchRequest = new SearchRequest();
        IndexSearchCriteria criteria = new IndexSearchCriteria();

        criteria.setTenantId(openApiOrdersTaskIRequest.getTenantId());
        criteria.setModuleName("Pending Tasks Service");
        criteria.setLimit(openApiOrdersTaskIRequest.getLimit());
        criteria.setOffset(openApiOrdersTaskIRequest.getOffset());
        criteria.setTenantId(openApiOrdersTaskIRequest.getTenantId());

        HashMap<String, Object> moduleSearchCriteria = new HashMap<>();
        moduleSearchCriteria.put("filingNumber", openApiOrdersTaskIRequest.getFilingNumber());
        moduleSearchCriteria.put("courtId", openApiOrdersTaskIRequest.getCourtId());
        moduleSearchCriteria.put("isCompleted", false);
        moduleSearchCriteria.put("status", "PENDING_PAYMENT");
        moduleSearchCriteria.put("entityType", Arrays.asList("task-notice", "task-summons", "task-warrant"));

        criteria.setModuleSearchCriteria(moduleSearchCriteria);

        searchRequest.setIndexSearchCriteria(criteria);

        SearchResponse searchResponse = inboxUtil.getPaymentTask(searchRequest);
        List<PaymentTask> paymentTasks = getPendingPaymentTasks(searchResponse);

        openApiOrderTaskResponse.setPaymentTasks(paymentTasks);

        searchRequest.getIndexSearchCriteria().setLimit(10000);
        searchRequest.getIndexSearchCriteria().setOffset(0);
        openApiOrderTaskResponse.setTotalCount(inboxUtil.getPaymentTask(searchRequest).getData().size());
    }

    private List<PaymentTask> getPendingPaymentTasks(SearchResponse searchResponse) {
        List<PaymentTask> paymentTasks = new ArrayList<>();

        if (!CollectionUtils.isEmpty(searchResponse.getData())) {
            for (Data data : searchResponse.getData()) {
                Long dueDate = null;
                String taskName = null;

                for (Field field : data.getFields()) {
                    if ("stateSla".equals(field.getKey()) && field.getValue() != null) {
                        dueDate = Long.parseLong(field.getValue().toString());
                    } else if ("name".equals(field.getKey()) && field.getValue() != null) {
                        taskName = field.getValue().toString();
                    }
                }

                if (dueDate != null && taskName != null) {
                    PaymentTask paymentTask = new PaymentTask();
                    paymentTask.setDueDate(dueDate);
                    paymentTask.setTask(taskName);

                    // Optional: Calculate days remaining
                    long currentTime = System.currentTimeMillis();
                    int daysRemaining = (int) ((dueDate - currentTime) / (1000 * 60 * 60 * 24));
                    paymentTask.setDaysRemaining(daysRemaining);

                    paymentTasks.add(paymentTask);
                }
            }
        }

        return paymentTasks;
    }


    private void getOrderIndexResponse(OpenApiOrdersTaskIRequest openApiOrdersTaskIRequest, OpenApiOrderTaskResponse openApiOrderTaskResponse) {
        InboxRequest inboxRequest = new InboxRequest();
        InboxSearchCriteria criteria = new InboxSearchCriteria();

        criteria.setTenantId(openApiOrdersTaskIRequest.getTenantId());
        OrderBy orderBy = new OrderBy();
        orderBy.setOrder(Order.DESC);
        orderBy.setCode("date");
        criteria.setSortOrder(List.of(orderBy));
        criteria.setLimit(openApiOrdersTaskIRequest.getLimit());
        criteria.setOffset(openApiOrdersTaskIRequest.getOffset());

        ProcessInstanceSearchCriteria processCriteria = new ProcessInstanceSearchCriteria();
        processCriteria.setBusinessService(Collections.singletonList("notification"));
        processCriteria.setModuleName("Transformer service");
        criteria.setProcessSearchCriteria(processCriteria);

        HashMap<String, Object> moduleSearchCriteria = new HashMap<>();
        moduleSearchCriteria.put("caseNumbers", Collections.singletonList(openApiOrdersTaskIRequest.getFilingNumber()));
        moduleSearchCriteria.put("tenantId", openApiOrdersTaskIRequest.getTenantId());
        moduleSearchCriteria.put("status", Collections.singletonList("PUBLISHED"));

        criteria.setModuleSearchCriteria(moduleSearchCriteria);

        inboxRequest.setInbox(criteria);

        InboxResponse inboxResponse = inboxUtil.getOrders(inboxRequest);
        List<OrderDetails> orderDetailsList = getOrdersDetails(inboxResponse);
        if (openApiOrdersTaskIRequest.getLatestOrder()) {
            if (!orderDetailsList.isEmpty()) {
                orderDetailsList = orderDetailsList.stream()
                        .limit(5)
                        .collect(Collectors.toList());
            }
        }
        openApiOrderTaskResponse.setOrderDetailsList(orderDetailsList);
        openApiOrderTaskResponse.setTotalCount(inboxResponse.getTotalCount());
    }

    private List<OrderDetails> getOrdersDetails(InboxResponse inboxResponse) {
        List<OrderDetails> orderDetailsList = new ArrayList<>();

        if (!CollectionUtils.isEmpty(inboxResponse.getItems())) {
            for (Inbox inbox : inboxResponse.getItems()) {
                Map<String, Object> businessObject = inbox.getBusinessObject();

                if (businessObject != null && businessObject.containsKey("orderNotification")) {
                    Object orderNotificationObj = businessObject.get("orderNotification");

                    if (orderNotificationObj instanceof Map) {
                        Map<String, Object> orderNotification = (Map<String, Object>) orderNotificationObj;

                        Object dateObj = orderNotification.get("date");
                        Object businessOfDayObj = orderNotification.get("businessOfTheDay");
                        Object orderId = orderNotification.get("id");

                        if (dateObj != null) {
                            OrderDetails orderDetails = new OrderDetails();
                            orderDetails.setDate(Long.parseLong(dateObj.toString()));
                            orderDetails.setBusinessOfTheDay(businessOfDayObj != null ? businessOfDayObj.toString() : null);
                            orderDetails.setOrderId(orderId != null ? orderId.toString() : null);

//                            List<Map<String, Object>> documents = (List<Map<String, Object>>) orderNotification.get("documents");
//                            if (documents != null) {
//                                for (Map<String, Object> doc : documents) {
//                                    if ("SIGNED".equals(doc.get("documentType"))) {
//                                        orderDetails.setFileStore((String) doc.get("fileStore"));
//                                        break;
//                                    }
//                                }
//                            }

                            orderDetailsList.add(orderDetails);
                        }
                    }
                }
            }
        }

        return orderDetailsList;
    }

    public String getOrderByIdFromIndex(String tenantId, String orderId) {
        InboxRequest inboxRequest = new InboxRequest();
        InboxSearchCriteria criteria = new InboxSearchCriteria();

        criteria.setTenantId(tenantId);
        criteria.setLimit(1);
        criteria.setOffset(0);

        ProcessInstanceSearchCriteria processCriteria = new ProcessInstanceSearchCriteria();
        processCriteria.setBusinessService(Collections.singletonList("notification"));
        processCriteria.setModuleName("Transformer service");
        criteria.setProcessSearchCriteria(processCriteria);

        HashMap<String, Object> moduleSearchCriteria = new HashMap<>();
        moduleSearchCriteria.put("id", orderId);
        moduleSearchCriteria.put("tenantId", tenantId);

        criteria.setModuleSearchCriteria(moduleSearchCriteria);

        inboxRequest.setInbox(criteria);

        InboxResponse inboxResponse = inboxUtil.getOrders(inboxRequest);
        String fileStoreId = null;

        if (!CollectionUtils.isEmpty(inboxResponse.getItems())) {
            for (Inbox inbox : inboxResponse.getItems()) {
                Map<String, Object> businessObject = inbox.getBusinessObject();

                if (businessObject != null && businessObject.containsKey("orderNotification")) {
                    Object orderNotificationObj = businessObject.get("orderNotification");

                    if (orderNotificationObj instanceof Map) {
                        Map<String, Object> orderNotification = (Map<String, Object>) orderNotificationObj;

                        List<Map<String, Object>> documents = (List<Map<String, Object>>) orderNotification.get("documents");
                        if (documents != null) {
                            for (Map<String, Object> doc : documents) {
                                if ("SIGNED".equals(doc.get("documentType"))) {
                                    fileStoreId = (String) doc.get("fileStore");
                                    break;
                                }
                            }
                        }
                    }
                }
            }
        }
        return fileStoreId;
    }
}
