package org.pucar.dristi.web.controllers;


import org.egov.common.contract.request.RequestInfo;
import org.egov.common.contract.response.ResponseInfo;
import org.pucar.dristi.service.OpenApiService;
import org.pucar.dristi.util.FileStoreUtil;
import org.pucar.dristi.util.HrmsUtil;
import org.pucar.dristi.util.RequestInfoGenerator;
import org.pucar.dristi.util.ResponseInfoFactory;
import org.pucar.dristi.validator.FileStoreValidator;
import org.pucar.dristi.web.models.*;
import com.fasterxml.jackson.databind.ObjectMapper;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.enums.ParameterIn;
import io.swagger.v3.oas.annotations.media.Schema;
import org.pucar.dristi.web.models.LandingPageCaseListRequest;
import org.pucar.dristi.web.models.LandingPageCaseListResponse;
import org.pucar.dristi.web.models.address.AddAddressRequest;
import org.pucar.dristi.web.models.address.AddAddressResponse;
import org.pucar.dristi.web.models.bailbond.OpenApiBailResponse;
import org.pucar.dristi.web.models.bailbond.OpenApiBailSearchRequest;
import org.pucar.dristi.web.models.bailbond.OpenApiUpdateBailBondRequest;
import org.pucar.dristi.web.models.esign.ESignParameter;
import org.pucar.dristi.web.models.esign.ESignResponse;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.core.io.Resource;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.*;

import jakarta.validation.constraints.*;
import jakarta.validation.Valid;
import jakarta.servlet.http.HttpServletRequest;

import java.util.List;

@jakarta.annotation.Generated(value = "org.egov.codegen.SpringBootCodegen", date = "2024-12-03T13:11:23.212020900+05:30[Asia/Calcutta]")
@Controller
@RequestMapping("")
public class OpenapiApiController {

    private final ObjectMapper objectMapper;

    private final HttpServletRequest request;

    private final OpenApiService openApiService;

    private final HrmsUtil hrmsUtil;

    private final FileStoreUtil fileStoreUtil;

    private final FileStoreValidator fileStoreValidator;
    private final RequestInfoGenerator requestInfoGenerator;
    private final ResponseInfoFactory responseInfoFactory;

    @Autowired
    public OpenapiApiController(ObjectMapper objectMapper, HttpServletRequest request, OpenApiService openApiService, HrmsUtil hrmsUtil, FileStoreUtil fileStoreUtil, FileStoreValidator fileStoreValidator, RequestInfoGenerator requestInfoGenerator, ResponseInfoFactory responseInfoFactory) {
        this.objectMapper = objectMapper;
        this.request = request;
        this.openApiService = openApiService;
        this.hrmsUtil = hrmsUtil;
        this.fileStoreUtil = fileStoreUtil;
        this.fileStoreValidator = fileStoreValidator;
        this.requestInfoGenerator = requestInfoGenerator;
        this.responseInfoFactory = responseInfoFactory;
    }

    @RequestMapping(value = "/openapi/v1/{tenantId}/case/cnr/{cnrNumber}", method = RequestMethod.GET)
    public ResponseEntity<CaseSummaryResponse> getCaseByCNR(@Pattern(regexp = "^[a-zA-Z]{2}$") @Size(min = 2, max = 2) @Parameter(in = ParameterIn.PATH, description = "tenant ID", required = true, schema = @Schema()) @PathVariable("tenantId") String tenantId, @Size(min = 16, max = 16) @Parameter(in = ParameterIn.PATH, description = "the CNR number of the case in format SCDCECNNNNNNYYYY where SC=State Code, DC=District Code, EC=Establishment Code NNNNNN=Case Number and YYYY=Year, whose summary is requested", required = true, schema = @Schema()) @PathVariable("cnrNumber") String cnrNumber) {
        CaseSummaryResponse caseSummaryResponse = openApiService.getCaseByCnrNumber(tenantId, cnrNumber);
        return new ResponseEntity<>(caseSummaryResponse, HttpStatus.OK);
    }

