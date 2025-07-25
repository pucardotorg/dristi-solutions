package org.pucar.dristi.enrichment;


import com.fasterxml.jackson.databind.JsonNode;
import lombok.extern.slf4j.Slf4j;
import org.egov.common.contract.models.AuditDetails;
import org.egov.common.contract.request.RequestInfo;
import org.egov.common.contract.request.Role;
import org.egov.common.contract.request.User;
import org.egov.tracer.model.CustomException;
import org.pucar.dristi.config.Configuration;
import org.pucar.dristi.config.ServiceConstants;
import org.pucar.dristi.service.IndividualService;
import org.pucar.dristi.util.*;
import org.pucar.dristi.web.models.*;
import org.pucar.dristi.web.models.v2.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;

import java.util.*;
import java.util.stream.Collectors;

import static org.pucar.dristi.config.ServiceConstants.*;

@Component
@Slf4j
public class CaseRegistrationEnrichment {

    private IndividualService individualService;
    private AdvocateUtil advocateUtil;
    private IdgenUtil idgenUtil;
    private CaseUtil caseUtil;
    private Configuration config;
    private HrmsUtil hrmsUtil;
    private final EtreasuryUtil etreasuryUtil;

    @Autowired
    public CaseRegistrationEnrichment(IndividualService individualService, AdvocateUtil advocateUtil, IdgenUtil idgenUtil, CaseUtil caseUtil, Configuration config, EtreasuryUtil etreasuryUtil, HrmsUtil hrmsUtil) {
        this.individualService = individualService;
        this.advocateUtil = advocateUtil;
        this.idgenUtil = idgenUtil;
        this.caseUtil = caseUtil;
        this.config = config;
        this.hrmsUtil = hrmsUtil;
        this.etreasuryUtil = etreasuryUtil;
    }

    private static void enrichDocumentsOnCreate(Document document) {
        if (document.getId() == null) {
            document.setId(String.valueOf(UUID.randomUUID()));
            document.setDocumentUid(document.getId());
        }
    }

    public static void enrichRepresentativesOnCreateAndUpdate(CourtCase courtCase, AuditDetails auditDetails) {
        String courtCaseId = courtCase.getId().toString();
        if (courtCase.getRepresentatives() == null) {
            return;
        }
        List<AdvocateMapping> representativesListToCreate = courtCase.getRepresentatives().stream().filter(representative -> representative.getId() == null).toList();
        representativesListToCreate.forEach(advocateMapping -> {
            advocateMapping.setId(String.valueOf(UUID.randomUUID()));
            advocateMapping.setCaseId(courtCaseId);
            advocateMapping.setAuditDetails(auditDetails);
            if (advocateMapping.getDocuments() != null) {
                advocateMapping.getDocuments().forEach(CaseRegistrationEnrichment::enrichDocumentsOnCreate);
            }
            if (advocateMapping.getRepresenting() != null) {
                enrichRepresentingOnCreateAndUpdate(auditDetails, advocateMapping, courtCaseId);
            }
        });
        List<AdvocateMapping> representativesListToUpdate = courtCase.getRepresentatives().stream().filter(representative -> representative.getId() != null).toList();
        representativesListToUpdate.forEach(advocateMapping -> {
            advocateMapping.setAuditDetails(auditDetails);
            if (advocateMapping.getDocuments() != null) {
                advocateMapping.getDocuments().forEach(CaseRegistrationEnrichment::enrichDocumentsOnCreate);
            }
            if (advocateMapping.getRepresenting() != null) {
                enrichRepresentingOnCreateAndUpdate(auditDetails, advocateMapping, courtCaseId);
            }
        });
    }

    private static void enrichPoaPartiesOnCreateAndUpdate(POAHolder poaHolder, String courtCaseId) {
        List<PoaParty> representingListToCreate = poaHolder.getRepresentingLitigants().stream().filter(party -> party.getId() == null).toList();
        representingListToCreate.forEach(party -> {
            party.setId((UUID.randomUUID().toString()));
            party.setCaseId(courtCaseId);

            if (party.getDocuments() != null) {
                party.getDocuments().forEach(CaseRegistrationEnrichment::enrichDocumentsOnCreate);
            }
        });
        List<PoaParty> representingListToUpdate = poaHolder.getRepresentingLitigants().stream().filter(party -> party.getId() != null).toList();
        representingListToUpdate.forEach(party -> {
            if (party.getDocuments() != null) {
                party.getDocuments().forEach(CaseRegistrationEnrichment::enrichDocumentsOnCreate);
            }
        });

    }

