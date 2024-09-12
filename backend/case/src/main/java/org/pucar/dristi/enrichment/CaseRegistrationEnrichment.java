package org.pucar.dristi.enrichment;


import java.util.List;
import java.util.UUID;

import org.egov.common.contract.models.AuditDetails;
import org.egov.common.contract.models.Document;
import org.egov.tracer.model.CustomException;
import org.pucar.dristi.config.Configuration;
import org.pucar.dristi.config.ServiceConstants;
import org.pucar.dristi.util.CaseUtil;
import org.pucar.dristi.util.IdgenUtil;
import org.pucar.dristi.web.models.AdvocateMapping;
import org.pucar.dristi.web.models.CaseRequest;
import org.pucar.dristi.web.models.CourtCase;
import org.pucar.dristi.web.models.LinkedCase;
import org.pucar.dristi.web.models.Party;
import org.pucar.dristi.web.models.StatuteSection;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;

import lombok.extern.slf4j.Slf4j;

import static org.pucar.dristi.config.ServiceConstants.*;

@Component
@Slf4j
public class CaseRegistrationEnrichment {

    private IdgenUtil idgenUtil;
    private CaseUtil caseUtil;
    private Configuration config;

    @Autowired
    public CaseRegistrationEnrichment(IdgenUtil idgenUtil, CaseUtil caseUtil, Configuration config) {
        this.idgenUtil = idgenUtil;
        this.caseUtil = caseUtil;
        this.config = config;
    }

    public void enrichCaseRegistrationOnCreate(CaseRequest caseRequest) {
        try {
            CourtCase courtCase = caseRequest.getCases();
            AuditDetails auditDetails = AuditDetails.builder().createdBy(caseRequest.getRequestInfo().getUserInfo().getUuid()).createdTime(caseUtil.getCurrentTimeMil()).lastModifiedBy(caseRequest.getRequestInfo().getUserInfo().getUuid()).lastModifiedTime(caseUtil.getCurrentTimeMil()).build();
            courtCase.setAuditdetails(auditDetails);

            courtCase.setId(UUID.randomUUID());
            enrichCaseRegistrationUponCreateAndUpdate(courtCase, auditDetails);

            courtCase.setFilingNumber(caseUtil.generateFilingNumber(caseRequest.getCases().getTenantId(), caseRequest.getRequestInfo().getUserInfo().getUuid(), FILING_NUMBER));


        } catch (Exception e) {
            log.error("Error enriching case application :: {}", e.toString());
            throw new CustomException(ENRICHMENT_EXCEPTION, e.getMessage());
        }
    }

    private void enrichCaseRegistrationUponCreateAndUpdate(CourtCase courtCase, AuditDetails auditDetails) {
        enrichLinkedCaseOnCreateAndUpdate(courtCase, auditDetails);

        enrichStatuteAndSectionsOnCreateAndUpdate(courtCase, auditDetails);

        enrichLitigantsOnCreateAndUpdate(courtCase, auditDetails);

        enrichRepresentativesOnCreateAndUpdate(courtCase, auditDetails);

        enrichCaseRegistrationFillingDate(courtCase);

        if (courtCase.getDocuments() != null) {
            List<Document> documentsListToCreate = courtCase.getDocuments().stream().filter(document -> document.getId() == null).toList();
            documentsListToCreate.forEach(CaseRegistrationEnrichment::enrichDocumentsOnCreate);
        }
    }

    private void enrichCaseRegistrationFillingDate(CourtCase courtCase) {
        if(courtCase.getWorkflow()!=null && courtCase.getWorkflow().getAction().equalsIgnoreCase(ServiceConstants.SUBMIT_CASE_WORKFLOW_ACTION)){
            courtCase.setFilingDate(caseUtil.getCurrentTimeMil());
        }
    }