    @RequestMapping(value = "/openapi/v1/{tenantId}/case/{year}/{caseType}/{caseNumber}", method = RequestMethod.GET)
    public ResponseEntity<CaseSummaryResponse> getCaseByCaseNumber(@Pattern(regexp = "^[a-zA-Z]{2}$") @Size(min = 2, max = 2) @Parameter(in = ParameterIn.PATH, description = "tenant ID", required = true, schema = @Schema()) @PathVariable("tenantId") String tenantId, @Min(2024) @Parameter(in = ParameterIn.PATH, description = "if type= CMP, then year in which the case was registered. Can check based on registration date also. If type = CC/ST, then check against CourtCase.courtCaseNumber(year). The minimum year is set to 2024 as this is the year the system has gone live and the first case in the system is from 2024. No earlier cases exist.", required = true, schema = @Schema(allowableValues = "")) @PathVariable("year") Integer year, @Parameter(in = ParameterIn.PATH, description = "the type of the case CMP/CC/ST", required = true, schema = @Schema(allowableValues = "")) @PathVariable("caseType") String caseType, @NotNull @Min(1) @Max(99999999) @Parameter(in = ParameterIn.QUERY, description = "Number part of CMP/CC/ST case number in format <type>/<number>/<year>", required = true, schema = @Schema(allowableValues = "")) @Valid @PathVariable(value = "caseNumber") Integer caseNumber) {
        CaseSummaryResponse caseSummaryResponse = openApiService.getCaseByCaseNumber(tenantId, year, caseType, caseNumber);
        return new ResponseEntity<>(caseSummaryResponse, HttpStatus.OK);
    }

    @RequestMapping(value = "/openapi/v1/{tenantId}/case/{year}/{caseType}", method = RequestMethod.GET)
    public ResponseEntity<CaseListResponse> getCaseListByCaseType(@Pattern(regexp = "^[a-zA-Z]{2}$") @Size(min = 2, max = 2) @Parameter(in = ParameterIn.PATH, description = "tenant ID", required = true, schema = @Schema()) @PathVariable("tenantId") String tenantId, @Min(2024) @Parameter(in = ParameterIn.PATH, description = "if type= CMP, then year in which the case was registered. Can check based on registration date also. If type = CC/ST, then check against CourtCase.courtCaseNumber(year). The minimum year is set to 2024 as this is the year the system has gone live and the first case in the system is from 2024. No earlier cases exist.", required = true, schema = @Schema(allowableValues = "")) @PathVariable("year") Integer year, @Parameter(in = ParameterIn.PATH, description = "the type of the case CMP/CC/ST", required = true, schema = @Schema(allowableValues = "")) @PathVariable("caseType") String caseType, @Min(0) @Parameter(in = ParameterIn.QUERY, description = "Page number to retrieve (0-based index)", schema = @Schema(allowableValues = "", defaultValue = "0")) @Valid @RequestParam(value = "offset", required = false, defaultValue = "0") Integer offset, @Min(1) @Max(100) @Parameter(in = ParameterIn.QUERY, description = "Number of items per page", schema = @Schema(allowableValues = "", defaultValue = "10")) @Valid @RequestParam(value = "limit", required = false, defaultValue = "10") Integer limit, @Pattern(regexp = "^(registrationDate|filingDate),(asc|desc)$") @Parameter(in = ParameterIn.QUERY, description = "Sorting criteria in the format `field,asc` or `field,desc`", schema = @Schema()) @Valid @RequestParam(value = "sort", required = false , defaultValue = "registrationDate,desc") String sort) {

        CaseListResponse caseList = openApiService.getCaseListByCaseType(tenantId, year, caseType, offset, limit, sort);
        return new ResponseEntity<>(caseList, HttpStatus.OK);
    }

    @PostMapping("/openapi/v1/hearings")
    public ResponseEntity<OpenApiHearingsResponse> getHearingsForDisplayBoard(@Parameter(description = "Details for fetching hearings in landing page", required = true)
                                                                        @Valid @RequestBody OpenAPiHearingRequest body) {

        List<OpenHearing> hearingList = openApiService.getHearings(body);
        OpenApiHearingsResponse response = OpenApiHearingsResponse.builder().openHearings(hearingList).build();
        return new ResponseEntity<>(response, HttpStatus.OK);
    }



    @PostMapping(value = "/openapi/v1/{tenantId}/case")
    public ResponseEntity<LandingPageCaseListResponse> getLandingPageCaseList(
            @Pattern(regexp = "^[a-zA-Z]{2}$") @Size(min = 2, max = 2)
            @Parameter(in = ParameterIn.PATH, description = "tenant ID", required = true)
            @PathVariable("tenantId") String tenantId,

            @RequestBody @Valid LandingPageCaseListRequest landingPageCaseListRequest
    ) {
        LandingPageCaseListResponse landingPageCaseList = openApiService.getLandingPageCaseList(tenantId, landingPageCaseListRequest);
        return new ResponseEntity<>(landingPageCaseList, HttpStatus.OK);
    }


