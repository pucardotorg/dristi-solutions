package digit.web.controllers;


import digit.service.BailService;
import digit.util.ResponseInfoFactory;
import digit.web.models.*;
import com.fasterxml.jackson.databind.ObjectMapper;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.enums.ParameterIn;
import io.swagger.v3.oas.annotations.media.Schema;
import org.egov.common.contract.request.RequestInfo;
import org.egov.common.contract.response.ResponseInfo;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMethod;
import org.springframework.web.bind.annotation.RequestMapping;

import java.io.IOException;
import java.util.Collections;
import java.util.List;

import jakarta.validation.Valid;
import jakarta.servlet.http.HttpServletRequest;

@jakarta.annotation.Generated(value = "org.egov.codegen.SpringBootCodegen", date = "2025-07-10T12:09:26.562015481+05:30[Asia/Kolkata]")
@Controller
@RequestMapping("")
public class BailApiController {

    private final ObjectMapper objectMapper;

    private final HttpServletRequest request;

    private final ResponseInfoFactory responseInfoFactory;
    private final BailService bailService;

    @Autowired
    public BailApiController(ObjectMapper objectMapper, HttpServletRequest request, ResponseInfoFactory responseInfoFactory, BailService bailService) {
        this.objectMapper = objectMapper;
        this.request = request;
        this.responseInfoFactory = responseInfoFactory;
        this.bailService = bailService;
    }

    @RequestMapping(value = "/v1/_create", method = RequestMethod.POST)
    public ResponseEntity<BailResponse> bailV1CreatePost(@Parameter(in = ParameterIn.DEFAULT, description = "", schema = @Schema()) @Valid @RequestBody BailRequest body) {
        Bail bail = bailService.createBail(body);
        RequestInfo requestInfo = body.getRequestInfo();
        ResponseInfo responseInfo = responseInfoFactory.createResponseInfoFromRequestInfo(requestInfo, true);
        BailResponse bailResponse = BailResponse.builder()
                .bails(Collections.singletonList(bail))
                .responseInfo(responseInfo)
                .build();
        return new ResponseEntity<BailResponse>(bailResponse, HttpStatus.OK);
    }

    @RequestMapping(value = "/v1/_search", method = RequestMethod.POST)
    public ResponseEntity<BailSearchResponse> bailV1SearchPost(@Parameter(in = ParameterIn.DEFAULT, description = "", schema = @Schema()) @Valid @RequestBody BailSearchRequest body) {
        List<Bail> bails = bailService.searchBail(body);
        RequestInfo requestInfo = body.getRequestInfo();
        ResponseInfo responseInfo = responseInfoFactory.createResponseInfoFromRequestInfo(requestInfo, true);

        BailSearchResponse bailResponse = BailSearchResponse.builder()
                .bails(bails)
                .responseInfo(responseInfo)
                .pagination(body.getPagination())
                .build();
        return new ResponseEntity<BailSearchResponse>(bailResponse, HttpStatus.OK);
    }

    @RequestMapping(value = "/v1/_update", method = RequestMethod.POST)
    public ResponseEntity<BailResponse> bailV1UpdatePost(@Parameter(in = ParameterIn.DEFAULT, description = "", schema = @Schema()) @Valid @RequestBody BailRequest body) {
        Bail bail = bailService.updateBail(body);
        ResponseInfo responseInfo = responseInfoFactory.createResponseInfoFromRequestInfo(body.getRequestInfo(), true);
        BailResponse bailResponse = BailResponse.builder()
                .bails(Collections.singletonList(bail))
                .responseInfo(responseInfo)
                .build();
        return new ResponseEntity<BailResponse>(bailResponse, HttpStatus.OK);
    }

    @PostMapping("/v1/_getBailsToSign")
    public ResponseEntity<BailsToSignResponse> getBailsToSign(
            @Parameter(in = ParameterIn.DEFAULT, required = true, schema = @Schema())
            @Valid @RequestBody BailsToSignRequest request) {

        List<BailToSign>  bailToSignList = bailService.createBailToSignRequest(request);
        BailsToSignResponse response = BailsToSignResponse.builder()
                .responseInfo(responseInfoFactory.createResponseInfoFromRequestInfo(request.getRequestInfo(), true))
                .bailList(bailToSignList)
                .build();
        return new ResponseEntity<>(response, HttpStatus.OK);
    }

    @PostMapping("/v1/_updateSignedBails")
    public ResponseEntity<UpdateSignedBailResponse> updateSignedBails(
            @Parameter(in = ParameterIn.DEFAULT, required = true, schema = @Schema())
            @Valid @RequestBody UpdateSignedBailRequest request) {

        List<Bail> bails = bailService.updateBailWithSignDoc(request);
        UpdateSignedBailResponse response = UpdateSignedBailResponse.builder()
                .bails(bails)
                .responseInfo(responseInfoFactory.createResponseInfoFromRequestInfo(request.getRequestInfo(), true))
                .build();
        return new ResponseEntity<>(response, HttpStatus.OK);
    }
}
