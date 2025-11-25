package digit.web.controllers;


import com.fasterxml.jackson.databind.ObjectMapper;
import digit.web.models.DigitalizedDocumentRequest;
import digit.web.models.DigitalizedDocumentResponse;
import digit.web.models.DigitalizedDocumentSearchRequest;
import digit.web.models.DigitalizedDocumentSearchResponse;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.enums.ParameterIn;
import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestMethod;

import java.io.IOException;

@jakarta.annotation.Generated(value = "org.egov.codegen.SpringBootCodegen", date = "2025-11-25T18:36:45.881826585+05:30[Asia/Kolkata]")
@Controller
@RequestMapping("")
public class DigitalizedDocumentsApiController {

    private final ObjectMapper objectMapper;

    private final HttpServletRequest request;

    @Autowired
    public DigitalizedDocumentsApiController(ObjectMapper objectMapper, HttpServletRequest request) {
        this.objectMapper = objectMapper;
        this.request = request;
    }

    @RequestMapping(value = "/digitalized-documents/v1/_create", method = RequestMethod.POST)
    public ResponseEntity<DigitalizedDocumentResponse> digitalizedDocumentsV1CreatePost(@Parameter(in = ParameterIn.DEFAULT, description = "Details for the new digitalized document + RequestInfo meta data.", required = true, schema = @Schema()) @Valid @RequestBody DigitalizedDocumentRequest body) {
        String accept = request.getHeader("Accept");
        if (accept != null && accept.contains("application/json")) {
            try {
                return new ResponseEntity<DigitalizedDocumentResponse>(objectMapper.readValue("{  \"ResponseInfo\" : {    \"ver\" : \"ver\",    \"resMsgId\" : \"resMsgId\",    \"msgId\" : \"msgId\",    \"apiId\" : \"apiId\",    \"ts\" : 0,    \"status\" : \"SUCCESSFUL\"  },  \"digitalizedDocument\" : {    \"workflow\" : {      \"documents\" : [ {        \"documentType\" : \"documentType\",        \"documentUid\" : \"documentUid\",        \"fileStore\" : \"fileStore\",        \"id\" : \"id\",        \"additionalDetails\" : { }      }, {        \"documentType\" : \"documentType\",        \"documentUid\" : \"documentUid\",        \"fileStore\" : \"fileStore\",        \"id\" : \"id\",        \"additionalDetails\" : { }      } ],      \"action\" : \"action\",      \"assignees\" : [ \"assignees\", \"assignees\" ],      \"comment\" : \"comment\",      \"status\" : \"status\"    },    \"documents\" : [ null, null ],    \"documentNumber\" : \"documentNumber\",    \"pleaDetails\" : {      \"fatherName\" : \"fatherName\",      \"magistrateRemarks\" : \"magistrateRemarks\",      \"accusedName\" : \"accusedName\",      \"taluk\" : \"taluk\",      \"caste\" : \"caste\",      \"calling\" : \"calling\",      \"pleadGuilty\" : true,      \"accusedUniqueId\" : \"accusedUniqueId\",      \"isChargesUnderstood\" : true,      \"village\" : \"village\",      \"age\" : 6,      \"religion\" : \"religion\"    },    \"type\" : \"plea\",    \"additionalDetails\" : \"\",    \"mediationDetails\" : {      \"dateOfInstitution\" : 1,      \"hearingDate\" : 5,      \"natureOfComplainant\" : \"natureOfComplainant\",      \"caseStage\" : \"caseStage\",      \"partyDetails\" : [ {        \"hasSigned\" : true,        \"mobileNumber\" : \"mobileNumber\",        \"partyIndex\" : 5,        \"partyName\" : \"partyName\",        \"partyType\" : \"COMPLAINANT\",        \"uniqueId\" : \"uniqueId\"      }, {        \"hasSigned\" : true,        \"mobileNumber\" : \"mobileNumber\",        \"partyIndex\" : 5,        \"partyName\" : \"partyName\",        \"partyType\" : \"COMPLAINANT\",        \"uniqueId\" : \"uniqueId\"      } ]    },    \"caseId\" : \"caseId\",    \"auditDetails\" : {      \"lastModifiedTime\" : 7,      \"createdBy\" : \"createdBy\",      \"lastModifiedBy\" : \"lastModifiedBy\",      \"createdTime\" : 2    },    \"tenantId\" : \"tenantId\",    \"id\" : \"id\",    \"caseFilingNumber\" : \"caseFilingNumber\",    \"examinationOfAccusedDetails\" : {      \"accusedName\" : \"accusedName\",      \"accusedMobileNumber\" : \"accusedMobileNumber\",      \"accusedUniqueId\" : \"accusedUniqueId\",      \"examinationDescription\" : \"examinationDescription\"    },    \"status\" : \"status\"  }}", DigitalizedDocumentResponse.class), HttpStatus.NOT_IMPLEMENTED);
            } catch (IOException e) {
                return new ResponseEntity<DigitalizedDocumentResponse>(HttpStatus.INTERNAL_SERVER_ERROR);
            }
        }

        return new ResponseEntity<DigitalizedDocumentResponse>(HttpStatus.NOT_IMPLEMENTED);
    }

