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
import org.springframework.stereotype.Component;
import org.springframework.util.ObjectUtils;

import java.util.Collections;
import java.util.List;
import java.util.UUID;

@Component
@Slf4j
@AllArgsConstructor
public class BailRegistrationEnrichment {
    private final Configuration config;
    private final IdgenUtil idgenUtil;
    private final CaseUtil caseUtil;

    public void enrichBailOnCreation(BailRequest bailRequest) {
        String idName = config.getBailConfig();
        String idFormat = config.getBailFormat();

        RequestInfo requestInfo = bailRequest.getRequestInfo();
        String tenantId = bailRequest.getBail().getTenantId();
        Bail bail = bailRequest.getBail();

        List<String> bailRegistrationBailIdList = idgenUtil.getIdList(requestInfo, tenantId, idName, idFormat, 1);
        log.info("Bail Registration Filing Number ID list: {}", bailRegistrationBailIdList);

        AuditDetails auditDetails = AuditDetails.builder()
                .createdBy(bailRequest.getRequestInfo().getUserInfo().getUuid())
                .createdTime(System.currentTimeMillis())
                .lastModifiedBy(bailRequest.getRequestInfo().getUserInfo().getUuid())
                .lastModifiedTime(System.currentTimeMillis())
                .build();

        bail.setAuditDetails(auditDetails);
        bail.setId(String.valueOf(UUID.randomUUID()));
        bail.setBailId(bailRegistrationBailIdList.get(0));
        enrichCaseDetails(bailRequest);

        bail.getDocuments().forEach(this::enrichDocument);
        enrichSureties(bailRequest);
    }

    public void enrichCaseDetails(BailRequest bailRequest) {
        Bail bail = bailRequest.getBail();
        CaseCriteria criteria = CaseCriteria.builder()
                .filingNumber(bail.getFilingNumber())
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
        bail.setCaseType(Bail.CaseTypeEnum.valueOf(caseType)) ;
    }

    public void enrichDocument(Document document) {
        if (document.getId() == null) {
            document.setId(String.valueOf(UUID.randomUUID()));
            document.setDocumentUid(document.getId());
        }
    }

    public void enrichSureties(BailRequest bailRequest) {
        if(!ObjectUtils.isEmpty(bailRequest.getBail().getSureties())) {
            bailRequest.getBail().getSureties().forEach(surety -> {
                if(surety.getId() == null) {
                    surety.setId(String.valueOf(UUID.randomUUID()));
                }
            });
        }
    }


}
