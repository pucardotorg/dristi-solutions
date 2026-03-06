package org.pucar.dristi.service;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.servlet.http.HttpServletRequest;
import lombok.extern.slf4j.Slf4j;
import org.egov.common.contract.request.RequestInfo;
import org.egov.common.contract.request.Role;
import org.egov.common.contract.request.User;
import org.egov.common.contract.response.ResponseInfo;
import org.egov.tracer.model.CustomException;
import org.pucar.dristi.config.Configuration;
import org.pucar.dristi.repository.ServiceRequestRepository;
import org.pucar.dristi.util.*;
import org.pucar.dristi.web.models.*;

import org.pucar.dristi.web.models.address.*;
import org.pucar.dristi.web.models.bailbond.*;
import org.pucar.dristi.web.models.cases.AddressDetails;
import org.pucar.dristi.web.models.cases.CourtCase;
import org.pucar.dristi.web.models.cases.PartyDetails;
import org.pucar.dristi.web.models.courtcase.WitnessDetails;
import org.pucar.dristi.web.models.esign.ESignParameter;
import org.pucar.dristi.web.models.esign.ESignRequest;
import org.pucar.dristi.web.models.esign.ESignResponse;
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

    private final BailUtil bailUtil;

    private final ESignUtil esignUtil;

    private final FileStoreUtil fileStoreUtil;

    private final UserService userService;

    private final OrderUtil orderUtil;

    private final CaseUtil caseUtil;

    private final PendingTaskUtil pendingTaskUtil;

    private final IndividualUtil individualUtil;

    public OpenApiService(Configuration configuration, ServiceRequestRepository serviceRequestRepository, ObjectMapper objectMapper, DateUtil dateUtil, InboxUtil inboxUtil, AdvocateUtil advocateUtil, ResponseInfoFactory responseInfoFactory, HrmsUtil hrmsUtil, BailUtil bailUtil, ESignUtil esignUtil, FileStoreUtil fileStoreUtil, UserService userService, OrderUtil orderUtil, CaseUtil caseUtil, PendingTaskUtil pendingTaskUtil, IndividualUtil individualUtil) {
        this.configuration = configuration;
        this.serviceRequestRepository = serviceRequestRepository;
        this.objectMapper = objectMapper;
        this.dateUtil = dateUtil;
        this.inboxUtil = inboxUtil;
        this.advocateUtil = advocateUtil;
        this.responseInfoFactory = responseInfoFactory;
        this.hrmsUtil = hrmsUtil;
        this.bailUtil = bailUtil;
        this.esignUtil = esignUtil;
        this.fileStoreUtil = fileStoreUtil;
        this.userService = userService;
        this.orderUtil = orderUtil;
        this.caseUtil = caseUtil;
        this.pendingTaskUtil = pendingTaskUtil;
        this.individualUtil = individualUtil;
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
        Boolean isHearingSerialNumberSorting = body.getIsHearingSerialNumberSorting();

        InboxRequest inboxRequest = inboxUtil.getInboxRequestForOpenHearing(tenantId, fromDate, toDate, searchText, isHearingSerialNumberSorting);
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
            if (filterCriteria.getCaseSubStage() != null) {
                moduleSearchCriteria.put("caseSubStage", filterCriteria.getCaseSubStage());
            }
            if (filterCriteria.getCaseStatus() != null) {
                String caseStatus = filterCriteria.getCaseStatus();

                if (DISPOSED.equalsIgnoreCase(caseStatus)) {
                    moduleSearchCriteria.put("outcome", configuration.getDisposedOutcomes());
                } else if (PENDING.equalsIgnoreCase(caseStatus)) {
                    moduleSearchCriteria.put("outcome", null);
                }
            }
            if (filterCriteria.getYearOfFiling() != null) {
                moduleSearchCriteria.put("yearOfFiling", filterCriteria.getYearOfFiling());
            }
            if (filterCriteria.getCaseTitle() != null) {
                moduleSearchCriteria.put("caseTitle", filterCriteria.getCaseTitle());
            }
        }
        moduleSearchCriteria.put("caseStatus", configuration.getAllowedCaseStatuses());

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
        return hrmsUtil.getJudgeName(tenantId, courtId);
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
        moduleSearchCriteria.put("status", Arrays.asList("PAYMENT_PENDING_POST", "PAYMENT_PENDING_EMAIL",
                "PAYMENT_PENDING_RPAD", "PAYMENT_PENDING_POLICE", "PAYMENT_PENDING_SMS"));
        moduleSearchCriteria.put("entityType", "order-default");

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
        orderBy.setCode("Data.orderNotification.date");
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

    public OpenApiBailResponse getBailByPartyMobile(OpenApiBailSearchRequest openApiBailSearchRequest) {

        boolean isValidRequest = false;
        String tenantId = openApiBailSearchRequest.getTenantId();
        String bailId = openApiBailSearchRequest.getBailId();
        String mobileNumber = openApiBailSearchRequest.getMobileNumber();
        BailSearchCriteria criteria = BailSearchCriteria.builder()
                .tenantId(tenantId)
                .bailId(bailId)
                .fuzzySearch(false)
                .build();

        BailSearchResponse response = bailUtil.fetchBails(criteria, createInternalRequestInfoWithSystemUserType());
        List<Bail> bails = response.getBails();

        if (bails == null || bails.isEmpty()) {
            throw new CustomException(BAIL_NOT_FOUND_EXCEPTION, "Bail not found");
        }

        Bail bail = bails.get(0);

        OpenApiBailResponse openBailResponse = objectMapper.convertValue(bail, OpenApiBailResponse.class);

        if (mobileNumber.equals(bail.getLitigantMobileNumber())) {
            isValidRequest = true;
            openBailResponse.setPhoneNumber(mobileNumber);
        } else {
            Optional<Surety> matchingSurety = bail.getSureties().stream()
                    .filter(surety -> mobileNumber.equals(surety.getMobileNumber()))
                    .findFirst();

            if (matchingSurety.isPresent()) {
                isValidRequest = true;
                openBailResponse.getSureties().stream()
                        .filter(openSurety -> openSurety.getId().equals(matchingSurety.get().getId()))
                        .findFirst()
                        .ifPresent(openSurety -> openSurety.setPhoneNumber(mobileNumber));
            }
        }

        if (isValidRequest) {
            return openBailResponse;
        } else {
            throw new CustomException(BAIL_NOT_FOUND_EXCEPTION, "Bail not found");
        }

    }

    public ESignResponse eSignDocument(String tenantId, ESignParameter params, HttpServletRequest servletRequest) {
        log.info("Initiating eSign for tenantId: {}", tenantId);

        ESignRequest eSignRequest = ESignRequest.builder()
                .eSignParameter(params)
                .requestInfo(RequestInfo.builder().userInfo(User.builder().build()).build())
                .build();

        return esignUtil.callESignService(eSignRequest);
    }

    public OpenApiBailResponse updateBailBond(OpenApiUpdateBailBondRequest request) {

        try {
            // Validate file store ID
            fileStoreUtil.getFilesByFileStore(request.getFileStoreId(), request.getTenantId(), null);

            // Fetch bail
            BailSearchCriteria criteria = BailSearchCriteria.builder()
                    .tenantId(request.getTenantId())
                    .bailId(request.getBailId())
                    .fuzzySearch(false)
                    .build();

            BailSearchResponse response = bailUtil.fetchBails(criteria, createInternalRequestInfoWithSystemUserType());
            List<Bail> bails = response.getBails();

            if (bails == null || bails.isEmpty()) {
                log.error("Bail not found for bailId: {}", request.getBailId());
                throw new CustomException("Bail not found for bailId: ", request.getBailId());
            }

            Bail bail = bails.get(0);
            String mobileNumber = request.getMobileNumber();

            boolean isLitigant = mobileNumber.equals(bail.getLitigantMobileNumber());
            Optional<Surety> matchingSurety = bail.getSureties().stream()
                    .filter(surety -> mobileNumber.equals(surety.getMobileNumber()))
                    .findFirst();

            if (!isLitigant && matchingSurety.isEmpty()) {
                throw new CustomException("mobile number not found", request.getBailId());
            }

            // Add signed document
            Document document = Document.builder()
                    .fileStore(request.getFileStoreId())
                    .documentType("SIGNED")
                    .isActive(true)
                    .build();

            // Set signed flag
            if (isLitigant) {
                bail.setLitigantSigned(true);
            } else {
                matchingSurety.get().setHasSigned(true);
            }

            // Replace documents with signed document
            bail.getDocuments().clear();
            bail.getDocuments().add(document);

            // Update Workflow
            WorkflowObject workflowObject = new WorkflowObject();
            workflowObject.setAction(E_SIGN);
            bail.setWorkflow(workflowObject);

            BailRequest bailRequest = BailRequest.builder()
                    .requestInfo(createInternalRequestInfo())
                    .bail(bail)
                    .build();

            BailResponse bailResponse = bailUtil.updateBailBond(bailRequest);
            return objectMapper.convertValue(bailResponse, OpenApiBailResponse.class);
        } catch (CustomException e) {
            throw e;
        } catch (Exception e) {
            log.error("Error while updating bail bond", e);
            throw new CustomException("Error while updating bail bond", e.getMessage());
        }
    }

    public OrderDetailsSearchResponse getOrderDetails(OrderDetailsSearch orderDetailsSearch) {

        try {
            String tenantId = orderDetailsSearch.getTenantId();
            String orderNumber = orderDetailsSearch.getOrderNumber();
            String orderItemId = orderDetailsSearch.getOrderItemId();
            String referenceId = orderDetailsSearch.getReferenceId();
            String mobileNumber = orderDetailsSearch.getMobileNumber();
            String filingNumber = orderDetailsSearch.getFilingNumber();

            OrderDetailsSearchResponse response = new OrderDetailsSearchResponse();

            //validate mobile number from pending task assigned to list
            JsonNode pendingTaskAdditionalDetails = validateMobileNumber(referenceId, mobileNumber, tenantId);
            if (pendingTaskAdditionalDetails == null) {
                response.setIsPendingTaskCompleted(true);
                return response;
            }

            OrderCriteria criteria = OrderCriteria.builder()
                    .orderNumber(orderNumber)
                    .tenantId(tenantId)
                    .build();

            OrderSearchRequest searchRequest = OrderSearchRequest.builder()
                    .criteria(criteria)
                    .pagination(Pagination.builder().limit(10.0).offSet(0.0).build())
                    .build();

            OrderListResponse orderListResponse = orderUtil.getOrders(searchRequest);

            if (!CollectionUtils.isEmpty(orderListResponse.getList())) {
                org.pucar.dristi.web.models.order.Order order = orderListResponse.getList().get(0);
                if (orderItemId != null) {
                    if (order == null || order.getCompositeItems() == null) {
                        return response;
                    }

                    try {
                        // Convert the generic Object to a List<Map<String, Object>>
                        List<Map<String, Object>> compositeList = objectMapper.convertValue(
                                order.getCompositeItems(),
                                new TypeReference<>() {
                                }
                        );

                        // Filter the list to keep only the matching item
                        List<Map<String, Object>> filtered = compositeList.stream()
                                .filter(item -> orderItemId.equals(item.get("id")))
                                .collect(Collectors.toList());

                        // Set the filtered list back into the order
                        order.setCompositeItems(filtered);
                    } catch (Exception e) {
                        throw new RuntimeException("Error filtering composite items", e);
                    }
                }

                mapperOrderToOrderSearchResponse(response, order);
            }

            CourtCase courtCase = caseUtil.getCase(filingNumber);
            response.setCaseTitle(courtCase.getCaseTitle());

            enrichPartyDetails(response, courtCase, pendingTaskAdditionalDetails);

            return response;
        } catch (Exception e) {
            log.error("Failed to get order details :: {}", e.toString());
            throw new CustomException("GET_ORDER_DETAILS_ERROR",
                    "Error Occurred while getting order details: " + e.getMessage());
        }
    }

    private void enrichPartyDetails(OrderDetailsSearchResponse response, CourtCase courtCase, JsonNode pendingTaskAdditionalDetails) {

        List<PartyDetails> partyDetailsList = new ArrayList<>();

        try {
            // Convert additionalDetails into a JsonNode for parsing
            JsonNode rootNode = objectMapper.convertValue(courtCase.getAdditionalDetails(), JsonNode.class);

            // ✅ Now handle pending task additionalDetails for filtering uniqueIds
            if (pendingTaskAdditionalDetails != null && !pendingTaskAdditionalDetails.isEmpty()) {
                // Convert JsonNode to Map for easier manipulation
                Map<String, Object> additionalDetailsMap = objectMapper.convertValue(
                        pendingTaskAdditionalDetails,
                        new TypeReference<Map<String, Object>>() {
                        }
                );

                // Extract uniqueIds list
                List<Map<String, String>> uniqueIdsList = (List<Map<String, String>>) additionalDetailsMap.get("uniqueIds");

                if (uniqueIdsList != null && !uniqueIdsList.isEmpty()) {
                    // Build a set of uniqueIds for fast lookup
                    Set<String> validUniqueIds = uniqueIdsList.stream()
                            .map(entry -> entry.get("uniqueId"))
                            .filter(Objects::nonNull)
                            .collect(Collectors.toSet());


                    // Process respondent details
                    processRespondents(rootNode, partyDetailsList, validUniqueIds);

                    // Process witness details
                    processWitnesses(courtCase.getWitnessDetails(), partyDetailsList, validUniqueIds);

                    response.setPartyDetails(partyDetailsList);
                }
            }

        } catch (Exception e) {
            log.error("Error while enriching party details", e);
            // Fallback: continue with unfiltered party details if something goes wrong
        }
    }


    private void processRespondents(JsonNode rootNode, List<PartyDetails> partyDetailsList, Set<String> validUniqueIds) {
        JsonNode respondentDetails = rootNode.path("respondentDetails");
        if (respondentDetails.isMissingNode() || !respondentDetails.has("formdata")) {
            return;
        }

        for (JsonNode respondent : respondentDetails.path("formdata")) {
            if (!respondent.has("data")) continue;

            JsonNode data = respondent.path("data");

            if (respondent.has("uniqueId") && validUniqueIds.contains(respondent.path("uniqueId").asText())) {

                PartyDetails party = new PartyDetails();
                party.setPartyType("Accused");

                // ✅ Extract and build full name
                String firstName = data.path("respondentFirstName").asText("");
                String middleName = data.path("respondentMiddleName").asText(""); // optional field
                String lastName = data.path("respondentLastName").asText("");

                String fullName = String.join(" ",
                        firstName,
                        middleName,
                        lastName
                ).replaceAll("\\s+", " ").trim();

                party.setPartyName(fullName);

                // ✅ Unique ID
                if (respondent.has("uniqueId")) {
                    party.setUniqueId(respondent.path("uniqueId").asText());
                }

                // ✅ Extract phone numbers (if any)
                if (data.has("phonenumbers")) {
                    JsonNode phoneNumbers = data.path("phonenumbers").path("mobileNumber");
                    if (phoneNumbers.isArray() && phoneNumbers.size() > 0) {
                        List<String> mobileList = new ArrayList<>();
                        for (JsonNode phone : phoneNumbers) {
                            mobileList.add(phone.asText());
                        }
                        party.setMobileNumbers(mobileList);
                    }
                }

                // ✅ Extract email addresses (if any)
                if (data.has("emails")) {
                    JsonNode emails = data.path("emails").path("emailId");
                    if (emails.isArray() && emails.size() > 0) {
                        List<String> emailList = new ArrayList<>();
                        for (JsonNode email : emails) {
                            emailList.add(email.asText());
                        }
                        party.setEmails(emailList);
                    }
                }

                // ✅ Process address details
                if (data.has("addressDetails") && data.get("addressDetails").isArray()) {
                    List<AddressDetails> addresses = new ArrayList<>();
                    for (JsonNode addressNode : data.path("addressDetails")) {
                        if (addressNode.has("addressDetails")) {
                            JsonNode addrDetails = addressNode.path("addressDetails");
                            AddressDetails address = new AddressDetails();

                            address.setId(addressNode.path("id").asText(""));
                            address.setDoorNo(addrDetails.path("doorNo").asText(""));
                            address.setStreet(addrDetails.path("street").asText(""));
                            address.setLandmark(addrDetails.path("landmark").asText(""));
                            address.setLocality(addrDetails.path("locality").asText(""));
                            address.setCity(addrDetails.path("city").asText(""));
                            address.setDistrict(addrDetails.path("district").asText(""));
                            address.setState(addrDetails.path("state").asText(""));
                            address.setPincode(addrDetails.path("pincode").asText(""));
                            address.setCountry(addrDetails.path("country").asText(""));

                            addresses.add(address);
                        }
                    }
                    party.setAddress(addresses);
                }

                // ✅ Add party details
                partyDetailsList.add(party);
            }
        }
    }


    private void processWitnesses(List<WitnessDetails> witnessDetails, List<PartyDetails> partyDetailsList, Set<String> validUniqueIds) {
        if (witnessDetails == null || witnessDetails.isEmpty()) {
            return;
        }

        for (WitnessDetails witnessDetail : witnessDetails) {
            if (validUniqueIds.contains(witnessDetail.getUniqueId())) {
                PartyDetails party = new PartyDetails();
                party.setPartyType("Witness");
                if(witnessDetail.getPhoneNumbers()!=null)
                 party.setMobileNumbers(witnessDetail.getPhoneNumbers().getMobileNumber());
                if(witnessDetail.getEmails()!=null)
                 party.setEmails(witnessDetail.getEmails().getEmailId());
                String name = (witnessDetail.getFirstName()  != null ? witnessDetail.getFirstName()  : "") +
                        (witnessDetail.getMiddleName() != null ? " " + witnessDetail.getMiddleName() : "") +
                        (witnessDetail.getLastName() != null ? " " + witnessDetail.getLastName() : "");
                party.setPartyName(name);
                party.setWitnessDesignation(witnessDetail.getWitnessDesignation());
                party.setUniqueId(witnessDetail.getUniqueId());

                List<AddressDetails> addresses = new ArrayList<>();
                for (PartyAddress partyAddress : witnessDetail.getAddressDetails()) {
                    AddressDetails address = new AddressDetails();

                    address.setId(partyAddress.getId());
                    address.setCity(partyAddress.getAddressDetails().getCity());
                    address.setDistrict(partyAddress.getAddressDetails().getDistrict());
                    address.setLocality(partyAddress.getAddressDetails().getLocality());
                    address.setState(partyAddress.getAddressDetails().getState());
                    address.setPincode(partyAddress.getAddressDetails().getPincode());
                    address.setCoordinates(partyAddress.getAddressDetails().getCoordinates());
                    address.setTypeOfAddress(partyAddress.getAddressDetails().getTypeOfAddress());

                    addresses.add(address);
                }
                party.setAddress(addresses);
                partyDetailsList.add(party);
            }

        }
    }

    private void mapperOrderToOrderSearchResponse(OrderDetailsSearchResponse response, org.pucar.dristi.web.models.order.Order order) {
        if (order == null || response == null) {
            return;
        }
        response.setId(order.getId());
        response.setTenantId(order.getTenantId());
        response.setFilingNumber(order.getFilingNumber());
        response.setCourtId(order.getCourtId());
        response.setCnrNumber(order.getCnrNumber());
        response.setApplicationNumber(order.getApplicationNumber());
        response.setHearingNumber(order.getHearingNumber());
        response.setHearingType(order.getHearingType());
        response.setScheduledHearingNumber(order.getScheduledHearingNumber());
        response.setOrderNumber(order.getOrderNumber());
        response.setLinkedOrderNumber(order.getLinkedOrderNumber());
        response.setCreatedDate(order.getCreatedDate());
        response.setIssuedBy(order.getIssuedBy());
        response.setOrderType(order.getOrderType());
        response.setOrderCategory(order.getOrderCategory());
        response.setStatus(order.getStatus());
        response.setComments(order.getComments());
        response.setIsActive(order.getIsActive());
        response.setStatuteSection(order.getStatuteSection());
        response.setDocuments(order.getDocuments());
        response.setOrderDetails(order.getOrderDetails());
        response.setCompositeItems(order.getCompositeItems());
        response.setAttendance(order.getAttendance());
        response.setItemText(order.getItemText());
        response.setPurposeOfNextHearing(order.getPurposeOfNextHearing());
        response.setNextHearingDate(order.getNextHearingDate());
        response.setOrderTitle(order.getOrderTitle());
        response.setAdditionalDetails(order.getAdditionalDetails());
        response.setAuditDetails(order.getAuditDetails());
    }


    private JsonNode validateMobileNumber(String referenceId, String mobileNumber, String tenantId) {
        JsonNode pendingTask = pendingTaskUtil.callPendingTask(referenceId);

        JsonNode pendingTaskAdditionalDetails = null;
        if (pendingTask == null || !pendingTask.has("hits")) {
            throw new CustomException("NO_TASK_FOUND",
                    "No pending task found for referenceId: " + referenceId);
        }

        JsonNode hits = pendingTask.path("hits").path("hits");
        if (!hits.isArray() || hits.isEmpty()) {
            throw new CustomException("NO_TASK_FOUND",
                    "No pending task found for referenceId: " + referenceId);
        }

        for (JsonNode hit : hits) {
            JsonNode source = hit.path("_source").path("Data");

            // Step 1: Extract assignedTo UUIDs
            List<String> assignedUuids = new ArrayList<>();
            JsonNode assignedTo = source.path("assignedTo");
            if (assignedTo.isArray()) {
                for (JsonNode node : assignedTo) {
                    String uuid = node.path("uuid").asText(null);
                    if (uuid != null) assignedUuids.add(uuid);
                }
            }

            if (!assignedUuids.isEmpty()) {
                List<Individual> individuals = individualUtil.getIndividuals(RequestInfo.builder().userInfo(new User()).build(), assignedUuids, tenantId);

                // Step 4: Match mobile number
                boolean isValidMobileNumber = false;
                for (Individual ind : individuals) {
                    if (ind.getMobileNumber() != null &&
                            ind.getMobileNumber().equalsIgnoreCase(mobileNumber)) {
                        log.info("Mobile number matched for individual UUID: {}", ind.getUserUuid());
                        isValidMobileNumber = true;
                        pendingTaskAdditionalDetails = source.path("additionalDetails");
                    }
                }
                if (!isValidMobileNumber) {
                    throw new CustomException("INVALID_MOBILE",
                            "Provided mobile number does not match any assigned or litigant user for this referenceId");
                }
            }
            boolean isCompleted = source.path("isCompleted").asBoolean(false);
            if (isCompleted) {
                return null;
            }
        }
        return pendingTaskAdditionalDetails;
    }

    private RequestInfo createInternalRequestInfo() {
        org.egov.common.contract.request.User userInfo = new User();
        userInfo.setUuid(userService.internalMicroserviceRoleUuid);
        userInfo.setRoles(userService.internalMicroserviceRoles);
        userInfo.getRoles().add(Role.builder().code(BAIL_BOND_CREATOR)
                .name(BAIL_BOND_CREATOR)
                .tenantId(configuration.getEgovStateTenantId())
                .build());
        userInfo.setType("EMPLOYEE");
        userInfo.setTenantId(configuration.getEgovStateTenantId());
        return RequestInfo.builder().userInfo(userInfo).msgId(msgId).build();
    }

    private RequestInfo createInternalRequestInfoWithSystemUserType() {
        org.egov.common.contract.request.User userInfo = new User();
        userInfo.setUuid(userService.internalMicroserviceRoleUuid);
        userInfo.setRoles(userService.internalMicroserviceRoles);
        userInfo.setType("SYSTEM");
        userInfo.setTenantId(configuration.getEgovStateTenantId());
        return RequestInfo.builder().userInfo(userInfo).msgId(msgId).build();
    }

    public AddAddressResponse addAddress(AddAddressRequest addAddressRequest) {
        StringBuilder uri = new StringBuilder();
        uri.append(configuration.getCaseServiceHost()).append(configuration.getCaseServiceAddAddressEndpoint());

        Object response = serviceRequestRepository.fetchResult(uri, addAddressRequest);
        return objectMapper.convertValue(response, AddAddressResponse.class);
    }

}
