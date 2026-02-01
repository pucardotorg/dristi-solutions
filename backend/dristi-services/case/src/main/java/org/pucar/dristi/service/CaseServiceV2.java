package org.pucar.dristi.service;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.extern.slf4j.Slf4j;
import org.egov.common.contract.models.AuditDetails;
import org.egov.common.contract.request.RequestInfo;
import org.egov.tracer.model.CustomException;
import org.pucar.dristi.config.Configuration;
import org.pucar.dristi.enrichment.CaseRegistrationEnrichment;
import org.pucar.dristi.repository.CaseRepositoryV2;
import org.pucar.dristi.util.*;
import org.pucar.dristi.web.models.*;
import org.pucar.dristi.web.models.v2.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

import static org.pucar.dristi.config.ServiceConstants.SEARCH_CASE_ERR;


@Service
@Slf4j
public class CaseServiceV2 {

    private final CaseRegistrationEnrichment enrichmentUtil;
    private final CaseRepositoryV2 caseRepository;
    private final Configuration config;
    private final EncryptionDecryptionUtil encryptionDecryptionUtil;
    private final ObjectMapper objectMapper;
    private final CacheService cacheService;

    @Autowired
    public CaseServiceV2(CaseRegistrationEnrichment enrichmentUtil,
                         CaseRepositoryV2 caseRepository,
                         Configuration config,
                         EncryptionDecryptionUtil encryptionDecryptionUtil,
                         ObjectMapper objectMapper, CacheService cacheService) {
        this.enrichmentUtil = enrichmentUtil;
        this.caseRepository = caseRepository;
        this.config = config;
        this.encryptionDecryptionUtil = encryptionDecryptionUtil;
        this.objectMapper = objectMapper;
        this.cacheService = cacheService;
    }

    public CourtCase searchCases(CaseSearchRequestV2 caseSearchRequests) {

        try {
            enrichmentUtil.enrichCaseSearchRequest(caseSearchRequests);

            CaseSearchCriteriaV2 criteria = caseSearchRequests.getCriteria();

            CourtCase courtCase = null;
            if (criteria.getCaseId() != null) {
                log.info("Searching in redis :: {}", criteria.getCaseId());
                courtCase = searchRedisCache(caseSearchRequests.getRequestInfo(), criteria.getCaseId());

                if(courtCase!=null) {
                    log.info("CourtCase found in Redis cache for caseId: {}", criteria.getCaseId());

                    validateIfUserPartOfCase(criteria, courtCase);
                    return encryptionDecryptionUtil.decryptObject(courtCase, config.getCaseDecryptSelf(), CourtCase.class, caseSearchRequests.getRequestInfo());
                } else {
                    log.debug("CourtCase not found in Redis cache for caseId: {}", criteria.getCaseId());
                }
            }

            log.info("Searching case in DB");
            courtCase = caseRepository.getCases(criteria, caseSearchRequests.getRequestInfo());
            if(courtCase==null){
                log.info("Case doesn't exist");
                return null;
            }
            saveInRedisCache(courtCase, caseSearchRequests.getRequestInfo());

            CourtCase decryptedCourtCases = encryptionDecryptionUtil.decryptObject(courtCase, config.getCaseDecryptSelf(), CourtCase.class, caseSearchRequests.getRequestInfo());
            enrichAdvocateJoinedStatus(decryptedCourtCases, criteria.getAdvocateId());

            return decryptedCourtCases;

        } catch (CustomException e) {
            throw e;
        } catch (Exception e) {
            log.error("Error while fetching to search results :: {}", e.toString());
            throw new CustomException(SEARCH_CASE_ERR, e.getMessage());
        }
    }

    private void validateIfUserPartOfCase(CaseSearchCriteriaV2 criteria, CourtCase courtCase) {
        boolean isPoaPresent = false;

        if (criteria.getCourtId() != null && !criteria.getCourtId().isEmpty()) {
            if(courtCase.getCourtId() == null || !(criteria.getCourtId().equalsIgnoreCase(courtCase.getCourtId()))){
                log.debug("User not eligible for to view the case, caseId {}", criteria.getCaseId());
                throw new CustomException(SEARCH_CASE_ERR, "User not eligible for to view this case");
            }
        }

        if (criteria.getPoaHolderIndividualId() != null && !criteria.getPoaHolderIndividualId().isEmpty()) {
             isPoaPresent = courtCase.getPoaHolders() != null &&
                    courtCase.getPoaHolders().stream()
                            .anyMatch(poa -> criteria.getPoaHolderIndividualId().equals(poa.getIndividualId()));
        }

        if (criteria.getAdvocateId() != null && !criteria.getAdvocateId().isEmpty()) {
            boolean isAdvocatePresent = courtCase.getRepresentatives() != null &&
                    courtCase.getRepresentatives().stream()
                            .anyMatch(rep -> criteria.getAdvocateId().equals(rep.getAdvocateId()));

            if(!isPoaPresent && !isAdvocatePresent){
                log.debug("Advocate is not part of the case for caseId {}", criteria.getCaseId());
                throw new CustomException(SEARCH_CASE_ERR, "Advocate is not part of the case");
            }
        }

        else if (criteria.getLitigantId() != null && !criteria.getLitigantId().isEmpty()) {
           boolean isLitigantPresent = courtCase.getLitigants() != null &&
                    courtCase.getLitigants().stream()
                            .anyMatch(l -> criteria.getLitigantId().equals(l.getIndividualId()));

            if(!isPoaPresent && !isLitigantPresent){
                log.debug("Litigant is not part of the case for caseId {}", criteria.getCaseId());
                throw new CustomException(SEARCH_CASE_ERR, "Litigant is not part of the case");
            }
        }
    }

