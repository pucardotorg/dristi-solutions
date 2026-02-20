package org.pucar.dristi.enrichment;

import com.fasterxml.jackson.databind.JsonNode;
import lombok.extern.slf4j.Slf4j;
import org.egov.common.contract.models.AuditDetails;
import org.egov.common.contract.models.Document;
import org.egov.common.contract.request.RequestInfo;
import org.egov.tracer.model.CustomException;
import org.pucar.dristi.config.Configuration;
import org.pucar.dristi.repository.EvidenceRepository;
import org.pucar.dristi.util.CaseUtil;
import org.pucar.dristi.util.IdgenUtil;
import org.pucar.dristi.web.models.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.UUID;

import static org.pucar.dristi.config.ServiceConstants.*;

@Component
@Slf4j
public class EvidenceEnrichment {
    private final IdgenUtil idgenUtil;
    private Configuration configuration;
    private final CaseUtil caseUtil;
    private final EvidenceRepository evidenceRepository;

    @Autowired
    public EvidenceEnrichment(IdgenUtil idgenUtil, Configuration configuration, CaseUtil caseUtil, EvidenceRepository evidenceRepository) {
        this.idgenUtil = idgenUtil;
        this.configuration = configuration;
        this.caseUtil = caseUtil;
        this.evidenceRepository = evidenceRepository;
    }

    public void enrichEvidenceRegistration(EvidenceRequest evidenceRequest) {
        try {
            String idName = configuration.getArtifactConfig();
            String idFormat = configuration.getArtifactFormat();

            String tenantId = getTenantId(evidenceRequest.getArtifact().getFilingNumber());

            List<String> artifactNumberList = idgenUtil.getIdList(
                    evidenceRequest.getRequestInfo(),
                    tenantId,
                    idName,
                    idFormat,
                    1,
                    false
            );

            evidenceRequest.getArtifact().setArtifactNumber(evidenceRequest.getArtifact().getFilingNumber()+"-"+artifactNumberList.get(0));

            AuditDetails auditDetails = AuditDetails.builder()
                    .createdBy(evidenceRequest.getRequestInfo().getUserInfo().getUuid())
                    .createdTime(System.currentTimeMillis())
                    .lastModifiedBy(evidenceRequest.getRequestInfo().getUserInfo().getUuid())
                    .lastModifiedTime(System.currentTimeMillis())
                    .build();

            evidenceRequest.getArtifact().setAuditdetails(auditDetails);
            evidenceRequest.getArtifact().setId(UUID.randomUUID());
            for (Comment comment : evidenceRequest.getArtifact().getComments()) {
                comment.setId(UUID.randomUUID());
            }

            evidenceRequest.getArtifact().setCourtId(getCourtId(evidenceRequest));
            evidenceRequest.getArtifact().setIsActive(true);
            evidenceRequest.getArtifact().setCreatedDate(System.currentTimeMillis());

            if (evidenceRequest.getArtifact().getFile() != null) {
                evidenceRequest.getArtifact().getFile().setId(String.valueOf(UUID.randomUUID()));
                evidenceRequest.getArtifact().getFile().setDocumentUid(evidenceRequest.getArtifact().getFile().getId());
            }

        } catch (CustomException e) {
            log.error("Custom Exception occurred while Enriching evidence: {}", e.toString());
            throw e;
        } catch (Exception e) {
            log.error("Error enriching evidence application: {}", e.toString());
            throw new CustomException(ENRICHMENT_EXCEPTION, "Error in evidence enrichment service: " + e.toString());
        }
    }

    private String getCourtId(EvidenceRequest evidenceRequest) {
        CaseSearchRequest caseSearchRequest = createCaseSearchRequest(
                evidenceRequest.getRequestInfo(), evidenceRequest.getArtifact().getFilingNumber());

        caseSearchRequest.getRequestInfo().getUserInfo().setType(EMPLOYEE_UPPER);
        JsonNode caseDetails = caseUtil.searchCaseDetails(caseSearchRequest);

        if (caseDetails == null || caseDetails.isEmpty()) {
            throw new CustomException("CASE_NOT_FOUND", "Case not found for the filing number: " + evidenceRequest.getArtifact().getFilingNumber());
        }

        return caseDetails.get("courtId").textValue();
    }

