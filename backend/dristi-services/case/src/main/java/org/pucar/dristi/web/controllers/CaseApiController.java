package org.pucar.dristi.web.controllers;

import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.enums.ParameterIn;
import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.Valid;
import lombok.extern.slf4j.Slf4j;
import org.egov.common.contract.request.RequestInfo;
import org.egov.common.contract.response.ResponseInfo;
import org.pucar.dristi.scheduling.CronJobScheduler;
import org.pucar.dristi.service.CasePdfService;
import org.pucar.dristi.service.CaseService;
import org.pucar.dristi.service.CaseServiceV2;
import org.pucar.dristi.service.WitnessService;
import org.pucar.dristi.util.ResponseInfoFactory;
import org.pucar.dristi.web.OpenApiCaseSummary;
import org.pucar.dristi.web.models.*;
import org.pucar.dristi.web.models.v2.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Collections;
import java.util.List;
import java.util.Map;
import java.util.concurrent.atomic.AtomicBoolean;

@jakarta.annotation.Generated(value = "org.egov.codegen.SpringBootCodegen", date = "2024-04-15T11:31:40.281899+05:30[Asia/Kolkata]")
@RestController
@RequestMapping("")
@Slf4j
public class CaseApiController {

    private final CaseService caseService;

    private final CaseServiceV2 caseServiceV2;

    private final WitnessService witnessService;

    private final ResponseInfoFactory responseInfoFactory;

    private final CasePdfService casePdfService;
    private final CronJobScheduler cronJobScheduler;


    @Autowired
    public CaseApiController(CaseService caseService, CaseServiceV2 caseServiceV2, WitnessService witnessService, ResponseInfoFactory responseInfoFactory, CasePdfService casePdfService, CronJobScheduler cronJobScheduler) {
        this.caseService = caseService;
        this.caseServiceV2 = caseServiceV2;
        this.witnessService = witnessService;
        this.responseInfoFactory = responseInfoFactory;
        this.casePdfService = casePdfService;
        this.cronJobScheduler = cronJobScheduler;
    }

    @PostMapping(value = "/v1/_create")
    public ResponseEntity<CaseResponse> caseV1CreatePost(@Parameter(in = ParameterIn.DEFAULT, description = "Details for the new court case + RequestInfo meta data.", required = true, schema = @Schema()) @Valid @RequestBody CaseRequest body) {

        CourtCase cases = caseService.createCase(body);
        ResponseInfo responseInfo = responseInfoFactory.createResponseInfoFromRequestInfo(body.getRequestInfo(), true);
        CaseResponse caseResponse = CaseResponse.builder().cases(Collections.singletonList(cases)).responseInfo(responseInfo).build();
        return new ResponseEntity<>(caseResponse, HttpStatus.OK);
    }

    @PostMapping(value = "/v1/_exists")
    public ResponseEntity<CaseExistsResponse> caseV1ExistsPost(
            @Parameter(in = ParameterIn.DEFAULT, description = "Case search criteria + RequestInfo meta data.", required = true, schema = @Schema()) @Valid @RequestBody CaseExistsRequest body) {

        List<CaseExists> caseExists = caseService.existCases(body);
        ResponseInfo responseInfo = responseInfoFactory.createResponseInfoFromRequestInfo(body.getRequestInfo(), true);
        CaseExistsResponse caseExistsResponse = CaseExistsResponse.builder().criteria(caseExists).responseInfo(responseInfo).build();
        return new ResponseEntity<>(caseExistsResponse, HttpStatus.OK);
    }

    @PostMapping(value = "/v1/_search")
    public ResponseEntity<CaseListResponse> caseV1SearchPost(
            @Parameter(in = ParameterIn.DEFAULT, description = "Search criteria + RequestInfo meta data.", required = true, schema = @Schema()) @Valid @RequestBody CaseSearchRequest body) {

        caseService.searchCases(body);
        ResponseInfo responseInfo = responseInfoFactory.createResponseInfoFromRequestInfo(body.getRequestInfo(), true);
        CaseListResponse caseResponse = CaseListResponse.builder().criteria(body.getCriteria()).responseInfo(responseInfo).build();
        return new ResponseEntity<>(caseResponse, HttpStatus.OK);
    }

