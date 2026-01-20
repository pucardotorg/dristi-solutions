package digit.web.controllers;


import com.fasterxml.jackson.databind.ObjectMapper;
import digit.web.models.*;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.enums.ParameterIn;
import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestMethod;

import java.io.IOException;

@jakarta.annotation.Generated(value = "org.egov.codegen.SpringBootCodegen", date = "2026-01-20T20:30:21.456282080+05:30[Asia/Kolkata]")
@Controller
@RequestMapping("")
public class AdvocateOfficeApiController {

    private final ObjectMapper objectMapper;

    private final HttpServletRequest request;

    @Autowired
    public AdvocateOfficeApiController(ObjectMapper objectMapper, HttpServletRequest request) {
        this.objectMapper = objectMapper;
        this.request = request;
    }

    @RequestMapping(value = "/advocate-office/v1/_addMember", method = RequestMethod.POST)
    public ResponseEntity<AddMemberResponse> advocateOfficeV1AddMemberPost(@Parameter(in = ParameterIn.DEFAULT, description = "Details for adding a member to the office + RequestInfo meta data.", required = true, schema = @Schema()) @Valid @RequestBody AddMemberRequest body) {
        String accept = request.getHeader("Accept");
        if (accept != null && accept.contains("application/json")) {
            try {
                return new ResponseEntity<AddMemberResponse>(objectMapper.readValue("{  \"ResponseInfo\" : {    \"ver\" : \"ver\",    \"resMsgId\" : \"resMsgId\",    \"msgId\" : \"msgId\",    \"apiId\" : \"apiId\",    \"ts\" : 0,    \"status\" : \"SUCCESSFUL\"  },  \"addMember\" : {    \"accessType\" : \"ALL_CASES\",    \"officeAdvocateId\" : \"046b6c7f-0b8a-43b9-b35d-6489e6daee91\",    \"auditDetails\" : {      \"lastModifiedTime\" : 1,      \"createdBy\" : \"createdBy\",      \"lastModifiedBy\" : \"lastModifiedBy\",      \"createdTime\" : 6    },    \"memberName\" : \"memberName\",    \"id\" : \"046b6c7f-0b8a-43b9-b35d-6489e6daee91\",    \"memberType\" : \"ADVOCATE\",    \"memberMobileNumber\" : \"memberMobileNumber\",    \"allowCaseCreate\" : true,    \"addNewCasesAutomatically\" : true,    \"memberId\" : \"046b6c7f-0b8a-43b9-b35d-6489e6daee91\"  }}", AddMemberResponse.class), HttpStatus.NOT_IMPLEMENTED);
            } catch (IOException e) {
                return new ResponseEntity<AddMemberResponse>(HttpStatus.INTERNAL_SERVER_ERROR);
            }
        }

        return new ResponseEntity<AddMemberResponse>(HttpStatus.NOT_IMPLEMENTED);
    }

    @RequestMapping(value = "/advocate-office/v1/_leaveOffice", method = RequestMethod.POST)
    public ResponseEntity<LeaveOfficeResponse> advocateOfficeV1LeaveOfficePost(@Parameter(in = ParameterIn.DEFAULT, description = "Details for leaving the office + RequestInfo meta data.", required = true, schema = @Schema()) @Valid @RequestBody LeaveOfficeRequest body) {
        String accept = request.getHeader("Accept");
        if (accept != null && accept.contains("application/json")) {
            try {
                return new ResponseEntity<LeaveOfficeResponse>(objectMapper.readValue("{  \"ResponseInfo\" : {    \"ver\" : \"ver\",    \"resMsgId\" : \"resMsgId\",    \"msgId\" : \"msgId\",    \"apiId\" : \"apiId\",    \"ts\" : 0,    \"status\" : \"SUCCESSFUL\"  },  \"leaveOffice\" : {    \"officeAdvocateId\" : \"046b6c7f-0b8a-43b9-b35d-6489e6daee91\",    \"id\" : \"046b6c7f-0b8a-43b9-b35d-6489e6daee91\",    \"memberType\" : \"ADVOCATE\",    \"memberId\" : \"046b6c7f-0b8a-43b9-b35d-6489e6daee91\"  }}", LeaveOfficeResponse.class), HttpStatus.NOT_IMPLEMENTED);
            } catch (IOException e) {
                return new ResponseEntity<LeaveOfficeResponse>(HttpStatus.INTERNAL_SERVER_ERROR);
            }
        }

        return new ResponseEntity<LeaveOfficeResponse>(HttpStatus.NOT_IMPLEMENTED);
    }