    @PostMapping("/openapi/v1/orders_tasks")
    public ResponseEntity<OpenApiOrderTaskResponse> getOrdersAndPaymentTaskForCaseDetails(@Parameter(description = "Details for fetching orders and payment tasks in case details page", required = true) @Valid @RequestBody OpenApiOrdersTaskIRequest body) {
        OpenApiOrderTaskResponse response = openApiService.getOrdersAndPaymentTasks(body);
        return new ResponseEntity<>(response, HttpStatus.OK);
    }

    @GetMapping("/openapi/v1/magistrate_name/{courtId}/{tenantId}")
    public ResponseEntity<String> getMagistrateName(@PathVariable("courtId") String courtId, @PathVariable("tenantId") String tenantId) {
        String magistrateName = hrmsUtil.getJudgeName(courtId,tenantId);
        return new ResponseEntity<>(magistrateName, HttpStatus.OK);
    }


    @GetMapping("/openapi/v1/file/{tenantId}/{orderId}")
    public ResponseEntity<Resource> getFile(@PathVariable("tenantId") String tenantId, @PathVariable("orderId") String orderId) {
        String fileStoreId = openApiService.getOrderByIdFromIndex(tenantId,orderId);
        return fileStoreUtil.getFilesByFileStore(fileStoreId, tenantId, null);
    }

    @PostMapping("/openapi/v1/landing_page/file")
    public ResponseEntity<Resource> getFiles(@RequestBody @Valid LandingPageFileRequest landingPageFileRequest) {
        String tenantId = landingPageFileRequest.getTenantId();
        String fileStoreId = landingPageFileRequest.getFileStoreId();
        String moduleName = landingPageFileRequest.getModuleName();
        fileStoreValidator.validatePayLoad(landingPageFileRequest);
        return fileStoreUtil.getFilesByFileStore(fileStoreId, tenantId, moduleName);
    }

    @RequestMapping(value = "/openapi/v1/bail/search", method = RequestMethod.POST)
    public ResponseEntity<OpenApiBailResponse> searchBailByPartyMobile(@Parameter(description = "Details for searching bail by mobile number and id", required = true, schema = @Schema(implementation = OpenApiBailSearchRequest.class)) @RequestBody @Valid OpenApiBailSearchRequest openApiBailSearchRequest) {
        OpenApiBailResponse response = openApiService.getBailByPartyMobile(openApiBailSearchRequest);
        return new ResponseEntity<>(response, HttpStatus.OK);
    }

    @PostMapping(value = "/openapi/v1/updateBailBond")
    public ResponseEntity<OpenApiBailResponse> updateBailBond(@RequestBody @Valid OpenApiUpdateBailBondRequest openApiUpdateBailBondRequest) {
        OpenApiBailResponse response = openApiService.updateBailBond(openApiUpdateBailBondRequest);
        return new ResponseEntity<>(response,HttpStatus.OK);
    }

    @PostMapping(value = "/openapi/v1/{tenantId}/esign")
    public ResponseEntity<ESignResponse> eSignDocument(@Pattern(regexp = "^[a-zA-Z]{2}$") @Size(min = 2, max = 2) @Parameter(in = ParameterIn.PATH, description = "tenant ID", required = true) @PathVariable("tenantId") String tenantId, @RequestBody @Valid ESignParameter eSignParameter, HttpServletRequest servletRequest) {
        ESignResponse response = openApiService.eSignDocument(tenantId, eSignParameter, servletRequest);
        return new ResponseEntity<>(response, HttpStatus.OK);
    }

    @RequestMapping(value = "/openapi/v1/getOrderDetails", method = RequestMethod.POST)
    public ResponseEntity<OrderDetailsSearchResponse> getOrderDetails(@Parameter(description = "Details for searching order details", required = true, schema = @Schema(implementation = OpenApiBailSearchRequest.class)) @RequestBody @Valid OrderDetailsSearch orderDetailsSearch) {
        OrderDetailsSearchResponse response = openApiService.getOrderDetails(orderDetailsSearch);
        return new ResponseEntity<>(response, HttpStatus.OK);
    }

    @PostMapping("/openapi/v1/case/addAddress")
    public ResponseEntity<AddAddressResponse> addAddress(@RequestBody @Valid AddAddressRequest addAddressRequest) {

        // This api is accessed before login so internal request info is set
        RequestInfo requestInfo = requestInfoGenerator.createInternalRequestInfo();
        addAddressRequest.setRequestInfo(requestInfo);
        ResponseInfo responseInfo = responseInfoFactory.createResponseInfoFromRequestInfo(requestInfo, true);
        AddAddressResponse response = openApiService.addAddress(addAddressRequest);
        response.setResponseInfo(responseInfo);

        return ResponseEntity.ok(response);

    }
}
