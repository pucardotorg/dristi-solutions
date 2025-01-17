package digit.web.controllers;


import digit.web.models.CaseDiaryEntryListResponse;
import digit.web.models.CaseDiaryEntryRequest;
import digit.web.models.CaseDiaryEntryResponse;
import digit.web.models.CaseDiaryFile;
import digit.web.models.CaseDiaryGenerateRequest;
import digit.web.models.CaseDiaryListResponse;
import digit.web.models.CaseDiaryRequest;
import digit.web.models.CaseDiaryResponse;
import digit.web.models.CaseDiarySearchRequest;

import java.util.UUID;

import com.fasterxml.jackson.databind.ObjectMapper;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.enums.ParameterIn;
import io.swagger.v3.oas.annotations.media.Schema;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RequestMethod;
import org.springframework.web.bind.annotation.RequestMapping;

import java.io.IOException;

import jakarta.validation.constraints.*;
import jakarta.validation.Valid;
import jakarta.servlet.http.HttpServletRequest;

@jakarta.annotation.Generated(value = "org.egov.codegen.SpringBootCodegen", date = "2025-01-15T12:45:29.792404900+05:30[Asia/Kolkata]")
@Controller
@RequestMapping("")
public class CaseDairyApiController {

    private final ObjectMapper objectMapper;

    private final HttpServletRequest request;

    @Autowired
    public CaseDairyApiController(ObjectMapper objectMapper, HttpServletRequest request) {
        this.objectMapper = objectMapper;
        this.request = request;
    }

    @RequestMapping(value = "/case/diary/v1/addDiaryEntry", method = RequestMethod.POST)
    public ResponseEntity<CaseDiaryResponse> addDiaryEntry(@Parameter(in = ParameterIn.DEFAULT, description = "Details for the new diary entry + RequestInfo meta data.", schema = @Schema()) @Valid @RequestBody CaseDiaryRequest body) {
        String accept = request.getHeader("Accept");
        if (accept != null && accept.contains("application/json")) {
            try {
                return new ResponseEntity<CaseDiaryResponse>(objectMapper.readValue("{  \"ResponseInfo\" : {    \"ver\" : \"ver\",    \"resMsgId\" : \"resMsgId\",    \"msgId\" : \"msgId\",    \"apiId\" : \"apiId\",    \"ts\" : 0,    \"status\" : \"SUCCESSFUL\"  },  \"diaryEntry\" : {    \"diaryType\" : \"ADiary, BDiary\",    \"diaryDate\" : 6,    \"documents\" : \"documentType = casediary.signed / casediary.unsigned\",    \"caseNumber\" : \"caseNumber\",    \"auditDetails\" : {      \"lastModifiedTime\" : 5,      \"createdBy\" : \"createdBy\",      \"lastModifiedBy\" : \"lastModifiedBy\",      \"createdTime\" : 1    },    \"tenantId\" : \"tenantId\",    \"id\" : \"046b6c7f-0b8a-43b9-b35d-6489e6daee91\",    \"additionalDetails\" : { },    \"judgeId\" : \"judgeId\"  }}", CaseDiaryResponse.class), HttpStatus.NOT_IMPLEMENTED);
            } catch (IOException e) {
                return new ResponseEntity<CaseDiaryResponse>(HttpStatus.INTERNAL_SERVER_ERROR);
            }
        }

        return new ResponseEntity<CaseDiaryResponse>(HttpStatus.NOT_IMPLEMENTED);
    }

