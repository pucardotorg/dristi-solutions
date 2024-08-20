package digit.util;

import digit.config.Configuration;
import digit.web.models.*;
import lombok.extern.slf4j.Slf4j;
import org.egov.tracer.model.CustomException;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.core.io.ByteArrayResource;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestTemplate;

import java.time.Instant;
import java.time.ZoneId;
import java.time.ZonedDateTime;
import java.time.format.DateTimeFormatter;
import java.util.Locale;

@Component
@Slf4j
public class PdfServiceUtil {

    private final RestTemplate restTemplate;

    private final Configuration config;

    @Autowired
    public PdfServiceUtil(RestTemplate restTemplate, Configuration config) {
        this.restTemplate = restTemplate;
        this.config = config;
    }

    public ByteArrayResource generatePdfFromPdfService(TaskRequest taskRequest, String tenantId,
                                                       String pdfTemplateKey) {
        try {
            StringBuilder uri = new StringBuilder();
            uri.append(config.getPdfServiceHost())
                    .append(config.getPdfServiceEndpoint())
                    .append("?tenantId=").append(tenantId).append("&key=").append(pdfTemplateKey);

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            SummonsPdf summonsPdf = createSummonsPdfFromTask(taskRequest.getTask());
            SummonsPdfRequest summonsPdfRequest = SummonsPdfRequest.builder()
                    .summonsPdf(summonsPdf).requestInfo(taskRequest.getRequestInfo()).build();
            HttpEntity<SummonsPdfRequest> requestEntity = new HttpEntity<>(summonsPdfRequest, headers);

            ResponseEntity<ByteArrayResource> responseEntity = restTemplate.postForEntity(uri.toString(),
                    requestEntity, ByteArrayResource.class);

            return responseEntity.getBody();
        } catch (Exception e) {
            log.error("Error getting response from Pdf Service", e);
            throw new CustomException("SU_PDF_APP_ERROR", "Error getting response from Pdf Service");
        }
    }

    private SummonsPdf createSummonsPdfFromTask(Task task) {
        String issueDateString = formatDateFromMillis(task.getTaskDetails().getSummonDetails().getIssueDate());
        String filingNUmber = task.getFilingNumber();
        return SummonsPdf.builder()
                .tenantId(task.getTenantId())
                .cnrNumber(task.getCnrNumber())
                .issueDate(issueDateString)
                .caseName(task.getTaskDetails().getCaseDetails().getCaseTitle())
                .caseNumber(extractCaseNumber(filingNUmber))
                .caseYear(extractCaseYear(filingNUmber))
                .judgeName(task.getTaskDetails().getCaseDetails().getJudgeName())
                .courtName(task.getTaskDetails().getCaseDetails().getCourtName())
                .hearingDate(task.getTaskDetails().getCaseDetails().getHearingDate())
                .respondentName(task.getTaskDetails().getRespondentDetails().getName())
                .respondentAddress(task.getTaskDetails().getRespondentDetails().getAddress().toString())
                .build();
    }

    private String extractCaseNumber(String input) {
        if (input == null) {
            return "";
        }
        String regex = "-(\\d+)$";
        java.util.regex.Pattern pattern = java.util.regex.Pattern.compile(regex);
        java.util.regex.Matcher matcher = pattern.matcher(input);

        if (matcher.find()) {
            String numberStr = matcher.group(1);
            return numberStr.replaceFirst("^0+(?!$)", "");
        } else {
            return  "";
        }
    }

    public static String extractCaseYear(String input) {
        if (input == null) {
            return "";
        }
        String regex = "-(\\d{4})-";
        java.util.regex.Pattern pattern = java.util.regex.Pattern.compile(regex);
        java.util.regex.Matcher matcher = pattern.matcher(input);

        if (matcher.find()) {
            return matcher.group(1);
        } else {
            return "";
        }
    }

    private String formatDateFromMillis(long millis) {
        try {
            ZonedDateTime dateTime = Instant.ofEpochMilli(millis)
                    .atZone(ZoneId.of("Asia/Kolkata"));

            String day = String.valueOf(dateTime.getDayOfMonth());

            DateTimeFormatter formatter = DateTimeFormatter.ofPattern("MMMM yyyy", Locale.ENGLISH);
            String formattedMonthYear = dateTime.format(formatter);

            return String.format("%s day of %s", day, formattedMonthYear);
        } catch (Exception e) {
            log.error("Failed to get Date in String format from : {}", millis);
            return "";
        }
    }
}
