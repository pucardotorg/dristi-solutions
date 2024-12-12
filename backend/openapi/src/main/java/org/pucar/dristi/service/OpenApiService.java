package org.pucar.dristi.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.extern.slf4j.Slf4j;
import org.pucar.dristi.config.Configuration;
import org.pucar.dristi.repository.ServiceRequestRepository;
import org.pucar.dristi.util.DateUtil;
import org.pucar.dristi.web.models.*;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@Slf4j
public class OpenApiService {

    private final Configuration configuration;

    private final ServiceRequestRepository serviceRequestRepository;

    private final ObjectMapper objectMapper;

    private final DateUtil dateUtil;

    public OpenApiService(Configuration configuration, ServiceRequestRepository serviceRequestRepository, ObjectMapper objectMapper, DateUtil dateUtil) {
        this.configuration = configuration;
        this.serviceRequestRepository = serviceRequestRepository;
        this.objectMapper = objectMapper;
        this.dateUtil = dateUtil;
    }

    public CaseSummaryResponse getCaseByCnrNumber(String tenantId, String cnrNumber) {
        if (configuration.getIsElasticSearchEnabled()) {
            log.info("Fetching case summary from elastic search");
            throw new RuntimeException("Elastic search is not enabled for case summary");
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
            throw new RuntimeException("Elastic search is not enabled for case list");
        } else {
            log.info("Fetching cases from Case Service");
            StringBuilder uri = new StringBuilder(configuration.getCaseServiceHost()).append(configuration.getCaseServiceSearchByCaseTypeEndpoint());
            Pagination pagination = Pagination.builder().offSet(Double.valueOf(offset)).limit(Double.valueOf(limit)).build();
            if (sort != null) {
                pagination.setSortBy(sort);
                List<String> sortList = List.of(sort.split(","));
                pagination.setSortBy(sortList.get(0));
                pagination.setOrder(Order.fromValue(sortList.get(1)));
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
            throw new RuntimeException("Elastic search is not enabled for case summary");
        } else {
            log.info("Fetching cases from Case Service");
            StringBuilder uri = new StringBuilder(configuration.getCaseServiceHost()).append(configuration.getCaseServiceSearchByCaseNumberEndpoint());
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
                    .filter(hearing -> hearing.getStatus() != null && hearing.getStatus().equalsIgnoreCase("Scheduled")).toList();
            if (!hearings.isEmpty()) {
                if (hearings.size() == 1) {
                    return hearings.get(0).getStartTime();
                } else {
                    throw new RuntimeException("Multiple scheduled hearings found for the case");
                }
            }
        }
        return null;
    }
}
