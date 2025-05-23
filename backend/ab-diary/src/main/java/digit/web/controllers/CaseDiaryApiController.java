package digit.web.controllers;


import digit.service.DiaryEntryService;
import digit.service.DiaryService;
import digit.util.ResponseInfoFactory;
import digit.web.models.*;

import java.util.List;
import java.util.UUID;

import com.fasterxml.jackson.databind.ObjectMapper;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.enums.ParameterIn;
import io.swagger.v3.oas.annotations.media.Schema;
import lombok.extern.slf4j.Slf4j;
import org.egov.common.contract.request.RequestInfo;
import org.egov.common.contract.response.ResponseInfo;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RequestMethod;
import org.springframework.web.bind.annotation.RequestMapping;

import jakarta.validation.constraints.*;
import jakarta.validation.Valid;
import jakarta.servlet.http.HttpServletRequest;

@Slf4j
@jakarta.annotation.Generated(value = "org.egov.codegen.SpringBootCodegen", date = "2025-01-15T12:45:29.792404900+05:30[Asia/Kolkata]")
@Controller
@RequestMapping("")
public class CaseDiaryApiController {

    private final ObjectMapper objectMapper;

    private final HttpServletRequest request;

    private final DiaryEntryService diaryEntryService;

    private final ResponseInfoFactory responseInfoFactory;

    private final DiaryService diaryService;

    @Autowired
    public CaseDiaryApiController(ObjectMapper objectMapper, HttpServletRequest request, DiaryEntryService diaryEntryService, ResponseInfoFactory responseInfoFactory, DiaryService diaryService) {
        this.objectMapper = objectMapper;
        this.request = request;
        this.diaryEntryService = diaryEntryService;
        this.responseInfoFactory = responseInfoFactory;
        this.diaryService = diaryService;
    }

    @RequestMapping(value = "/case/diary/v1/addDiaryEntry", method = RequestMethod.POST)
    public ResponseEntity<CaseDiaryEntryResponse> addDiaryEntry(@Parameter(in = ParameterIn.DEFAULT, description = "Details for the new diary entry + RequestInfo meta data.", schema = @Schema()) @Valid @RequestBody CaseDiaryEntryRequest body) {
        log.info("api = /case/diary/v1/addDiaryEntry, result = IN_PROGRESS");
        CaseDiaryEntry response = diaryEntryService.addDiaryEntry(body);
        ResponseInfo responseInfo = responseInfoFactory.createResponseInfoFromRequestInfo(body.getRequestInfo(), true);
        CaseDiaryEntryResponse caseDiaryEntryResponse = CaseDiaryEntryResponse.builder().diaryEntry(response)
                .responseInfo(responseInfo).build();
        log.info("api = /case/diary/v1/addDiaryEntry, result = SUCCESS");
        return new ResponseEntity<>(caseDiaryEntryResponse, HttpStatus.OK);
    }

    @RequestMapping(value = "/case/diary/entry/v1/update", method = RequestMethod.POST)
    public ResponseEntity<CaseDiaryEntryResponse> caseDiaryEntryV1UpdatePost(@Parameter(in = ParameterIn.DEFAULT, description = "updated diary line item + RequestInfo meta data.", schema = @Schema()) @Valid @RequestBody CaseDiaryEntryRequest body) {
        log.info("api = /case/diary/entry/v1/update, result = IN_PROGRESS");
        CaseDiaryEntry response = diaryEntryService.updateDiaryEntry(body);
        ResponseInfo responseInfo = responseInfoFactory.createResponseInfoFromRequestInfo(body.getRequestInfo(), true);
        CaseDiaryEntryResponse updateCaseDiaryEntryResponse = CaseDiaryEntryResponse.builder().diaryEntry(response)
                .responseInfo(responseInfo).build();
        log.info("api = /case/diary/entry/v1/update, result = SUCCESS");
        return new ResponseEntity<>(updateCaseDiaryEntryResponse, HttpStatus.OK);
    }

    @RequestMapping(value = "/case/diary/v1/update", method = RequestMethod.POST)
    public ResponseEntity<CaseDiaryResponse> caseDiaryV1UpdatePost(@Parameter(in = ParameterIn.DEFAULT, description = "updated diary + RequestInfo meta data.", schema = @Schema()) @Valid @RequestBody CaseDiaryRequest body) {
        log.info("api = /case/diary/v1/update, result = IN_PROGRESS");
        CaseDiary response = diaryService.updateDiary(body);
        ResponseInfo responseInfo = responseInfoFactory.createResponseInfoFromRequestInfo(body.getRequestInfo(), true);
        CaseDiaryResponse updateCaseDiaryResponse = CaseDiaryResponse.builder().diaryEntry(response)
                .responseInfo(responseInfo).build();
        log.info("api = /case/diary/v1/update, result = SUCCESS");
        return new ResponseEntity<>(updateCaseDiaryResponse, HttpStatus.OK);
    }

    @RequestMapping(value = "/case/diary/v1/generate", method = RequestMethod.POST)
    public ResponseEntity<CaseDiaryFile> generate(@Parameter(in = ParameterIn.DEFAULT, description = "Details for diary whose PDF is being created + RequestInfo meta data.", schema = @Schema()) @Valid @RequestBody CaseDiaryGenerateRequest body) {
        log.info("api = /case/diary/v1/generate, result = IN_PROGRESS");
        String response = diaryService.generateDiary(body);
        ResponseInfo responseInfo = responseInfoFactory.createResponseInfoFromRequestInfo(body.getRequestInfo(), true);
        CaseDiaryFile caseDiaryFile = CaseDiaryFile.builder().fileStoreID(response)
                .responseInfo(responseInfo).build();
        log.info("api = /case/diary/v1/generate, result = SUCCESS");
        return new ResponseEntity<>(caseDiaryFile, HttpStatus.OK);
    }