    private CaseSearchRequest createCaseSearchRequest(RequestInfo requestInfo, String fillingNUmber) {
        CaseSearchRequest caseSearchRequest = new CaseSearchRequest();
        caseSearchRequest.setRequestInfo(requestInfo);
        CaseCriteria caseCriteria = CaseCriteria.builder().filingNumber(fillingNUmber).defaultFields(false).build();
        caseSearchRequest.addCriteriaItem(caseCriteria);
        return caseSearchRequest;
    }

    public void enrichEvidenceNumber(EvidenceRequest evidenceRequest) {
        try {
            String sourceType = evidenceRequest.getArtifact().getSourceType();

            String idName = "";
            String idFormat = "";
            Boolean isDeposition = DEPOSITION.equalsIgnoreCase(evidenceRequest.getArtifact().getArtifactType());

            if(COMPLAINANT.equalsIgnoreCase(sourceType)){
                if(isDeposition){
                    idName=configuration.getProsecutionWitnessConfig();
                    idFormat=configuration.getProsecutionWitnessFormat();
                }else{
                    idName=configuration.getProsecutionConfig();
                    idFormat=configuration.getProsecutionFormat();
                }

            } else if (ACCUSED.equalsIgnoreCase(sourceType)) {
                if(isDeposition){
                    idName=configuration.getDefenceWitnessConfig();
                    idFormat=configuration.getDefenceWitnessFormat();
                }else{
                    idName=configuration.getDefenceConfig();
                    idFormat=configuration.getDefenceFormat();
                }

            } else if (COURT.equalsIgnoreCase(sourceType)) {
                if(isDeposition){
                    idName=configuration.getCourtWitnessConfig();
                    idFormat=configuration.getCourtWitnessFormat();
                }
                else {
                    idName=configuration.getCourtConfig();
                    idFormat=configuration.getCourtFormat();
                }
            } else if(ICOPS.equalsIgnoreCase(sourceType)) {
                idName = configuration.getCourtConfig();
                idFormat = configuration.getIcopsFormat();
            }
            String tenantId = getTenantId(evidenceRequest.getArtifact().getFilingNumber());

            List<String> evidenceNumberList = idgenUtil.getIdList(
                    evidenceRequest.getRequestInfo(),
                    tenantId,
                    idName,
                    idFormat,
                    1,
                    false
            );

            evidenceRequest.getArtifact().setPublishedDate(System.currentTimeMillis());
            evidenceRequest.getArtifact().setEvidenceNumber(evidenceRequest.getArtifact().getFilingNumber()+"-"+evidenceNumberList.get(0));
            evidenceRequest.getArtifact().setIsEvidence(true);
        } catch (Exception e) {
            log.error("Error enriching evidence number upon update: {}", e.toString());
            throw new CustomException(ENRICHMENT_EXCEPTION, "Failed to generate evidence number for " + evidenceRequest.getArtifact().getId() + ": " + e.toString());
        }
    }
    public void enrichIsActive(EvidenceRequest evidenceRequest) {
        try {
            evidenceRequest.getArtifact().setIsActive(false);
        }
        catch (Exception e) {
            log.error("Error enriching isActive status upon update: {}", e.toString());
            throw new CustomException(ENRICHMENT_EXCEPTION, "Error in enrichment service during isActive status update process: " + e.toString());
        }
    }

    private String getTenantId(String filingNumber){
        return filingNumber.replace("-","");
    }

