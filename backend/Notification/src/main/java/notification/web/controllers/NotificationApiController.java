package notification.web.controllers;


import com.fasterxml.jackson.databind.ObjectMapper;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.enums.ParameterIn;
import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import notification.web.models.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestMethod;

import java.io.IOException;

@jakarta.annotation.Generated(value = "org.egov.codegen.SpringBootCodegen", date = "2025-02-07T11:59:26.022967807+05:30[Asia/Kolkata]")
@Controller
@RequestMapping("")
public class NotificationApiController {

    private final ObjectMapper objectMapper;

    private final HttpServletRequest request;

    @Autowired
    public NotificationApiController(ObjectMapper objectMapper, HttpServletRequest request) {
        this.objectMapper = objectMapper;
        this.request = request;
    }

    @RequestMapping(value = "/v1/create", method = RequestMethod.POST)
    public ResponseEntity<NotificationResponse> notificationV1CreatePost(@Parameter(in = ParameterIn.DEFAULT, description = "Details for the new Notification + RequestInfo meta data.", required = true, schema = @Schema()) @Valid @RequestBody NotificationRequest body) {
        String accept = request.getHeader("Accept");
        if (accept != null && accept.contains("application/json")) {
            try {
                return new ResponseEntity<NotificationResponse>(objectMapper.readValue("{  \"ResponseInfo\" : {    \"ver\" : \"ver\",    \"resMsgId\" : \"resMsgId\",    \"msgId\" : \"msgId\",    \"apiId\" : \"apiId\",    \"ts\" : 0,    \"status\" : \"SUCCESSFUL\"  },  \"notification\" : {    \"comments\" : \"comments\",    \"workflow\" : {      \"documents\" : [ null, null ],      \"action\" : \"action\",      \"assignees\" : [ \"assignees\", \"assignees\" ],      \"comment\" : \"comment\",      \"status\" : \"status\"    },    \"documents\" : [ {      \"documentType\" : \"documentType\",      \"documentUid\" : \"documentUid\",      \"fileStore\" : \"fileStore\",      \"id\" : \"id\",      \"additionalDetails\" : { }    }, {      \"documentType\" : \"documentType\",      \"documentUid\" : \"documentUid\",      \"fileStore\" : \"fileStore\",      \"id\" : \"id\",      \"additionalDetails\" : { }    } ],    \"issuedBy\" : \"issuedBy\",    \"notificationType\" : \"notificationType\",    \"isActive\" : true,    \"additionalDetails\" : { },    \"createdDate\" : 6,    \"notificationDetails\" : { },    \"caseNumber\" : [ \"caseNumber\", \"caseNumber\" ],    \"auditDetails\" : {      \"lastModifiedTime\" : 5,      \"createdBy\" : \"createdBy\",      \"lastModifiedBy\" : \"lastModifiedBy\",      \"createdTime\" : 1    },    \"tenantId\" : \"tenantId\",    \"id\" : \"046b6c7f-0b8a-43b9-b35d-6489e6daee91\",    \"notificationNumber\" : \"notificationNumber\",    \"courtId\" : \"courtId\",    \"status\" : \"status\"  }}", NotificationResponse.class), HttpStatus.NOT_IMPLEMENTED);
            } catch (IOException e) {
                return new ResponseEntity<NotificationResponse>(HttpStatus.INTERNAL_SERVER_ERROR);
            }
        }

        return new ResponseEntity<NotificationResponse>(HttpStatus.NOT_IMPLEMENTED);
    }