    @RequestMapping(value = "/case/diary/v1/{tenantId}/{courtId}/{diaryType}", method = RequestMethod.GET)
    public ResponseEntity<CaseDiaryResponse> getDiaryStoreId(@Pattern(regexp = "^[a-zA-Z]{2}$") @Size(min = 2, max = 2) @Parameter(in = ParameterIn.PATH, description = "tenant Id", required = true, schema = @Schema()) @PathVariable("tenantId") String tenantId, @Parameter(in = ParameterIn.PATH, description = "the Id of the court, whose diary is being queried", required = true, schema = @Schema()) @PathVariable("courtId") String courtId, @Parameter(in = ParameterIn.PATH, description = "the type of the diary i.e. A diary or B diary", required = true, schema = @Schema(allowableValues = "")) @PathVariable("diaryType") String diaryType, @Parameter(in = ParameterIn.QUERY, description = "the date for which we want the diary in EPOCH format, but with time component set to 0. This will be used in case we are searching A diary", schema = @Schema()) @Valid @RequestParam(value = "date", required = false) Long date, @Parameter(in = ParameterIn.QUERY, description = "the caseId for which we want the diary. This will be used in case we are searching for B diary", schema = @Schema()) @Valid @RequestParam(value = "caseId", required = false) UUID caseId) {
        log.info("api = /case/diary/v1/{tenantId}/{courtId}/{diaryType} , result = IN_PROGRESS");

        CaseDiary caseDiary = diaryService.searchCaseDiaryForJudge(tenantId,courtId,diaryType,date,caseId);
        ResponseInfo responseInfo = responseInfoFactory.createResponseInfoFromRequestInfo(RequestInfo.builder().build(),true);
        CaseDiaryResponse caseDiaryResponse = CaseDiaryResponse.builder()
                .diaryEntry(caseDiary)
                .responseInfo(responseInfo)
                .build();
        log.info("api = /case/diary/v1/{tenantId}/{courtId}/{diaryType} , result = SUCCESS");
        return new ResponseEntity<>(caseDiaryResponse,HttpStatus.OK);
    }

    @RequestMapping(value = "/case/diary/v1/search", method = RequestMethod.POST)
    public ResponseEntity<CaseDiaryListResponse> searchDiaries(@Parameter(in = ParameterIn.DEFAULT, description = "Details for the search of diaries + RequestInfo meta data.", required = true, schema = @Schema()) @Valid @RequestBody CaseDiarySearchRequest body) {
        log.info("api = /case/diary/v1/search, result = calling API");
        List<CaseDiaryListItem> caseDiaryListItems = diaryService.searchCaseDiaries(body);
        ResponseInfo responseInfo = responseInfoFactory.createResponseInfoFromRequestInfo(body.getRequestInfo(), true);
        CaseDiaryListResponse caseDiaryListResponse = CaseDiaryListResponse.builder()
                .responseInfo(responseInfo).pagination(body.getPagination())
                .diaries(caseDiaryListItems)
                .build();
        log.info("api = /case/diary/v1/search, result = SUCCESS");
        return new ResponseEntity<>(caseDiaryListResponse, HttpStatus.OK);
    }

    @RequestMapping(value = "/case/diary/entries/v1/search", method = RequestMethod.POST)
    public ResponseEntity<CaseDiaryEntryListResponse> searchDiaryEntry(@Parameter(in = ParameterIn.DEFAULT, description = "Details for the search of diary entries + RequestInfo meta data.", required = true, schema = @Schema()) @Valid @RequestBody CaseDiarySearchRequest body) {
        log.info("api = /case/diary/entries/v1/search, result = IN_PROGRESS");
        List<CaseDiaryEntry> caseDiaryEntries = diaryEntryService.searchDiaryEntries(body);
        ResponseInfo responseInfo = responseInfoFactory.createResponseInfoFromRequestInfo(body.getRequestInfo(), true);
        CaseDiaryEntryListResponse caseDiaryEntryListResponse = CaseDiaryEntryListResponse.builder()
                .responseInfo(responseInfo).pagination(body.getPagination())
                .entries(caseDiaryEntries)
                .build();
        log.info("api = /case/diary/entries/v1/search, result = SUCCESS");
        return new ResponseEntity<>(caseDiaryEntryListResponse, HttpStatus.OK);
    }

    @RequestMapping(value = "/case/diary/v1/bulkEntry", method = RequestMethod.POST)
    public ResponseEntity<BulkDiaryEntryResponse> bulkDiary(@Parameter(in = ParameterIn.DEFAULT, description = "Details for the diary entries + RequestInfo meta data.", required = true, schema = @Schema()) @Valid @RequestBody BulkDiaryEntryRequest request) {
        log.info("api = /case/diary/v1/bulkEntry, result = IN_PROGRESS");
        List<CaseDiaryEntry> caseDiaryEntries = diaryEntryService.bulkDiaryEntry(request);
        ResponseInfo responseInfo = responseInfoFactory.createResponseInfoFromRequestInfo(request.getRequestInfo(), true);
        BulkDiaryEntryResponse response = BulkDiaryEntryResponse.builder()
                .responseInfo(responseInfo)
                .caseDiaryEntries(caseDiaryEntries).build();
        log.info("api = /case/diary/v1/bulkEntry, result = SUCCESS");
        return new ResponseEntity<>(response, HttpStatus.OK);
    }
}