    private static void enrichRepresentingOnCreateAndUpdate(AuditDetails auditDetails, AdvocateMapping advocateMapping, String courtCaseId) {
        List<Party> representingListToCreate = advocateMapping.getRepresenting().stream().filter(party -> party.getId() == null).toList();
        representingListToCreate.forEach(party -> {
            party.setId((UUID.randomUUID()));
            party.setCaseId(courtCaseId);
            party.setAuditDetails(auditDetails);
            if (party.getDocuments() != null) {
                party.getDocuments().forEach(CaseRegistrationEnrichment::enrichDocumentsOnCreate);
            }
        });
        List<Party> representingListToUpdate = advocateMapping.getRepresenting().stream().filter(party -> party.getId() != null).toList();
        representingListToUpdate.forEach(party -> {
            party.setAuditDetails(auditDetails);
            if (party.getDocuments() != null) {
                party.getDocuments().forEach(CaseRegistrationEnrichment::enrichDocumentsOnCreate);
            }
        });
    }

    public static void enrichLitigantsOnCreateAndUpdate(CourtCase courtCase, AuditDetails auditDetails) {
        if (courtCase.getLitigants() == null) {
            return;
        }
        String courtCaseId = courtCase.getId().toString();
        List<Party> litigantsListToCreate = courtCase.getLitigants().stream().filter(litigant -> litigant.getId() == null).toList();
        litigantsListToCreate.forEach(party -> {
            party.setId((UUID.randomUUID()));
            party.setCaseId(courtCaseId);
            party.setAuditDetails(auditDetails);
            if (party.getDocuments() != null) {
                party.getDocuments().forEach(CaseRegistrationEnrichment::enrichDocumentsOnCreate);
            }
        });
        List<Party> litigantsListToUpdate = courtCase.getLitigants().stream().filter(litigant -> litigant.getId() != null).toList();
        litigantsListToUpdate.forEach(party -> {
            party.setAuditDetails(auditDetails);
            if (party.getDocuments() != null) {
                party.getDocuments().forEach(CaseRegistrationEnrichment::enrichDocumentsOnCreate);
            }
        });
    }

    private static void enrichLinkedCaseOnCreateAndUpdate(CourtCase courtCase, AuditDetails auditDetails) {
        if (courtCase.getLinkedCases() == null) {
            return;
        }
        List<LinkedCase> linkedCasesListToCreate = courtCase.getLinkedCases().stream().filter(linkedCase -> linkedCase.getId() == null).toList();
        linkedCasesListToCreate.forEach(linkedCase -> {
            linkedCase.setId(UUID.randomUUID());
            linkedCase.setAuditdetails(auditDetails);
            if (linkedCase.getDocuments() != null) {
                linkedCase.getDocuments().forEach(CaseRegistrationEnrichment::enrichDocumentsOnCreate);
            }
        });
        List<LinkedCase> linkedCasesListToUpdate = courtCase.getLinkedCases().stream().filter(linkedCase -> linkedCase.getId() != null).toList();
        linkedCasesListToUpdate.forEach(linkedCase -> {
            linkedCase.setAuditdetails(auditDetails);
            if (linkedCase.getDocuments() != null) {
                linkedCase.getDocuments().forEach(CaseRegistrationEnrichment::enrichDocumentsOnCreate);
            }
        });
    }

    public void enrichCaseRegistrationOnCreate(CaseRequest caseRequest) {
        try {
            CourtCase courtCase = caseRequest.getCases();

            String tenantId = caseRequest.getCases().getTenantId();
            String idName = config.getCaseFilingConfig();
            String idFormat = config.getCaseFilingFormat();

            List<String> courtCaseRegistrationFillingNumberIdList = idgenUtil.getIdList(caseRequest.getRequestInfo(), tenantId, idName, idFormat, 1, true);
            log.info("Court Case Registration Filling Number cp Id List :: {}", courtCaseRegistrationFillingNumberIdList);
            AuditDetails auditDetails = AuditDetails.builder().createdBy(caseRequest.getRequestInfo().getUserInfo().getUuid()).createdTime(caseUtil.getCurrentTimeMil()).lastModifiedBy(caseRequest.getRequestInfo().getUserInfo().getUuid()).lastModifiedTime(caseUtil.getCurrentTimeMil()).build();
            courtCase.setAuditdetails(auditDetails);

            courtCase.setId(UUID.randomUUID());
            enrichCaseRegistrationUponCreateAndUpdate(courtCase, auditDetails);

            courtCase.setFilingNumber(courtCaseRegistrationFillingNumberIdList.get(0));


        } catch (Exception e) {
            log.error("Error enriching case application :: {}", e.toString());
            throw new CustomException(ENRICHMENT_EXCEPTION, e.getMessage());
        }
    }