    public void enrichEvidenceRegistrationUponUpdate(EvidenceRequest evidenceRequest) {
        try {
            // Enrich lastModifiedTime and lastModifiedBy in case of update
            evidenceRequest.getArtifact().getAuditdetails().setLastModifiedTime(System.currentTimeMillis());
            evidenceRequest.getArtifact().getAuditdetails().setLastModifiedBy(evidenceRequest.getRequestInfo().getUserInfo().getUuid());
            Document seal = evidenceRequest.getArtifact().getSeal();
            if(seal != null && seal.getId() == null){
                seal.setId(String.valueOf(UUID.randomUUID()));
                seal.setDocumentUid(seal.getId());
                evidenceRequest.getArtifact().setSeal(seal);
            }
        } catch (Exception e) {
            log.error("Error enriching evidence application upon update: {}", e.toString());
            throw new CustomException(ENRICHMENT_EXCEPTION, "Error in enrichment service during  update process: " + e.toString());
        }
    }

    public void enrichCommentUponCreate(Comment comment, AuditDetails auditDetails) {
        try {
            comment.setId(UUID.randomUUID());
            comment.setAuditdetails(auditDetails);
        } catch (Exception e) {
            log.error("Error enriching comment upon create: {}", e.toString());
            throw new CustomException(ENRICHMENT_EXCEPTION, "Error enriching comment upon create: " + e.getMessage());
        }
    }

    public void enrichTag(EvidenceRequest body) {
        try {
            log.info("Tag for {} is {}", body.getArtifact().getId(), body.getArtifact().getTag());
            String idName = "";
            String idFormat = "";
            if(WITNESS_DEPOSITION.equalsIgnoreCase(body.getArtifact().getArtifactType())) {
                if(COMPLAINANT.equalsIgnoreCase(body.getArtifact().getSourceType())) {
                    idName = configuration.getProsecutionWitnessConfig();
                    idFormat = configuration.getProsecutionWitnessFormat();
                } else if (ACCUSED.equalsIgnoreCase(body.getArtifact().getSourceType())) {
                    idName = configuration.getDefenceWitnessConfig();
                    idFormat = configuration.getDefenceWitnessFormat();
                } else if (COURT.equalsIgnoreCase(body.getArtifact().getSourceType())) {
                    idName = configuration.getCourtWitnessConfig();
                    idFormat = configuration.getCourtWitnessFormat();
                }
            }
            String tenantId = getTenantId(body.getArtifact().getFilingNumber());
            List<String> tags = idgenUtil.getIdList(body.getRequestInfo(), tenantId, idName, idFormat, 1, false);
            body.getArtifact().setTag(tags.get(0));
            log.info("Tag generated id: {} is {}", body.getArtifact().getId(), body.getArtifact().getTag());
        } catch (CustomException e) {
            log.error("Error generating tag for {}: {}", body.getArtifact().getId(), e.getMessage());
            throw new CustomException(ENRICHMENT_EXCEPTION, "Failed to generate tag for " + body.getArtifact().getId() + ": " + e.getMessage());
        }
    }

    public String enrichPseudoTag(EvidenceRequest body) {
        String sequenceName = getSequenceName(body.getArtifact().getTag());
        if(sequenceName.isEmpty()){
            return sequenceName;
        }
        sequenceName = sequenceName.replace("[TENANT_ID]", getTenantId(body.getArtifact().getFilingNumber()).toLowerCase());
        Integer nextVal = evidenceRepository.getNextValForSequence(sequenceName);
        log.debug("Retrieved sequence value {} for sequence {}", nextVal, sequenceName);
        
        // Set the generated tag with sequence value to the artifact
        String generatedTag = body.getArtifact().getTag() + nextVal;
        log.info("Generated pseudo tag: {} for artifact: {}", generatedTag, body.getArtifact().getId());
        return generatedTag;
    }

    private String getSequenceName(String tag) {
        return switch (tag) {
            case PROSECUTION_WITNESS -> "seq_prsqnwtns_[TENANT_ID]";
            case DEFENCE_WITNESS -> "seq_dfncwtns_[TENANT_ID]";
            case COURT_WITNESS -> "seq_courtwtns_[TENANT_ID]";
            default -> "";
        };
    }
}
