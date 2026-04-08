package digit.web.controllers;

import digit.service.SampleEntityService;
import digit.util.ResponseInfoFactory;
import digit.web.models.*;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.enums.ParameterIn;
import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.Valid;
import org.egov.common.contract.response.ResponseInfo;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestMethod;

import java.util.List;

@jakarta.annotation.Generated(value = "org.egov.codegen.SpringBootCodegen", date = "2026-04-08T15:24:31.238628853+05:30[Asia/Kolkata]")
@Controller
@RequestMapping("")
public class DigitalizedDocumentsApiController {

    private final SampleEntityService sampleEntityService;
    private final ResponseInfoFactory responseInfoFactory;

    @Autowired
    public DigitalizedDocumentsApiController(SampleEntityService sampleEntityService,
                                             ResponseInfoFactory responseInfoFactory) {
        this.sampleEntityService = sampleEntityService;
        this.responseInfoFactory = responseInfoFactory;
    }

    @RequestMapping(value = "/sample/v1/_create", method = RequestMethod.POST)
    public ResponseEntity<SampleEntityResponse> createSampleEntity(
            @Parameter(in = ParameterIn.DEFAULT, description = "Details for the new sample entity + RequestInfo meta data.",
                    required = true, schema = @Schema())
            @Valid @RequestBody SampleEntityRequest body) {

        SampleEntity sampleEntity = sampleEntityService.createSampleEntity(body);
        ResponseInfo responseInfo = responseInfoFactory.createResponseInfoFromRequestInfo(
                body.getRequestInfo(), true, HttpStatus.OK.getReasonPhrase());

        SampleEntityResponse response = SampleEntityResponse.builder()
                .sampleEntity(sampleEntity)
                .responseInfo(responseInfo)
                .build();

        return new ResponseEntity<>(response, HttpStatus.OK);
    }

    @RequestMapping(value = "/sample/v1/_update", method = RequestMethod.POST)
    public ResponseEntity<SampleEntityResponse> updateSampleEntity(
            @Parameter(in = ParameterIn.DEFAULT, description = "Details for updating the sample entity + RequestInfo meta data.",
                    required = true, schema = @Schema())
            @Valid @RequestBody SampleEntityRequest body) {

        SampleEntity sampleEntity = sampleEntityService.updateSampleEntity(body);
        ResponseInfo responseInfo = responseInfoFactory.createResponseInfoFromRequestInfo(
                body.getRequestInfo(), true, HttpStatus.OK.getReasonPhrase());

        SampleEntityResponse response = SampleEntityResponse.builder()
                .sampleEntity(sampleEntity)
                .responseInfo(responseInfo)
                .build();

        return new ResponseEntity<>(response, HttpStatus.OK);
    }

    @RequestMapping(value = "/sample/v1/_search", method = RequestMethod.POST)
    public ResponseEntity<SampleEntityListResponse> searchSampleEntity(
            @Parameter(in = ParameterIn.DEFAULT, required = true, schema = @Schema())
            @Valid @RequestBody SampleEntitySearchRequest request) {

        List<SampleEntity> sampleEntityList = sampleEntityService.searchSampleEntity(request);
        ResponseInfo responseInfo = responseInfoFactory.createResponseInfoFromRequestInfo(
                request.getRequestInfo(), true, HttpStatus.OK.getReasonPhrase());

        int totalCount;
        if (request.getPagination() != null) {
            totalCount = request.getPagination().getTotalCount().intValue();
        } else {
            totalCount = sampleEntityList.size();
        }

        SampleEntityListResponse response = SampleEntityListResponse.builder()
                .list(sampleEntityList)
                .totalCount(totalCount)
                .pagination(request.getPagination())
                .responseInfo(responseInfo)
                .build();

        return new ResponseEntity<>(response, HttpStatus.OK);
    }
}
