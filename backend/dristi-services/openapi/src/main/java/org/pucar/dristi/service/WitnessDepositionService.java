package org.pucar.dristi.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.extern.slf4j.Slf4j;
import org.egov.common.contract.models.Document;
import org.egov.common.contract.request.RequestInfo;
import org.egov.common.contract.request.Role;
import org.egov.common.contract.request.User;
import org.egov.tracer.model.CustomException;
import org.pucar.dristi.config.Configuration;
import org.pucar.dristi.util.EvidenceUtil;
import org.pucar.dristi.util.FileStoreUtil;
import org.pucar.dristi.web.models.WorkflowObject;
import org.pucar.dristi.web.models.witnessdeposition.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

import static org.pucar.dristi.config.ServiceConstants.*;

@Service
@Slf4j
public class WitnessDepositionService {

    private final EvidenceUtil evidenceUtil;

    private final UserService userService;

    private final FileStoreUtil fileStoreUtil;

    private final Configuration configuration;

    private final ObjectMapper objectMapper;

    @Autowired
    public WitnessDepositionService(EvidenceUtil evidenceUtil, UserService userService, FileStoreUtil fileStoreUtil, Configuration configuration, ObjectMapper objectMapper) {
        this.evidenceUtil = evidenceUtil;
        this.userService = userService;
        this.fileStoreUtil = fileStoreUtil;
        this.configuration = configuration;
        this.objectMapper = objectMapper;
    }

    public OpenApiEvidenceResponse searchWitnessDepositionByMobileNumber(OpenApiEvidenceSearchRequest request) {

        try {

            log.info("method=searchWitnessDepositionByMobileNumber, status=IN_PROGRESS, request={}", request);

            EvidenceSearchCriteria criteria = EvidenceSearchCriteria.builder()
                    .tenantId(request.getTenantId())
                    .artifactNumber(request.getArtifactNumber())
                    .fuzzySearch(false)
                    .build();

            EvidenceSearchResponse response = evidenceUtil.searchEvidence(criteria, createInternalRequestInfoWithSystemUserType());

            if (response == null || response.getArtifacts() == null || response.getArtifacts().isEmpty()) {
                throw new CustomException(EVIDENCE_NOT_FOUND_EXCEPTION, "Evidence not found");
            }

            Artifact artifact = response.getArtifacts().get(0);
            List<String> witnessMobileNumbers = artifact.getWitnessMobileNumbers();

            if (witnessMobileNumbers != null && witnessMobileNumbers.contains(request.getMobileNumber())) {
                log.info("method=searchWitnessDepositionByMobileNumber, status=COMPLETED, request={}", request);
                OpenApiEvidenceResponse openApiEvidenceResponse = objectMapper.convertValue(artifact, OpenApiEvidenceResponse.class);
                openApiEvidenceResponse.setMobileNumber(request.getMobileNumber());
                return openApiEvidenceResponse;
            }

            log.info("method=searchWitnessDepositionByMobileNumber, status=FAILED, request={}", request);
            return null;
        } catch (Exception e) {
            log.error("method=searchWitnessDepositionByMobileNumber, status=FAILED, request={}", request, e);
            throw new CustomException(EVIDENCE_SERVICE_EXCEPTION, "Evidence service exception");
        }
    }

    public OpenApiEvidenceResponse updateWitnessDeposition(OpenApiEvidenceUpdateRequest request) {

        try {
            log.info("method=updateWitnessDeposition, status=IN_PROGRESS, request={}", request);

            // Validate file store ID
            fileStoreUtil.getFilesByFileStore(request.getFileStoreId(), request.getTenantId(), null);

            // Fetch evidence
            EvidenceSearchCriteria criteria = EvidenceSearchCriteria.builder()
                    .tenantId(request.getTenantId())
                    .artifactNumber(request.getArtifactNumber())
                    .fuzzySearch(false)
                    .sourceType(request.getPartyType())
                    .build();

            EvidenceSearchResponse response = evidenceUtil.searchEvidence(criteria, createInternalRequestInfoWithSystemUserType());

            if (response == null || response.getArtifacts() == null || response.getArtifacts().isEmpty()) {
                throw new CustomException(EVIDENCE_NOT_FOUND_EXCEPTION, "Evidence not found");
            }

            Artifact artifact = response.getArtifacts().get(0);

            List<String> witnessMobileNumbers = artifact.getWitnessMobileNumbers();

            if (witnessMobileNumbers != null && witnessMobileNumbers.contains(request.getMobileNumber())) {

                Document document = Document.builder()
                        .id(UUID.randomUUID().toString())
                        .fileStore(request.getFileStoreId())
                        .documentType("application/pdf")
                        .documentUid(UUID.randomUUID().toString())
                        .build();

                artifact.setFile(document);

                WorkflowObject workflow = new WorkflowObject();
                workflow.setAction(E_SIGN);
                artifact.setWorkflow(workflow);

                EvidenceResponse evidenceResponse = evidenceUtil.updateEvidence(artifact, createInternalRequestInfoWithSystemUserType());
                OpenApiEvidenceResponse openApiEvidenceResponse = objectMapper.convertValue(evidenceResponse, OpenApiEvidenceResponse.class);
                openApiEvidenceResponse.setMobileNumber(request.getMobileNumber());
                log.info("method=updateWitnessDeposition, status=COMPLETED, request={}", request);
                return openApiEvidenceResponse;
            }

            log.info("method=updateWitnessDeposition, status=FAILED, request={}", request);
            return null;
        } catch (Exception e) {
            log.error("method=updateWitnessDeposition, status=FAILED, request={}", request, e);
            throw new CustomException(EVIDENCE_UPDATE_EXCEPTION, "Evidence service exception");
        }
    }

    private RequestInfo createInternalRequestInfoWithSystemUserType() {
        org.egov.common.contract.request.User userInfo = new User();
        userInfo.setUuid(userService.internalMicroserviceRoleUuid);
        userInfo.setRoles(userService.internalMicroserviceRoles);
        userInfo.setType(SYSTEM);
        userInfo.setTenantId(configuration.getEgovStateTenantId());
        if (userInfo.getRoles() == null || userInfo.getRoles().isEmpty()) {
            userInfo.setRoles(new ArrayList<>());
        }
        userInfo.getRoles().add(Role.builder().code(SYSTEM)
                .name(SYSTEM)
                .tenantId(configuration.getEgovStateTenantId())
                .build());

        return RequestInfo.builder().userInfo(userInfo).msgId(msgId).build();
    }

}
