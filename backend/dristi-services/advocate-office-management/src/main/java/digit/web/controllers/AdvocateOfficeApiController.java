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

    @RequestMapping(value = "/v1/_addMember", method = RequestMethod.POST)
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

    @RequestMapping(value = "/v1/_leaveOffice", method = RequestMethod.POST)
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

    @RequestMapping(value = "/v1/_searchMember", method = RequestMethod.POST)
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

    @RequestMapping(value = "/v1/_searchCaseMember", method = RequestMethod.POST)
    public ResponseEntity<CaseMemberSearchResponse> advocateOfficeV1SearchCaseMemberPost(@Parameter(in = ParameterIn.DEFAULT, description = "Search criteria for case members + RequestInfo meta data.", required = true, schema = @Schema()) @Valid @RequestBody CaseMemberSearchRequest body) {
        log.info("Searching case members with criteria: {}", body.getCriteria());
        CaseMemberSearchResponse caseMemberResponse = advocateOfficeService.searchCaseMembers(body);
        CaseMemberSearchResponse response = CaseMemberSearchResponse.builder()
                .cases(caseMemberResponse.getCases())
                .totalCount(caseMemberResponse.getTotalCount())
                .pagination(caseMemberResponse.getPagination())
                .responseInfo(responseInfoFactory.createResponseInfoFromRequestInfo(body.getRequestInfo(), true))
                .build();
        log.info("Case member search completed, found {} cases", response.getTotalCount());
        return new ResponseEntity<>(response, HttpStatus.OK);
    }

    @RequestMapping(value = "/v1/_updateMemberAccess", method = RequestMethod.POST)
    public ResponseEntity<UpdateMemberAccessResponse> advocateOfficeV1UpdateMemberAccessPost(@Parameter(in = ParameterIn.DEFAULT, description = "Details for updating member access + RequestInfo meta data.", required = true, schema = @Schema()) @Valid @RequestBody UpdateMemberAccessRequest body) {
        log.info("Updating member access: {}", body);
        UpdateMemberAccess updatedMember = advocateOfficeService.updateMemberAccess(body);
        UpdateMemberAccessResponse response = UpdateMemberAccessResponse.builder()
                .updateMemberAccess(updatedMember)
                .responseInfo(responseInfoFactory.createResponseInfoFromRequestInfo(body.getRequestInfo(), true))
                .build();
        log.info("Member access updated successfully: {}", response);
        return new ResponseEntity<>(response, HttpStatus.OK);
    }

    @RequestMapping(value = "/v1/_checkMemberStatus", method = RequestMethod.POST)
    public ResponseEntity<CheckMemberStatusResponse> advocateOfficeV1CheckMemberStatusPost(@Parameter(in = ParameterIn.DEFAULT, description = "Details for checking member status + RequestInfo meta data.", required = true, schema = @Schema()) @Valid @RequestBody CheckMemberStatusRequest body) {
        log.info("Checking member status: {}", body);
        String status = advocateOfficeService.checkMemberStatus(body);
        CheckMemberStatusResponse response = CheckMemberStatusResponse.builder()
                .status(status)
                .responseInfo(responseInfoFactory.createResponseInfoFromRequestInfo(body.getRequestInfo(), true))
                .build();
        log.info("Member status check completed: {}", response);
        return new ResponseEntity<>(response, HttpStatus.OK);
    }

    @RequestMapping(value = "/v1/_processCaseMember", method = RequestMethod.POST)
    public ResponseEntity<ProcessCaseMemberResponse> advocateOfficeV1ProcessCaseMemberPost(@Parameter(in = ParameterIn.DEFAULT, description = "Details for processing case member + RequestInfo meta data.", required = true, schema = @Schema()) @Valid @RequestBody ProcessCaseMemberRequest body) {
        log.info("Processing case member: {}", body);
        ProcessCaseMember processCaseMember = advocateOfficeService.processCaseMember(body);
        ProcessCaseMemberResponse response = ProcessCaseMemberResponse.builder()
                .processCaseMember(processCaseMember)
                .responseInfo(responseInfoFactory.createResponseInfoFromRequestInfo(body.getRequestInfo(), true))
                .build();
        log.info("Case member processed successfully: {}", response);
        return new ResponseEntity<>(response, HttpStatus.OK);
    }

}
