package digit.enrichment;

import com.fasterxml.jackson.databind.JsonNode;
import digit.config.Configuration;
import digit.util.CaseUtil;
import digit.util.IdgenUtil;
import digit.web.models.AuditDetails;
import digit.web.models.Bail;
import digit.web.models.BailRequest;
import digit.web.models.CaseCriteria;
import digit.web.models.CaseSearchRequest;
import digit.web.models.Document;
import lombok.AllArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.egov.common.contract.request.RequestInfo;
import org.egov.tracer.model.CustomException;
import org.springframework.stereotype.Component;
import org.springframework.util.ObjectUtils;

import java.util.Collections;
import java.util.List;
import java.util.UUID;

import static digit.config.ServiceConstants.EDIT;
import static digit.config.ServiceConstants.ERROR_WHILE_FETCHING_FROM_CASE;

@Component
@Slf4j
@AllArgsConstructor
public class BailRegistrationEnrichment {
    private final Configuration config;
    private final IdgenUtil idgenUtil;
    private final CaseUtil caseUtil;

    public void enrichBailOnCreation(BailRequest bailRequest) {
        log.info("Enriching Bail On Creation");
        String idName = config.getBailConfig();
        String idFormat = config.getBailFormat();

        RequestInfo requestInfo = bailRequest.getRequestInfo();
        String tenantId = bailRequest.getBail().getFilingNumber().replace("-","");
        Bail bail = bailRequest.getBail();

        List<String> bailRegistrationBailIdList = idgenUtil.getIdList(requestInfo, tenantId, idName, idFormat, 1,false);
        log.info("Bail Registration ID list: {}", bailRegistrationBailIdList);

        AuditDetails auditDetails = AuditDetails.builder()
                .createdBy(bailRequest.getRequestInfo().getUserInfo().getUuid())
                .createdTime(System.currentTimeMillis())
                .lastModifiedBy(bailRequest.getRequestInfo().getUserInfo().getUuid())
                .lastModifiedTime(System.currentTimeMillis())
                .build();

        bail.setAuditDetails(auditDetails);
        bail.setId(String.valueOf(UUID.randomUUID()));
        String bailId = bail.getFilingNumber() + "-" + bailRegistrationBailIdList.get(0);
        bail.setBailId(bailId);
        enrichCaseDetails(bailRequest);
        if(!ObjectUtils.isEmpty(bailRequest.getBail().getDocuments())){
            bail.getDocuments().forEach(document -> enrichDocument(document, tenantId, requestInfo));
        }
        enrichSureties(bailRequest);
        bail.setBailType(Bail.BailTypeEnum.fromValue(String.valueOf(bail.getBailType())));
    }


    public void enrichCaseDetails(BailRequest bailRequest) {
        Bail bail = bailRequest.getBail();
        CaseCriteria criteria = CaseCriteria.builder()
                .filingNumber(bail.getFilingNumber())
                .defaultFields(true)
                .build();
        CaseSearchRequest caseSearchRequest = CaseSearchRequest.builder()
                .requestInfo(bailRequest.getRequestInfo())
                .criteria(Collections.singletonList(criteria))
                .build();
        JsonNode caseDetails = caseUtil.searchCaseDetails(caseSearchRequest);

        bail.setCourtId(caseUtil.getCourtId(caseDetails));
        bail.setCaseTitle(caseUtil.getCaseTitle(caseDetails));
        bail.setCnrNumber(caseUtil.getCnrNumber(caseDetails));
        String caseType = caseUtil.getCaseType(caseDetails);
        if(caseType != null){
            bail.setCaseType(Bail.CaseTypeEnum.valueOf(caseType)) ;
            if(caseType.equalsIgnoreCase("ST")){
                bail.setCaseNumber(caseUtil.getCourtCaseNumber(caseDetails));
            }
            else{
                bail.setCaseNumber(caseUtil.getCmpNumber(caseDetails));
            }
        }
        bail.setCaseId(caseUtil.getCaseId(caseDetails));
    }

    public void enrichDocument(Document document, String rootTenantId, RequestInfo requestInfo) {
        if (ObjectUtils.isEmpty(document.getId())) {
            document.setId(String.valueOf(UUID.randomUUID()));
            document.setDocumentUid(document.getId());
        }
        if(ObjectUtils.isEmpty(document.getTenantId())){
            document.setTenantId(rootTenantId);
        }
        AuditDetails auditDetails = document.getAuditDetails();

        Long currentTime = System.currentTimeMillis();
        String userUuid = requestInfo.getUserInfo().getUuid();

        if (ObjectUtils.isEmpty(auditDetails)) {
            auditDetails = AuditDetails.builder()
                    .createdBy(userUuid)
                    .createdTime(currentTime)
                    .lastModifiedBy(userUuid)
                    .lastModifiedTime(currentTime)
                    .build();
        } else {
            auditDetails.setLastModifiedBy(userUuid);
            auditDetails.setLastModifiedTime(currentTime);
        }

        document.setAuditDetails(auditDetails);


    }

    public void enrichSureties(BailRequest bailRequest) {
        if(!ObjectUtils.isEmpty(bailRequest.getBail().getSureties())) {
            bailRequest.getBail().getSureties().forEach(surety -> {
                if(surety.getId() == null) {
                    surety.setId(String.valueOf(UUID.randomUUID()));
                }
                if(!ObjectUtils.isEmpty(surety.getDocuments())){
                    surety.getDocuments().forEach(document -> enrichDocument(document, bailRequest.getBail().getTenantId(), bailRequest.getRequestInfo()));
                }
            });
        }
    }


    public void enrichBailUponUpdate(BailRequest bailRequest, Bail existingBail) {
        log.info("Enriching Bail Upon Update");
        // If workflow action is edit, invalidate all the sign
        if(!ObjectUtils.isEmpty(bailRequest.getBail().getWorkflow()) &&
                bailRequest.getBail().getWorkflow().getAction().equalsIgnoreCase(EDIT)){
            bailRequest.getBail().setLitigantSigned(false);
            if(!ObjectUtils.isEmpty(bailRequest.getBail().getSureties())){
                bailRequest.getBail().getSureties().forEach(surety -> {
                    surety.setHasSigned(false);
                });
            }
        }
        enrichSureties(bailRequest);
        if(!ObjectUtils.isEmpty(bailRequest.getBail().getDocuments())){
            bailRequest.getBail().getDocuments().forEach(document -> enrichDocument(document, bailRequest.getBail().getTenantId(), bailRequest.getRequestInfo()));
        }
        AuditDetails auditDetails = bailRequest.getBail().getAuditDetails();
        auditDetails.setCreatedBy(existingBail.getAuditDetails().getCreatedBy());
        auditDetails.setCreatedTime(existingBail.getAuditDetails().getCreatedTime());
        auditDetails.setLastModifiedBy(bailRequest.getRequestInfo().getUserInfo().getUuid());
        auditDetails.setLastModifiedTime(System.currentTimeMillis());
        bailRequest.getBail().setAuditDetails(auditDetails);
    }
}
