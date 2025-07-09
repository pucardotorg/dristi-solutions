package digit.web.controllers;

import digit.util.ResponseInfoFactory;
import digit.web.models.*;
import com.fasterxml.jackson.databind.ObjectMapper;
import digit.service.BailService;
import digit.validators.BailRegistrationValidator;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.enums.ParameterIn;
import io.swagger.v3.oas.annotations.media.Schema;
import org.egov.common.contract.response.ResponseInfo;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMethod;
import org.springframework.web.bind.annotation.RequestMapping;
import java.util.*;

import jakarta.validation.Valid;
import jakarta.servlet.http.HttpServletRequest;

@jakarta.annotation.Generated(value = "org.egov.codegen.SpringBootCodegen", date = "2025-07-01T18:25:48.287360981+05:30[Asia/Kolkata]")
@Controller
@RequestMapping("")
public class V1ApiController {

    private final ObjectMapper objectMapper;

    private final HttpServletRequest request;

    private ResponseInfoFactory responseInfoFactory;

    @Autowired
    private BailService bailService;

    @Autowired
    private BailRegistrationValidator bailValidator;

    @Autowired
    public V1ApiController(ObjectMapper objectMapper, HttpServletRequest request,ResponseInfoFactory responseInfoFactory) {
        this.objectMapper = objectMapper;
        this.request = request;
        this.responseInfoFactory = responseInfoFactory;
    }

    @RequestMapping(value = "/v1/_create", method = RequestMethod.POST)
    public ResponseEntity<BailResponse> v1CreatePost(@Parameter(in = ParameterIn.DEFAULT, description = "", schema = @Schema()) @Valid @RequestBody BailRequest body) {
        Bail response = bailService.createBail(body);
        ResponseInfo responseInfo = responseInfoFactory.createResponseInfoFromRequestInfo(body.getRequestInfo(), true);
        BailResponse bailResponse = BailResponse.builder().bail(response).responseInfo(responseInfo).build();
        return new ResponseEntity<>(bailResponse, HttpStatus.OK);
    }

    @RequestMapping(value = "/v1/search", method = RequestMethod.POST)
    public ResponseEntity<BailListResponse> bailV1SearchPost(
            @Parameter(in = ParameterIn.DEFAULT, required=true, schema=@Schema()) @Valid @RequestBody BailSearchRequest request)
    {
        List<Bail> bailList = bailService.searchBail(request);
        ResponseInfo responseInfo = responseInfoFactory.createResponseInfoFromRequestInfo(request.getRequestInfo(), true);
        int totalCount;
        if(request.getPagination() != null){
            totalCount = request.getPagination().getTotalCount().intValue();
        } else {
            totalCount = bailList.size();
        }
        BailListResponse bailListResponse = BailListResponse.builder()
                .bailList(bailList)
                .totalCount(totalCount)
                .responseInfo(responseInfo)
                .build();
        return new ResponseEntity<>(bailListResponse, HttpStatus.OK);
    }


    @RequestMapping(value = "/v1/exists", method = RequestMethod.POST)
    public ResponseEntity<BailExistsResponse> bailV1ExistsPost(
            @Parameter(in = ParameterIn.DEFAULT, description = "Check if the Bail(s) exist", required = true, schema = @Schema())
            @Valid @RequestBody BailExistsRequest body) {

        BailExists order = bailService.isBailExist(body);
        ResponseInfo responseInfo = responseInfoFactory.createResponseInfoFromRequestInfo(body.getRequestInfo(), true);
        BailExistsResponse bailExistsResponse = BailExistsResponse.builder()
                .order(order)
                .responseInfo(responseInfo)
                .build();
        return new ResponseEntity<>(bailExistsResponse, HttpStatus.OK);
    }



    @RequestMapping(value = "/v1/update", method = RequestMethod.POST)
    public ResponseEntity<BailResponse> bailV1UpdatePost(
            @Parameter(in = ParameterIn.DEFAULT, description = "Details for the update bail(s) + RequestInfo meta data.", required = true, schema = @Schema())
            @Valid @RequestBody BailRequest body) {

        Bail bail = bailService.updateBail(body);
        ResponseInfo responseInfo = responseInfoFactory.createResponseInfoFromRequestInfo(body.getRequestInfo(), true);
        BailResponse bailResponse = BailResponse.builder().bail(bail).responseInfo(responseInfo).build();
        return new ResponseEntity<>(bailResponse, HttpStatus.OK);
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
