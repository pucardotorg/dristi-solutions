package org.pucar.dristi.web.controllers;

import jakarta.validation.Valid;
import lombok.extern.slf4j.Slf4j;
import org.pucar.dristi.service.WitnessDepositionService;
import org.pucar.dristi.web.models.witnessdeposition.OpenApiEvidenceResponse;
import org.pucar.dristi.web.models.witnessdeposition.OpenApiEvidenceSearchRequest;
import org.pucar.dristi.web.models.witnessdeposition.OpenApiEvidenceUpdateRequest;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/openapi/v1/witness_deposition")
@Slf4j
public class WitnessDepositionController {

    private final WitnessDepositionService witnessDepositionService;

    @Autowired
    public WitnessDepositionController(WitnessDepositionService witnessDepositionService) {
        this.witnessDepositionService = witnessDepositionService;
    }

    @PostMapping(value = "/search")
    public ResponseEntity<OpenApiEvidenceResponse> searchWitnessDeposition(@RequestBody @Valid OpenApiEvidenceSearchRequest openApiEvidenceSearchRequest) {
        log.info("Received request to search witness deposition method : status :: IN_PROGRESS {}", openApiEvidenceSearchRequest);
        OpenApiEvidenceResponse response = witnessDepositionService.searchWitnessDepositionByMobileNumber(openApiEvidenceSearchRequest);
        log.info("Received request to search witness deposition: status :: COMPLETED {}", openApiEvidenceSearchRequest);
        return new ResponseEntity<>(response, HttpStatus.OK);
    }

    @PostMapping(value = "/update")
    public ResponseEntity<OpenApiEvidenceResponse> updateWitnessDeposition(@RequestBody @Valid OpenApiEvidenceUpdateRequest openApiEvidenceUpdateRequest) {
        log.info("Received request to update witness deposition: status :: IN_PROGRESS {}", openApiEvidenceUpdateRequest);
        OpenApiEvidenceResponse response = witnessDepositionService.updateWitnessDeposition(openApiEvidenceUpdateRequest);
        log.info("Received request to update witness deposition: status :: COMPLETED {}", openApiEvidenceUpdateRequest);
        return new ResponseEntity<>(response, HttpStatus.OK);
    }

}
