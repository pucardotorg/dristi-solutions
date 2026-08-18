package org.pucar.dristi.web.controllers;


import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.enums.ParameterIn;
import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.Valid;
import org.egov.common.contract.response.ResponseInfo;
import org.pucar.dristi.service.TemplateConfigurationService;
import org.pucar.dristi.util.ResponseInfoFactory;
import org.pucar.dristi.web.models.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestMethod;

import java.util.List;


@jakarta.annotation.Generated(value = "org.egov.codegen.SpringBootCodegen", date = "2024-04-18T11:13:43.389623100+05:30[Asia/Calcutta]")
@Controller
@RequestMapping("")
public class TemplateConfigurationApiController {

    private TemplateConfigurationService templateConfigurationService;

    private ResponseInfoFactory responseInfoFactory;

    @Autowired
    public TemplateConfigurationApiController(TemplateConfigurationService templateConfigurationService, ResponseInfoFactory responseInfoFactory) {
        this.templateConfigurationService = templateConfigurationService;
        this.responseInfoFactory = responseInfoFactory;
    }

    public void setMockInjects(TemplateConfigurationService templateConfigurationService, ResponseInfoFactory responseInfoFactory){
        this.templateConfigurationService = templateConfigurationService;
        this.responseInfoFactory = responseInfoFactory;
    }

    @RequestMapping(value = "/v1/create", method = RequestMethod.POST)
    public ResponseEntity<TemplateConfigurationResponse> templateV1CreatePost(@Parameter(in = ParameterIn.DEFAULT, description = "Details for the new template + RequestInfo meta data.", required = true, schema = @Schema()) @Valid @RequestBody TemplateConfigurationRequest body) {
            TemplateConfiguration templateConfiguration = templateConfigurationService.createTemplateConfiguration(body);
            ResponseInfo responseInfo = responseInfoFactory.createResponseInfoFromRequestInfo(body.getRequestInfo(), true, HttpStatus.OK.getReasonPhrase());
            TemplateConfigurationResponse templateConfigurationResponse = TemplateConfigurationResponse.builder().templateConfiguration(templateConfiguration).responseInfo(responseInfo).build();
            return new ResponseEntity<>(templateConfigurationResponse, HttpStatus.OK);
    }

    @RequestMapping(value = "/v1/search", method = RequestMethod.POST)
    public ResponseEntity<TemplateConfigurationListResponse> templateV1SearchPost(@Parameter(in = ParameterIn.DEFAULT, required=true, schema=@Schema()) @Valid @RequestBody TemplateConfigurationSearchRequest request) {
            List<TemplateConfiguration> templateConfigurationList = templateConfigurationService.searchTemplateConfiguration(request);
            ResponseInfo responseInfo = responseInfoFactory.createResponseInfoFromRequestInfo(request.getRequestInfo(), true, HttpStatus.OK.getReasonPhrase());
            int totalCount;
            if (request.getPagination() != null) {
              totalCount = request.getPagination().getTotalCount().intValue();
            } else {
              totalCount = templateConfigurationList.size();
            }
            TemplateConfigurationListResponse templateConfigurationListResponse = TemplateConfigurationListResponse.builder().list(templateConfigurationList).totalCount(totalCount).pagination(request.getPagination()).responseInfo(responseInfo).build();
            return new ResponseEntity<>(templateConfigurationListResponse, HttpStatus.OK);
    }

    @RequestMapping(value = "/v1/update", method = RequestMethod.POST)
    public ResponseEntity<TemplateConfigurationResponse> templateV1UpdatePost(@Parameter(in = ParameterIn.DEFAULT, description = "Details for the update template(s) + RequestInfo meta data.", required = true, schema = @Schema()) @Valid @RequestBody TemplateConfigurationRequest body) {
            TemplateConfiguration templateConfiguration = templateConfigurationService.updateTemplateConfiguration(body);
            ResponseInfo responseInfo = responseInfoFactory.createResponseInfoFromRequestInfo(body.getRequestInfo(), true, HttpStatus.OK.getReasonPhrase());
            TemplateConfigurationResponse templateConfigurationResponse = TemplateConfigurationResponse.builder().templateConfiguration(templateConfiguration).responseInfo(responseInfo).build();
            return new ResponseEntity<>(templateConfigurationResponse, HttpStatus.OK);
    }
}

