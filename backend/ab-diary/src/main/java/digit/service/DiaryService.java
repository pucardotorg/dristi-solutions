package digit.service;

import digit.config.Configuration;
import digit.enrichment.ADiaryEnrichment;
import digit.kafka.Producer;
import digit.repository.DiaryRepository;
import digit.util.ADiaryUtil;
import digit.util.FileStoreUtil;
import digit.util.PdfServiceUtil;
import digit.validators.ADiaryValidator;
import digit.web.models.*;
import lombok.extern.slf4j.Slf4j;
import org.apache.commons.lang.StringUtils;
import org.egov.common.contract.models.AuditDetails;
import org.egov.common.contract.models.Document;
import org.egov.common.contract.request.RequestInfo;
import org.egov.tracer.model.CustomException;
import org.springframework.core.io.ByteArrayResource;
import org.springframework.stereotype.Service;

import java.util.Date;
import java.util.List;
import java.text.SimpleDateFormat;

import static digit.config.ServiceConstants.*;

@Service
@Slf4j
public class DiaryService {

    private final Producer producer;

    private final Configuration configuration;

    private final DiaryRepository diaryRepository;

    private final ADiaryValidator validator;

    private final ADiaryEnrichment enrichment;

    private final DiaryEntryService diaryEntryService;

    private final FileStoreUtil fileStoreUtil;

    private final ADiaryUtil aDiaryUtil;

    private final PdfServiceUtil pdfServiceUtil;

    private final WorkflowService workflowService;

    public DiaryService(Producer producer, Configuration configuration, DiaryRepository diaryRepository, ADiaryValidator validator, ADiaryEnrichment enrichment, DiaryEntryService diaryEntryService, FileStoreUtil fileStoreUtil, ADiaryUtil aDiaryUtil, PdfServiceUtil pdfServiceUtil, WorkflowService workflowService) {
        this.producer = producer;
        this.configuration = configuration;
        this.diaryRepository = diaryRepository;
        this.validator = validator;
        this.enrichment = enrichment;
        this.diaryEntryService = diaryEntryService;
        this.fileStoreUtil = fileStoreUtil;
        this.aDiaryUtil = aDiaryUtil;
        this.pdfServiceUtil = pdfServiceUtil;
        this.workflowService = workflowService;
    }

    public List<CaseDiaryListItem> searchCaseDiaries(CaseDiarySearchRequest searchRequest) {

        log.info("operation = searchCaseDiaries ,  result = IN_PROGRESS , CaseDiarySearchRequest : {} ", searchRequest);
        try {
            if (searchRequest == null || searchRequest.getCriteria() == null) {
                return null;
            }
            log.info("operation = searchDiaryEntries ,  result = SUCCESS , caseDiaryEntryRequest : {} ", searchRequest);
            return diaryRepository.getCaseDiaries(searchRequest);
        } catch (CustomException e) {
            log.error("Custom exception while searching");
            throw e;
        } catch (Exception e) {
            throw new CustomException(DIARY_SEARCH_EXCEPTION, "Error while searching");
        }

    }

    public CaseDiary updateDiary(CaseDiaryRequest caseDiaryRequest) {
        log.info("operation = updateDiaryEntry ,  result = IN_PROGRESS , caseDiaryEntryRequest : {} ", caseDiaryRequest);

        try {
            validator.validateUpdateDiary(caseDiaryRequest);

            enrichment.enrichUpdateCaseDiary(caseDiaryRequest);

            workflowService.updateWorkflowStatus(caseDiaryRequest);

            producer.push(configuration.getADiaryUpdateTopic(), caseDiaryRequest);
        } catch (CustomException e) {
            log.error("Custom exception occurred while updating diary");
            throw e;
        } catch (Exception e) {
            log.error("Error occurred while updating diary");
            throw new CustomException(DIARY_UPDATE_EXCEPTION, e.getMessage());
        }
        log.info("operation = updateDiaryEntry ,  result = SUCCESS , caseDiaryEntryRequest : {} ", caseDiaryRequest);

        return caseDiaryRequest.getDiary();
    }

