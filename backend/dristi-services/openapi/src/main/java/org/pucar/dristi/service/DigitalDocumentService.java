package org.pucar.dristi.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.extern.slf4j.Slf4j;
import org.egov.common.contract.request.RequestInfo;
import org.egov.common.contract.request.Role;
import org.egov.common.contract.request.User;
import org.egov.tracer.model.CustomException;
import org.pucar.dristi.config.Configuration;
import org.pucar.dristi.util.DigitalizedDocumentUtil;
import org.pucar.dristi.util.FileStoreUtil;
import org.pucar.dristi.web.models.WorkflowObject;
import org.pucar.dristi.web.models.digital_document.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;
import java.util.Objects;
import java.util.UUID;

import static org.pucar.dristi.config.ServiceConstants.*;

@Service
@Slf4j
public class DigitalDocumentService {

    private final DigitalizedDocumentUtil digitalizedDocumentUtil;

    private final UserService userService;

    private final FileStoreUtil fileStoreUtil;

    private final Configuration configuration;

    @Autowired
    public DigitalDocumentService(DigitalizedDocumentUtil digitalizedDocumentUtil, UserService userService, FileStoreUtil fileStoreUtil, Configuration configuration, ObjectMapper objectMapper) {
        this.digitalizedDocumentUtil = digitalizedDocumentUtil;
        this.userService = userService;
        this.fileStoreUtil = fileStoreUtil;
        this.configuration = configuration;
    }

    public DigitalizedDocumentSearchResponse searchDigitalDocument(OpenApiDigitalDocumentSearchRequest request) {

        try {

            log.info("method=searchDigitalDocument, status=IN_PROGRESS, request={}", request);

            DigitalizedDocumentSearchCriteria criteria = DigitalizedDocumentSearchCriteria.builder()
                    .tenantId(request.getTenantId())
                    .documentNumber(request.getDocumentNumber())
                    .build();

            DigitalizedDocumentSearchResponse response = digitalizedDocumentUtil.searchDigitalizeDoc(criteria, createInternalRequestInfoWithSystemUserType());

            if (response == null || response.getDocuments() == null || response.getDocuments().isEmpty()) {
                throw new CustomException(EVIDENCE_NOT_FOUND_EXCEPTION, "Digitalize document not found");
            }

            DigitalizedDocument digitalizedDocument = response.getDocuments().get(0);
            List<String> mobileNumbers = getMobileNumbers(digitalizedDocument);

            if (!mobileNumbers.contains(request.getMobileNumber())) {
                return null;
            }

            if (TypeEnum.MEDIATION.equals(digitalizedDocument.getType())) {
                filterMediationPartyDetails(digitalizedDocument, request.getMobileNumber());
            }

            return response;
        } catch (Exception e) {
            log.error("method=searchDigitalDocument, status=FAILED, request={}", request, e);
            throw new CustomException(DIGITALIZE_SERVICE_EXCEPTION, "Digitalize document service exception");
        }
    }

    public DigitalizedDocumentResponse updateDigitalDocument(OpenApiDigitalDocumentRequest request) {

        try {
            log.info("method=updateDigitalDocument, status=IN_PROGRESS, request={}", request);

            // Validate file store ID
            fileStoreUtil.getFilesByFileStore(request.getFileStoreId(), request.getTenantId(), null);

            // Fetch evidence
            DigitalizedDocumentSearchCriteria criteria = DigitalizedDocumentSearchCriteria.builder()
                    .tenantId(request.getTenantId())
                    .documentNumber(request.getDocumentNumber())
                    .build();

            DigitalizedDocumentSearchResponse response = digitalizedDocumentUtil.searchDigitalizeDoc(criteria, createInternalRequestInfoWithSystemUserType());

            if (response == null || response.getDocuments() == null || response.getDocuments().isEmpty()) {
                throw new CustomException(DIGITALIZE_SERVICE_EXCEPTION, "Digitalize document not found");
            }

            DigitalizedDocument digitalizedDocument = response.getDocuments().get(0);

            List<String> mobileNumbers = getMobileNumbers(digitalizedDocument);

            DigitalizedDocumentResponse digitalizedDocumentResponse;
            if (mobileNumbers.contains(request.getMobileNumber())) {

                Document document = Document.builder()
                        .fileStore(request.getFileStoreId())
                        .documentType("SIGNED")
                        .documentUid(UUID.randomUUID().toString())
                        .build();

                if (digitalizedDocument.getDocuments() == null) {
                    digitalizedDocument.setDocuments(new ArrayList<>());
                }
                digitalizedDocument.getDocuments().clear();
                digitalizedDocument.getDocuments().add(document);

                WorkflowObject workflow = new WorkflowObject();
                workflow.setAction(E_SIGN);
                digitalizedDocument.setWorkflow(workflow);

                if (TypeEnum.MEDIATION.equals(digitalizedDocument.getType())) {
                    digitalizedDocument.getMediationDetails().getPartyDetails().stream()
                            .filter(partyDetails -> partyDetails.getMobileNumber().equals(request.getMobileNumber()))
                            .forEach(partyDetails -> partyDetails.setHasSigned(true));
                }

                digitalizedDocumentResponse = digitalizedDocumentUtil.updateDigitalizeDoc(digitalizedDocument, createInternalRequestInfoWithSystemUserType());
                log.info("method=updateDigitalDocument, status=COMPLETED, request={}", request);
            } else {
                return null;
            }
            return digitalizedDocumentResponse;

        } catch (Exception e) {
            log.error("method=updateDigitalDocument, status=FAILED, request={}", request, e);
            throw new CustomException(DIGITALIZE_UPDATE_EXCEPTION, "Digitalize document service exception");
        }
    }

    private List<String> getMobileNumbers(DigitalizedDocument digitalizedDocument) {
        List<String> mobileNumbers = new ArrayList<>();
        if (TypeEnum.PLEA.equals(digitalizedDocument.getType())) {
            if (digitalizedDocument.getPleaDetails() != null && digitalizedDocument.getPleaDetails().getAccusedMobileNumber() != null) {
                mobileNumbers.add(digitalizedDocument.getPleaDetails().getAccusedMobileNumber());
            }
        } else if (TypeEnum.EXAMINATION_OF_ACCUSED.equals(digitalizedDocument.getType())) {
            if (digitalizedDocument.getExaminationOfAccusedDetails() != null && digitalizedDocument.getExaminationOfAccusedDetails().getAccusedMobileNumber() != null) {
                mobileNumbers.add(digitalizedDocument.getExaminationOfAccusedDetails().getAccusedMobileNumber());
            }
        } else if (TypeEnum.MEDIATION.equals(digitalizedDocument.getType())) {
            if (digitalizedDocument.getMediationDetails() != null && digitalizedDocument.getMediationDetails().getPartyDetails() != null) {
                digitalizedDocument.getMediationDetails().getPartyDetails().stream()
                        .map(MediationPartyDetails::getMobileNumber)
                        .filter(Objects::nonNull)
                        .forEach(mobileNumbers::add);
            }
        }
        return mobileNumbers;
    }

    private void filterMediationPartyDetails(DigitalizedDocument digitalizedDocument, String mobileNumber) {
        if (digitalizedDocument.getMediationDetails() != null && digitalizedDocument.getMediationDetails().getPartyDetails() != null) {
            digitalizedDocument.getMediationDetails().getPartyDetails().stream()
                    .filter(party -> !mobileNumber.equals(party.getMobileNumber()))
                    .forEach(party -> party.setMobileNumber(null));
        }
    }

    private RequestInfo createInternalRequestInfoWithSystemUserType() {
        User userInfo = new User();
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
