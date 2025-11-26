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
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestMethod;

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
        return null;
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

}
