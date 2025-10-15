package digit.web.controllers;

import digit.web.models.*;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;

@jakarta.annotation.Generated(value = "org.egov.codegen.SpringBootCodegen", date = "2025-10-14T19:19:54.104875784+05:30[Asia/Kolkata]")
@Controller
@RequestMapping("")
public class InPortalSurveyController {

    @PostMapping("/feedback")
    public ResponseEntity<FeedBackResponse> createFeedBack(@RequestBody FeedBackRequest feedBackRequest) {
        return new ResponseEntity<>(FeedBackResponse.builder().build(), HttpStatus.OK);
    }

    @PostMapping("/eligibility")
    public ResponseEntity<EligibilityResponse> createEligibility(@RequestBody EligibilityRequest eligibilityRequest) {
        return new ResponseEntity<>(EligibilityResponse.builder().build(), HttpStatus.OK);
    }

    @PostMapping("/remind-me-later")
    public ResponseEntity<RemindMeLaterResponse> createRemindMeLater(@RequestBody RemindMeLaterRequest remindMeLaterRequest) {
        return new ResponseEntity<>(RemindMeLaterResponse.builder().build(), HttpStatus.OK);
    }

}
