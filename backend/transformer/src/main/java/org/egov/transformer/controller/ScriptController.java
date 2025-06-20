package org.egov.transformer.controller;


import jakarta.validation.Valid;
import lombok.extern.slf4j.Slf4j;
import org.egov.transformer.event.impl.OrderImpl;
import org.egov.transformer.models.HearingRequest;
import org.egov.transformer.models.OrderRequest;
import org.egov.transformer.service.HearingService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestMethod;
import org.springframework.web.bind.annotation.RestController;

// remove this whole class when migration is done
@Slf4j
@RestController
public class ScriptController {

    private final OrderImpl order;
    private final HearingService hearingService;

    @Autowired
    public ScriptController(OrderImpl order, HearingService hearingService) {
        this.order = order;
        this.hearingService = hearingService;
    }


    @RequestMapping(value = "/v1/script", method = RequestMethod.POST)
    public ResponseEntity<?> hearingV1CreatePost(@Valid @RequestBody OrderRequest body) {
        try {
            order.process(body.getOrder(), body.getRequestInfo());
            return ResponseEntity.ok().build();
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }

    }


    @RequestMapping(value = "/v1/openHearing", method = RequestMethod.POST)
    public ResponseEntity<?> openHearing(@Valid @RequestBody HearingRequest body) {
        try {
            hearingService.enrichOpenHearings(body);
            log.info("enriched openHearing of hearingId: {}", body.getHearing().getHearingId());
            return ResponseEntity.ok().build();
        } catch (Exception e) {
            log.error("error in openHearing", e);
            return ResponseEntity.badRequest().body(e.getMessage());
        }

    }
}
