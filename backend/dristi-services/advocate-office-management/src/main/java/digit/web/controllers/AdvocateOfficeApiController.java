package digit.web.controllers;

import digit.service.AdvocateOfficeService;
import digit.util.ResponseInfoFactory;
import digit.web.models.*;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.enums.ParameterIn;
import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.Valid;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestMethod;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("")
@Slf4j
public class AdvocateOfficeApiController {

    private final AdvocateOfficeService advocateOfficeService;
    private final ResponseInfoFactory responseInfoFactory;

    @Autowired
    public AdvocateOfficeApiController(AdvocateOfficeService advocateOfficeService, ResponseInfoFactory responseInfoFactory) {
        this.advocateOfficeService = advocateOfficeService;
        this.responseInfoFactory = responseInfoFactory;
    }

    @RequestMapping(value = "/advocate-office/v1/_addMember", method = RequestMethod.POST)
    public ResponseEntity<AddMemberResponse> advocateOfficeV1AddMemberPost(@Parameter(in = ParameterIn.DEFAULT, description = "Details for adding a member to the office + RequestInfo meta data.", required = true, schema = @Schema()) @Valid @RequestBody AddMemberRequest body) {
        log.info("Adding member: {}", body);
        AddMember addMember = advocateOfficeService.addMember(body);
        AddMemberResponse response = AddMemberResponse.builder()
                .addMember(addMember)
                .responseInfo(responseInfoFactory.createResponseInfoFromRequestInfo(body.getRequestInfo(), true))
                .build();
        log.info("Member added successfully: {}", response);
        return new ResponseEntity<>(response, HttpStatus.OK);
    }

    @RequestMapping(value = "/advocate-office/v1/_leaveOffice", method = RequestMethod.POST)
    public ResponseEntity<LeaveOfficeResponse> advocateOfficeV1LeaveOfficePost(@Parameter(in = ParameterIn.DEFAULT, description = "Details for leaving the office + RequestInfo meta data.", required = true, schema = @Schema()) @Valid @RequestBody LeaveOfficeRequest body) {
        log.info("Processing leave office request: {}", body);
        LeaveOffice leaveOffice = advocateOfficeService.leaveOffice(body);
        LeaveOfficeResponse response = LeaveOfficeResponse.builder()
                .leaveOffice(leaveOffice)
                .responseInfo(responseInfoFactory.createResponseInfoFromRequestInfo(body.getRequestInfo(), true))
                .build();
        log.info("Leave office processed successfully: {}", response);
        return new ResponseEntity<>(response, HttpStatus.OK);
    }

    @RequestMapping(value = "/advocate-office/v1/_searchMember", method = RequestMethod.POST)
    public ResponseEntity<MemberSearchResponse> advocateOfficeV1SearchMemberPost(@Parameter(in = ParameterIn.DEFAULT, description = "Search criteria for members + RequestInfo meta data.", required = true, schema = @Schema()) @Valid @RequestBody MemberSearchRequest body) {
        log.info("Searching members with criteria: {}", body);
        List<AddMember> members = advocateOfficeService.searchMembers(body);
        int totalCount;
        if (body.getPagination() != null && body.getPagination().getTotalCount() != null) {
            totalCount = body.getPagination().getTotalCount().intValue();
        } else {
            totalCount = members.size();
        }
        MemberSearchResponse response = MemberSearchResponse.builder()
                .responseInfo(responseInfoFactory.createResponseInfoFromRequestInfo(body.getRequestInfo(), true))
                .members(members)
                .totalCount(totalCount)
                .pagination(body.getPagination())
                .build();
        log.info("Members search completed, found {} members", response);
        return ResponseEntity.accepted().body(response);
    }

}