    private String getCourtId(RequestInfo requestInfo) {

        return hrmsUtil.getCourtId(requestInfo);

    }

    private void enrichCaseRegistrationUponCreateAndUpdate(CourtCase courtCase, AuditDetails auditDetails) {
        enrichLinkedCaseOnCreateAndUpdate(courtCase, auditDetails);

        enrichStatuteAndSectionsOnCreateAndUpdate(courtCase, auditDetails);

        enrichLitigantsOnCreateAndUpdate(courtCase, auditDetails);

        enrichRepresentativesOnCreateAndUpdate(courtCase, auditDetails);

        enrichPoaHoldersOnCreateAndUpdate(courtCase, auditDetails);

//        enrichCaseRegistrationFillingDate(courtCase);

        if (courtCase.getDocuments() != null) {
            List<Document> documentsListToCreate = courtCase.getDocuments().stream().filter(document -> document.getId() == null).toList();
            documentsListToCreate.forEach(CaseRegistrationEnrichment::enrichDocumentsOnCreate);
        }
    }

    private void enrichPoaHoldersOnCreateAndUpdate(CourtCase courtCase, AuditDetails auditDetails) {

        if (courtCase.getPoaHolders() != null) {
            List<POAHolder> poaHolderListToCreate = courtCase.getPoaHolders().stream().filter(poaHolder -> poaHolder.getId() == null).toList();
            poaHolderListToCreate.forEach(poaHolder -> {
                poaHolder.setId(UUID.randomUUID().toString());
                poaHolder.setCaseId(courtCase.getId().toString());
                poaHolder.setAuditDetails(auditDetails);
                if (poaHolder.getDocuments() != null) {
                    poaHolder.getDocuments().forEach(CaseRegistrationEnrichment::enrichDocumentsOnCreate);
                }
                if (poaHolder.getRepresentingLitigants() != null) {
                    enrichPoaPartiesOnCreateAndUpdate(poaHolder, courtCase.getId().toString());
                }
            });
            List<POAHolder> poaHolderListToUpdate = courtCase.getPoaHolders().stream().filter(poaHolder -> poaHolder.getId() != null).toList();
            poaHolderListToUpdate.forEach(poaHolder -> {
                poaHolder.setAuditDetails(auditDetails);
                if (poaHolder.getDocuments() != null) {
                    poaHolder.getDocuments().forEach(CaseRegistrationEnrichment::enrichDocumentsOnCreate);
                }
                if (poaHolder.getRepresentingLitigants() != null) {
                    enrichPoaPartiesOnCreateAndUpdate(poaHolder, courtCase.getId().toString());
                }
            });
        }
    }

    public void enrichCaseRegistrationFillingDate(CourtCase courtCase) {
        courtCase.setFilingDate(caseUtil.getCurrentTimeMil());
    }

    private void enrichStatuteAndSectionsOnCreateAndUpdate(CourtCase courtCase, AuditDetails auditDetails) {
        if (courtCase.getStatutesAndSections() == null) {
            return;
        }
        List<StatuteSection> statutesAndSectionsListToCreate = courtCase.getStatutesAndSections().stream().filter(statuteSection -> statuteSection.getId() == null).toList();
        statutesAndSectionsListToCreate.forEach(statuteSection -> {
            statuteSection.setId(UUID.randomUUID());
            statuteSection.setStrSections(listToString(statuteSection.getSections()));
            statuteSection.setStrSubsections(listToString(statuteSection.getSubsections()));
            statuteSection.setAuditdetails(auditDetails);
        });
        List<StatuteSection> statutesAndSectionsListToUpdate = courtCase.getStatutesAndSections().stream().filter(statuteSection -> statuteSection.getId() != null).toList();

        statutesAndSectionsListToUpdate.forEach(statuteSection -> {
            statuteSection.setAuditdetails(auditDetails);
            statuteSection.setStrSections(listToString(statuteSection.getSections()));
            statuteSection.setStrSubsections(listToString(statuteSection.getSubsections()));
        });
    }

