package org.pucar.dristi.web.controllers;


import com.fasterxml.jackson.databind.ObjectMapper;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.enums.ParameterIn;
import io.swagger.v3.oas.annotations.media.Schema;
import org.egov.common.contract.response.ResponseInfo;
import org.pucar.dristi.service.BankDetailsService;
import org.pucar.dristi.util.ResponseInfoFactory;
import org.pucar.dristi.web.models.BankDetails;
import org.pucar.dristi.web.models.BankDetailsSearchRequest;
import org.pucar.dristi.web.models.BankDetailsSearchResponse;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestMethod;

import javax.servlet.http.HttpServletRequest;
import javax.validation.Valid;
import java.util.List;

@javax.annotation.Generated(value = "org.egov.codegen.SpringBootCodegen", date = "2026-02-19T19:24:10.916325138+05:30[Asia/Kolkata]")
@Controller
@RequestMapping("")
public class BankDetailsApiController {

    private final ObjectMapper objectMapper;
    private final HttpServletRequest request;
    private final BankDetailsService bankDetailsService;
    private final ResponseInfoFactory responseInfoFactory;

    @Autowired
    public BankDetailsApiController(ObjectMapper objectMapper, HttpServletRequest request, BankDetailsService bankDetailsService, ResponseInfoFactory responseInfoFactory) {
        this.objectMapper = objectMapper;
        this.request = request;
        this.bankDetailsService = bankDetailsService;
        this.responseInfoFactory = responseInfoFactory;
    }

    @RequestMapping(value = "/v1/_search", method = RequestMethod.POST)
    public ResponseEntity<BankDetailsSearchResponse> bankDetailsV1SearchPost(@Parameter(in = ParameterIn.DEFAULT, description = "Search criteria + RequestInfo meta data.", required = true, schema = @Schema()) @Valid @RequestBody BankDetailsSearchRequest body) {

        List<BankDetails> bankDetails = bankDetailsService.searchBankDetails(body);
        ResponseInfo responseInfo = responseInfoFactory.createResponseInfoFromRequestInfo(body.getRequestInfo(), true);
        BankDetailsSearchResponse response = BankDetailsSearchResponse.builder()
                .responseInfo(responseInfo)
                .bankDetails(bankDetails)
                .build();

        return ResponseEntity.accepted().body(response);
    }

}