    @PostMapping(value = "/v2/search/details")
    public ResponseEntity<CaseSearchResponse> caseV2SearchDetails(
            @Parameter(in = ParameterIn.DEFAULT, description = "Search criteria + RequestInfo meta data.", required = true, schema = @Schema()) @Valid @RequestBody CaseSearchRequestV2 body) {

        CourtCase courtCase = caseServiceV2.searchCases(body);
        ResponseInfo responseInfo = responseInfoFactory.createResponseInfoFromRequestInfo(body.getRequestInfo(), true);
        CaseSearchResponse caseResponse = CaseSearchResponse.builder().cases(courtCase).responseInfo(responseInfo).build();
        return new ResponseEntity<>(caseResponse, HttpStatus.OK);
    }

    @PostMapping(value = "/v2/search/list")
    public ResponseEntity<CaseSummaryListResponse> caseV2SearchList(
            @Parameter(in = ParameterIn.DEFAULT, description = "Search criteria + RequestInfo meta data.", required = true, schema = @Schema()) @Valid @RequestBody CaseSummaryListRequest body) {

        List<CaseSummaryList> caseSummaryLists = caseServiceV2.searchCasesList(body);
        ResponseInfo responseInfo = responseInfoFactory.createResponseInfoFromRequestInfo(body.getRequestInfo(), true);
        CaseSummaryListResponse caseSummaryListResponse = CaseSummaryListResponse.builder().caseList(caseSummaryLists).pagination(body.getCriteria().getPagination()).responseInfo(responseInfo).build();
        return new ResponseEntity<>(caseSummaryListResponse, HttpStatus.OK);
    }

    @PostMapping(value = "/v2/search/summary")
    public ResponseEntity<CaseSummarySearchResponse> caseV2SearchSummary(
            @Parameter(in = ParameterIn.DEFAULT, description = "Search criteria + RequestInfo meta data.", required = true, schema = @Schema()) @Valid @RequestBody CaseSummarySearchRequest body) {

        List<CaseSummarySearch> caseSummarySearchList = caseServiceV2.searchCasesSummary(body);
        ResponseInfo responseInfo = responseInfoFactory.createResponseInfoFromRequestInfo(body.getRequestInfo(), true);
        CaseSummarySearchResponse caseSummarySearchResponse = CaseSummarySearchResponse.builder().caseSummaries(caseSummarySearchList).responseInfo(responseInfo).build();
        return new ResponseEntity<>(caseSummarySearchResponse, HttpStatus.OK);
    }

    @PostMapping(value = "/v1/_verify")
    public ResponseEntity<JoinCaseResponse> verifyV1JoinCase(
            @Parameter(in = ParameterIn.DEFAULT, description = "Search criteria + RequestInfo meta data.", required = true, schema = @Schema()) @Valid @RequestBody JoinCaseRequest body) {

        JoinCaseResponse joinCaseResponse = caseService.verifyJoinCaseRequest(body,true);
        ResponseInfo responseInfo = responseInfoFactory.createResponseInfoFromRequestInfo(body.getRequestInfo(), true);
        joinCaseResponse.setResponseInfo(responseInfo);
        return new ResponseEntity<>(joinCaseResponse, HttpStatus.OK);
    }

    @PostMapping(value = "/v1/joincase/_joincase")
    public ResponseEntity<JoinCaseV2Response> joinCaseV2(@Parameter(in = ParameterIn.DEFAULT, description = "Search criteria + RequestInfo meta data.", required = true, schema = @Schema()) @Valid @RequestBody JoinCaseV2Request body) {
        JoinCaseV2Response joinCaseResponse = caseService.processJoinCaseRequest(body);
        ResponseInfo responseInfo = responseInfoFactory.createResponseInfoFromRequestInfo(body.getRequestInfo(), true);
        joinCaseResponse.setResponseInfo(responseInfo);
        return new ResponseEntity<>(joinCaseResponse, HttpStatus.OK);
    }