    public String listToString(List<String> list) {
        StringBuilder stB = new StringBuilder();
        boolean isFirst = true;
        for (String doc : list) {
            if (isFirst) {
                isFirst = false;
                stB.append(doc);
            } else {
                stB.append(",").append(doc);
            }
        }

        return stB.toString();
    }

    public void enrichCaseApplicationUponUpdate(CaseRequest caseRequest, List<CourtCase> existingCourtCaseList) {
        try {
            // Enrich lastModifiedTime and lastModifiedBy in case of update
            CourtCase courtCase = caseRequest.getCases();
            AuditDetails auditDetails = courtCase.getAuditdetails();
            auditDetails.setLastModifiedTime(caseUtil.getCurrentTimeMil());
            auditDetails.setLastModifiedBy(caseRequest.getRequestInfo().getUserInfo().getUuid());
            enrichCaseRegistrationUponCreateAndUpdate(courtCase, auditDetails);
            enrichDocument(caseRequest, existingCourtCaseList);

        } catch (Exception e) {
            log.error("Error enriching case application upon update :: {}", e.toString());
            throw new CustomException(ENRICHMENT_EXCEPTION, "Error in case enrichment service during case update process: " + e.getMessage());
        }
    }

    private void enrichDocument(CaseRequest caseRequest, List<CourtCase> existingCourtCaseList) {
        // Extract IDs from documents in the caseRequest
        List<String> documentIds = Optional.ofNullable(caseRequest.getCases().getDocuments())
                .orElse(Collections.emptyList())
                .stream()
                .map(Document::getId)
                .filter(Objects::nonNull)
                .toList();

        // Iterate through existing documents and compare IDs
        if (existingCourtCaseList.get(0).getDocuments() != null) {
            existingCourtCaseList.get(0).getDocuments().forEach(existingDocument -> {
                log.info("Checking for existing document Id :: {}", existingDocument.getId());

                // If documentIds is empty or the ID is not in the list, deactivate the document
                if (documentIds.isEmpty() || !documentIds.contains(existingDocument.getId())) {
                    log.info("Setting isActive false for document Id :: {}", existingDocument.getId());
                    existingDocument.setIsActive(false);

                    if (caseRequest.getCases().getDocuments() == null) {
                        caseRequest.getCases().setDocuments(new ArrayList<>());
                    }
                    caseRequest.getCases().getDocuments().add(existingDocument);
                }
            });
        }
    }

    public void enrichCourtCaseNumber(CaseRequest caseRequest) {
        try {
            String tenantId = caseRequest.getCases().getCourtId();
            String idName = config.getCourtCaseConfig();
            String idFormat = config.getCourtCaseSTFormat();
            List<String> courtCaseRegistrationCaseNumberIdList = idgenUtil.getIdList(caseRequest.getRequestInfo(), tenantId, idName, idFormat, 1, false);
            caseRequest.getCases().setCourtCaseNumber(courtCaseRegistrationCaseNumberIdList.get(0));
        } catch (Exception e) {
            log.error("Error enriching case number and court case number: {}", e.toString());
            throw new CustomException(ENRICHMENT_EXCEPTION, "Error in case enrichment service while enriching case number and court case number: " + e.getMessage());
        }
    }

    public void enrichCNRNumber(CaseRequest caseRequest) {
        try {
            String tenantId = caseRequest.getCases().getCourtId();
            String idName = config.getCaseCNRConfig();
            String idFormat = config.getCaseCNRFormat();
            List<String> cnrNumberIdList = idgenUtil.getIdList(caseRequest.getRequestInfo(), tenantId, idName, idFormat, 1, true);
            caseRequest.getCases().setCnrNumber(cnrNumberIdList.get(0));
        } catch (Exception e) {
            log.error("Error enriching cnr number: {}", e.toString());
            throw new CustomException(ENRICHMENT_EXCEPTION, "Error in case enrichment service while enriching cnr number: " + e.getMessage());
        }
    }

    public void enrichCMPNumber(CaseRequest caseRequest) {
        try {
            String tenantId = caseRequest.getCases().getCourtId();
            String idName = config.getCmpConfig();
            String idFormat = config.getCmpFormat();
            List<String> cmpNumberIdList = idgenUtil.getIdList(caseRequest.getRequestInfo(), tenantId, idName, idFormat, 1, false);
            caseRequest.getCases().setCmpNumber(cmpNumberIdList.get(0));
        } catch (Exception e) {
            log.error("Error enriching cnr number: {}", e.toString());
            throw new CustomException(ENRICHMENT_EXCEPTION, "Error in case enrichment service while enriching cnr number: " + e.getMessage());
        }
    }

