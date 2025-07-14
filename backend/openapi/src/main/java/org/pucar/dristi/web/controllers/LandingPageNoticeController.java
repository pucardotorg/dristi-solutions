package org.pucar.dristi.web.controllers;

import jakarta.validation.Valid;
import lombok.extern.slf4j.Slf4j;
import org.egov.common.contract.response.ResponseInfo;
import org.pucar.dristi.service.LandingPageNoticeService;
import org.pucar.dristi.util.ResponseInfoFactory;
import org.pucar.dristi.web.models.landingpagenotices.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@Slf4j
@RestController
@RequestMapping("openapi/landing-page")
public class LandingPageNoticeController {

    private final LandingPageNoticeService landingPageNoticeService;

    private final ResponseInfoFactory responseInfoFactory;

    @Autowired
    public LandingPageNoticeController(LandingPageNoticeService landingPageNoticeService, ResponseInfoFactory responseInfoFactory) {
        this.landingPageNoticeService = landingPageNoticeService;
        this.responseInfoFactory = responseInfoFactory;
    }

    @PostMapping("/v1/add-notices")
    public ResponseEntity<LandingPageNoticeResponse> addNotices(@Valid @RequestBody LandingPageNoticeRequest landingPageNoticeRequest) {
        log.info("Received request to add notices: status :: IN_PROGRESS {}", landingPageNoticeRequest);
        LandingPageNotice landingPageNotice = landingPageNoticeService.addNotices(landingPageNoticeRequest);
        ResponseInfo responseInfo = responseInfoFactory.createResponseInfoFromRequestInfo(landingPageNoticeRequest.getRequestInfo(), true);
        LandingPageNoticeResponse landingPageNoticeResponse = LandingPageNoticeResponse.builder().responseInfo(responseInfo).landingPageNotice(landingPageNotice).build();
        log.info("Received request to add notices: status :: COMPLETED {}", landingPageNoticeRequest);
        return new ResponseEntity<>(landingPageNoticeResponse, HttpStatus.OK);
    }

    @PostMapping("/v1/update-notices")
    public ResponseEntity<LandingPageNoticeResponse> updateNotices(@Valid @RequestBody LandingPageNoticeRequest landingPageNoticeRequest) {
        log.info("Received request to update notices: status :: IN_PROGRESS {}", landingPageNoticeRequest);
        LandingPageNotice landingPageNotice = landingPageNoticeService.updateNotices(landingPageNoticeRequest);
        ResponseInfo responseInfo = responseInfoFactory.createResponseInfoFromRequestInfo(landingPageNoticeRequest.getRequestInfo(), true);
        LandingPageNoticeResponse landingPageNoticeResponse = LandingPageNoticeResponse.builder().responseInfo(responseInfo).landingPageNotice(landingPageNotice).build();
        log.info("Received request to update notices: status :: COMPLETED {}", landingPageNoticeRequest);
        return new ResponseEntity<>(landingPageNoticeResponse, HttpStatus.OK);
    }

    @PostMapping("/v1/search-notices")
    public ResponseEntity<LandingPageNoticeSearchResponse> searchNotices(@Valid @RequestBody LandingPageNoticeSearchCriteria searchCriteria) {
        log.info("Received request to search notices: status :: IN_PROGRESS {}", searchCriteria);
        List<LandingPageNotice> notices = landingPageNoticeService.searchNoticesPaginated(searchCriteria);
        long totalCount = (searchCriteria.getSearchText() == null || searchCriteria.getSearchText().isEmpty())
                ? landingPageNoticeService.countAll()
                : landingPageNoticeService.countByTitle(searchCriteria.getSearchText());
        LandingPageNoticeSearchResponse response = LandingPageNoticeSearchResponse.builder()
                .landingPageNotices(notices)
                .totalCount(totalCount)
                .offset(searchCriteria.getOffset() != null ? searchCriteria.getOffset() : 0)
                .limit(searchCriteria.getLimit() != null ? searchCriteria.getLimit() : 10)
                .build();
        log.info("Received request to search notices: status :: COMPLETED {}", searchCriteria);
        return ResponseEntity.ok(response);
    }
}