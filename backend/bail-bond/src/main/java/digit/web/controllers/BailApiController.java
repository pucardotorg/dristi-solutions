package digit.web.controllers;


import digit.service.BailService;
import digit.util.ResponseInfoFactory;
import digit.web.models.Bail;
import digit.web.models.BailRequest;
import digit.web.models.BailResponse;
import digit.web.models.BailSearchRequest;
import digit.web.models.BailSearchResponse;
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
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMethod;
import org.springframework.web.bind.annotation.RequestMapping;

import java.io.IOException;
import java.util.Collections;

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
        String accept = request.getHeader("Accept");
        if (accept != null && accept.contains("application/json")) {
            try {
                return new ResponseEntity<BailSearchResponse>(objectMapper.readValue("{  \"ResponseInfo\" : {    \"ver\" : \"ver\",    \"resMsgId\" : \"resMsgId\",    \"msgId\" : \"msgId\",    \"apiId\" : \"apiId\",    \"ts\" : 0,    \"status\" : \"SUCCESSFUL\"  },  \"bails\" : [ {    \"filingNumber\" : \"filingNumber\",    \"workflow\" : {      \"documents\" : [ null, null ],      \"action\" : \"action\",      \"assignees\" : [ \"assignees\", \"assignees\" ],      \"comment\" : \"comment\",      \"status\" : \"status\"    },    \"endDate\" : 5,    \"documents\" : [ null, null ],    \"litigantFatherName\" : \"litigantFatherName\",    \"caseTitle\" : \"caseTitle\",    \"bailType\" : \"Personal\",    \"litigantSigned\" : true,    \"isActive\" : true,    \"additionalDetails\" : { },    \"cnrNumber\" : \"cnrNumber\",    \"caseType\" : \"ST\",    \"shortenedURL\" : \"shortenedURL\",    \"sureties\" : [ {      \"hasSigned\" : true,      \"fatherName\" : \"fatherName\",      \"address\" : { },      \"documents\" : [ {        \"documentType\" : \"documentType\",        \"documentUid\" : \"documentUid\",        \"fileStore\" : \"fileStore\",        \"id\" : \"id\",        \"additionalDetails\" : { }      }, {        \"documentType\" : \"documentType\",        \"documentUid\" : \"documentUid\",        \"fileStore\" : \"fileStore\",        \"id\" : \"id\",        \"additionalDetails\" : { }      } ],      \"mobileNumber\" : \"mobileNumber\",      \"tenantId\" : \"tenantId\",      \"name\" : \"name\",      \"id\" : \"id\",      \"isApproved\" : true,      \"isActive\" : true,      \"additionalDetails\" : { },      \"email\" : \"email\"    }, {      \"hasSigned\" : true,      \"fatherName\" : \"fatherName\",      \"address\" : { },      \"documents\" : [ {        \"documentType\" : \"documentType\",        \"documentUid\" : \"documentUid\",        \"fileStore\" : \"fileStore\",        \"id\" : \"id\",        \"additionalDetails\" : { }      }, {        \"documentType\" : \"documentType\",        \"documentUid\" : \"documentUid\",        \"fileStore\" : \"fileStore\",        \"id\" : \"id\",        \"additionalDetails\" : { }      } ],      \"mobileNumber\" : \"mobileNumber\",      \"tenantId\" : \"tenantId\",      \"name\" : \"name\",      \"id\" : \"id\",      \"isApproved\" : true,      \"isActive\" : true,      \"additionalDetails\" : { },      \"email\" : \"email\"    } ],    \"caseId\" : \"caseId\",    \"litigantName\" : \"litigantName\",    \"auditDetails\" : {      \"lastModifiedTime\" : 2,      \"createdBy\" : \"createdBy\",      \"lastModifiedBy\" : \"lastModifiedBy\",      \"createdTime\" : 5    },    \"tenantId\" : \"tenantId\",    \"id\" : \"id\",    \"litigantId\" : \"litigantId\",    \"bailAmount\" : 6.027456183070403,    \"startDate\" : 1,    \"bailId\" : \"bailId\",    \"courtId\" : \"courtId\"  }, {    \"filingNumber\" : \"filingNumber\",    \"workflow\" : {      \"documents\" : [ null, null ],      \"action\" : \"action\",      \"assignees\" : [ \"assignees\", \"assignees\" ],      \"comment\" : \"comment\",      \"status\" : \"status\"    },    \"endDate\" : 5,    \"documents\" : [ null, null ],    \"litigantFatherName\" : \"litigantFatherName\",    \"caseTitle\" : \"caseTitle\",    \"bailType\" : \"Personal\",    \"litigantSigned\" : true,    \"isActive\" : true,    \"additionalDetails\" : { },    \"cnrNumber\" : \"cnrNumber\",    \"caseType\" : \"ST\",    \"shortenedURL\" : \"shortenedURL\",    \"sureties\" : [ {      \"hasSigned\" : true,      \"fatherName\" : \"fatherName\",      \"address\" : { },      \"documents\" : [ {        \"documentType\" : \"documentType\",        \"documentUid\" : \"documentUid\",        \"fileStore\" : \"fileStore\",        \"id\" : \"id\",        \"additionalDetails\" : { }      }, {        \"documentType\" : \"documentType\",        \"documentUid\" : \"documentUid\",        \"fileStore\" : \"fileStore\",        \"id\" : \"id\",        \"additionalDetails\" : { }      } ],      \"mobileNumber\" : \"mobileNumber\",      \"tenantId\" : \"tenantId\",      \"name\" : \"name\",      \"id\" : \"id\",      \"isApproved\" : true,      \"isActive\" : true,      \"additionalDetails\" : { },      \"email\" : \"email\"    }, {      \"hasSigned\" : true,      \"fatherName\" : \"fatherName\",      \"address\" : { },      \"documents\" : [ {        \"documentType\" : \"documentType\",        \"documentUid\" : \"documentUid\",        \"fileStore\" : \"fileStore\",        \"id\" : \"id\",        \"additionalDetails\" : { }      }, {        \"documentType\" : \"documentType\",        \"documentUid\" : \"documentUid\",        \"fileStore\" : \"fileStore\",        \"id\" : \"id\",        \"additionalDetails\" : { }      } ],      \"mobileNumber\" : \"mobileNumber\",      \"tenantId\" : \"tenantId\",      \"name\" : \"name\",      \"id\" : \"id\",      \"isApproved\" : true,      \"isActive\" : true,      \"additionalDetails\" : { },      \"email\" : \"email\"    } ],    \"caseId\" : \"caseId\",    \"litigantName\" : \"litigantName\",    \"auditDetails\" : {      \"lastModifiedTime\" : 2,      \"createdBy\" : \"createdBy\",      \"lastModifiedBy\" : \"lastModifiedBy\",      \"createdTime\" : 5    },    \"tenantId\" : \"tenantId\",    \"id\" : \"id\",    \"litigantId\" : \"litigantId\",    \"bailAmount\" : 6.027456183070403,    \"startDate\" : 1,    \"bailId\" : \"bailId\",    \"courtId\" : \"courtId\"  } ]}", BailSearchResponse.class), HttpStatus.NOT_IMPLEMENTED);
            } catch (IOException e) {
                return new ResponseEntity<BailSearchResponse>(HttpStatus.INTERNAL_SERVER_ERROR);
            }
        }

        return new ResponseEntity<BailSearchResponse>(HttpStatus.NOT_IMPLEMENTED);
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

}