    public List<CaseSummaryList> searchCasesList(CaseSummaryListRequest caseListRequest) {

        try {
            enrichmentUtil.enrichCaseSearchRequest(caseListRequest);

            List<CaseSummaryList> caseSummaryLists =  caseRepository.getCaseList(caseListRequest);
            caseSummaryLists.forEach(caseSummaryList -> {
                enrichAdvocateJoinedStatus(caseSummaryList, caseListRequest.getCriteria().getAdvocateId());
                caseSummaryList.setPendingAdvocateRequests(null);
            });
            return caseSummaryLists;
        } catch (CustomException e) {
            // Return empty list for clerk access issues
            if ("CLERK_ACCESS_DENIED".equals(e.getCode()) || 
                "CLERK_MEMBER_NOT_FOUND".equals(e.getCode()) || 
                "CLERK_NOT_MEMBER".equals(e.getCode())) {
                log.info("Clerk access denied: {}", e.getMessage());
                return new ArrayList<>();
            }
            throw e;
        }
    }

    private void enrichAdvocateJoinedStatus(CaseSummaryList caseSummary, String advocateId) {
        if (advocateId != null && caseSummary.getPendingAdvocateRequests() != null) {
            Optional<PendingAdvocateRequest> foundPendingAdvocateRequest = caseSummary.getPendingAdvocateRequests().stream().filter(pendingAdvocateRequest -> pendingAdvocateRequest.getAdvocateId().equalsIgnoreCase(advocateId)).findFirst();
            foundPendingAdvocateRequest.ifPresentOrElse(
                    pendingAdvocateRequest -> caseSummary.setAdvocateStatus(pendingAdvocateRequest.getStatus()),
                    () -> caseSummary.setAdvocateStatus("JOINED")
            );
        }
    }

    public List<CaseSummarySearch> searchCasesSummary(CaseSummarySearchRequest caseSummarySearchRequest) {
        try {
            List<CaseSummarySearch> caseSummarySearchList = caseRepository.getCaseSummary(caseSummarySearchRequest);

            caseSummarySearchList.forEach(caseSummarySearch -> {
                CourtCase courtCaseEncryptedAdditionalDetails = new CourtCase();
                courtCaseEncryptedAdditionalDetails.setAdditionalDetails(caseSummarySearch.getAdditionalDetails());
                courtCaseEncryptedAdditionalDetails.setAuditdetails(AuditDetails.builder().createdBy(caseSummarySearch.getCreatedBy()).build());
                CourtCase courtCaseDecryptedAdditionalDetails = encryptionDecryptionUtil.decryptObject(courtCaseEncryptedAdditionalDetails, config.getCaseDecryptSelf(), CourtCase.class, caseSummarySearchRequest.getRequestInfo());
                caseSummarySearch.setAdditionalDetails(courtCaseDecryptedAdditionalDetails.getAdditionalDetails());
            });
            return caseSummarySearchList;

        } catch (CustomException e) {
            throw e;
        } catch (Exception e) {
            log.error("Error while fetching to case summary search :: {}", e.toString());
            throw new CustomException(SEARCH_CASE_ERR, e.getMessage());
        }
    }

    public CourtCase searchRedisCache(RequestInfo requestInfo, String caseId) {
        try {
            Object value = cacheService.findById(getRedisKey(requestInfo, caseId));
            log.info("Redis data received :: {}", value);
            if (value != null) {
                String caseObject = objectMapper.writeValueAsString(value);
                return objectMapper.readValue(caseObject, CourtCase.class);
            } else {
                return null;
            }
        } catch (JsonProcessingException e) {
            log.error("Error occurred while searching case in redis cache :: {}", e.toString());
            throw new CustomException(SEARCH_CASE_ERR, e.getMessage());
        }
    }

    private void enrichAdvocateJoinedStatus(CourtCase courtCase, String advocateId) {
        if (advocateId != null && courtCase.getPendingAdvocateRequests() != null) {
            Optional<PendingAdvocateRequest> foundPendingAdvocateRequest = courtCase.getPendingAdvocateRequests().stream().filter(pendingAdvocateRequest -> pendingAdvocateRequest.getAdvocateId().equalsIgnoreCase(advocateId)).findFirst();
            foundPendingAdvocateRequest.ifPresentOrElse(
                    pendingAdvocateRequest -> courtCase.setAdvocateStatus(pendingAdvocateRequest.getStatus()),
                    () -> courtCase.setAdvocateStatus("JOINED")
            );
        }
    }

    private String getRedisKey(RequestInfo requestInfo, String caseId) {
        return requestInfo.getUserInfo().getTenantId() + ":" + caseId;
    }

    public void saveInRedisCache(CourtCase courtCase, RequestInfo requestInfo) {
        cacheService.save(requestInfo.getUserInfo().getTenantId() + ":" + courtCase.getId().toString(), courtCase);
    }
}