    @RequestMapping(value = "/advocate-office/v1/_searchMember", method = RequestMethod.POST)
    public ResponseEntity<MemberSearchResponse> advocateOfficeV1SearchMemberPost(@Parameter(in = ParameterIn.DEFAULT, description = "Search criteria for members + RequestInfo meta data.", required = true, schema = @Schema()) @Valid @RequestBody MemberSearchRequest body) {
        String accept = request.getHeader("Accept");
        if (accept != null && accept.contains("application/json")) {
            try {
                return new ResponseEntity<MemberSearchResponse>(objectMapper.readValue("{  \"ResponseInfo\" : {    \"ver\" : \"ver\",    \"resMsgId\" : \"resMsgId\",    \"msgId\" : \"msgId\",    \"apiId\" : \"apiId\",    \"ts\" : 0,    \"status\" : \"SUCCESSFUL\"  },  \"pagination\" : {    \"offSet\" : 6.027456183070403,    \"limit\" : 8.008281904610115,    \"sortBy\" : \"sortBy\",    \"totalCount\" : 1.4658129805029452,    \"order\" : \"\"  },  \"members\" : [ {    \"accessType\" : \"ALL_CASES\",    \"officeAdvocateId\" : \"046b6c7f-0b8a-43b9-b35d-6489e6daee91\",    \"auditDetails\" : {      \"lastModifiedTime\" : 1,      \"createdBy\" : \"createdBy\",      \"lastModifiedBy\" : \"lastModifiedBy\",      \"createdTime\" : 6    },    \"memberName\" : \"memberName\",    \"id\" : \"046b6c7f-0b8a-43b9-b35d-6489e6daee91\",    \"memberType\" : \"ADVOCATE\",    \"memberMobileNumber\" : \"memberMobileNumber\",    \"allowCaseCreate\" : true,    \"addNewCasesAutomatically\" : true,    \"memberId\" : \"046b6c7f-0b8a-43b9-b35d-6489e6daee91\"  }, {    \"accessType\" : \"ALL_CASES\",    \"officeAdvocateId\" : \"046b6c7f-0b8a-43b9-b35d-6489e6daee91\",    \"auditDetails\" : {      \"lastModifiedTime\" : 1,      \"createdBy\" : \"createdBy\",      \"lastModifiedBy\" : \"lastModifiedBy\",      \"createdTime\" : 6    },    \"memberName\" : \"memberName\",    \"id\" : \"046b6c7f-0b8a-43b9-b35d-6489e6daee91\",    \"memberType\" : \"ADVOCATE\",    \"memberMobileNumber\" : \"memberMobileNumber\",    \"allowCaseCreate\" : true,    \"addNewCasesAutomatically\" : true,    \"memberId\" : \"046b6c7f-0b8a-43b9-b35d-6489e6daee91\"  } ],  \"totalCount\" : 5}", MemberSearchResponse.class), HttpStatus.NOT_IMPLEMENTED);
            } catch (IOException e) {
                return new ResponseEntity<MemberSearchResponse>(HttpStatus.INTERNAL_SERVER_ERROR);
            }
        }

        return new ResponseEntity<MemberSearchResponse>(HttpStatus.NOT_IMPLEMENTED);
    }

}