    public void enrichAccessCode(CaseRequest caseRequest) {
        try {
            if (caseRequest.getCases().getAccessCode() == null) {
                String accessCode = CaseUtil.generateAccessCode(ACCESSCODE_LENGTH);
                caseRequest.getCases().setAccessCode(accessCode);
            }
        } catch (Exception e) {
            log.error("Error enriching access code: {}", e.toString());
            throw new CustomException(ENRICHMENT_EXCEPTION, "Error in case enrichment service while enriching access code: " + e.getMessage());
        }
    }

    public void enrichRegistrationDate(CaseRequest caseRequest) {
        try {
            caseRequest.getCases().setRegistrationDate(caseUtil.getCurrentTimeMil());
        } catch (Exception e) {
            log.error("Error enriching registration date: {}", e.toString());
            throw new CustomException(ENRICHMENT_EXCEPTION, "Error in case enrichment service while enriching registration date: " + e.getMessage());
        }
    }

    public void enrichCaseSearchRequest(CaseSearchRequest caseSearchRequests) {
        RequestInfo requestInfo = caseSearchRequests.getRequestInfo();
        User userInfo = requestInfo.getUserInfo();
        String type = userInfo.getType();
        List<Role> roles = userInfo.getRoles();

        switch (type.toLowerCase()) {
            case "employee" -> enrichEmployeeUserId(roles, caseSearchRequests);
            case "citizen" -> enrichCitizenUserId(roles, caseSearchRequests);
            default -> throw new IllegalArgumentException("Unknown user type: " + type);
        }
    }

    private void enrichEmployeeUserId(List<Role> roles, CaseSearchRequest searchRequest) {

        boolean isJudge = roles.stream()
                .anyMatch(role -> JUDGE_ROLE.equals(role.getCode()));

        boolean isBenchClerk = roles.stream()
                .anyMatch(role -> BENCH_CLERK.equals(role.getCode()));

        // TO DO- Need to enhance this after HRMS integration
        if (isJudge || isBenchClerk) {
            for (CaseCriteria element : searchRequest.getCriteria()) {
                String courtId = getCourtId(searchRequest.getRequestInfo());
                element.setCourtId(courtId);
            }

        }
        else {
            for (CaseCriteria element : searchRequest.getCriteria()) {
                element.setCourtId(null);
            }
        }

    }

    private void enrichCitizenUserId(List<Role> roles, CaseSearchRequest searchRequest) {

        RequestInfo requestInfo = searchRequest.getRequestInfo();

        String individualId = individualService.getIndividualId(requestInfo);

        boolean isAdvocate = roles.stream()
                .anyMatch(role -> ADVOCATE_ROLE.equals(role.getCode()));

        if (isAdvocate) {

            List<Advocate> advocates = advocateUtil.fetchAdvocatesByIndividualId(requestInfo, individualId);

            if (!advocates.isEmpty()) {
                String advocateId = advocates.get(0).getId().toString();
                for (CaseCriteria element : searchRequest.getCriteria()) {
                    element.setAdvocateId(advocateId);
                }
            }

        } else {
            for (CaseCriteria element : searchRequest.getCriteria()) {
                element.setLitigantId(individualId);
            }
        }

        for (CaseCriteria element : searchRequest.getCriteria()) {
            element.setPoaHolderIndividualId(individualId);
        }

    }

    public void enrichCaseSearchRequest(CaseSearchRequestV2 caseSearchRequest) {
        RequestInfo requestInfo = caseSearchRequest.getRequestInfo();
        User userInfo = requestInfo.getUserInfo();
        String type = userInfo.getType();
        List<Role> roles = userInfo.getRoles();

        switch (type.toLowerCase()) {
            case "employee" -> enrichEmployeeUserId(roles, caseSearchRequest.getCriteria(), requestInfo);
            case "citizen" -> enrichCitizenUserId(roles, caseSearchRequest.getCriteria(),requestInfo);
            default -> throw new IllegalArgumentException("Unknown user type: " + type);
        }
    }

    private void enrichEmployeeUserId(List<Role> roles, CaseSearchCriteriaV2 criteria, RequestInfo requestInfo) {

        boolean isJudge = roles.stream()
                .anyMatch(role -> JUDGE_ROLE.equals(role.getCode()));

        boolean isBenchClerk = roles.stream()
                .anyMatch(role -> BENCH_CLERK.equals(role.getCode()));

        // TO DO- Need to enhance this after HRMS integration
        if (isJudge || isBenchClerk) {
            String courtId = getCourtId(requestInfo);
            criteria.setCourtId(courtId);
        }else {
            criteria.setCourtId(null);
        }

    }

