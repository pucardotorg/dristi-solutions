package org.pucar.dristi.web.controllers;

import jakarta.validation.Valid;
import lombok.extern.slf4j.Slf4j;
import org.pucar.dristi.service.LandingPageNoticeService;
import org.pucar.dristi.web.models.landingpagenotices.LandingPageNotice;
import org.pucar.dristi.web.models.landingpagenotices.LandingPageNoticeRequest;
import org.pucar.dristi.web.models.landingpagenotices.LandingPageNoticeResponse;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@Slf4j
@RestController
@RequestMapping("/landing-page")
public class LandingPageNoticeController {

    private final LandingPageNoticeService landingPageNoticeService;

    @Autowired
    public LandingPageNoticeController(LandingPageNoticeService landingPageNoticeService) {
        this.landingPageNoticeService = landingPageNoticeService;
    }

    @PostMapping("/v1/notices")
    public ResponseEntity<LandingPageNoticeResponse> addNotices(@Valid LandingPageNoticeRequest landingPageNoticeRequest) {
        log.info("Received request to add notices: status :: IN_PROGRESS {}", landingPageNoticeRequest);
        LandingPageNotice landingPageNotice = landingPageNoticeService.addNotices(landingPageNoticeRequest);
        log.info("Received request to add notices: status :: COMPLETED {}", landingPageNoticeRequest);
        return null;
    }

}