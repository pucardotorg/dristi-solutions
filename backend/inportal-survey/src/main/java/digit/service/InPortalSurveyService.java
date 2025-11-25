package digit.service;

import digit.config.Configuration;
import digit.enrichment.InPortalSurveyEnrichment;
import digit.kafka.Producer;
import digit.repository.InPortalSurveyRepository;
import digit.validators.InportalSurveyValidations;
import digit.web.models.*;
import lombok.extern.slf4j.Slf4j;
import org.egov.common.contract.request.RequestInfo;
import org.egov.tracer.model.CustomException;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;

import static digit.config.ServiceConstants.*;

@Service
@Slf4j
public class InPortalSurveyService {

    private final InportalSurveyValidations validations;
    private final InPortalSurveyRepository repository;
    private final InPortalSurveyEnrichment enrichment;
    private final Configuration config;
    private final Producer producer;

    @Autowired
    public InPortalSurveyService(InportalSurveyValidations validations,
                                 InPortalSurveyRepository repository,
                                 InPortalSurveyEnrichment enrichment,
                                 Configuration config,
                                 Producer producer) {
        this.validations = validations;
        this.repository = repository;
        this.enrichment = enrichment;
        this.config = config;
        this.producer = producer;
    }

    public Eligibility checkEligibility(EligibilityRequest request) {
        String userUuid = request.getRequestInfo().getUserInfo().getUuid();
        log.info("operation=checkEligibility, status=IN_PROGRESS, userUuid={}, request={}", userUuid, request);

        try {
            // Step 1: Validate the request
            validations.validateEligibilityRequest(request);

            // Step 2: Fetch existing survey tracker
            List<SurveyTracker> trackers = repository.getSurveyTracker(request.getRequestInfo());

            if (trackers.isEmpty()) {
                // No existing tracker — create a new one
                log.info("No existing survey tracker found for userUuid={}. Creating a new one.", userUuid);

                SurveyTracker newTracker = enrichment.enrichCreateSurveyTracker(request);
                SurveyTrackerRequest trackerRequest = buildSurveyTrackerRequest(request.getRequestInfo(), newTracker);

                producer.push(config.getCreateSurveyTrackerTopic(), trackerRequest);
                log.info("New survey tracker created for userUuid={}", userUuid);

                return Eligibility.builder().isEligible(true).build();
            }

            if (trackers.size() > 1) {
                // Multiple trackers — invalid state
                String error = String.format("Multiple survey trackers found for userUuid=%s", userUuid);
                log.error(error);
                throw new CustomException(ELIGIBILITY_CHECK_EXCEPTION, error);
            }

            // Step 3: Update existing tracker
            SurveyTracker existingTracker = trackers.get(0);
            existingTracker = enrichment.enrichSurveyTrackerForEligibilityCheck(request, existingTracker);

            SurveyTrackerRequest trackerRequest = buildSurveyTrackerRequest(request.getRequestInfo(), existingTracker);

            // Step 4: Validate eligibility
            boolean isEligible = validations.validateEligibility(existingTracker, request.getRequestInfo());

            producer.push(config.getUpdateSurveyTrackerTopic(), trackerRequest);

            log.info("Survey tracker updated successfully for userUuid={}, eligibility={}", userUuid, isEligible);
            return Eligibility.builder().isEligible(isEligible).build();

        } catch (CustomException e) {
            log.error("operation=checkEligibility, status=FAILED, userUuid={}, reason={}", userUuid, e.getMessage());
            throw new CustomException(ELIGIBILITY_CHECK_EXCEPTION, e.getMessage());
        }
    }

    public void createRemindMeLater(RemindMeLaterRequest request) {

        log.info("operation=createRemindMeLater, status=IN_PROGRESS, request={}", request);

        try {

            // Step 1: Validate the request
            validations.validateRemindMeLaterRequest(request);

            // step 2: Fetch existing survey tracker
            List<SurveyTracker> trackers = repository.getSurveyTracker(request.getRequestInfo());

            if (trackers.isEmpty()) {
                throw new CustomException(REMIND_ME_LATER_EXCEPTION, "No existing survey tracker found for userUuid=" + request.getRequestInfo().getUserInfo().getUuid());
            }

            if (trackers.size() > 1) {
                throw new CustomException(REMIND_ME_LATER_EXCEPTION, "Multiple survey trackers found for userUuid=" + request.getRequestInfo().getUserInfo().getUuid());
            }

            SurveyTracker tracker = trackers.get(0);

            tracker = enrichment.enrichSurveyTrackerForRemindMeLater(request, tracker);

            SurveyTrackerRequest trackerRequest = buildSurveyTrackerRequest(request.getRequestInfo(), tracker);
            producer.push(config.getUpdateExpiryDateTopic(), trackerRequest);

            log.info("operation=createRemindMeLater, status=SUCCESS, request={}", request);


        } catch (CustomException e) {
            log.error("operation=createRemindMeLater, status=FAILED, reason={}", e.getMessage());
            throw new CustomException(REMIND_ME_LATER_EXCEPTION, e.getMessage());
        }
    }

    public FeedBack createFeedBack(FeedBackRequest request) {

        log.info("operation=createFeedBack, status=IN_PROGRESS, request={}", request);

        try {

            // Step 1: Validate the request
            validations.validateFeedBackRequest(request);

            // Step 2: Fetch existing survey tracker
            List<SurveyTracker> trackers = repository.getSurveyTracker(request.getRequestInfo());

            if (trackers.isEmpty()) {
                throw new CustomException(FEED_BACK_EXCEPTION, "No existing survey tracker found for userUuid=" + request.getRequestInfo().getUserInfo().getUuid());
            }

            if (trackers.size() > 1) {
                throw new CustomException(FEED_BACK_EXCEPTION, "Multiple survey trackers found for userUuid=" + request.getRequestInfo().getUserInfo().getUuid());
            }

            SurveyTracker tracker = trackers.get(0);

            tracker = enrichment.enrichSurveyTrackerForFeedBack(request, tracker);

            SurveyTrackerRequest trackerRequest = buildSurveyTrackerRequest(request.getRequestInfo(), tracker);
            producer.push(config.getUpdateExpiryDateTopic(), trackerRequest);
            producer.push(config.getCreateFeedBackTopic(), request);

            log.info("operation=createFeedBack, status=SUCCESS, request={}", request);

            return request.getFeedBack();

        } catch (CustomException e) {
            log.error("operation=createFeedBack, status=FAILED, reason={}", e.getMessage());
            throw new CustomException(FEED_BACK_EXCEPTION, e.getMessage());
        }

    }

    private SurveyTrackerRequest buildSurveyTrackerRequest(RequestInfo requestInfo, SurveyTracker tracker) {
        return SurveyTrackerRequest.builder()
                .requestInfo(requestInfo)
                .surveyTracker(tracker)
                .build();
    }

}