package org.pucar.dristi.evidence_enrichment.controller;

import org.pucar.dristi.evidence_enrichment.models.Artifact;
import org.pucar.dristi.evidence_enrichment.models.EvidenceSearchCriteria;
import org.pucar.dristi.evidence_enrichment.models.EvidenceSearchRequest;
import org.pucar.dristi.evidence_enrichment.service.EvidenceEnrichmentService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestMethod;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/evidence-enrichment")
public class EvidenceEnrichmentController {

    private final EvidenceEnrichmentService evidenceEnrichmentService;

    @Autowired
    public EvidenceEnrichmentController(EvidenceEnrichmentService evidenceEnrichmentService) {
        this.evidenceEnrichmentService = evidenceEnrichmentService;
    }

    @RequestMapping(value = "/v1/enrich", method = RequestMethod.POST)
    public ResponseEntity<?> enrichExistingEvidence(@RequestBody EvidenceSearchRequest searchRequest) {
        List<Artifact> artifacts = evidenceEnrichmentService.enrichExistingEvidence(searchRequest);
        return ResponseEntity.ok(artifacts);
    }

}
