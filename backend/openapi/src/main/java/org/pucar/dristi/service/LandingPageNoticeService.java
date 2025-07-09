package org.pucar.dristi.service;

import lombok.extern.slf4j.Slf4j;
import org.egov.tracer.model.CustomException;
import org.pucar.dristi.enrichment.LandingPageNoticeEnrichment;
import org.pucar.dristi.repository.LandingPageNoticeRepository;
import org.pucar.dristi.validators.LandingPageNoticeValidator;
import org.pucar.dristi.web.models.landingpagenotices.LandingPageNotice;
import org.pucar.dristi.web.models.landingpagenotices.LandingPageNoticeRequest;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

@Service
@Slf4j
public class LandingPageNoticeService {

    private final LandingPageNoticeValidator landingPageNoticeValidator;

    private final LandingPageNoticeEnrichment landingPageNoticeEnrichment;

    private final LandingPageNoticeRepository landingPageNoticeRepository;

    @Autowired
    public LandingPageNoticeService(LandingPageNoticeValidator landingPageNoticeValidator, LandingPageNoticeEnrichment landingPageNoticeEnrichment, LandingPageNoticeRepository landingPageNoticeRepository) {
        this.landingPageNoticeValidator = landingPageNoticeValidator;
        this.landingPageNoticeEnrichment = landingPageNoticeEnrichment;
        this.landingPageNoticeRepository = landingPageNoticeRepository;
    }

    public LandingPageNotice addNotices(LandingPageNoticeRequest landingPageNoticeRequest) {
        try {
            log.info("operation = addNotices, status :: IN_PROGRESS {}", landingPageNoticeRequest);

            // validate request
            landingPageNoticeValidator.validateSaveDiaryEntry(landingPageNoticeRequest);

            // enrich request
            landingPageNoticeEnrichment.enrichCreateNotice(landingPageNoticeRequest);

            // save to db
            LandingPageNotice landingPageNotice = landingPageNoticeRequest.getLandingPageNotice();
            landingPageNoticeRepository.save(landingPageNotice);
            log.info("operation = addNotices, status :: COMPLETED {}", landingPageNoticeRequest);
            return landingPageNotice;
        } catch (CustomException e) {
            log.error("Error while adding notices: {}", e.getMessage(), e);
            throw new CustomException("LANDING_PAGE_NOTICE_SERVICE_EXCEPTION", "Error occurred while adding notices");
        }
    }

}
