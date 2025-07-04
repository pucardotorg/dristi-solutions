package org.pucar.dristi.web.controllers;

import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.enums.ParameterIn;
import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.Valid;
import lombok.extern.slf4j.Slf4j;
import org.egov.common.contract.response.ResponseInfo;
import org.pucar.dristi.service.HearingService;
import org.pucar.dristi.service.WitnessDepositionPdfService;
import org.pucar.dristi.util.OrderUtil;
import org.pucar.dristi.util.ResponseInfoFactory;
import org.pucar.dristi.web.models.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.core.io.ByteArrayResource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@jakarta.annotation.Generated(value = "org.egov.codegen.SpringBootCodegen", date = "2024-04-18T11:14:11.072458+05:30[Asia/Calcutta]")
@Controller
@RequestMapping("")
@Slf4j
public class HearingApiController {

    private HearingService hearingService;
    private ResponseInfoFactory responseInfoFactory;
    private WitnessDepositionPdfService witnessDepositionPdfService;
    private OrderUtil orderUtil;

    @Autowired
    public HearingApiController(HearingService hearingService, ResponseInfoFactory responseInfoFactory, WitnessDepositionPdfService witnessDepositionPdfService, OrderUtil orderUtil) {
        this.hearingService = hearingService;
        this.responseInfoFactory = responseInfoFactory;
        this.witnessDepositionPdfService = witnessDepositionPdfService;
        this.orderUtil = orderUtil;
    }

    @RequestMapping(value = "/v1/create", method = RequestMethod.POST)
    public ResponseEntity<HearingResponse> hearingV1CreatePost(@Parameter(in = ParameterIn.DEFAULT, description = "Details for the new hearing + RequestInfo meta data.", required = true, schema = @Schema()) @Valid @RequestBody HearingRequest body) {

        Hearing hearing = hearingService.createHearing(body);
        ResponseInfo responseInfo = responseInfoFactory.createResponseInfoFromRequestInfo(body.getRequestInfo(), true);
        HearingResponse hearingResponse = HearingResponse.builder().hearing(hearing).responseInfo(responseInfo).build();
        return new ResponseEntity<>(hearingResponse, HttpStatus.OK);
    }

    @RequestMapping(value = "/v1/exists", method = RequestMethod.POST)
    public ResponseEntity<HearingExistsResponse> hearingV1ExistsPost(@Parameter(in = ParameterIn.DEFAULT, description = "check if the Hearing(S) exists", required = true, schema = @Schema()) @Valid @RequestBody HearingExistsRequest body) {

        HearingExists order = hearingService.isHearingExist(body);
        ResponseInfo responseInfo = responseInfoFactory.createResponseInfoFromRequestInfo(body.getRequestInfo(), true);
        HearingExistsResponse hearingExistsResponse = HearingExistsResponse.builder().order(order).responseInfo(responseInfo).build();
        return new ResponseEntity<>(hearingExistsResponse, HttpStatus.OK);
    }

    @RequestMapping(value = "/v1/search", method = RequestMethod.POST)
    public ResponseEntity<HearingListResponse> hearingV1SearchPost(
            @Parameter(in = ParameterIn.DEFAULT, required=true, schema=@Schema()) @Valid @RequestBody HearingSearchRequest request)
    {
        List<Hearing> hearingList = hearingService.searchHearing(request);
        ResponseInfo responseInfo = responseInfoFactory.createResponseInfoFromRequestInfo(request.getRequestInfo(), true);
        int totalCount;
        if(request.getPagination() != null){
            totalCount = request.getPagination().getTotalCount().intValue();
        }else{
            totalCount = hearingList.size();
        }
        HearingListResponse hearingListResponse = HearingListResponse.builder().hearingList(hearingList).totalCount(totalCount).responseInfo(responseInfo).build();
        return new ResponseEntity<>(hearingListResponse, HttpStatus.OK);
    }

    @RequestMapping(value = "/v1/update", method = RequestMethod.POST)
    public ResponseEntity<HearingResponse> hearingV1UpdatePost(@Parameter(in = ParameterIn.DEFAULT, description = "Details for the update hearing(s) + RequestInfo meta data.", required = true, schema = @Schema()) @Valid @RequestBody HearingRequest body) {

        Hearing hearing = hearingService.updateHearing(body);
        ResponseInfo responseInfo = responseInfoFactory.createResponseInfoFromRequestInfo(body.getRequestInfo(), true);
        HearingResponse hearingResponse = HearingResponse.builder().hearing(hearing).responseInfo(responseInfo).build();
        return new ResponseEntity<>(hearingResponse, HttpStatus.OK);

    }

    @PostMapping(value = "/v1/update_transcript_additional_attendees")
    public ResponseEntity<HearingResponse> hearingV1UpdateHearingTranscriptAdditionAuditDetailsPost(@Parameter(in = ParameterIn.DEFAULT, description = "Details for the update hearing(s) + RequestInfo meta data.", required = true, schema = @Schema()) @Valid @RequestBody HearingRequest body) {

        Hearing hearing = hearingService.updateTranscriptAdditionalAttendees(body);
        ResponseInfo responseInfo = responseInfoFactory.createResponseInfoFromRequestInfo(body.getRequestInfo(), true);
        HearingResponse hearingResponse = HearingResponse.builder().hearing(hearing).responseInfo(responseInfo).build();
        return new ResponseEntity<>(hearingResponse, HttpStatus.OK);

    }

