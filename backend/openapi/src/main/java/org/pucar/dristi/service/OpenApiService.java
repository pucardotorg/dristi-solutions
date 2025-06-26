package org.pucar.dristi.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.extern.slf4j.Slf4j;
import org.egov.common.contract.request.RequestInfo;
import org.egov.common.contract.response.ResponseInfo;
import org.egov.tracer.model.CustomException;
import org.pucar.dristi.config.Configuration;
import org.pucar.dristi.repository.ServiceRequestRepository;
import org.pucar.dristi.util.AdvocateUtil;
import org.pucar.dristi.util.DateUtil;
import org.pucar.dristi.util.FileStoreUtil;
import org.pucar.dristi.util.HrmsUtil;
import org.pucar.dristi.util.InboxUtil;
import org.pucar.dristi.util.ResponseInfoFactory;
import org.pucar.dristi.web.models.*;

import org.pucar.dristi.web.models.inbox.*;

import org.springframework.core.io.Resource;
import org.springframework.http.ResponseEntity;

import org.springframework.stereotype.Service;
import org.springframework.util.CollectionUtils;

import java.time.Instant;
import java.time.LocalDate;
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

    private AdvocateUtil advocateUtil;

    private final ResponseInfoFactory responseInfoFactory;
  
    private final HrmsUtil hrmsUtil;

    public OpenApiService(Configuration configuration, ServiceRequestRepository serviceRequestRepository, ObjectMapper objectMapper, DateUtil dateUtil, InboxUtil inboxUtil, AdvocateUtil advocateUtil, ResponseInfoFactory responseInfoFactory, HrmsUtil hrmsUtil) {
        this.configuration = configuration;
        this.serviceRequestRepository = serviceRequestRepository;
        this.objectMapper = objectMapper;
        this.dateUtil = dateUtil;
        this.inboxUtil = inboxUtil;
        this.advocateUtil = advocateUtil;
        this.responseInfoFactory = responseInfoFactory;
        this.hrmsUtil = hrmsUtil;
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

    public LandingPageCaseListResponse getLandingPageCaseList(String tenantId, LandingPageCaseListRequest request) {
        if (configuration.getIsElasticSearchEnabled()) {
            log.info("ElasticSearch enabled — tenantId: {}, falling back with error", tenantId);
            throw new RuntimeException("Fetching from ElasticSearch is not yet implemented for landing page");
        } else {
            log.info("Fetching landing page cases from Case Service for tenantId: {}", tenantId);

            SearchCaseCriteria criteria = request.getSearchCaseCriteria();
            if (!validateCaseSearchCriteria(criteria)) {
                log.warn("Invalid SearchCaseCriteria for searchType: {} | criteria: {}",
                        criteria != null ? criteria.getSearchType() : "null",
                        criteria);
                throw new CustomException(INVALID_SEARCH_CASE_CRITERIA_EXCEPTION,
                        "SearchCaseCriteria is invalid for searchType: " +
                                (criteria != null ? criteria.getSearchType() : "null"));
            }

            InboxRequest inboxRequest = buildInboxRequestFromSearchCriteria(
                    tenantId,
                    request.getSearchCaseCriteria(),
                    request.getFilterCriteria(),
                    request.getOffset(),
                    request.getLimit(),
                    request.getSortOrder()
            );

            if (inboxRequest == null) {
                log.warn("InboxRequest could not be built — tenantId: {}, criteria: {}", tenantId, criteria);
                return new LandingPageCaseListResponse(
                        responseInfoFactory.createResponseInfoFromRequestInfo(null, true),
                        0, 0, Collections.emptyList(), Collections.emptyList()
                );
            }

            return inboxUtil.getLandingPageCaseListResponse(inboxRequest);
        }
    }


    private InboxRequest buildInboxRequestFromSearchCriteria(
            String tenantId,
            SearchCaseCriteria searchCaseCriteria,
            FilterCriteria filterCriteria,
            Integer offset,
            Integer limit,
            List<OrderBy> sortOrder
    ) {
        HashMap<String, Object> moduleSearchCriteria = new HashMap<>();
        if (tenantId != null) {
            moduleSearchCriteria.put("tenantId", tenantId);
        }

        if (searchCaseCriteria != null && searchCaseCriteria.getSearchType() != null) {
            switch (searchCaseCriteria.getSearchType()) {

                case FILING_NUMBER:
                    FilingNumberCriteria filingNumberCriteria = searchCaseCriteria.getFilingNumberCriteria();
                    if (filingNumberCriteria == null || filingNumberCriteria.getCode() == null
                            || filingNumberCriteria.getCaseNumber() == null || filingNumberCriteria.getYear() == null) {
                        log.warn("Missing fields in FilingNumberCriteria: {}", filingNumberCriteria);
                        return null;
                    }
                    String filingNumber = String.join("-", filingNumberCriteria.getCode(),
                            filingNumberCriteria.getCaseNumber(), filingNumberCriteria.getYear());
                    moduleSearchCriteria.put("filingNumber", filingNumber);
                    if (filingNumberCriteria.getCourtName() != null) {
                        moduleSearchCriteria.put("courtName", filingNumberCriteria.getCourtName());
                    }
                    break;

                case CASE_NUMBER:
                    CaseNumberCriteria caseNumberCriteria = searchCaseCriteria.getCaseNumberCriteria();
                    if (caseNumberCriteria == null || caseNumberCriteria.getCaseType() == null
                            || caseNumberCriteria.getCaseNumber() == null || caseNumberCriteria.getYear() == null) {
                        log.warn("Missing fields in CaseNumberCriteria: {}", caseNumberCriteria);
                        return null;
                    }

                    String caseNumber = String.join("/",
                            caseNumberCriteria.getCaseType(),
                            caseNumberCriteria.getCaseNumber(),
                            caseNumberCriteria.getYear());

                    String caseType = caseNumberCriteria.getCaseType();
                    if (caseType.equalsIgnoreCase("ST")) {
                        moduleSearchCriteria.put("stNumber", caseNumber);
                    } else if (caseType.equalsIgnoreCase("CMP")) {
                        moduleSearchCriteria.put("cmpNumber", caseNumber);
                    } else {
                        return null;
                    }

                    if (caseNumberCriteria.getCourtName() != null) {
                        moduleSearchCriteria.put("courtName", caseNumberCriteria.getCourtName());
                    }
                    break;


                case CNR_NUMBER:
                    CnrNumberCriteria cnrNumberCriteria = searchCaseCriteria.getCnrNumberCriteria();
                    if (cnrNumberCriteria == null || cnrNumberCriteria.getCnrNumber() == null) {
                        log.warn("Missing or null CNR Number in CnrNumberCriteria: {}", cnrNumberCriteria);
                        return null;
                    }
                    moduleSearchCriteria.put("cnrNumber", cnrNumberCriteria.getCnrNumber());
                    break;

                case ADVOCATE:
                    AdvocateCriteria advocateCriteria = searchCaseCriteria.getAdvocateCriteria();
                    if (advocateCriteria == null) {
                        log.warn("AdvocateCriteria is null");
                        return null;
                    }

                    if (advocateCriteria.getAdvocateSearchType() == AdvocateSearchType.BARCODE) {
                        BarCodeDetails barCodeDetails = advocateCriteria.getBarCodeDetails();
                        if (barCodeDetails == null || barCodeDetails.getStateCode() == null
                                || barCodeDetails.getBarCode() == null || barCodeDetails.getYear() == null) {
                            log.warn("Missing fields in BarCodeDetails: {}", barCodeDetails);
                            return null;
                        }

                        String barCode = String.join("/", barCodeDetails.getStateCode(),
                                barCodeDetails.getBarCode(), barCodeDetails.getYear());
                        List<Advocate> advocates = advocateUtil.fetchAdvocatesByBarRegistrationNumber(barCode);

                        if (advocates == null || advocates.isEmpty() || advocates.get(0).getId() == null) {
                            log.warn("No advocate found for barcode: {}", barCode);
                            return null;
                        }
                        moduleSearchCriteria.put("advocateId", advocates.get(0).getId());

                    } else if (advocateCriteria.getAdvocateSearchType() == AdvocateSearchType.ADVOCATE_NAME) {
                        if (advocateCriteria.getAdvocateName() == null) {
                            log.warn("AdvocateName is null in AdvocateCriteria");
                            return null;
                        }
                        moduleSearchCriteria.put("advocateName", advocateCriteria.getAdvocateName());
                    } else {
                        log.warn("Unsupported AdvocateSearchType: {}", advocateCriteria.getAdvocateSearchType());
                        return null;
                    }
                    break;

                case LITIGANT:
                    LitigantCriteria litigantCriteria = searchCaseCriteria.getLitigantCriteria();
                    if (litigantCriteria == null || litigantCriteria.getLitigantName() == null) {
                        log.warn("Missing LitigantCriteria or litigantName: {}", litigantCriteria);
                        return null;
                    }
                    moduleSearchCriteria.put("litigantName", litigantCriteria.getLitigantName());
                    break;

                case ALL:
                    // No search criteria needed for ALL
                    log.debug("SearchType is ALL — no specific search criteria provided");
                    break;

                default:
                    log.warn("Unsupported SearchType: {}", searchCaseCriteria.getSearchType());
                    return null;
            }
        } else {
            log.warn("SearchCaseCriteria or searchType is null");
            return null;
        }

        if (filterCriteria != null) {
            if (filterCriteria.getCourtName() != null) {
                moduleSearchCriteria.put("courtName", filterCriteria.getCourtName());
            }
            if (filterCriteria.getCaseType() != null) {
                moduleSearchCriteria.put("caseType", filterCriteria.getCaseType());
            }
            if (filterCriteria.getHearingDateFrom() != null) {
                moduleSearchCriteria.put("hearingDateFrom", dateUtil.getEpochFromLocalDate(filterCriteria.getHearingDateFrom()).toString());
            }
            if (filterCriteria.getHearingDateTo() != null) {
                LocalDate toDate = filterCriteria.getHearingDateTo();
                String zoneId = configuration.getZoneId();
                long endOfDayEpochMillis = toDate
                        .plusDays(1)
                        .atStartOfDay(ZoneId.of(zoneId))
                        .toInstant()
                        .toEpochMilli() - 1;
                moduleSearchCriteria.put("hearingDateTo", String.valueOf(endOfDayEpochMillis));
            }
            if (filterCriteria.getCaseStage() != null) {
                moduleSearchCriteria.put("caseStage", filterCriteria.getCaseStage());
            }
            if (filterCriteria.getCaseStatus() != null) {
                moduleSearchCriteria.put("caseStatus", filterCriteria.getCaseStatus());
            }
            if (filterCriteria.getYearOfFiling() != null) {
                moduleSearchCriteria.put("yearOfFiling", filterCriteria.getYearOfFiling());
            }
            if(filterCriteria.getCaseTitle() != null) {
                moduleSearchCriteria.put("caseTitle", filterCriteria.getCaseTitle());
            }
        }

        InboxSearchCriteria inboxSearchCriteria = InboxSearchCriteria.builder()
                .tenantId(tenantId)
                .moduleSearchCriteria(moduleSearchCriteria)
                .offset(offset)
                .limit(limit != null ? limit : 50)
                .sortOrder(sortOrder)
                .processSearchCriteria(ProcessInstanceSearchCriteria.builder()
                        .moduleName(OPENAPI_MODULE_NAME)
                        .businessService(Collections.singletonList(OPENAPI_BUSINESS_SERVICE))
                        .tenantId(tenantId)
                        .build())
                .build();

        return InboxRequest.builder().inbox(inboxSearchCriteria).RequestInfo(RequestInfo.builder().build()).build();
    }
  
    public String getMagistrateName(String courtId, String tenantId) {
       return hrmsUtil.getJudgeName(tenantId,courtId);
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

                            orderDetailsList.add(orderDetails);
                        }
                    }
                }
            }
        }

        return orderDetailsList;
    }

    public static boolean validateCaseSearchCriteria(SearchCaseCriteria criteria) {
        boolean isValid = false;
        if (criteria == null || criteria.getSearchType() == null) {
            return isValid;
        }

        isValid = switch (criteria.getSearchType()) {
            case FILING_NUMBER -> criteria.getFilingNumberCriteria() != null &&
                    criteria.getCaseNumberCriteria() == null &&
                    criteria.getCnrNumberCriteria() == null &&
                    criteria.getAdvocateCriteria() == null &&
                    criteria.getLitigantCriteria() == null;

            case CASE_NUMBER -> criteria.getCaseNumberCriteria() != null &&
                    criteria.getFilingNumberCriteria() == null &&
                    criteria.getCnrNumberCriteria() == null &&
                    criteria.getAdvocateCriteria() == null &&
                    criteria.getLitigantCriteria() == null;

            case CNR_NUMBER -> criteria.getCnrNumberCriteria() != null &&
                    criteria.getFilingNumberCriteria() == null &&
                    criteria.getCaseNumberCriteria() == null &&
                    criteria.getAdvocateCriteria() == null &&
                    criteria.getLitigantCriteria() == null;

            case ADVOCATE -> criteria.getAdvocateCriteria() != null &&
                    criteria.getFilingNumberCriteria() == null &&
                    criteria.getCaseNumberCriteria() == null &&
                    criteria.getCnrNumberCriteria() == null &&
                    criteria.getLitigantCriteria() == null;

            case LITIGANT -> criteria.getLitigantCriteria() != null &&
                    criteria.getFilingNumberCriteria() == null &&
                    criteria.getCaseNumberCriteria() == null &&
                    criteria.getCnrNumberCriteria() == null &&
                    criteria.getAdvocateCriteria() == null;

            case ALL -> true;
        };

        return isValid;
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
