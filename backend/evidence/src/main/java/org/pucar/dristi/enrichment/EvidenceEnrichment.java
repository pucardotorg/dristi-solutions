package org.pucar.dristi.enrichment;

import lombok.extern.slf4j.Slf4j;
import org.egov.common.contract.models.AuditDetails;
import org.egov.tracer.model.CustomException;
import org.pucar.dristi.config.Configuration;
import org.pucar.dristi.util.IdgenUtil;
import org.pucar.dristi.web.models.Artifact;
import org.pucar.dristi.web.models.Comment;
import org.pucar.dristi.web.models.EvidenceRequest;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

import static org.pucar.dristi.config.ServiceConstants.*;

@Component
@Slf4j
public class EvidenceEnrichment {
    private final IdgenUtil idgenUtil;
    private Configuration configuration;

    @Autowired
    public EvidenceEnrichment(IdgenUtil idgenUtil,Configuration configuration) {
        this.idgenUtil = idgenUtil;
        this.configuration = configuration;
    }

    public void enrichEvidenceRegistration(EvidenceRequest evidenceRequest) {
        try {
            String idName = getIdgenByArtifactTypeAndSourceType(evidenceRequest.getArtifact().getArtifactType(), evidenceRequest.getArtifact().getSourceType());
            String idFormat = getIdGenFormatByArtifactTypeAndSourceType(evidenceRequest.getArtifact().getArtifactType(), evidenceRequest.getArtifact().getSourceType());
            String tenantId = evidenceRequest.getArtifact().getCnrNumber();
            List<String> evidenceNumberList = idgenUtil.getIdList(
                    evidenceRequest.getRequestInfo(),
                    tenantId,
                    idName,
                    idFormat,
                    1,
                    false
            );

            evidenceRequest.getArtifact().setArtifactNumber(evidenceRequest.getArtifact().getCnrNumber()+"-"+evidenceNumberList.get(0));

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

    private static final Map<String, String> artifactSourceMap = new HashMap<>();
    private static final Map<String, String> artifactSourceMapForIdFormat = new HashMap<>();


    static {
        //For IdName
        artifactSourceMap.put("DOCUMENTARY_COMPLAINANT", "case.evidence.prosecution.[TENANT_ID]");
        artifactSourceMap.put("DOCUMENTARY_ACCUSED", "case.evidence.defence.[TENANT_ID]");
        artifactSourceMap.put("DOCUMENTARY_COURT", "case.evidence.court.[TENANT_ID]");
        artifactSourceMap.put("AFFIDAVIT_COMPLAINANT", "case.evidence.prosecution.[TENANT_ID]");
        artifactSourceMap.put("AFFIDAVIT_ACCUSED", "case.evidence.defence.[TENANT_ID]");
        artifactSourceMap.put("AFFIDAVIT_COURT", "case.evidence.court.[TENANT_ID]");
        artifactSourceMap.put("DEPOSITION_COMPLAINANT", "case.evidence.prosecution.witness.[TENANT_ID]");
        artifactSourceMap.put("DEPOSITION_ACCUSED", "case.evidence.defence.witness.[TENANT_ID]");
        artifactSourceMap.put("DEPOSITION_COURT", "case.evidence.court.witness.[TENANT_ID]");

        //For idFormat
        artifactSourceMapForIdFormat.put("DOCUMENTARY_COMPLAINANT", "P[SEQ_PRSQN_[TENANT_ID]]");
        artifactSourceMapForIdFormat.put("DOCUMENTARY_ACCUSED", "D[SEQ_DFNC_[TENANT_ID]]");
        artifactSourceMapForIdFormat.put("DOCUMENTARY_COURT", "C[SEQ_COURT_[TENANT_ID]]");
        artifactSourceMapForIdFormat.put("AFFIDAVIT_COMPLAINANT", "P[SEQ_PRSQN_[TENANT_ID]]");
        artifactSourceMapForIdFormat.put("AFFIDAVIT_ACCUSED", "D[SEQ_DFNC_[TENANT_ID]]");
        artifactSourceMapForIdFormat.put("AFFIDAVIT_COURT", "C[SEQ_COURT_[TENANT_ID]]");
        artifactSourceMapForIdFormat.put("DEPOSITION_COMPLAINANT", "PW[SEQ_PRSQNWTNS_[TENANT_ID]]");
        artifactSourceMapForIdFormat.put("DEPOSITION_ACCUSED", "DW[SEQ_DFNCWTNS_[TENANT_ID]]");
        artifactSourceMapForIdFormat.put("DEPOSITION_COURT", "CW[SEQ_COURTWTNS_[TENANT_ID]]");
    }

    public String getIdgenByArtifactTypeAndSourceType(String artifactType, String sourceType) {
        String key = artifactType + "_" + sourceType;
        String result = artifactSourceMap.get(key);
        if (result != null) {
            return result;
        } else {
            throw new CustomException(ENRICHMENT_EXCEPTION, "Invalid artifact type or source type provided");
        }
    }

    public String getIdGenFormatByArtifactTypeAndSourceType(String artifactType, String sourceType) {
        String key = artifactType + "_" + sourceType;
        String result = artifactSourceMapForIdFormat.get(key);
        if (result != null) {
            return result;
        } else {
            throw new CustomException(ENRICHMENT_EXCEPTION, "Invalid artifact type or source type provided");
        }
    }


    public void enrichEvidenceNumber(EvidenceRequest evidenceRequest) {
        try {
            evidenceRequest.getArtifact().setEvidenceNumber(evidenceRequest.getArtifact().getArtifactNumber());
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


    public void enrichEvidenceRegistrationUponUpdate(EvidenceRequest evidenceRequest) {
        try {
            // Enrich lastModifiedTime and lastModifiedBy in case of update
            evidenceRequest.getArtifact().getAuditdetails().setLastModifiedTime(System.currentTimeMillis());
            evidenceRequest.getArtifact().getAuditdetails().setLastModifiedBy(evidenceRequest.getRequestInfo().getUserInfo().getUuid());
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
}