    @RequestMapping(value = "/v1/exists", method = RequestMethod.POST)
    public ResponseEntity<NotificationExistsResponse> notificationV1ExistsPost(@Parameter(in = ParameterIn.DEFAULT, description = "check if the Notification(S) exists", required = true, schema = @Schema()) @Valid @RequestBody NotificationExistsRequest body) {
        String accept = request.getHeader("Accept");
        if (accept != null && accept.contains("application/json")) {
            try {
                return new ResponseEntity<NotificationExistsResponse>(objectMapper.readValue("{  \"ResponseInfo\" : {    \"ver\" : \"ver\",    \"resMsgId\" : \"resMsgId\",    \"msgId\" : \"msgId\",    \"apiId\" : \"apiId\",    \"ts\" : 0,    \"status\" : \"SUCCESSFUL\"  },  \"notificationList\" : [ {    \"exists\" : true,    \"id\" : \"046b6c7f-0b8a-43b9-b35d-6489e6daee91\",    \"notificationType\" : \"notificationType\",    \"notificationNumber\" : \"notificationNumber\"  }, {    \"exists\" : true,    \"id\" : \"046b6c7f-0b8a-43b9-b35d-6489e6daee91\",    \"notificationType\" : \"notificationType\",    \"notificationNumber\" : \"notificationNumber\"  } ]}", NotificationExistsResponse.class), HttpStatus.NOT_IMPLEMENTED);
            } catch (IOException e) {
                return new ResponseEntity<NotificationExistsResponse>(HttpStatus.INTERNAL_SERVER_ERROR);
            }
        }

        return new ResponseEntity<NotificationExistsResponse>(HttpStatus.NOT_IMPLEMENTED);
    }

    @RequestMapping(value = "/v1/search", method = RequestMethod.POST)
    public ResponseEntity<NotificationListResponse> notificationV1SearchPost(@Parameter(in = ParameterIn.DEFAULT, description = "Details for the search Notification(s) + RequestInfo meta data.", required = true, schema = @Schema()) @Valid @RequestBody NotificationSearchRequest body) {
        String accept = request.getHeader("Accept");
        if (accept != null && accept.contains("application/json")) {
            try {
                return new ResponseEntity<NotificationListResponse>(objectMapper.readValue("{  \"ResponseInfo\" : {    \"ver\" : \"ver\",    \"resMsgId\" : \"resMsgId\",    \"msgId\" : \"msgId\",    \"apiId\" : \"apiId\",    \"ts\" : 0,    \"status\" : \"SUCCESSFUL\"  },  \"pagination\" : {    \"offSet\" : 1.4658129805029452,    \"limit\" : 60.27456183070403,    \"sortBy\" : \"sortBy\",    \"totalCount\" : 5.962133916683182,    \"order\" : \"\"  },  \"totalCount\" : 0,  \"list\" : [ {    \"comments\" : \"comments\",    \"workflow\" : {      \"documents\" : [ null, null ],      \"action\" : \"action\",      \"assignees\" : [ \"assignees\", \"assignees\" ],      \"comment\" : \"comment\",      \"status\" : \"status\"    },    \"documents\" : [ {      \"documentType\" : \"documentType\",      \"documentUid\" : \"documentUid\",      \"fileStore\" : \"fileStore\",      \"id\" : \"id\",      \"additionalDetails\" : { }    }, {      \"documentType\" : \"documentType\",      \"documentUid\" : \"documentUid\",      \"fileStore\" : \"fileStore\",      \"id\" : \"id\",      \"additionalDetails\" : { }    } ],    \"issuedBy\" : \"issuedBy\",    \"notificationType\" : \"notificationType\",    \"isActive\" : true,    \"additionalDetails\" : { },    \"createdDate\" : 6,    \"notificationDetails\" : { },    \"caseNumber\" : [ \"caseNumber\", \"caseNumber\" ],    \"auditDetails\" : {      \"lastModifiedTime\" : 5,      \"createdBy\" : \"createdBy\",      \"lastModifiedBy\" : \"lastModifiedBy\",      \"createdTime\" : 1    },    \"tenantId\" : \"tenantId\",    \"id\" : \"046b6c7f-0b8a-43b9-b35d-6489e6daee91\",    \"notificationNumber\" : \"notificationNumber\",    \"courtId\" : \"courtId\",    \"status\" : \"status\"  }, {    \"comments\" : \"comments\",    \"workflow\" : {      \"documents\" : [ null, null ],      \"action\" : \"action\",      \"assignees\" : [ \"assignees\", \"assignees\" ],      \"comment\" : \"comment\",      \"status\" : \"status\"    },    \"documents\" : [ {      \"documentType\" : \"documentType\",      \"documentUid\" : \"documentUid\",      \"fileStore\" : \"fileStore\",      \"id\" : \"id\",      \"additionalDetails\" : { }    }, {      \"documentType\" : \"documentType\",      \"documentUid\" : \"documentUid\",      \"fileStore\" : \"fileStore\",      \"id\" : \"id\",      \"additionalDetails\" : { }    } ],    \"issuedBy\" : \"issuedBy\",    \"notificationType\" : \"notificationType\",    \"isActive\" : true,    \"additionalDetails\" : { },    \"createdDate\" : 6,    \"notificationDetails\" : { },    \"caseNumber\" : [ \"caseNumber\", \"caseNumber\" ],    \"auditDetails\" : {      \"lastModifiedTime\" : 5,      \"createdBy\" : \"createdBy\",      \"lastModifiedBy\" : \"lastModifiedBy\",      \"createdTime\" : 1    },    \"tenantId\" : \"tenantId\",    \"id\" : \"046b6c7f-0b8a-43b9-b35d-6489e6daee91\",    \"notificationNumber\" : \"notificationNumber\",    \"courtId\" : \"courtId\",    \"status\" : \"status\"  } ]}", NotificationListResponse.class), HttpStatus.NOT_IMPLEMENTED);
            } catch (IOException e) {
                return new ResponseEntity<NotificationListResponse>(HttpStatus.INTERNAL_SERVER_ERROR);
            }
        }

        return new ResponseEntity<NotificationListResponse>(HttpStatus.NOT_IMPLEMENTED);
    }

