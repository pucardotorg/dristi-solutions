package org.pucar.dristi.enrichment;


import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.extern.slf4j.Slf4j;
import org.egov.common.contract.models.AuditDetails;
import org.egov.common.contract.request.RequestInfo;
import org.egov.common.contract.request.Role;
import org.egov.common.contract.request.User;
import org.egov.tracer.model.CustomException;
import org.pucar.dristi.config.Configuration;
import org.pucar.dristi.repository.CaseRepositoryV2;
import org.pucar.dristi.service.IndividualService;
import org.pucar.dristi.util.*;
import org.pucar.dristi.web.models.*;
import org.pucar.dristi.web.models.advocateoffice.OfficeMember;
import org.pucar.dristi.web.models.enums.MemberType;
import org.pucar.dristi.web.models.v2.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;

import java.time.LocalDate;
import java.time.ZoneId;
import java.util.*;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

import static org.pucar.dristi.config.ServiceConstants.*;

@Component
@Slf4j
public class CaseRegistrationEnrichment {

    private IndividualService individualService;
    private AdvocateUtil advocateUtil;
    private AdvocateOfficeUtil advocateOfficeUtil;
    private IdgenUtil idgenUtil;
    private CaseUtil caseUtil;
    private Configuration config;
    private HrmsUtil hrmsUtil;
    private final EtreasuryUtil etreasuryUtil;
    private final ObjectMapper objectMapper;
    private final CaseRepositoryV2 caseRepositoryV2;

