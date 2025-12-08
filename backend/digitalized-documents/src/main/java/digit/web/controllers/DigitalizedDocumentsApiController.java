package digit.web.controllers;


import digit.service.DigitalizedDocumentService;
import digit.util.ResponseInfoFactory;
import digit.web.models.*;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.enums.ParameterIn;
import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.Valid;
import lombok.extern.slf4j.Slf4j;
import org.egov.common.contract.response.ResponseInfo;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestMethod;

import java.util.List;

@Slf4j
@jakarta.annotation.Generated(value = "org.egov.codegen.SpringBootCodegen", date = "2025-11-25T18:36:45.881826585+05:30[Asia/Kolkata]")
@Controller
@RequestMapping("")
public class DigitalizedDocumentsApiController {

    private final DigitalizedDocumentService digitalizedDocumentService;

    private final ResponseInfoFactory responseInfoFactory;

    @Autowired
    public DigitalizedDocumentsApiController(DigitalizedDocumentService digitalizedDocumentService, ResponseInfoFactory responseInfoFactory) {
        this.digitalizedDocumentService = digitalizedDocumentService;
        this.responseInfoFactory = responseInfoFactory;
    }

    @RequestMapping(value = "/v1/_create", method = RequestMethod.POST)
    public ResponseEntity<DigitalizedDocumentResponse> digitalizedDocumentsV1CreatePost(@Parameter(in = ParameterIn.DEFAULT, description = "Details for the new digitalized document + RequestInfo meta data.", required = true, schema = @Schema()) @Valid @RequestBody DigitalizedDocumentRequest body) {
        log.info("api = /v1/_create, result = IN_PROGRESS, {}", body);
        DigitalizedDocument digitalizedDocument = digitalizedDocumentService.createDigitalizedDocument(body);
        ResponseInfo responseInfo = responseInfoFactory.createResponseInfoFromRequestInfo(body.getRequestInfo(), true);
        DigitalizedDocumentResponse digitalizedDocumentResponse = DigitalizedDocumentResponse.builder()
                .digitalizedDocument(digitalizedDocument)
                .responseInfo(responseInfo)
                .build();
        log.info("api = /v1/_create, result = SUCCESS, {}", digitalizedDocumentResponse);
        return new ResponseEntity<>(digitalizedDocumentResponse, HttpStatus.OK);
    }

    @RequestMapping(value = "/v1/_search", method = RequestMethod.POST)
    public ResponseEntity<DigitalizedDocumentSearchResponse> digitalizedDocumentsV1SearchPost(@Parameter(in = ParameterIn.DEFAULT, description = "Search criteria + RequestInfo meta data.", required = true, schema = @Schema()) @Valid @RequestBody DigitalizedDocumentSearchRequest body) {
        log.info("api = /v1/_search, result = IN_PROGRESS, {}", body);
        List<DigitalizedDocument> digitalizedDocuments = digitalizedDocumentService.searchDigitalizedDocument(body);
        ResponseInfo responseInfo = responseInfoFactory.createResponseInfoFromRequestInfo(body.getRequestInfo(), true);
        
        int totalCount;
        if (body.getPagination() != null) {
            totalCount = body.getPagination().getTotalCount().intValue();
        } else {
            totalCount = digitalizedDocuments.size();
        }
        
        DigitalizedDocumentSearchResponse digitalizedDocumentSearchResponse = DigitalizedDocumentSearchResponse.builder()
                .documents(digitalizedDocuments)
                .responseInfo(responseInfo)
                .totalCount(totalCount)
                .build();
        log.info("api = /v1/_search, result = SUCCESS, {}", digitalizedDocumentSearchResponse);
        return new ResponseEntity<>(digitalizedDocumentSearchResponse, HttpStatus.OK);
    }

    @RequestMapping(value = "/v1/_update", method = RequestMethod.POST)
    public ResponseEntity<DigitalizedDocumentResponse> digitalizedDocumentsV1UpdatePost(@Parameter(in = ParameterIn.DEFAULT, description = "Details for updating the digitalized document + RequestInfo meta data.", required = true, schema = @Schema()) @Valid @RequestBody DigitalizedDocumentRequest body) {
        log.info("api = /v1/_update, result = IN_PROGRESS, {}", body);
        DigitalizedDocument digitalizedDocument = digitalizedDocumentService.updateDigitalizedDocument(body);
        ResponseInfo responseInfo = responseInfoFactory.createResponseInfoFromRequestInfo(body.getRequestInfo(), true);
        DigitalizedDocumentResponse digitalizedDocumentResponse = DigitalizedDocumentResponse.builder()
                .digitalizedDocument(digitalizedDocument)
                .responseInfo(responseInfo)
                .build();
        log.info("api = /v1/_update, result = SUCCESS, {}", digitalizedDocumentResponse);
        return new ResponseEntity<>(digitalizedDocumentResponse, HttpStatus.OK);
    }

    @PostMapping("/v1/_getDigitalizedDocumentsToSign")
    public ResponseEntity<DigitalizedDocumentsToSignResponse> getDigitalizedDocumentsToSign(@Parameter(in = ParameterIn.DEFAULT, description = "Get digitalized documents to sign based on criteria", required = true, schema = @Schema()) @Valid @RequestBody DigitalizedDocumentsToSignRequest request) {
        log.info("api = /v1/_getDigitalizedDocumentsToSign, result = IN_PROGRESS, {}", request);
        List<DigitalizedDocumentToSign> documentList = digitalizedDocumentService.getDigitalizedDocumentsToSign(request);
        ResponseInfo responseInfo = responseInfoFactory.createResponseInfoFromRequestInfo(request.getRequestInfo(), true);
        
        DigitalizedDocumentsToSignResponse response = DigitalizedDocumentsToSignResponse.builder()
                .responseInfo(responseInfo)
                .documentList(documentList)
                .build();
        log.info("api = /v1/_getDigitalizedDocumentsToSign, result = SUCCESS, {}", response);
        return new ResponseEntity<>(response, HttpStatus.OK);
    }

    @PostMapping("/v1/_updateSignedDigitalizedDocuments")
    public ResponseEntity<UpdateSignedDigitalizedDocumentResponse> updateSignedDigitalizedDocuments(@Parameter(in = ParameterIn.DEFAULT, description = "Update signed digitalized documents", required = true, schema = @Schema()) @Valid @RequestBody UpdateSignedDigitalizedDocumentRequest request) {
        log.info("api = /v1/_updateSignedDigitalizedDocuments, result = IN_PROGRESS, {}", request);
        List<DigitalizedDocument> documents = digitalizedDocumentService.updateSignedDigitalizedDocuments(request);
        ResponseInfo responseInfo = responseInfoFactory.createResponseInfoFromRequestInfo(request.getRequestInfo(), true);
        
        UpdateSignedDigitalizedDocumentResponse response = UpdateSignedDigitalizedDocumentResponse.builder()
                .responseInfo(responseInfo)
                .documents(documents)
                .build();
        log.info("api = /v1/_updateSignedDigitalizedDocuments, result = SUCCESS, {}", response);
        return new ResponseEntity<>(response, HttpStatus.OK);
    }



}
