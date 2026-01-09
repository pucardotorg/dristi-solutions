package org.pucar.dristi.web.controllers;

import jakarta.validation.Valid;
import lombok.extern.slf4j.Slf4j;
import org.pucar.dristi.service.DigitalDocumentService;
import org.pucar.dristi.web.models.digital_document.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/openapi/v1/digitalized_document")
@Slf4j
public class DigitalizedDocumentController {

    private final DigitalDocumentService digitalDocumentService;

    @Autowired
    public DigitalizedDocumentController(DigitalDocumentService digitalDocumentService) {
        this.digitalDocumentService = digitalDocumentService;
    }

    @PostMapping(value = "/search")
    public ResponseEntity<DigitalizedDocumentSearchResponse> searchDigitalDocument(@RequestBody @Valid OpenApiDigitalDocumentSearchRequest openApiDigitalDocumentSearchRequest) {
        log.info("Received request to search document method : status :: IN_PROGRESS {}", openApiDigitalDocumentSearchRequest);
        DigitalizedDocumentSearchResponse response = digitalDocumentService.searchDigitalDocument(openApiDigitalDocumentSearchRequest);
        log.info("Received request to search document: status :: COMPLETED {}", openApiDigitalDocumentSearchRequest);
        return new ResponseEntity<>(response, HttpStatus.OK);
    }

    @PostMapping(value = "/update")
    public ResponseEntity<DigitalizedDocumentResponse> updateDigitalDocument(@RequestBody @Valid OpenApiDigitalDocumentRequest openApiDigitalDocumentRequest) {
        log.info("Received request to update document: status :: IN_PROGRESS {}", openApiDigitalDocumentRequest);
        DigitalizedDocumentResponse response = digitalDocumentService.updateDigitalDocument(openApiDigitalDocumentRequest);
        log.info("Received request to update document: status :: COMPLETED {}", openApiDigitalDocumentRequest);
        return new ResponseEntity<>(response, HttpStatus.OK);
    }

}