    @RequestMapping(value = "/digitalized-documents/v1/_search", method = RequestMethod.POST)
    public ResponseEntity<DigitalizedDocumentSearchResponse> digitalizedDocumentsV1SearchPost(@Parameter(in = ParameterIn.DEFAULT, description = "Search criteria + RequestInfo meta data.", required = true, schema = @Schema()) @Valid @RequestBody DigitalizedDocumentSearchRequest body) {
        String accept = request.getHeader("Accept");
        if (accept != null && accept.contains("application/json")) {
            try {
                return new ResponseEntity<DigitalizedDocumentSearchResponse>(objectMapper.readValue("{  \"ResponseInfo\" : {    \"ver\" : \"ver\",    \"resMsgId\" : \"resMsgId\",    \"msgId\" : \"msgId\",    \"apiId\" : \"apiId\",    \"ts\" : 0,    \"status\" : \"SUCCESSFUL\"  },  \"pagination\" : {    \"offSet\" : 6.027456183070403,    \"limit\" : 8.008281904610115,    \"sortBy\" : \"sortBy\",    \"totalCount\" : 1.4658129805029452,    \"order\" : \"\"  },  \"documents\" : [ {    \"workflow\" : {      \"documents\" : [ {        \"documentType\" : \"documentType\",        \"documentUid\" : \"documentUid\",        \"fileStore\" : \"fileStore\",        \"id\" : \"id\",        \"additionalDetails\" : { }      }, {        \"documentType\" : \"documentType\",        \"documentUid\" : \"documentUid\",        \"fileStore\" : \"fileStore\",        \"id\" : \"id\",        \"additionalDetails\" : { }      } ],      \"action\" : \"action\",      \"assignees\" : [ \"assignees\", \"assignees\" ],      \"comment\" : \"comment\",      \"status\" : \"status\"    },    \"documents\" : [ null, null ],    \"documentNumber\" : \"documentNumber\",    \"pleaDetails\" : {      \"fatherName\" : \"fatherName\",      \"magistrateRemarks\" : \"magistrateRemarks\",      \"accusedName\" : \"accusedName\",      \"taluk\" : \"taluk\",      \"caste\" : \"caste\",      \"calling\" : \"calling\",      \"pleadGuilty\" : true,      \"accusedUniqueId\" : \"accusedUniqueId\",      \"isChargesUnderstood\" : true,      \"village\" : \"village\",      \"age\" : 6,      \"religion\" : \"religion\"    },    \"type\" : \"plea\",    \"additionalDetails\" : \"\",    \"mediationDetails\" : {      \"dateOfInstitution\" : 1,      \"hearingDate\" : 5,      \"natureOfComplainant\" : \"natureOfComplainant\",      \"caseStage\" : \"caseStage\",      \"partyDetails\" : [ {        \"hasSigned\" : true,        \"mobileNumber\" : \"mobileNumber\",        \"partyIndex\" : 5,        \"partyName\" : \"partyName\",        \"partyType\" : \"COMPLAINANT\",        \"uniqueId\" : \"uniqueId\"      }, {        \"hasSigned\" : true,        \"mobileNumber\" : \"mobileNumber\",        \"partyIndex\" : 5,        \"partyName\" : \"partyName\",        \"partyType\" : \"COMPLAINANT\",        \"uniqueId\" : \"uniqueId\"      } ]    },    \"caseId\" : \"caseId\",    \"auditDetails\" : {      \"lastModifiedTime\" : 7,      \"createdBy\" : \"createdBy\",      \"lastModifiedBy\" : \"lastModifiedBy\",      \"createdTime\" : 2    },    \"tenantId\" : \"tenantId\",    \"id\" : \"id\",    \"caseFilingNumber\" : \"caseFilingNumber\",    \"examinationOfAccusedDetails\" : {      \"accusedName\" : \"accusedName\",      \"accusedMobileNumber\" : \"accusedMobileNumber\",      \"accusedUniqueId\" : \"accusedUniqueId\",      \"examinationDescription\" : \"examinationDescription\"    },    \"status\" : \"status\"  }, {    \"workflow\" : {      \"documents\" : [ {        \"documentType\" : \"documentType\",        \"documentUid\" : \"documentUid\",        \"fileStore\" : \"fileStore\",        \"id\" : \"id\",        \"additionalDetails\" : { }      }, {        \"documentType\" : \"documentType\",        \"documentUid\" : \"documentUid\",        \"fileStore\" : \"fileStore\",        \"id\" : \"id\",        \"additionalDetails\" : { }      } ],      \"action\" : \"action\",      \"assignees\" : [ \"assignees\", \"assignees\" ],      \"comment\" : \"comment\",      \"status\" : \"status\"    },    \"documents\" : [ null, null ],    \"documentNumber\" : \"documentNumber\",    \"pleaDetails\" : {      \"fatherName\" : \"fatherName\",      \"magistrateRemarks\" : \"magistrateRemarks\",      \"accusedName\" : \"accusedName\",      \"taluk\" : \"taluk\",      \"caste\" : \"caste\",      \"calling\" : \"calling\",      \"pleadGuilty\" : true,      \"accusedUniqueId\" : \"accusedUniqueId\",      \"isChargesUnderstood\" : true,      \"village\" : \"village\",      \"age\" : 6,      \"religion\" : \"religion\"    },    \"type\" : \"plea\",    \"additionalDetails\" : \"\",    \"mediationDetails\" : {      \"dateOfInstitution\" : 1,      \"hearingDate\" : 5,      \"natureOfComplainant\" : \"natureOfComplainant\",      \"caseStage\" : \"caseStage\",      \"partyDetails\" : [ {        \"hasSigned\" : true,        \"mobileNumber\" : \"mobileNumber\",        \"partyIndex\" : 5,        \"partyName\" : \"partyName\",        \"partyType\" : \"COMPLAINANT\",        \"uniqueId\" : \"uniqueId\"      }, {        \"hasSigned\" : true,        \"mobileNumber\" : \"mobileNumber\",        \"partyIndex\" : 5,        \"partyName\" : \"partyName\",        \"partyType\" : \"COMPLAINANT\",        \"uniqueId\" : \"uniqueId\"      } ]    },    \"caseId\" : \"caseId\",    \"auditDetails\" : {      \"lastModifiedTime\" : 7,      \"createdBy\" : \"createdBy\",      \"lastModifiedBy\" : \"lastModifiedBy\",      \"createdTime\" : 2    },    \"tenantId\" : \"tenantId\",    \"id\" : \"id\",    \"caseFilingNumber\" : \"caseFilingNumber\",    \"examinationOfAccusedDetails\" : {      \"accusedName\" : \"accusedName\",      \"accusedMobileNumber\" : \"accusedMobileNumber\",      \"accusedUniqueId\" : \"accusedUniqueId\",      \"examinationDescription\" : \"examinationDescription\"    },    \"status\" : \"status\"  } ],  \"totalCount\" : 5}", DigitalizedDocumentSearchResponse.class), HttpStatus.NOT_IMPLEMENTED);
            } catch (IOException e) {
                return new ResponseEntity<DigitalizedDocumentSearchResponse>(HttpStatus.INTERNAL_SERVER_ERROR);
            }
        }

        return new ResponseEntity<DigitalizedDocumentSearchResponse>(HttpStatus.NOT_IMPLEMENTED);
    }