    @PostMapping(value = "/v1/_update")
    public ResponseEntity<CaseResponse> caseV1UpdatePost(
            @Parameter(in = ParameterIn.DEFAULT, description = "Details for updating all editable fields in the court case + RequestInfo meta data.", required = true, schema = @Schema()) @Valid @RequestBody CaseRequest body) {

        CourtCase cases = caseService.updateCase(body);
        ResponseInfo responseInfo = responseInfoFactory.createResponseInfoFromRequestInfo(body.getRequestInfo(), true);
        CaseResponse caseResponse = CaseResponse.builder().cases(Collections.singletonList(cases)).responseInfo(responseInfo).build();
        return new ResponseEntity<>(caseResponse, HttpStatus.OK);
    }

    @Deprecated
    @PostMapping(value = "/v1/add/witness")
    public ResponseEntity<AddWitnessResponse> caseV1AddWitnessPost(
            @Parameter(in = ParameterIn.DEFAULT, description = "Details for adding witness details in the court case + RequestInfo meta data.", required = true, schema = @Schema()) @Valid @RequestBody AddWitnessRequest body) {
        AddWitnessResponse addWitnessResponse = caseService.addWitness(body);
        ResponseInfo responseInfo = responseInfoFactory.createResponseInfoFromRequestInfo(body.getRequestInfo(), true);
        addWitnessResponse.setResponseInfo(responseInfo);
        return new ResponseEntity<>(addWitnessResponse, HttpStatus.OK);
    }

    @PostMapping(value = "/v1/admin/edit_case")
    public ResponseEntity<CaseResponse> caseV1Edit(
            @Parameter(in = ParameterIn.DEFAULT, description = "Details for editing few fields in the court case + RequestInfo meta data.", required = true, schema = @Schema()) @Valid @RequestBody CaseRequest body) {

        CourtCase cases = caseService.editCase(body);
        ResponseInfo responseInfo = responseInfoFactory.createResponseInfoFromRequestInfo(body.getRequestInfo(), true);
        CaseResponse caseResponse = CaseResponse.builder().cases(Collections.singletonList(cases)).responseInfo(responseInfo).build();
        return new ResponseEntity<>(caseResponse, HttpStatus.OK);
    }

    @PostMapping(value = "/witness/v1/_create")
    public ResponseEntity<WitnessResponse> caseWitnessV1CreatePost(
            @Parameter(in = ParameterIn.DEFAULT, description = "Details for the witness + RequestInfo meta data.", required = true, schema = @Schema()) @Valid @RequestBody WitnessRequest body) {

        Witness witness = witnessService.registerWitnessRequest(body);
        ResponseInfo responseInfo = responseInfoFactory.createResponseInfoFromRequestInfo(body.getRequestInfo(), true);
        WitnessResponse witnessResponse = WitnessResponse.builder().witnesses(Collections.singletonList(witness)).requestInfo(responseInfo).build();
        return new ResponseEntity<>(witnessResponse, HttpStatus.OK);
    }

    @PostMapping(value = "/witness/v1/_search")
    public ResponseEntity<WitnessResponse> caseWitnessV1SearchPost(
            @Parameter(in = ParameterIn.DEFAULT, description = "Details for the witness + RequestInfo meta data.", required = true, schema = @Schema()) @Valid @RequestBody WitnessSearchRequest body) {

        List<Witness> witnessList = witnessService.searchWitnesses(body);
        ResponseInfo responseInfo = responseInfoFactory.createResponseInfoFromRequestInfo(body.getRequestInfo(), true);
        WitnessResponse witnessResponse = WitnessResponse.builder().witnesses(witnessList).requestInfo(responseInfo).build();
        return new ResponseEntity<>(witnessResponse, HttpStatus.OK);
    }

