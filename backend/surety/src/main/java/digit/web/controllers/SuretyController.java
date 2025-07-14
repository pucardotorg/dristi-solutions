package digit.web.controllers;


import digit.service.SuretyService;
import digit.util.ResponseInfoFactory;
import digit.web.models.*;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.enums.ParameterIn;
import io.swagger.v3.oas.annotations.media.Schema;
import org.egov.common.contract.response.ResponseInfo;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMethod;
import org.springframework.web.bind.annotation.RequestMapping;

import java.util.Collections;
import java.util.List;

import jakarta.validation.Valid;

@jakarta.annotation.Generated(value = "org.egov.codegen.SpringBootCodegen", date = "2025-07-01T18:23:09.143185454+05:30[Asia/Kolkata]")
@Controller
@RequestMapping("")
public class SuretyController {

    private final SuretyService suretyService;
    private final ResponseInfoFactory responseInfoFactory;

    @Autowired
    public SuretyController(SuretyService suretyService, ResponseInfoFactory responseInfoFactory) {
        this.suretyService = suretyService;
        this.responseInfoFactory = responseInfoFactory;
    }

    @RequestMapping(value = "/v1/_create", method = RequestMethod.POST)
    public ResponseEntity<SuretyResponse> v1CreatePost(@Parameter(in = ParameterIn.DEFAULT, description = "", schema = @Schema()) @Valid @RequestBody SuretyRequest body) {
        Surety surety = suretyService.create(body);
        ResponseInfo responseInfo = responseInfoFactory.createResponseInfoFromRequestInfo(body.getRequestInfo(), true);
        SuretyResponse response = SuretyResponse.builder().sureties(Collections.singletonList(surety)).responseInfo(responseInfo).build();
        return new ResponseEntity<SuretyResponse>(response,HttpStatus.OK);
    }

    @RequestMapping(value = "/v1/_search", method = RequestMethod.POST)
    public ResponseEntity<SuretySearchResponse> v1SearchPost(@Parameter(in = ParameterIn.DEFAULT, description = "", schema = @Schema()) @Valid @RequestBody SuretySearchRequest body) {
        List<Surety> sureties = suretyService.search(body);
        ResponseInfo responseInfo = responseInfoFactory.createResponseInfoFromRequestInfo(body.getRequestInfo(), true);
        SuretySearchResponse response = SuretySearchResponse.builder().sureties(sureties).responseInfo(responseInfo).build();
        return new ResponseEntity<SuretySearchResponse>(response,HttpStatus.OK);
    }

    @RequestMapping(value = "/v1/_update", method = RequestMethod.POST)
    public ResponseEntity<SuretyResponse> v1UpdatePost(@Parameter(in = ParameterIn.DEFAULT, description = "", schema = @Schema()) @Valid @RequestBody SuretyRequest body) {
        Surety surety = suretyService.update(body);
        ResponseInfo responseInfo = responseInfoFactory.createResponseInfoFromRequestInfo(body.getRequestInfo(), true);
        SuretyResponse response = SuretyResponse.builder().sureties(Collections.singletonList(surety)).responseInfo(responseInfo).build();
        return new ResponseEntity<SuretyResponse>(response,HttpStatus.OK);
    }

}