    @RequestMapping(value = "/case/diary/entry/v1/update", method = RequestMethod.POST)
    public ResponseEntity<CaseDiaryEntryResponse> caseDiaryEntryV1UpdatePost(@Parameter(in = ParameterIn.DEFAULT, description = "updated diary line item + RequestInfo meta data.", schema = @Schema()) @Valid @RequestBody CaseDiaryEntryRequest body) {
        String accept = request.getHeader("Accept");
        if (accept != null && accept.contains("application/json")) {
            try {
                return new ResponseEntity<CaseDiaryEntryResponse>(objectMapper.readValue("{  \"ResponseInfo\" : {    \"ver\" : \"ver\",    \"resMsgId\" : \"resMsgId\",    \"msgId\" : \"msgId\",    \"apiId\" : \"apiId\",    \"ts\" : 0,    \"status\" : \"SUCCESSFUL\"  },  \"diaryEntry\" : {    \"businessOfDay\" : \"businessOfDay\",    \"entryDate\" : 0,    \"caseNumber\" : \"caseNumber\",    \"hearingDate\" : 6,    \"auditDetails\" : {      \"lastModifiedTime\" : 5,      \"createdBy\" : \"createdBy\",      \"lastModifiedBy\" : \"lastModifiedBy\",      \"createdTime\" : 1    },    \"tenantId\" : \"tenantId\",    \"referenceType\" : \"order, hearing, evidence etc.\",    \"id\" : \"046b6c7f-0b8a-43b9-b35d-6489e6daee91\",    \"additionalDetails\" : { },    \"referenceId\" : \"referenceId\",    \"judgeId\" : \"judgeId\"  }}", CaseDiaryEntryResponse.class), HttpStatus.NOT_IMPLEMENTED);
            } catch (IOException e) {
                return new ResponseEntity<CaseDiaryEntryResponse>(HttpStatus.INTERNAL_SERVER_ERROR);
            }
        }

        return new ResponseEntity<CaseDiaryEntryResponse>(HttpStatus.NOT_IMPLEMENTED);
    }

    @RequestMapping(value = "/case/diary/v1/update", method = RequestMethod.POST)
    public ResponseEntity<CaseDiaryResponse> caseDiaryV1UpdatePost(@Parameter(in = ParameterIn.DEFAULT, description = "updated diary + RequestInfo meta data.", schema = @Schema()) @Valid @RequestBody CaseDiaryRequest body) {
        String accept = request.getHeader("Accept");
        if (accept != null && accept.contains("application/json")) {
            try {
                return new ResponseEntity<CaseDiaryResponse>(objectMapper.readValue("{  \"ResponseInfo\" : {    \"ver\" : \"ver\",    \"resMsgId\" : \"resMsgId\",    \"msgId\" : \"msgId\",    \"apiId\" : \"apiId\",    \"ts\" : 0,    \"status\" : \"SUCCESSFUL\"  },  \"diaryEntry\" : {    \"diaryType\" : \"ADiary, BDiary\",    \"diaryDate\" : 6,    \"documents\" : \"documentType = casediary.signed / casediary.unsigned\",    \"caseNumber\" : \"caseNumber\",    \"auditDetails\" : {      \"lastModifiedTime\" : 5,      \"createdBy\" : \"createdBy\",      \"lastModifiedBy\" : \"lastModifiedBy\",      \"createdTime\" : 1    },    \"tenantId\" : \"tenantId\",    \"id\" : \"046b6c7f-0b8a-43b9-b35d-6489e6daee91\",    \"additionalDetails\" : { },    \"judgeId\" : \"judgeId\"  }}", CaseDiaryResponse.class), HttpStatus.NOT_IMPLEMENTED);
            } catch (IOException e) {
                return new ResponseEntity<CaseDiaryResponse>(HttpStatus.INTERNAL_SERVER_ERROR);
            }
        }

        return new ResponseEntity<CaseDiaryResponse>(HttpStatus.NOT_IMPLEMENTED);
    }

    @RequestMapping(value = "/case/diary/v1/generate", method = RequestMethod.POST)
    public ResponseEntity<CaseDiaryFile> generate(@Parameter(in = ParameterIn.DEFAULT, description = "Details for diary whose PDF is being created + RequestInfo meta data.", schema = @Schema()) @Valid @RequestBody CaseDiaryGenerateRequest body) {
        String accept = request.getHeader("Accept");
        if (accept != null && accept.contains("application/json")) {
            try {
                return new ResponseEntity<CaseDiaryFile>(objectMapper.readValue("{  \"ResponseInfo\" : {    \"ver\" : \"ver\",    \"resMsgId\" : \"resMsgId\",    \"msgId\" : \"msgId\",    \"apiId\" : \"apiId\",    \"ts\" : 0,    \"status\" : \"SUCCESSFUL\"  },  \"fileStoreID\" : \"fileStoreID\"}", CaseDiaryFile.class), HttpStatus.NOT_IMPLEMENTED);
            } catch (IOException e) {
                return new ResponseEntity<CaseDiaryFile>(HttpStatus.INTERNAL_SERVER_ERROR);
            }
        }

        return new ResponseEntity<CaseDiaryFile>(HttpStatus.NOT_IMPLEMENTED);
    }