    private static void enrichDocumentsOnCreate(Document document) {
        if(document.getId() == null) {
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
            if(advocateMapping.getRepresenting() != null) {
                enrichRepresentingOnCreateAndUpdate(auditDetails, advocateMapping, courtCaseId);
            }
        });
        List<AdvocateMapping> representativesListToUpdate = courtCase.getRepresentatives().stream().filter(representative -> representative.getId() != null).toList();
        representativesListToUpdate.forEach(advocateMapping -> {
            advocateMapping.setAuditDetails(auditDetails);
            if (advocateMapping.getDocuments() != null) {
                advocateMapping.getDocuments().forEach(CaseRegistrationEnrichment::enrichDocumentsOnCreate);
            }
            if(advocateMapping.getRepresenting() != null) {
               enrichRepresentingOnCreateAndUpdate(auditDetails, advocateMapping, courtCaseId);
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
        if(courtCase.getLitigants() == null) {
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

    private void enrichStatuteAndSectionsOnCreateAndUpdate(CourtCase courtCase, AuditDetails auditDetails) {
        if(courtCase.getStatutesAndSections() == null) {
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

    private static void enrichLinkedCaseOnCreateAndUpdate(CourtCase courtCase, AuditDetails auditDetails) {
        if(courtCase.getLinkedCases() == null) {
            return;
        }
        List<LinkedCase> linkedCasesListToCreate = courtCase.getLinkedCases().stream().filter(linkedCase -> linkedCase.getId() == null).toList();
        linkedCasesListToCreate.forEach(linkedCase -> {
            linkedCase.setId(UUID.randomUUID());
            linkedCase.setAuditdetails(auditDetails);
            if(linkedCase.getDocuments() != null) {
                linkedCase.getDocuments().forEach(CaseRegistrationEnrichment::enrichDocumentsOnCreate);
            }
        });
        List<LinkedCase> linkedCasesListToUpdate = courtCase.getLinkedCases().stream().filter(linkedCase -> linkedCase.getId() != null).toList();
        linkedCasesListToUpdate.forEach(linkedCase -> {
            linkedCase.setAuditdetails(auditDetails);
            if(linkedCase.getDocuments() != null) {
                linkedCase.getDocuments().forEach(CaseRegistrationEnrichment::enrichDocumentsOnCreate);
            }
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

    public void enrichCaseApplicationUponUpdate(CaseRequest caseRequest) {
        try {
            // Enrich lastModifiedTime and lastModifiedBy in case of update
            CourtCase courtCase = caseRequest.getCases();
            AuditDetails auditDetails  = courtCase.getAuditdetails();
            auditDetails.setLastModifiedTime(caseUtil.getCurrentTimeMil());
            auditDetails.setLastModifiedBy(caseRequest.getRequestInfo().getUserInfo().getUuid());
            enrichCaseRegistrationUponCreateAndUpdate(courtCase, auditDetails);

        } catch (Exception e) {
            log.error("Error enriching case application upon update :: {}", e.toString());
            throw new CustomException(ENRICHMENT_EXCEPTION, "Error in case enrichment service during case update process: " + e.getMessage());
        }
    }
    public void enrichCaseNumber(CaseRequest caseRequest) {
        try {
            List<String> courtCaseRegistrationCaseNumberIdList = idgenUtil.getIdList(caseRequest.getRequestInfo(), caseRequest.getCases().getTenantId(), config.getCaseNumberCc(), null, 1);
            caseRequest.getCases().setCaseNumber(courtCaseRegistrationCaseNumberIdList.get(0));
        } catch (Exception e) {
            log.error("Error enriching case number: {}", e.toString());
            throw new CustomException(ENRICHMENT_EXCEPTION, "Error in case enrichment service while enriching case number: " + e.getMessage());
        }
    }

    public void enrichCourtCaseNumber(CaseRequest caseRequest) {
        try {
            caseRequest.getCases().setCourtCaseNumber(caseUtil.get(0));
        } catch (Exception e) {
            log.error("Error enriching court case number: {}", e.toString());
            throw new CustomException(ENRICHMENT_EXCEPTION, "Error in case enrichment service while enriching court case number: " + e.getMessage());
        }
    }

    public void enrichCNRAndCMPNumber(CaseRequest caseRequest) {
        try {
            caseRequest.getCases().setCnrNumber(caseUtil.generateCNRNumber(caseRequest.getCases().getTenantId(), caseRequest.getRequestInfo().getUserInfo().getUuid()));
            caseRequest.getCases().setCmpNumber(caseUtil.generateCMPNumber(caseRequest.getCases().getTenantId(), caseRequest.getRequestInfo().getUserInfo().getUuid(), CMP_NUMBER));
        } catch (Exception e) {
            log.error("Error enriching cnr number: {}", e.toString());
            throw new CustomException(ENRICHMENT_EXCEPTION, "Error in case enrichment service while enriching cnr number: " + e.getMessage());
        }
    }

    public void enrichAccessCode(CaseRequest caseRequest){
            try {

                String accessCode = CaseUtil.generateAccessCode(ACCESSCODE_LENGTH);
                caseRequest.getCases().setAccessCode(accessCode);
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
}