package notification.web.controllers;


import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.enums.ParameterIn;
import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.Valid;
import notification.service.NotificationService;
import notification.util.ResponseInfoFactory;
import notification.web.models.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestMethod;

import java.util.List;

@jakarta.annotation.Generated(value = "org.egov.codegen.SpringBootCodegen", date = "2025-02-07T11:59:26.022967807+05:30[Asia/Kolkata]")
@Controller
@RequestMapping("")
public class NotificationApiController {

    private final NotificationService notificationService;

    @Autowired
    public NotificationApiController(NotificationService notificationService) {
        this.notificationService = notificationService;
    }


    @RequestMapping(value = "/v1/_create", method = RequestMethod.POST)
    public ResponseEntity<NotificationResponse> notificationV1Create(@Parameter(in = ParameterIn.DEFAULT, description = "Details for the new Notification + RequestInfo meta data.", required = true, schema = @Schema()) @Valid @RequestBody NotificationRequest request) {
        Notification notification = notificationService.createV1Notification(request);

        NotificationResponse response = NotificationResponse.builder()
                .responseInfo(ResponseInfoFactory.createResponseInfoFromRequestInfo(request.getRequestInfo(), true))
                .notification(notification)
                .build();

        return new ResponseEntity<>(response, HttpStatus.OK);
    }

    @RequestMapping(value = "/v1/_exists", method = RequestMethod.POST)
    public ResponseEntity<NotificationExistsResponse> notificationV1Exists(@Parameter(in = ParameterIn.DEFAULT, description = "check if the Notification(S) exists", required = true, schema = @Schema()) @Valid @RequestBody NotificationExistsRequest request) {

        List<NotificationExists> notificationExists = notificationService.existV1Notification(request);
        NotificationExistsResponse response = NotificationExistsResponse.builder()
                .responseInfo(ResponseInfoFactory.createResponseInfoFromRequestInfo(request.getRequestInfo(), true))
                .notificationList(notificationExists).build();

        return new ResponseEntity<>(response, HttpStatus.OK);
    }

    @RequestMapping(value = "/v1/_search", method = RequestMethod.POST)
    public ResponseEntity<NotificationListResponse> notificationV1Search(@Parameter(in = ParameterIn.DEFAULT, description = "Details for the search Notification(s) + RequestInfo meta data.", required = true, schema = @Schema()) @Valid @RequestBody NotificationSearchRequest request) {
        List<Notification> notifications = notificationService.searchV1Notification(request);
        int totalCount;
        if (request.getPagination() != null) {
            totalCount = request.getPagination().getTotalCount().intValue();
        } else {
            totalCount = notifications.size();
        }
        NotificationListResponse response = NotificationListResponse.builder()
                .responseInfo(ResponseInfoFactory.createResponseInfoFromRequestInfo(request.getRequestInfo(), true))
                .list(notifications)
                .totalCount(totalCount)
                .pagination(request.getPagination())
                .build();

        return new ResponseEntity<>(response, HttpStatus.OK);
    }

    @RequestMapping(value = "/v1/_update", method = RequestMethod.POST)
    public ResponseEntity<NotificationResponse> notificationV1Update(@Parameter(in = ParameterIn.DEFAULT, description = "Details for the update Notification(s) + RequestInfo meta data.", required = true, schema = @Schema()) @Valid @RequestBody NotificationRequest request) {

        Notification notification = notificationService.updateV1Notification(request);

        NotificationResponse response = NotificationResponse.builder()
                .responseInfo(ResponseInfoFactory.createResponseInfoFromRequestInfo(request.getRequestInfo(), true))
                .notification(notification)
                .build();

        return new ResponseEntity<>(response, HttpStatus.OK);
    }

}