    @RequestMapping(value = "/case/diary/v1/{tenantId}/{judgeId}/{diaryType}", method = RequestMethod.GET)
    public ResponseEntity<CaseDiaryResponse> getDiaryStoreId(@Pattern(regexp = "^[a-zA-Z]{2}$") @Size(min = 2, max = 2) @Parameter(in = ParameterIn.PATH, description = "tenant Id", required = true, schema = @Schema()) @PathVariable("tenantId") String tenantId, @Parameter(in = ParameterIn.PATH, description = "the Id of the Judge, whose diary is being queried", required = true, schema = @Schema()) @PathVariable("judgeId") String judgeId, @Parameter(in = ParameterIn.PATH, description = "the type of the diary i.e. A diary or B diary", required = true, schema = @Schema(allowableValues = "")) @PathVariable("diaryType") String diaryType, @Parameter(in = ParameterIn.QUERY, description = "the date for which we want the diary in EPOCH format, but with time component set to 0. This will be used in case we are searching A diary", schema = @Schema()) @Valid @RequestParam(value = "date", required = false) Long date, @Parameter(in = ParameterIn.QUERY, description = "the caseId for which we want the diary. This will be used in case we are searching for B diary", schema = @Schema()) @Valid @RequestParam(value = "caseId", required = false) UUID caseId) {
        String accept = request.getHeader("Accept");
        if (accept != null && accept.contains("application/json")) {
            try {
                return new ResponseEntity<CaseDiaryResponse>(objectMapper.readValue("{  \"ResponseInfo\" : {    \"ver\" : \"ver\",    \"resMsgId\" : \"resMsgId\",    \"msgId\" : \"msgId\",    \"apiId\" : \"apiId\",    \"ts\" : 0,    \"status\" : \"SUCCESSFUL\"  },  \"diaryEntry\" : {    \"diaryType\" : \"ADiary, BDiary\",    \"diaryDate\" : 6,    \"documents\" : \"documentType = casediary.signed / casediary.unsigned\",    \"caseNumber\" : \"caseNumber\",    \"auditDetails\" : {      \"lastModifiedTime\" : 5,      \"createdBy\" : \"createdBy\",      \"lastModifiedBy\" : \"lastModifiedBy\",      \"createdTime\" : 1    },    \"tenantId\" : \"tenantId\",    \"id\" : \"046b6c7f-0b8a-43b9-b35d-6489e6daee91\",    \"additionalDetails\" : { },    \"judgeId\" : \"judgeId\"  }}", CaseDiaryResponse.class), HttpStatus.NOT_IMPLEMENTED);
            } catch (IOException e) {
                return new ResponseEntity<CaseDiaryResponse>(HttpStatus.INTERNAL_SERVER_ERROR);
            }
        }

        return new ResponseEntity<CaseDiaryResponse>(HttpStatus.NOT_IMPLEMENTED);
    }