    private void enrichCitizenUserId(List<Role> roles, CaseSearchCriteriaV2 criteria,RequestInfo requestInfo) {

        String individualId = individualService.getIndividualId(requestInfo);

        boolean isAdvocate = roles.stream()
                .anyMatch(role -> ADVOCATE_ROLE.equals(role.getCode()));

        if (isAdvocate) {

            List<Advocate> advocates = advocateUtil.fetchAdvocatesByIndividualId(requestInfo, individualId);

            if (!advocates.isEmpty()) {
                String advocateId = advocates.get(0).getId().toString();
                criteria.setAdvocateId(advocateId);
            }

        } else {
            criteria.setLitigantId(individualId);
        }

        criteria.setPoaHolderIndividualId(individualId);

    }

    public void enrichCaseSearchRequest(CaseSummaryListRequest caseListRequest) {
        RequestInfo requestInfo = caseListRequest.getRequestInfo();
        User userInfo = requestInfo.getUserInfo();
        String type = userInfo.getType();
        List<Role> roles = userInfo.getRoles();

        switch (type.toLowerCase()) {
            case "employee" -> enrichEmployeeUserId(roles, caseListRequest.getCriteria(), requestInfo);
            case "citizen" -> enrichCitizenUserId(roles, caseListRequest.getCriteria(),requestInfo);
            default -> throw new IllegalArgumentException("Unknown user type: " + type);
        }
    }

    private void enrichEmployeeUserId(List<Role> roles, CaseSummaryListCriteria caseSummaryListCriteria, RequestInfo requestInfo) {

        boolean isJudge = roles.stream()
                .anyMatch(role -> JUDGE_ROLE.equals(role.getCode()));

        boolean isBenchClerk = roles.stream()
                .anyMatch(role -> BENCH_CLERK.equals(role.getCode()));

        // TO DO- Need to enhance this after HRMS integration
        if (isJudge || isBenchClerk) {
            String courtId = getCourtId(requestInfo);
            caseSummaryListCriteria.setCourtId(courtId);
        }else {
            caseSummaryListCriteria.setCourtId(null);
        }

    }

    private void enrichCitizenUserId(List<Role> roles, CaseSummaryListCriteria caseSummaryListCriteria, RequestInfo requestInfo) {

        String individualId = individualService.getIndividualId(requestInfo);

        boolean isAdvocate = roles.stream()
                .anyMatch(role -> ADVOCATE_ROLE.equals(role.getCode()));

        if (isAdvocate) {

            List<Advocate> advocates = advocateUtil.fetchAdvocatesByIndividualId(requestInfo, individualId);

            if (!advocates.isEmpty()) {
                String advocateId = advocates.get(0).getId().toString();
                caseSummaryListCriteria.setAdvocateId(advocateId);
            }

        } else {
            caseSummaryListCriteria.setLitigantId(individualId);
        }

        caseSummaryListCriteria.setPoaHolderIndividualId(individualId);

    }

    public Document enrichCasePaymentReceipt(CaseRequest caseRequest, String id, String consumerCode){
        try {
            log.info("Enriching payment receipt for case with id: {}", id);
            JsonNode paymentReceipt = etreasuryUtil.getPaymentReceipt(caseRequest.getRequestInfo(), id);
            Document paymentReceiptDocument = Document.builder()
                    .fileStore(paymentReceipt.get("Document").get("fileStore").textValue())
                    .documentType(PAYMENT_RECEIPT)
                    .isActive(true)
                    .additionalDetails(getAdditionalDetails(consumerCode))
                    .build();
            enrichDocumentsOnCreate(paymentReceiptDocument);
            caseRequest.getCases().getDocuments().add(paymentReceiptDocument);
            return paymentReceiptDocument;
        } catch (Exception e) {
            log.error("Error enriching payment receipt: {}", e.toString());
            throw new CustomException(ENRICHMENT_EXCEPTION, "Error in case enrichment service while enriching payment receipt: " + e.getMessage());
        }
    }

    private Object getAdditionalDetails(String consumerCode) {
        Map<String, Object> additionalDetails = new HashMap<>();
        additionalDetails.put("consumerCode", consumerCode);
        return additionalDetails;
    }
}