    @RequestMapping(value = "/digitalized-documents/v1/_update", method = RequestMethod.POST)
    public ResponseEntity<DigitalizedDocumentResponse> digitalizedDocumentsV1UpdatePost(@Parameter(in = ParameterIn.DEFAULT, description = "Details for updating the digitalized document + RequestInfo meta data.", required = true, schema = @Schema()) @Valid @RequestBody DigitalizedDocumentRequest body) {
        String accept = request.getHeader("Accept");
        if (accept != null && accept.contains("application/json")) {
            try {
                return new ResponseEntity<DigitalizedDocumentResponse>(objectMapper.readValue("{  \"ResponseInfo\" : {    \"ver\" : \"ver\",    \"resMsgId\" : \"resMsgId\",    \"msgId\" : \"msgId\",    \"apiId\" : \"apiId\",    \"ts\" : 0,    \"status\" : \"SUCCESSFUL\"  },  \"digitalizedDocument\" : {    \"workflow\" : {      \"documents\" : [ {        \"documentType\" : \"documentType\",        \"documentUid\" : \"documentUid\",        \"fileStore\" : \"fileStore\",        \"id\" : \"id\",        \"additionalDetails\" : { }      }, {        \"documentType\" : \"documentType\",        \"documentUid\" : \"documentUid\",        \"fileStore\" : \"fileStore\",        \"id\" : \"id\",        \"additionalDetails\" : { }      } ],      \"action\" : \"action\",      \"assignees\" : [ \"assignees\", \"assignees\" ],      \"comment\" : \"comment\",      \"status\" : \"status\"    },    \"documents\" : [ null, null ],    \"documentNumber\" : \"documentNumber\",    \"pleaDetails\" : {      \"fatherName\" : \"fatherName\",      \"magistrateRemarks\" : \"magistrateRemarks\",      \"accusedName\" : \"accusedName\",      \"taluk\" : \"taluk\",      \"caste\" : \"caste\",      \"calling\" : \"calling\",      \"pleadGuilty\" : true,      \"accusedUniqueId\" : \"accusedUniqueId\",      \"isChargesUnderstood\" : true,      \"village\" : \"village\",      \"age\" : 6,      \"religion\" : \"religion\"    },    \"type\" : \"plea\",    \"additionalDetails\" : \"\",    \"mediationDetails\" : {      \"dateOfInstitution\" : 1,      \"hearingDate\" : 5,      \"natureOfComplainant\" : \"natureOfComplainant\",      \"caseStage\" : \"caseStage\",      \"partyDetails\" : [ {        \"hasSigned\" : true,        \"mobileNumber\" : \"mobileNumber\",        \"partyIndex\" : 5,        \"partyName\" : \"partyName\",        \"partyType\" : \"COMPLAINANT\",        \"uniqueId\" : \"uniqueId\"      }, {        \"hasSigned\" : true,        \"mobileNumber\" : \"mobileNumber\",        \"partyIndex\" : 5,        \"partyName\" : \"partyName\",        \"partyType\" : \"COMPLAINANT\",        \"uniqueId\" : \"uniqueId\"      } ]    },    \"caseId\" : \"caseId\",    \"auditDetails\" : {      \"lastModifiedTime\" : 7,      \"createdBy\" : \"createdBy\",      \"lastModifiedBy\" : \"lastModifiedBy\",      \"createdTime\" : 2    },    \"tenantId\" : \"tenantId\",    \"id\" : \"id\",    \"caseFilingNumber\" : \"caseFilingNumber\",    \"examinationOfAccusedDetails\" : {      \"accusedName\" : \"accusedName\",      \"accusedMobileNumber\" : \"accusedMobileNumber\",      \"accusedUniqueId\" : \"accusedUniqueId\",      \"examinationDescription\" : \"examinationDescription\"    },    \"status\" : \"status\"  }}", DigitalizedDocumentResponse.class), HttpStatus.NOT_IMPLEMENTED);
            } catch (IOException e) {
                return new ResponseEntity<DigitalizedDocumentResponse>(HttpStatus.INTERNAL_SERVER_ERROR);
            }
        }

        return new ResponseEntity<DigitalizedDocumentResponse>(HttpStatus.NOT_IMPLEMENTED);
    }

}