    @PostMapping(value = "/witness/v1/_update")
    public ResponseEntity<WitnessResponse> caseWitnessV1UpdatePost(
            @Parameter(in = ParameterIn.DEFAULT, description = "Details for the witness + RequestInfo meta data.", required = true, schema = @Schema()) @Valid @RequestBody WitnessRequest body) {

        Witness witness = witnessService.updateWitness(body);
        ResponseInfo responseInfo = responseInfoFactory.createResponseInfoFromRequestInfo(body.getRequestInfo(), true);
        WitnessResponse witnessResponse = WitnessResponse.builder().witnesses(Collections.singletonList(witness)).requestInfo(responseInfo).build();
        return new ResponseEntity<>(witnessResponse, HttpStatus.OK);
    }

    @PostMapping(value = "/v1/_generatePdf")
    public ResponseEntity<?> caseV1GeneratePdf(
            @Parameter(in = ParameterIn.DEFAULT, description = "Search criteria + RequestInfo meta data.", required = true, schema = @Schema()) @Valid @RequestBody CaseSearchRequest body) {

        CourtCase courtCase = casePdfService.generatePdf(body);
        ResponseInfo responseInfo = responseInfoFactory.createResponseInfoFromRequestInfo(body.getRequestInfo(), true);
        CaseResponse caseResponse = CaseResponse.builder().cases(Collections.singletonList(courtCase)).responseInfo(responseInfo).build();
        return new ResponseEntity<>(caseResponse, HttpStatus.OK);
    }


    @PostMapping(value = "/v1/search/_summary")
    public ResponseEntity<CaseSummaryResponse> caseV1SummaryPost(@Parameter(in = ParameterIn.DEFAULT, description = "Details for the new court case + RequestInfo meta data.", required = true, schema = @Schema()) @Valid @RequestBody CaseSummaryRequest body) {
        List<CaseSummary> caseSummaries = caseService.getCaseSummary(body);
        ResponseInfo responseInfo = responseInfoFactory.createResponseInfoFromRequestInfo(body.getRequestInfo(), true);
        CaseSummaryResponse caseSummaryResponse = CaseSummaryResponse.builder().cases(caseSummaries).pagination(body.getPagination()).responseInfo(responseInfo).build();
        return new ResponseEntity<>(caseSummaryResponse, HttpStatus.OK);
    }

    @PostMapping(value = "/v1/search/cnrNumber")
    public ResponseEntity<OpenApiCaseSummaryResponse> caseV1SearchCnrNumber(@Parameter(in = ParameterIn.DEFAULT, description = "Details for the new court case + RequestInfo meta data.", required = true, schema = @Schema()) @Valid @RequestBody OpenApiCaseSummaryRequest body) {
        OpenApiCaseSummary cases = caseService.searchByCnrNumber(body);
        ResponseInfo responseInfo = responseInfoFactory.createResponseInfoFromRequestInfo(RequestInfo.builder().build(), true);
        OpenApiCaseSummaryResponse caseSummaryResponse = OpenApiCaseSummaryResponse.builder().caseSummary(cases).responseInfo(responseInfo).build();
        return new ResponseEntity<>(caseSummaryResponse, HttpStatus.OK);
    }

    @PostMapping(value = "/v1/search/caseType")
    public ResponseEntity<OpenApiCaseListResponse> caseV1SearchCaseType(@Parameter(in = ParameterIn.DEFAULT, description = "Details for the new court case + RequestInfo meta data.", required = true, schema = @Schema()) @Valid @RequestBody OpenApiCaseSummaryRequest body) {
        List<CaseListLineItem> cases = caseService.searchByCaseType(body);
        ResponseInfo responseInfo = responseInfoFactory.createResponseInfoFromRequestInfo(RequestInfo.builder().build(), true);
        OpenApiCaseListResponse caseSummaryResponse = OpenApiCaseListResponse.builder().caseList(cases).responseInfo(responseInfo).pagination(body.getPagination()).build();
        return new ResponseEntity<>(caseSummaryResponse, HttpStatus.OK);
    }

