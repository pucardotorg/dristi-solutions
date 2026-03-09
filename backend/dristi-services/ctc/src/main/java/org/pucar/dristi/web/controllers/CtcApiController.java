package org.pucar.dristi.web.controllers;

import lombok.extern.slf4j.Slf4j;
import org.egov.common.contract.response.ResponseInfo;
import org.egov.tracer.model.CustomException;
import org.pucar.dristi.service.CtcApplicationService;
import org.pucar.dristi.util.ResponseInfoFactory;
import org.pucar.dristi.web.models.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;

import jakarta.validation.Valid;

import java.util.List;

@Slf4j
@RestController
@RequestMapping("")
@Validated
public class CtcApiController {

    private final CtcApplicationService ctcApplicationService;

    private final ResponseInfoFactory responseInfoFactory;

    @Autowired
    public CtcApiController(CtcApplicationService ctcApplicationService, ResponseInfoFactory responseInfoFactory) {
        this.ctcApplicationService = ctcApplicationService;
        this.responseInfoFactory = responseInfoFactory;
    }

    @PostMapping("/applications/_create")
    public ResponseEntity<CtcApplicationResponse> createApplication(@Valid @RequestBody CtcApplicationRequest request) {

        try {

            log.info("Creating CTC application request : {}", request);

            CtcApplication application = ctcApplicationService.createApplication(request);

            ResponseInfo responseInfo = responseInfoFactory.createResponseInfoFromRequestInfo(request.getRequestInfo(), true);

            CtcApplicationResponse response = CtcApplicationResponse.builder()
                    .responseInfo(responseInfo)
                    .ctcApplication(application)
                    .build();

            log.info("Creating CTC application response : {}", response);

            return new ResponseEntity<>(response, HttpStatus.CREATED);

        } catch (CustomException e) {
            log.error("Error creating CTC application: {}", e.getMessage());
            throw e;
        } catch (Exception e) {
            log.error("Unexpected error creating CTC application", e);
            throw new CustomException("CTC_CREATE_ERROR", "Error creating CTC application: " + e.getMessage());
        }
    }

    @PostMapping("/applications/_update")
    public ResponseEntity<CtcApplicationResponse> updateApplication(@Valid @RequestBody CtcApplicationRequest request) {

        log.info("Updating CTC application request : {}", request);

        try {
            CtcApplication application = ctcApplicationService.updateApplication(request);
            ResponseInfo responseInfo = responseInfoFactory.createResponseInfoFromRequestInfo(request.getRequestInfo(), true);

            CtcApplicationResponse response = CtcApplicationResponse.builder()
                    .responseInfo(responseInfo)
                    .ctcApplication(application)
                    .build();

            return ResponseEntity.ok(response);

        } catch (CustomException e) {
            log.error("Error updating CTC application: {}", e.getMessage());
            throw e;
        } catch (Exception e) {
            log.error("Unexpected error updating CTC application", e);
            throw new CustomException("CTC_UPDATE_ERROR", "Error updating CTC application: " + e.getMessage());
        }
    }

    @PostMapping("/applications/_search")
    public ResponseEntity<CtcApplicationSearchResponse> searchApplications(@Valid @RequestBody CtcApplicationSearchRequest request ) {

        log.info("Searching CTC applications with criteria: {}", request.getCriteria());

        try {
            List<CtcApplication> applications = ctcApplicationService.searchApplications(request);
            ResponseInfo responseInfo = responseInfoFactory.createResponseInfoFromRequestInfo(request.getRequestInfo(), true);

            CtcApplicationSearchResponse response = CtcApplicationSearchResponse.builder()
                    .responseInfo(responseInfo)
                    .ctcApplications(applications)
                    .totalCount(request.getPagination().getTotalCount())
                    .build();

            return ResponseEntity.ok(response);

        } catch (CustomException e) {
            log.error("Error searching CTC applications: {}", e.getMessage());
            throw e;
        } catch (Exception e) {
            log.error("Unexpected error searching CTC applications", e);
            throw new CustomException("CTC_SEARCH_ERROR", "Error searching CTC applications: " + e.getMessage());
        }
    }

    @PostMapping("/applications/_review")
    public ResponseEntity<CtcApplicationSearchResponse> reviewApplications(@Valid @RequestBody CtcApplicationReviewRequest request) {

        log.info("Reviewing {} CTC applications, action: {}", request.getApplications() != null ? request.getApplications().size() : 0, request.getAction());

        try {
            List<CtcApplication> applications = ctcApplicationService.reviewApplications(request);
            ResponseInfo responseInfo = responseInfoFactory.createResponseInfoFromRequestInfo(request.getRequestInfo(), true);

            CtcApplicationSearchResponse response = CtcApplicationSearchResponse.builder()
                    .responseInfo(responseInfo)
                    .ctcApplications(applications)
                    .build();

            return ResponseEntity.ok(response);

        } catch (CustomException e) {
            log.error("Error reviewing CTC applications: {}", e.getMessage());
            throw e;
        } catch (Exception e) {
            log.error("Unexpected error reviewing CTC applications", e);
            throw new CustomException("CTC_REVIEW_ERROR", "Error reviewing CTC applications: " + e.getMessage());
        }
    }

    @PostMapping("/applications/documents/issue-reject")
    public ResponseEntity<IssueCtcDocumentUpdateResponse> markDocumentsAsIssuedOrReject(@Valid @RequestBody IssueCtcDocumentUpdateRequest request) {

        log.info("Processing bulk issue/reject for {} documents", request.getDocs() != null ? request.getDocs().size() : 0);

        try {
            ctcApplicationService.markDocumentsAsIssuedOrReject(request);
            ResponseInfo responseInfo = responseInfoFactory.createResponseInfoFromRequestInfo(request.getRequestInfo(), true);

            IssueCtcDocumentUpdateResponse response = IssueCtcDocumentUpdateResponse.builder()
                    .responseInfo(responseInfo)
                    .docs(request.getDocs())
                    .build();

            return ResponseEntity.ok(response);

        } catch (CustomException e) {
            log.error("Error processing bulk issue/reject: {}", e.getMessage());
            throw e;
        } catch (Exception e) {
            log.error("Unexpected error processing bulk issue/reject", e);
            throw new CustomException("CTC_ISSUE_DOCUMENTS_UPDATE_ERROR", "Error processing bulk issue/reject: " + e.getMessage());
        }
    }

    @PostMapping("/applications/_validate")
    public ResponseEntity<ValidateUserResponse> validateUser(@Valid @RequestBody ValidateUserRequest request) {

        log.info("Validating user for CTC application with filing number: {}", request.getFilingNumber());

        try {
            ValidateUserInfo validateUserInfo = ctcApplicationService.validateUser(request);
            ResponseInfo responseInfo = responseInfoFactory.createResponseInfoFromRequestInfo(request.getRequestInfo(), true);

            ValidateUserResponse response = ValidateUserResponse.builder()
                    .responseInfo(responseInfo)
                    .validateUserInfo(validateUserInfo)
                    .build();

            return ResponseEntity.ok(response);

        } catch (CustomException e) {
            log.error("Error validating user for CTC application: {}", e.getMessage());
            throw e;
        } catch (Exception e) {
            log.error("Unexpected error validating user for CTC application", e);
            throw new CustomException("VALIDATE_USER_CTC_ERROR", "Error validating user for CTC application: " + e.getMessage());
        }
    }

}
