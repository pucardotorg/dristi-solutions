package org.pucar.dristi.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.extern.slf4j.Slf4j;
import org.egov.common.contract.response.ResponseInfo;
import org.egov.tracer.model.CustomException;
import org.pucar.dristi.config.Configuration;
import org.pucar.dristi.repository.ServiceRequestRepository;
import org.pucar.dristi.util.AdvocateUtil;
import org.pucar.dristi.util.DateUtil;
import org.pucar.dristi.util.InboxUtil;
import org.pucar.dristi.util.ResponseInfoFactory;
import org.pucar.dristi.web.models.*;
import org.pucar.dristi.web.models.inbox.InboxRequest;
import org.pucar.dristi.web.models.inbox.InboxSearchCriteria;
import org.pucar.dristi.web.models.inbox.OrderBy;
import org.pucar.dristi.web.models.inbox.ProcessInstanceSearchCriteria;
import org.springframework.stereotype.Service;

import java.util.Collections;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

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

    public OpenApiService(Configuration configuration, ServiceRequestRepository serviceRequestRepository, ObjectMapper objectMapper, DateUtil dateUtil, InboxUtil inboxUtil, AdvocateUtil advocateUtil, ResponseInfoFactory responseInfoFactory) {
        this.configuration = configuration;
        this.serviceRequestRepository = serviceRequestRepository;
        this.objectMapper = objectMapper;
        this.dateUtil = dateUtil;
        this.inboxUtil = inboxUtil;
        this.advocateUtil = advocateUtil;
        this.responseInfoFactory = responseInfoFactory;
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
                }
                else {
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
                    throw new CustomException(HEARING_SERVICE_EXCEPTION,"Multiple scheduled hearings found for the case");
                }
            }
        }
        else {
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
            log.info("Fetching landing page cases from ElasticSearch");
            throw new RuntimeException("Fetching from ElasticSearch is not yet implemented for landing page");
        } else {
            log.info("Fetching landing page cases from Case Service");

            InboxRequest inboxRequest = buildInboxRequestFromSearchCriteria(
                    tenantId,
                    request.getSearchCaseCriteria(),
                    request.getFilterCriteria(),
                    request.getOffset(),
                    request.getLimit(),
                    request.getSortOrder()
            );

            if (inboxRequest == null) {
                log.info("InboxRequest is null — returning empty response");
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
        Map<String, Object> moduleSearchCriteria = new HashMap<>();
        if(tenantId != null)
            moduleSearchCriteria.put("tenantId", tenantId);

        if (searchCaseCriteria != null && searchCaseCriteria.getSearchType() != null) {
            switch (searchCaseCriteria.getSearchType()) {
                case FILING_NUMBER:
                    FilingNumberCriteria filingNumberCriteria = searchCaseCriteria.getFilingNumberCriteria();
                    if (filingNumberCriteria == null ||
                            filingNumberCriteria.getCode() == null ||
                            filingNumberCriteria.getCaseNumber() == null ||
                            filingNumberCriteria.getYear() == null) {
                        return null;
                    }
                    moduleSearchCriteria.put("filingNumber", String.join("-", filingNumberCriteria.getCode(), filingNumberCriteria.getCaseNumber(), filingNumberCriteria.getYear()));
                    if (filingNumberCriteria.getCourtName() != null)
                        moduleSearchCriteria.put("courtName", filingNumberCriteria.getCourtName());
                    break;

                case CASE_NUMBER:
                    CaseNumberCriteria caseNumberCriteria = searchCaseCriteria.getCaseNumberCriteria();
                    if (caseNumberCriteria == null ||
                            caseNumberCriteria.getCaseType() == null ||
                            caseNumberCriteria.getCaseNumber() == null ||
                            caseNumberCriteria.getYear() == null) {
                        return null;
                    }
                    moduleSearchCriteria.put("caseNumber", String.join("/", caseNumberCriteria.getCaseType(), caseNumberCriteria.getCaseNumber(), caseNumberCriteria.getYear()));
                    if (caseNumberCriteria.getCourtName() != null)
                        moduleSearchCriteria.put("courtName", caseNumberCriteria.getCourtName());
                    break;

                case CNR_NUMBER:
                    CnrNumberCriteria cnrNumberCriteria = searchCaseCriteria.getCnrNumberCriteria();
                    if (cnrNumberCriteria == null || cnrNumberCriteria.getCnrNumber() == null) {
                        return null;
                    }
                    moduleSearchCriteria.put("cnrNumber", cnrNumberCriteria.getCnrNumber());
                    break;

                case ADVOCATE:
                    AdvocateCriteria advocateCriteria = searchCaseCriteria.getAdvocateCriteria();
                    if (advocateCriteria == null) {
                        return null;
                    }
                    if (advocateCriteria.getAdvocateSearchType() == AdvocateSearchType.BARCODE) {
                        BarCodeDetails barCodeDetails = advocateCriteria.getBarCodeDetails();
                        if (barCodeDetails == null ||
                                barCodeDetails.getStateCode() == null ||
                                barCodeDetails.getBarCode() == null ||
                                barCodeDetails.getYear() == null) {
                            return null;
                        }
                        String barCode = String.join("/", barCodeDetails.getStateCode(), barCodeDetails.getBarCode(), barCodeDetails.getYear());
                        List<Advocate> advocates = advocateUtil.fetchAdvocatesByBarRegistrationNumber(barCode);
                        if (advocates == null || advocates.isEmpty() || advocates.get(0).getId() == null) {
                            return null;
                        }
                        moduleSearchCriteria.put("advocateId", Collections.singletonList(advocates.get(0).getId()));
                    } else if (advocateCriteria.getAdvocateSearchType() == AdvocateSearchType.ADVOCATE_NAME) {
                        if (advocateCriteria.getAdvocateName() == null) {
                            return null;
                        }
                        moduleSearchCriteria.put("advocateName", Collections.singletonList(advocateCriteria.getAdvocateName()));
                    } else {
                        return null;
                    }
                    break;

                case LITIGANT:
                    LitigantCriteria litigantCriteria = searchCaseCriteria.getLitigantCriteria();
                    if (litigantCriteria == null || litigantCriteria.getLitigantName() == null) {
                        return null;
                    }
                    moduleSearchCriteria.put("litigantName", Collections.singletonList(litigantCriteria.getLitigantName()));
                    break;

                case ALL:
                    // No criteria to apply
                    break;
                default:
                    break;
            }
        }

        if (filterCriteria != null) {
            if (filterCriteria.getCourtName() != null)
                moduleSearchCriteria.put("courtName", filterCriteria.getCourtName());
            if (filterCriteria.getCaseType() != null)
                moduleSearchCriteria.put("caseType", filterCriteria.getCaseType());
            if (filterCriteria.getHearingDateFrom() != null)
                moduleSearchCriteria.put("hearingDateFrom", filterCriteria.getHearingDateFrom().toString());
            if (filterCriteria.getHearingDateTo() != null)
                moduleSearchCriteria.put("hearingDateTo", filterCriteria.getHearingDateTo().toString());
            if (filterCriteria.getCaseStage() != null)
                moduleSearchCriteria.put("caseStage", filterCriteria.getCaseStage());
            if (filterCriteria.getCaseStatus() != null)
                moduleSearchCriteria.put("caseStatus", filterCriteria.getCaseStatus());
            if (filterCriteria.getYearOfFiling() != null)
                moduleSearchCriteria.put("yearOfFiling", filterCriteria.getYearOfFiling());
        }

        InboxSearchCriteria inboxSearchCriteria = InboxSearchCriteria.builder()
                .tenantId(tenantId)
                .moduleSearchCriteria((HashMap<String, Object>) moduleSearchCriteria)
                .offset(offset)
                .limit(limit != null ? limit : 50)
                .sortOrder(sortOrder)
                .processSearchCriteria(ProcessInstanceSearchCriteria.builder()
                        .moduleName(OPENAPI_MODULE_NAME)
                        .businessService(Collections.singletonList(OPENAPI_BUSINESS_SERVICE))
                        .tenantId(tenantId)
                        .build())
                .build();

        return InboxRequest.builder().inbox(inboxSearchCriteria).build();
    }
}