    @RequestMapping(value = "/v1/update/time", method = RequestMethod.POST)
    public ResponseEntity<UpdateTimeResponse> hearingV1UpdateTimePost(@Parameter(in = ParameterIn.DEFAULT, description = "Details for the update start and end time + RequestInfo meta data.", required = true, schema = @Schema()) @Valid @RequestBody UpdateTimeRequest body) {

        hearingService.updateStartAndTime(body);
        ResponseInfo responseInfo = responseInfoFactory.createResponseInfoFromRequestInfo(body.getRequestInfo(), true);
        UpdateTimeResponse hearingResponse = UpdateTimeResponse.builder().hearings(body.getHearings()).responseInfo(responseInfo).build();
        return new ResponseEntity<>(hearingResponse, HttpStatus.OK);

    }

    @PostMapping("/witnessDeposition/v1/downloadPdf")
    public ResponseEntity<Object> witnessDepositionV1DownloadPdf(@Valid @RequestBody HearingSearchRequest searchRequest) {
        ByteArrayResource pdfResponse = witnessDepositionPdfService.getWitnessDepositionPdf(searchRequest);
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"witness_deposition_pdf.pdf\"")
                .contentType(MediaType.APPLICATION_PDF)
                .body(pdfResponse);
    }

    @RequestMapping(value = "/witnessDeposition/v1/uploadPdf", method = RequestMethod.POST)
    public ResponseEntity<HearingResponse> witnessDepositionV1UploadPdf(@Parameter(in = ParameterIn.DEFAULT, description = "Details for the update hearing(s) + RequestInfo meta data.", required = true, schema = @Schema()) @Valid @RequestBody HearingRequest body) {

        Hearing hearing = hearingService.uploadWitnessDeposition(body);
        ResponseInfo responseInfo = responseInfoFactory.createResponseInfoFromRequestInfo(body.getRequestInfo(), true);
        HearingResponse hearingResponse = HearingResponse.builder().hearing(hearing).responseInfo(responseInfo).build();
        return new ResponseEntity<>(hearingResponse, HttpStatus.OK);
    }

    @PostMapping("/v1/close-payment-pending-tasks")
    public ResponseEntity<ResponseInfo> closeActivePaymentPendingTasks(@Valid @RequestBody HearingRequest request) {
        log.info("api =/v1/close-payment-pending-tasks, result = IN_PROGRESS");
        orderUtil.closeActivePaymentPendingTasks(request);
        ResponseInfo responseInfo = responseInfoFactory.createResponseInfoFromRequestInfo(request.getRequestInfo(), true);
        log.info("api =/v1/close-payment-pending-tasks, result = SUCCESS");
        return ResponseEntity.ok(responseInfo);
    }

    @RequestMapping(value = "/v1/bulk/_reschedule", method = RequestMethod.POST)
    public ResponseEntity<BulkRescheduleResponse> bulkRescheduleHearing(@Parameter(in = ParameterIn.DEFAULT, description = "Bulk Reschedule Request and Request Info", required = true, schema = @Schema()) @Valid @RequestBody BulkRescheduleRequest request) {
        log.info("api =/v1/bulk/_reschedule, result = IN_PROGRESS");
        List<ScheduleHearing> scheduledHearings = hearingService.bulkReschedule(request);
        BulkRescheduleResponse response = BulkRescheduleResponse.builder().ResponseInfo(responseInfoFactory.createResponseInfoFromRequestInfo(request.getRequestInfo(), true))
                .reScheduleHearings(scheduledHearings).build();
        log.info("api =/v1/bulk/_reschedule, result = SUCCESS");
        return ResponseEntity.accepted().body(response);
    }

    @RequestMapping(value = "/v1/bulk/_update", method = RequestMethod.POST)
    public ResponseEntity<HearingUpdateBulkResponse> bulkUpdateHearings(@Parameter(in = ParameterIn.DEFAULT, description = "Bulk Update Request and RequestInfo", required = true, schema = @Schema()) @Valid @RequestBody HearingUpdateBulkRequest request) {
        log.info("api=/v1/bulk/_update, result=IN_PROGRESS");
        List<Hearing> updatedHearing = hearingService.updateBulkHearing(request);
        HearingUpdateBulkResponse response = HearingUpdateBulkResponse.builder().responseInfo(responseInfoFactory.createResponseInfoFromRequestInfo(request.getRequestInfo(), true))
                .hearings(updatedHearing)
                .build();
        log.info("api=/v1/bulk/_update, result=SUCCESS");
        return ResponseEntity.accepted().body(response);
    }

    @RequestMapping(value = "/v1/getNoOfDaysToHearing", method = RequestMethod.POST)
    public ResponseEntity<List<Integer>> getNoOfDaysToHearing(@Parameter(in = ParameterIn.DEFAULT, description = "Request Info", required = true, schema = @Schema()) @Valid @RequestBody HearingRequest request) {
        log.info("api=/v1/getNoOfDaysToHearing, result=IN_PROGRESS");
        List<Integer> noOfDaysToHearingOfEachCase = hearingService.getAvgNoOfDaysToHearingForEachCase();
        log.info("api=/v1/getNoOfDaysToHearing, result=SUCCESS");
        return ResponseEntity.ok(noOfDaysToHearingOfEachCase);
    }

}