    public String generateDiary(CaseDiaryGenerateRequest generateRequest) {

        log.info("operation = generateDiary ,  result = IN_PROGRESS , CaseDiaryGenerateRequest : {} ", generateRequest);
        try {
            if (generateRequest == null || generateRequest.getDiary() == null) {
                return null;
            }
            SimpleDateFormat dateFormat = new SimpleDateFormat(DOB_FORMAT_D_M_Y);

            CaseDiaryRequest caseDiaryRequest = CaseDiaryRequest.builder().requestInfo(generateRequest.getRequestInfo()).diary(generateRequest.getDiary()).build();

            validator.validateSaveDiary(caseDiaryRequest);

            enrichment.enrichSaveCaseDiary(caseDiaryRequest);

            List<CaseDiaryEntry> caseDiaryEntries;
            CaseDiarySearchRequest caseDiarySearchRequest = buildCaseDiarySearchRequest(generateRequest);

            caseDiaryEntries = diaryEntryService.searchDiaryEntries(caseDiarySearchRequest);
            caseDiaryEntries.forEach(entry -> {
                if (entry.getHearingDate() != null) {
                    Date date = new Date(entry.getHearingDate());
                    entry.setDate(dateFormat.format(date));
                }
            });

            CaseDiary caseDiary = caseDiaryRequest.getDiary();

            caseDiary.setCaseDiaryEntries(caseDiaryEntries);
            caseDiary.setDate(dateFormat.format(new Date(caseDiary.getDiaryDate())));
            generateRequest.setDiary(caseDiary);

            ByteArrayResource byteArrayResource = generateCaseDiary(caseDiary, generateRequest.getRequestInfo());
            Document document = fileStoreUtil.saveDocumentToFileStore(byteArrayResource, generateRequest.getDiary().getTenantId());

            CaseDiaryDocument caseDiaryDocument = getCaseDiaryDocument(generateRequest, document);
            generateRequest.getDiary().addDocumentsItem(caseDiaryDocument);

            workflowService.updateWorkflowStatus(caseDiaryRequest);

            producer.push(configuration.getCaseDiaryTopic(), caseDiaryRequest);
            log.info("operation = generateDiary ,  result = SUCCESS , CaseDiaryGenerateRequest : {} ", generateRequest);

            return document.getFileStore();
        } catch (CustomException e) {
            log.error("Custom exception while generating diary");
            throw e;
        } catch (Exception e) {
            throw new CustomException(DIARY_GENERATE_EXCEPTION, "Error while generating diary");
        }

    }

    public CaseDiarySearchRequest buildCaseDiarySearchRequest(CaseDiaryGenerateRequest generateRequest) {
        return CaseDiarySearchRequest.builder().requestInfo(generateRequest.getRequestInfo())
                .criteria(CaseDiarySearchCriteria.builder()
                        .caseId(generateRequest.getDiary().getCaseNumber())
                        .tenantId(generateRequest.getDiary().getTenantId())
                        .diaryType(generateRequest.getDiary().getDiaryType())
                        .date(generateRequest.getDiary().getDiaryDate())
                        .judgeId(generateRequest.getDiary().getJudgeId())
                        .build())
                .build();
    }

    public CaseDiaryDocument getCaseDiaryDocument(CaseDiaryGenerateRequest generateRequest, Document document) {
        AuditDetails auditDetails = AuditDetails.builder()
                .createdTime(aDiaryUtil.getCurrentTimeInMilliSec())
                .lastModifiedTime(aDiaryUtil.getCurrentTimeInMilliSec())
                .createdBy(generateRequest.getRequestInfo().getUserInfo() != null ? generateRequest.getRequestInfo().getUserInfo().getUuid() : null)
                .lastModifiedBy(generateRequest.getRequestInfo().getUserInfo() != null ? generateRequest.getRequestInfo().getUserInfo().getUuid() : null)
                .build();

        return CaseDiaryDocument.builder()
                .id(aDiaryUtil.generateUUID())
                .tenantId(generateRequest.getDiary().getTenantId())
                .documentType(document.getDocumentType())
                .caseDiaryId(String.valueOf(generateRequest.getDiary().getId()))
                .fileStoreId(document.getFileStore())
                .documentUid(document.getDocumentUid())
                .additionalDetails(document.getAdditionalDetails())
                .auditDetails(auditDetails)
                .build();
    }

    public ByteArrayResource generateCaseDiary(CaseDiary caseDiary, RequestInfo requestInfo){
        log.info("operation = generateCaseDiary, result = IN_PROGRESS");
        ByteArrayResource byteArrayResource = null;
        try {
            CaseDiaryRequest caseDiaryRequest = CaseDiaryRequest.builder()
                    .requestInfo(requestInfo)
                    .courtName(configuration.getCourtName())
                    .diary(caseDiary).build();

            String pdfTemplateKey = "";
            if (StringUtils.equals(caseDiary.getDiaryType().toLowerCase(), "adiary")) {
                pdfTemplateKey = configuration.getADiaryPdfTemplateKey();
            } else if (StringUtils.equals(caseDiary.getDiaryType().toLowerCase(), "bdiary")) {
                pdfTemplateKey = configuration.getBDiaryPdfTemplateKey();
            }

            byteArrayResource =  pdfServiceUtil.generatePdfFromPdfService(caseDiaryRequest, caseDiary.getTenantId(), pdfTemplateKey);
            log.info("operation = generateCauseListPdf, result = SUCCESS");
        } catch (Exception e) {
            log.error("Error occurred while generating pdf: {}", e.getMessage());
        }
        return byteArrayResource;
    }
}
