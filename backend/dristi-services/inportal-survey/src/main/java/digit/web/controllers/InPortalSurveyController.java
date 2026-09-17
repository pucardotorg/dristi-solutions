package digit.web.controllers;

import digit.service.InPortalSurveyService;
import digit.util.ResponseInfoFactory;
import digit.web.models.*;
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

@Slf4j
@jakarta.annotation.Generated(value = "org.egov.codegen.SpringBootCodegen", date = "2025-10-14T19:19:54.104875784+05:30[Asia/Kolkata]")
@Controller
@RequestMapping("/v1")
public class InPortalSurveyController {

    private final InPortalSurveyService inPortalSurveyService;

    private final ResponseInfoFactory responseInfoFactory;

    @Autowired
    public InPortalSurveyController(InPortalSurveyService inPortalSurveyService, ResponseInfoFactory responseInfoFactory) {
        this.inPortalSurveyService = inPortalSurveyService;
        this.responseInfoFactory = responseInfoFactory;
    }


    @PostMapping("/feedback")
    public ResponseEntity<FeedBackResponse> createFeedBack(@RequestBody @Valid FeedBackRequest feedBackRequest) {
        log.info("api = /feedback, result = IN_PROGRESS");
        FeedBack feedBack = inPortalSurveyService.createFeedBack(feedBackRequest);
        ResponseInfo responseInfo = responseInfoFactory.createResponseInfoFromRequestInfo(feedBackRequest.getRequestInfo(), true);
        log.info("api = /feedback, result = SUCCESS");
        return new ResponseEntity<>(FeedBackResponse.builder().feedback(feedBack).responseInfo(responseInfo).build(), HttpStatus.OK);
    }

    @PostMapping("/eligibility")
    public ResponseEntity<EligibilityResponse> createEligibility(@RequestBody @Valid EligibilityRequest eligibilityRequest) {
        log.info("api = /eligibility, result = IN_PROGRESS");
        Eligibility eligibilityResponse = inPortalSurveyService.checkEligibility(eligibilityRequest);
        ResponseInfo responseInfo = responseInfoFactory.createResponseInfoFromRequestInfo(eligibilityRequest.getRequestInfo(), true);
        log.info("api = /eligibility, result = SUCCESS");
        return new ResponseEntity<>(EligibilityResponse.builder().eligibility(eligibilityResponse).responseInfo(responseInfo).build(), HttpStatus.OK);
    }

    @PostMapping("/remind-me-later")
    public ResponseEntity<RemindMeLaterResponse> createRemindMeLater(@RequestBody @Valid RemindMeLaterRequest remindMeLaterRequest) {
        log.info("api = /remind-me-later, result = IN_PROGRESS");
        inPortalSurveyService.createRemindMeLater(remindMeLaterRequest);
        ResponseInfo responseInfo = responseInfoFactory.createResponseInfoFromRequestInfo(remindMeLaterRequest.getRequestInfo(), true);
        log.info("api = /remind-me-later, result = SUCCESS");
        return new ResponseEntity<>(RemindMeLaterResponse.builder().responseInfo(responseInfo).build(), HttpStatus.OK);
    }

}