    @PostMapping(value = "/v1/search/caseNumber")
    public ResponseEntity<OpenApiCaseSummaryResponse> caseV1SearchCaseNumber(@Parameter(in = ParameterIn.DEFAULT, description = "Details for the new court case + RequestInfo meta data.", required = true, schema = @Schema()) @Valid @RequestBody OpenApiCaseSummaryRequest body) {
        OpenApiCaseSummary cases = caseService.searchByCaseNumber(body);
        ResponseInfo responseInfo = responseInfoFactory.createResponseInfoFromRequestInfo(RequestInfo.builder().build(), true);
        OpenApiCaseSummaryResponse caseSummaryResponse = OpenApiCaseSummaryResponse.builder().caseSummary(cases).responseInfo(responseInfo).build();
        return new ResponseEntity<>(caseSummaryResponse, HttpStatus.OK);
    }

    @PostMapping(value = "/v2/profilerequest/process")
    public ResponseEntity<CaseResponse> updateProfileRequest(@Parameter(in = ParameterIn.DEFAULT, description = "Details for the profile update + RequestInfo meta data", required = true, schema = @Schema()) @Valid @RequestBody ProcessProfileRequest request) {
        CourtCase courtCase = caseService.processProfileRequest(request);
        ResponseInfo responseInfo = responseInfoFactory.createResponseInfoFromRequestInfo(request.getRequestInfo(), true);
        CaseResponse response = CaseResponse.builder()
                .responseInfo(responseInfo)
                .cases(Collections.singletonList(courtCase))
                .build();
        return ResponseEntity.ok(response);
    }

    @PostMapping(value = "/v2/profilerequest/create")
    public ResponseEntity<CaseResponse> caseV1EditProfile(
            @Parameter(in = ParameterIn.DEFAULT, description = "Details for editing litigant profile details + RequestInfo meta data.", required = true, schema = @Schema()) @Valid @RequestBody CreateProfileRequest body) {

        CourtCase cases = caseService.createEditProfileRequest(body);
        ResponseInfo responseInfo = responseInfoFactory.createResponseInfoFromRequestInfo(body.getRequestInfo(), true);
        CaseResponse caseResponse = CaseResponse.builder().cases(Collections.singletonList(cases)).responseInfo(responseInfo).build();
        return new ResponseEntity<>(caseResponse, HttpStatus.OK);
    }

    @PostMapping(value = "/v2/joincase/_verifycode")
    public ResponseEntity<CaseCodeResponse> verifyCodeV2JoinCase(
            @Parameter(in = ParameterIn.DEFAULT, description = "verify that the access code provided to join a case is indeed the code the case has", required = true, schema = @Schema()) @Valid @RequestBody CaseCodeRequest body) {

        CaseCodeResponse caseCodeResponse = caseService.verifyJoinCaseCodeV2Request(body);
        ResponseInfo responseInfo = responseInfoFactory.createResponseInfoFromRequestInfo(body.getRequestInfo(), true);
        caseCodeResponse.setResponseInfo(responseInfo);
        return new ResponseEntity<>(caseCodeResponse, HttpStatus.OK);
    }

    @PostMapping(value = "/enrich/access-code")
    public ResponseEntity<Map<String, AtomicBoolean>> enrichAccessCode(@Parameter(in = ParameterIn.DEFAULT, description = "enrich access code", required = true, schema = @Schema()) @Valid @RequestBody AccessCodeGenerateRequest body) {
        Map<String,AtomicBoolean> response = caseService.enrichAccessCode(body);
        return new ResponseEntity<>(response,HttpStatus.OK);
    }

    @PostMapping(value = "/v1/_count")
    public ResponseEntity<Integer> getCaseCount(@Parameter(in = ParameterIn.DEFAULT, description = "Search criteria + RequestInfo meta data.", required = true, schema = @Schema()) @Valid @RequestBody CaseSearchRequest body) {
        log.info("api=/v1/_count, result=IN_PROGRESS");
        Integer count = caseService.getCaseCount(body);
        log.info("api=/v1/_count, result=SUCCESS");
        return new ResponseEntity<>(count,HttpStatus.OK);
    }