    @RequestMapping(value = "/v1/update", method = RequestMethod.POST)
    public ResponseEntity<NotificationResponse> notificationV1UpdatePost(@Parameter(in = ParameterIn.DEFAULT, description = "Details for the update Notification(s) + RequestInfo meta data.", required = true, schema = @Schema()) @Valid @RequestBody NotificationRequest body) {
        String accept = request.getHeader("Accept");
        if (accept != null && accept.contains("application/json")) {
            try {
                return new ResponseEntity<NotificationResponse>(objectMapper.readValue("{  \"ResponseInfo\" : {    \"ver\" : \"ver\",    \"resMsgId\" : \"resMsgId\",    \"msgId\" : \"msgId\",    \"apiId\" : \"apiId\",    \"ts\" : 0,    \"status\" : \"SUCCESSFUL\"  },  \"notification\" : {    \"comments\" : \"comments\",    \"workflow\" : {      \"documents\" : [ null, null ],      \"action\" : \"action\",      \"assignees\" : [ \"assignees\", \"assignees\" ],      \"comment\" : \"comment\",      \"status\" : \"status\"    },    \"documents\" : [ {      \"documentType\" : \"documentType\",      \"documentUid\" : \"documentUid\",      \"fileStore\" : \"fileStore\",      \"id\" : \"id\",      \"additionalDetails\" : { }    }, {      \"documentType\" : \"documentType\",      \"documentUid\" : \"documentUid\",      \"fileStore\" : \"fileStore\",      \"id\" : \"id\",      \"additionalDetails\" : { }    } ],    \"issuedBy\" : \"issuedBy\",    \"notificationType\" : \"notificationType\",    \"isActive\" : true,    \"additionalDetails\" : { },    \"createdDate\" : 6,    \"notificationDetails\" : { },    \"caseNumber\" : [ \"caseNumber\", \"caseNumber\" ],    \"auditDetails\" : {      \"lastModifiedTime\" : 5,      \"createdBy\" : \"createdBy\",      \"lastModifiedBy\" : \"lastModifiedBy\",      \"createdTime\" : 1    },    \"tenantId\" : \"tenantId\",    \"id\" : \"046b6c7f-0b8a-43b9-b35d-6489e6daee91\",    \"notificationNumber\" : \"notificationNumber\",    \"courtId\" : \"courtId\",    \"status\" : \"status\"  }}", NotificationResponse.class), HttpStatus.NOT_IMPLEMENTED);
            } catch (IOException e) {
                return new ResponseEntity<NotificationResponse>(HttpStatus.INTERNAL_SERVER_ERROR);
            }
        }

        return new ResponseEntity<NotificationResponse>(HttpStatus.NOT_IMPLEMENTED);
    }

}