    @Autowired
    public CaseRegistrationEnrichment(IndividualService individualService, AdvocateUtil advocateUtil, 
                                      AdvocateOfficeUtil advocateOfficeUtil, IdgenUtil idgenUtil, 
                                      CaseUtil caseUtil, Configuration config, EtreasuryUtil etreasuryUtil, HrmsUtil hrmsUtil, ObjectMapper objectMapper, CaseRepositoryV2 caseRepositoryV2) {
        this.individualService = individualService;
        this.advocateUtil = advocateUtil;
        this.advocateOfficeUtil = advocateOfficeUtil;
        this.idgenUtil = idgenUtil;
        this.caseUtil = caseUtil;
        this.config = config;
        this.hrmsUtil = hrmsUtil;
        this.etreasuryUtil = etreasuryUtil;
        this.objectMapper = objectMapper;
        this.caseRepositoryV2 = caseRepositoryV2;
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

            // Enrich advocate office case members
            enrichAdvocateOffices(caseRequest, auditDetails);

        } catch (Exception e) {
            log.error("Error enriching case application :: {}", e.toString());
            throw new CustomException(ENRICHMENT_EXCEPTION, e.getMessage());
        }
    }

    private String getCourtId(RequestInfo requestInfo) {

        return hrmsUtil.getCourtId(requestInfo);

    }

    /**
     * Enriches advocate office entries for a case.
     * This populates the advocateOffices field in CourtCase for persistence to dristi_advocate_office_case_member table.
     */
    public void enrichAdvocateOffices(CaseRequest caseRequest, AuditDetails auditDetails) {
        CourtCase courtCase = caseRequest.getCases();
        RequestInfo requestInfo = caseRequest.getRequestInfo();
        
        if (courtCase.getRepresentatives() == null || courtCase.getRepresentatives().isEmpty()) {
            return;
        }

        String tenantId = courtCase.getTenantId() != null ? courtCase.getTenantId() : config.getTenantId();
        String caseId = courtCase.getId().toString();

        List<AdvocateOffice> advocateOffices = new ArrayList<>();

        for (AdvocateMapping rep : courtCase.getRepresentatives()) {
            if (rep.getAdvocateId() == null) {
                continue;
            }

            String advocateId = rep.getAdvocateId();

            // Check if advocate is active - if not, office members should also be inactive
            Boolean isAdvocateActive = rep.getIsActive() != null ? rep.getIsActive() : true;

            List<AdvocateOfficeMember> advocates = new ArrayList<>();
            List<AdvocateOfficeMember> clerks = new ArrayList<>();

            // Get all active members of the advocate's office
            List<OfficeMember> officeMembers = advocateOfficeUtil.getActiveMembersOfAdvocateOffice(
                    requestInfo, tenantId, UUID.fromString(advocateId));

            if (officeMembers.isEmpty()) {
                log.info("No active members found for advocate: {}", advocateId);
                continue;
            }

            for (OfficeMember officeMember : officeMembers) {
                AdvocateOfficeMember member = AdvocateOfficeMember.builder()
                        .id(UUID.randomUUID().toString())
                        .tenantId(tenantId)
                        .caseId(caseId)
                        .memberId(officeMember.getMemberId().toString())
                        .memberUserUuid(officeMember.getMemberUserUuid().toString())
                        .memberType(officeMember.getMemberType())
                        .memberName(officeMember.getMemberName())
                        .isActive(isAdvocateActive)
                        .auditDetails(auditDetails)
                        .build();

                // Separate advocates and clerks based on memberType
                if (officeMember.getMemberType() == MemberType.ADVOCATE) {
                    advocates.add(member);
                } else if (officeMember.getMemberType() == MemberType.ADVOCATE_CLERK) {
                    clerks.add(member);
                }
            }

            AdvocateOffice advocateOffice = AdvocateOffice.builder()
                    .officeAdvocateId(advocateId)
                    .officeAdvocateName(officeMembers.get(0).getOfficeAdvocateName())
                    .officeAdvocateUserUuid(officeMembers.get(0).getOfficeAdvocateUserUuid().toString())
                    .advocates(advocates)
                    .clerks(clerks)
                    .build();

            advocateOffices.add(advocateOffice);
        }

        courtCase.setAdvocateOffices(advocateOffices);
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

    public void enrichStatuteAndSectionsOnCreateAndUpdate(CourtCase courtCase, AuditDetails auditDetails) {
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
            String year = getYearForEnrichingCourtCaseNumber(caseRequest);
            String tenantId = caseRequest.getCases().getCourtId() + year;
            String idName = config.getCourtCaseConfig();
            String idFormat = config.getCourtCaseSTFormat();
            List<String> courtCaseRegistrationCaseNumberIdList = idgenUtil.getIdList(caseRequest.getRequestInfo(), tenantId, idName, idFormat, 1, false);
            String courtCaseNumber = courtCaseRegistrationCaseNumberIdList.get(0);
            courtCaseNumber = courtCaseNumber + "/" + year;
            caseRequest.getCases().setCourtCaseNumber(courtCaseNumber);
        } catch (Exception e) {
            log.error("Error enriching case number and court case number: {}", e.toString());
            throw new CustomException(ENRICHMENT_EXCEPTION, "Error in case enrichment service while enriching case number and court case number: " + e.getMessage());
        }
    }

    private String getYearForEnrichingCourtCaseNumber(CaseRequest caseRequest) {
        CourtCase courtCase = caseRequest.getCases();

        // Case for admitting the court case
        if (isAdmittingCase(courtCase)) {
            return getCurrentYearAsString();
        }

        // Case for LPR (Legal Person Registration) cases with a court case number
        else if (!courtCase.getIsLPRCase() && courtCase.getLprNumber() != null) {
            return extractYearFromCourtCaseNumber(courtCase.getCourtCaseNumber());
        } else {
            throw new CustomException(ENRICHMENT_EXCEPTION, "Invalid case for enriching court case number");
        }
    }

    private boolean isAdmittingCase(CourtCase courtCase) {
        if (courtCase == null || courtCase.getWorkflow() == null || courtCase.getWorkflow().getAction() == null) {
            return false;
        }
        return ADMIT_CASE_WORKFLOW_ACTION.equals(courtCase.getWorkflow().getAction());
    }

    private String getCurrentYearAsString() {
        LocalDate currentDate = LocalDate.now(ZoneId.of("Asia/Kolkata"));
        return String.valueOf(currentDate.getYear());
    }

    private String extractYearFromCourtCaseNumber(String courtCaseNumber) {
        if (courtCaseNumber == null) {
            return null;
        }

        // Match the pattern "ST/xxx/yyyy" in the court case number
        Pattern pattern = Pattern.compile(REGEX_TO_EXTRACT_YEAR);
        Matcher matcher = pattern.matcher(courtCaseNumber);

        if (matcher.find()) {
            return matcher.group(1);  // Extracts the year
        } else {
            log.error("Invalid court case number format");
            return null;
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
            case "system" -> log.info("System User is searching for cases");
            default -> throw new IllegalArgumentException("Unknown user type: " + type);
        }
    }

    private void enrichEmployeeUserId(List<Role> roles, CaseSearchRequest searchRequest) {

        boolean isCourtAssigned = roles.stream()
                .anyMatch(role -> COURT_ASSIGNED_ROLE.equals(role.getCode()));

        if (isCourtAssigned) {
            for (CaseCriteria element : searchRequest.getCriteria()) {
                String courtId = getCourtId(searchRequest.getRequestInfo());
                element.setCourtId(courtId);
            }

        } else {
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
            case "system" -> log.info("System User is searching for cases");
            default -> throw new IllegalArgumentException("Unknown user type: " + type);
        }
    }

    
    private void enrichEmployeeUserId(List<Role> roles, CaseSearchCriteriaV2 criteria, RequestInfo requestInfo) {

        boolean isCourtAssigned = roles.stream()
                .anyMatch(role -> COURT_ASSIGNED_ROLE.equals(role.getCode()));

        if (isCourtAssigned) {
            String courtId = getCourtId(requestInfo);
            criteria.setCourtId(courtId);
        } else {
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
            case "citizen" -> enrichCitizenUserId(roles, caseListRequest, requestInfo);
            case "system" -> log.info("System User is searching for cases");
            default -> throw new IllegalArgumentException("Unknown user type: " + type);
        }
    }

    private void enrichEmployeeUserId(List<Role> roles, CaseSummaryListCriteria caseSummaryListCriteria, RequestInfo requestInfo) {

        boolean isCourtAssigned = roles.stream()
                .anyMatch(role -> COURT_ASSIGNED_ROLE.equals(role.getCode()));

        if (isCourtAssigned) {
            String courtId = getCourtId(requestInfo);
            caseSummaryListCriteria.setCourtId(courtId);
        } else {
            caseSummaryListCriteria.setCourtId(null);
        }

    }

    private void enrichCitizenUserId(List<Role> roles, CaseSummaryListRequest caseListRequest, RequestInfo requestInfo) {
        CaseSummaryListCriteria caseSummaryListCriteria = caseListRequest.getCriteria();
        String individualId = individualService.getIndividualId(requestInfo);

        boolean isAdvocate = roles.stream()
                .anyMatch(role -> ADVOCATE_ROLE.equals(role.getCode()));
        boolean isClerk = roles.stream()
                .anyMatch(role -> ADVOCATE_CLERK_ROLE.equals(role.getCode()));

        if (isAdvocate) {

            List<Advocate> advocates = advocateUtil.fetchAdvocatesByIndividualId(requestInfo, individualId);

            if (!advocates.isEmpty()) {
                String advocateId = advocates.get(0).getId().toString();
                caseSummaryListCriteria.setAdvocateId(advocateId);
            }

            processAdvocateOfficeAdvocateValidation(caseListRequest);


        } else if (isClerk) {
            processClerkOfficeAdvocateValidation(caseListRequest);
        } else {
            caseSummaryListCriteria.setLitigantId(individualId);
        }

        caseSummaryListCriteria.setPoaHolderIndividualId(individualId);

    }

    private void processClerkOfficeAdvocateValidation(CaseSummaryListRequest caseListRequest) {
        CaseSummaryListCriteria criteria = caseListRequest.getCriteria();
        
        // Both fields are mandatory for clerks
        if (criteria.getOfficeAdvocateId() == null || criteria.getMemberId() == null) {
            log.info("Both officeAdvocateId and memberId are mandatory for ADVOCATE_CLERK_ROLE. Returning empty list");
            criteria.setCaseId("INVALID_CASE_ID_FOR_EMPTY_RESULT");
            return;
        }

        // Validate that the clerk is allowed to view this advocate's cases
        boolean memberExists = caseRepositoryV2.validateAdvocateOfficeCaseMember(
                criteria.getOfficeAdvocateId(),
                criteria.getMemberId()
        );

        if (!memberExists) {
            log.info("Clerk is not allowed to view advocate{}'s cases", criteria.getOfficeAdvocateId());
            criteria.setCaseId("INVALID_CASE_ID_FOR_EMPTY_RESULT");
            return;
        }

        // Create new criteria with only advocateId, invalidating all others
        String officeAdvocateId = criteria.getOfficeAdvocateId();
        CaseSummaryListCriteria newCriteria = CaseSummaryListCriteria.builder()
                .advocateId(officeAdvocateId)
                .pagination(criteria.getPagination())
                .build();
        
        // Set the new criteria back to the request
        caseListRequest.setCriteria(newCriteria);
    }

    private void processAdvocateOfficeAdvocateValidation(CaseSummaryListRequest caseListRequest) {
        CaseSummaryListCriteria criteria = caseListRequest.getCriteria();
        
        // For advocates, officeAdvocateId and memberId are optional
        if (criteria.getOfficeAdvocateId() == null || criteria.getMemberId() == null) {
            // If not provided, let existing logic apply (advocate's own cases)
            return;
        }

        // Validate if provided
        boolean memberExists = caseRepositoryV2.validateAdvocateOfficeCaseMember(
                criteria.getOfficeAdvocateId(),
                criteria.getMemberId()
        );

        if (!memberExists) {
            log.info("Advocate is not allowed to view advocate {}'s cases", criteria.getOfficeAdvocateId());
            // For advocates, let the existing logic apply (don't set invalid case ID)
            return;
        }

        // Create new criteria with only advocateId, invalidating all others
        String officeAdvocateId = criteria.getOfficeAdvocateId();
        CaseSummaryListCriteria newCriteria = CaseSummaryListCriteria.builder()
                .advocateId(officeAdvocateId)
                .pagination(criteria.getPagination())
                .build();
        
        // Set the new criteria back to the request
        caseListRequest.setCriteria(newCriteria);
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

    public void enrichLPRNumber(CaseRequest caseRequest) {
        try {
            String year = getCurrentYearAsString();
            String tenantId = caseRequest.getCases().getCourtId() + year;
            String idName = config.getLprConfig();
            String idFormat = config.getLprFormat();
            List<String> lprNumberIdList = idgenUtil.getIdList(caseRequest.getRequestInfo(), tenantId, idName, idFormat, 1, false);
            String lprNumber = lprNumberIdList.get(0);
            lprNumber = lprNumber + "/" + year;
            caseRequest.getCases().setLprNumber(lprNumber);
        } catch (Exception e) {
            log.error("Error enriching lpr number: {}", e.toString());
            throw new CustomException(ENRICHMENT_EXCEPTION, "Error in case enrichment service while enriching lpr number: " + e.getMessage());
        }
    }
}