    @PostMapping(value = "/v2/add/witness")
    public ResponseEntity<WitnessDetailsResponse> addWitnessToCase(@Parameter(in = ParameterIn.DEFAULT, description = "Court case details + RequestInfo meta data.", required = true, schema = @Schema()) @Valid @RequestBody WitnessDetailsRequest body) {
        log.info("api=/v2/add/witness, result=IN_PROGRESS");
        WitnessDetailsResponse response = caseService.addWitnessToCase(body);
        ResponseInfo responseInfo = responseInfoFactory.createResponseInfoFromRequestInfo(body.getRequestInfo(), true);
        response.setResponseInfo(responseInfo);
        log.info("api=/v2/add/witness, result=SUCCESS");
        return new ResponseEntity<>(response, HttpStatus.OK);
    }

    @PostMapping(value = "/v2/_update")
    public ResponseEntity<CaseResponse> updateCaseWithoutWorkflow(@Parameter(in = ParameterIn.DEFAULT, description = "Details for the new court case + RequestInfo meta data.", required = true, schema = @Schema()) @Valid @RequestBody CaseRequest body) {
        CourtCase cases = caseService.updateCaseWithoutWorkflow(body);
        ResponseInfo responseInfo = responseInfoFactory.createResponseInfoFromRequestInfo(body.getRequestInfo(), true);
        CaseResponse caseResponse = CaseResponse.builder().cases(Collections.singletonList(cases)).responseInfo(responseInfo).build();
        return new ResponseEntity<>(caseResponse, HttpStatus.OK);
    }

    @PostMapping(value = "/v1/_updateLPRDetails")
    public ResponseEntity<CaseResponse> updateLPRDetails(@Parameter(in = ParameterIn.DEFAULT, description = "Details for the new court case + RequestInfo meta data.", required = true, schema = @Schema()) @Valid @RequestBody CaseRequest body) {
        CourtCase cases = caseService.updateLPRDetails(body);
        ResponseInfo responseInfo = responseInfoFactory.createResponseInfoFromRequestInfo(body.getRequestInfo(), true);
        CaseResponse caseResponse = CaseResponse.builder().cases(Collections.singletonList(cases)).responseInfo(responseInfo).build();
        return new ResponseEntity<>(caseResponse, HttpStatus.OK);
    }

    @PostMapping(value = "/v1/address/_add")
    public ResponseEntity<AddAddressResponse> caseV1AddAddress(
            @Parameter(in = ParameterIn.DEFAULT, description = "This API is used to add or update addresses for parties involved in a case. It can handle multiple addresses for multiple parties in a single request.", required = true, schema = @Schema()) @Valid @RequestBody AddAddressRequest body) {

        List<PartyAddressRequest> addressResponses = caseService.addAddress(body);
        ResponseInfo responseInfo = responseInfoFactory.createResponseInfoFromRequestInfo(body.getRequestInfo(), true);
        AddAddressResponse addAddressResponse = AddAddressResponse.builder().partyAddressList(addressResponses).responseInfo(responseInfo).build();
        return new ResponseEntity<>(addAddressResponse, HttpStatus.OK);
    }

    @PostMapping(value = "/v1/_runCronJob")
    public ResponseEntity<?> runCronJob() {
        cronJobScheduler.sendNotificationToCaseReassigned();

        return new ResponseEntity<>(HttpStatus.OK);
    }

    @PostMapping(value = "/v1/advocate/_cases")
    public ResponseEntity<AdvocateCasesResponse> getAdvocateCases(
            @Parameter(in = ParameterIn.DEFAULT, description = "Advocate ID + RequestInfo meta data.", required = true, schema = @Schema()) @Valid @RequestBody AdvocateCasesRequest body) {
        log.info("api=/v1/advocate/_cases, result=IN_PROGRESS");
        List<AdvocateCaseInfo> cases = caseService.getCasesByAdvocateId(body);
        ResponseInfo responseInfo = responseInfoFactory.createResponseInfoFromRequestInfo(body.getRequestInfo(), true);
        AdvocateCasesResponse response = AdvocateCasesResponse.builder()
                .cases(cases)
                .responseInfo(responseInfo)
                .build();
        log.info("api=/v1/advocate/_cases, result=SUCCESS");
        return new ResponseEntity<>(response, HttpStatus.OK);
    }
}