    @RequestMapping(value = "/case/diary/v1/search", method = RequestMethod.POST)
    public ResponseEntity<CaseDiaryListResponse> searchCaseDiaries(@Parameter(in = ParameterIn.DEFAULT, description = "Details for the search of diaries + RequestInfo meta data.", required = true, schema = @Schema()) @Valid @RequestBody CaseDiarySearchRequest body) {
        String accept = request.getHeader("Accept");
        if (accept != null && accept.contains("application/json")) {
            try {
                return new ResponseEntity<CaseDiaryListResponse>(objectMapper.readValue("{  \"ResponseInfo\" : {    \"ver\" : \"ver\",    \"resMsgId\" : \"resMsgId\",    \"msgId\" : \"msgId\",    \"apiId\" : \"apiId\",    \"ts\" : 0,    \"status\" : \"SUCCESSFUL\"  },  \"pagination\" : {    \"offSet\" : 1.4658129805029452,    \"limit\" : 60.27456183070403,    \"sortBy\" : \"sortBy\",    \"totalCount\" : 5.962133916683182,    \"order\" : \"\"  },  \"diaries\" : [ {    \"date\" : 0,    \"diaryType\" : \"ADiary, BDiary\",    \"diaryId\" : \"046b6c7f-0b8a-43b9-b35d-6489e6daee91\",    \"tenantId\" : \"tenantId\",    \"fileStoreID\" : \"fileStoreID\"  }, {    \"date\" : 0,    \"diaryType\" : \"ADiary, BDiary\",    \"diaryId\" : \"046b6c7f-0b8a-43b9-b35d-6489e6daee91\",    \"tenantId\" : \"tenantId\",    \"fileStoreID\" : \"fileStoreID\"  } ]}", CaseDiaryListResponse.class), HttpStatus.NOT_IMPLEMENTED);
            } catch (IOException e) {
                return new ResponseEntity<CaseDiaryListResponse>(HttpStatus.INTERNAL_SERVER_ERROR);
            }
        }

        return new ResponseEntity<CaseDiaryListResponse>(HttpStatus.NOT_IMPLEMENTED);
    }

    @RequestMapping(value = "/case/diary/entries/v1/search", method = RequestMethod.POST)
    public ResponseEntity<CaseDiaryEntryListResponse> search(@Parameter(in = ParameterIn.DEFAULT, description = "Details for the search of diary entries + RequestInfo meta data.", required = true, schema = @Schema()) @Valid @RequestBody CaseDiarySearchRequest body) {
        String accept = request.getHeader("Accept");
        if (accept != null && accept.contains("application/json")) {
            try {
                return new ResponseEntity<CaseDiaryEntryListResponse>(objectMapper.readValue("{  \"ResponseInfo\" : {    \"ver\" : \"ver\",    \"resMsgId\" : \"resMsgId\",    \"msgId\" : \"msgId\",    \"apiId\" : \"apiId\",    \"ts\" : 0,    \"status\" : \"SUCCESSFUL\"  },  \"entries\" : [ {    \"businessOfDay\" : \"businessOfDay\",    \"entryDate\" : 0,    \"caseNumber\" : \"caseNumber\",    \"hearingDate\" : 6,    \"auditDetails\" : {      \"lastModifiedTime\" : 5,      \"createdBy\" : \"createdBy\",      \"lastModifiedBy\" : \"lastModifiedBy\",      \"createdTime\" : 1    },    \"tenantId\" : \"tenantId\",    \"referenceType\" : \"order, hearing, evidence etc.\",    \"id\" : \"046b6c7f-0b8a-43b9-b35d-6489e6daee91\",    \"additionalDetails\" : { },    \"referenceId\" : \"referenceId\",    \"judgeId\" : \"judgeId\"  }, {    \"businessOfDay\" : \"businessOfDay\",    \"entryDate\" : 0,    \"caseNumber\" : \"caseNumber\",    \"hearingDate\" : 6,    \"auditDetails\" : {      \"lastModifiedTime\" : 5,      \"createdBy\" : \"createdBy\",      \"lastModifiedBy\" : \"lastModifiedBy\",      \"createdTime\" : 1    },    \"tenantId\" : \"tenantId\",    \"referenceType\" : \"order, hearing, evidence etc.\",    \"id\" : \"046b6c7f-0b8a-43b9-b35d-6489e6daee91\",    \"additionalDetails\" : { },    \"referenceId\" : \"referenceId\",    \"judgeId\" : \"judgeId\"  } ],  \"pagination\" : {    \"offSet\" : 1.4658129805029452,    \"limit\" : 60.27456183070403,    \"sortBy\" : \"sortBy\",    \"totalCount\" : 5.962133916683182,    \"order\" : \"\"  }}", CaseDiaryEntryListResponse.class), HttpStatus.NOT_IMPLEMENTED);
            } catch (IOException e) {
                return new ResponseEntity<CaseDiaryEntryListResponse>(HttpStatus.INTERNAL_SERVER_ERROR);
            }
        }

        return new ResponseEntity<CaseDiaryEntryListResponse>(HttpStatus.NOT_IMPLEMENTED);
    }

}
