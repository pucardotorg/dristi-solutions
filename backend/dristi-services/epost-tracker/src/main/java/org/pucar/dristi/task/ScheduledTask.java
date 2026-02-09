package org.pucar.dristi.task;

import lombok.extern.slf4j.Slf4j;
import org.egov.common.contract.request.RequestInfo;
import org.egov.common.contract.request.User;
import org.pucar.dristi.config.EPostConfiguration;
import org.pucar.dristi.kafka.Producer;
import org.pucar.dristi.model.*;
import org.pucar.dristi.model.email.Email;
import org.pucar.dristi.model.email.EmailRequest;
import org.pucar.dristi.service.EPostService;
import org.pucar.dristi.service.ExcelService;
import org.pucar.dristi.service.FileStoreService;
import org.pucar.dristi.service.UserService;
import org.pucar.dristi.util.PdfServiceUtil;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.scheduling.annotation.Async;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.time.LocalDate;
import java.time.ZoneId;
import java.time.ZonedDateTime;
import java.time.format.DateTimeFormatter;
import java.time.format.TextStyle;
import java.util.*;

import static org.pucar.dristi.config.ServiceConstants.msgId;

@Component
@Slf4j
public class ScheduledTask {

    private final ExcelService excelService;
    private final EPostConfiguration ePostConfiguration;
    private final EPostService ePostService;
    private final PdfServiceUtil pdfServiceUtil;
    private final Producer producer;
    private final FileStoreService fileStoreService;
    private final UserService userService;

    private final EPostConfiguration configuration;

    @Autowired
    public ScheduledTask(ExcelService excelService,
                         EPostConfiguration ePostConfiguration,
                         EPostService ePostService,
                         PdfServiceUtil pdfServiceUtil,
                         Producer producer,
                         FileStoreService fileStoreService, UserService userService, EPostConfiguration configuration) {
        this.excelService = excelService;
        this.ePostConfiguration = ePostConfiguration;
        this.ePostService = ePostService;
        this.pdfServiceUtil = pdfServiceUtil;
        this.producer = producer;
        this.fileStoreService = fileStoreService;
        this.userService = userService;
        this.configuration = configuration;
    }

    @Async
    @Scheduled(cron = "${epost.tracker.cron.expression}", zone = "Asia/Kolkata")
    public void sendEmailNotification() {
        log.info("Starting scheduled email notification...");

        String tenantId = ePostConfiguration.getEgovStateTenantId();
        ZoneId kolkataZone = ZoneId.of(ePostConfiguration.getZoneId());
        LocalDate today = LocalDate.now(kolkataZone);

        // Calculate previous month's date range
        LocalDate previousMonth = today.minusMonths(1);
        LocalDate startOfMonth = previousMonth.withDayOfMonth(1);
        LocalDate endOfMonth = previousMonth.withDayOfMonth(previousMonth.lengthOfMonth());

        // Convert to epoch milliseconds (start of day and end of day in Asia/Kolkata timezone)
        Long bookingDateStartTime = startOfMonth.atStartOfDay(kolkataZone).toInstant().toEpochMilli();
        Long bookingDateEndTime = endOfMonth.atTime(23, 59, 59, 999_999_999)
                .atZone(kolkataZone)
                .toInstant()
                .toEpochMilli();

        String monthName = previousMonth.getMonth().getDisplayName(TextStyle.FULL, Locale.ENGLISH);
        String excelFileName = String.format("%d_%s_Epost_Report.xlsx", previousMonth.getYear(), monthName);
        String pdfFileName = String.format("%d_%s_Epost_Report.pdf", previousMonth.getYear(), monthName);

        log.info("Generating report for {} {} (from {} to {})", monthName, previousMonth.getYear(), startOfMonth, endOfMonth);

        // Build search request
        EPostTrackerSearchCriteria searchCriteria = EPostTrackerSearchCriteria.builder()
                .bookingDateStartTime(bookingDateStartTime)
                .bookingDateEndTime(bookingDateEndTime)
                .excelSheetType(ExcelSheetType.MONTHLY_REPORT_EMAIL)
                .pagination(Pagination.builder().build())
                .build();

        EPostTrackerSearchRequest searchRequest = EPostTrackerSearchRequest.builder()
                .ePostTrackerSearchCriteria(searchCriteria)
                .build();

        // Fetch data
        byte[] excelBytes = excelService.generateExcel(searchRequest);
        EPostResponse ePostResponse = ePostService.getAllEPost(searchRequest, 1000, 0);
        List<EPostTracker> ePostTrackers = ePostResponse.getEPostTrackers();

        // Upload files (PDF + Excel)
        Map<String, String> fileStoreMap = new HashMap<>();
        Optional.ofNullable(getFileStoreIdOfPdf(ePostTrackers, pdfFileName, monthName, previousMonth))
                .ifPresent(fileId -> fileStoreMap.put(fileId, pdfFileName));

        try {
            String excelFileStoreId = fileStoreService.upload(
                    excelBytes,
                    excelFileName,
                    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
                    tenantId
            );
            if (excelFileStoreId != null) {
                fileStoreMap.put(excelFileStoreId, excelFileName);
                log.info("Uploaded Excel to filestore with id {}", excelFileStoreId);
            } else {
                log.warn("Excel filestore upload returned null fileStoreId; proceeding without attachment");
            }
        } catch (Exception ex) {
            log.error("Failed to upload Excel to filestore: {}", ex.getMessage(), ex);
        }

        // Resolve recipients
        Set<String> recipients = new HashSet<>();
        String recipientsStr = ePostConfiguration.getEpostEmailRecipients();
        if (recipientsStr != null && !recipientsStr.isBlank()) {
            recipients.addAll(Arrays.stream(recipientsStr.split(","))
                    .map(String::trim)
                    .filter(s -> !s.isEmpty())
                    .toList());
        }

        // Build email body
        Map<String, String> bodyMap = new HashMap<>();
        bodyMap.put("monthName", monthName);
        bodyMap.put("year", String.valueOf(today.getYear()));

        Email email = Email.builder()
                .subject(ePostConfiguration.getEpostEmailSubject() + " " + monthName + " " + today.getYear())
                .body(bodyMap.toString())
                .emailTo(recipients)
                .isHTML(true)
                .tenantId(tenantId)
                .templateCode(ePostConfiguration.getEpostEmailTemplateCode())
                .fileStoreId(fileStoreMap.isEmpty() ? null : fileStoreMap)
                .build();

        EmailRequest emailRequest = EmailRequest.builder()
                .requestInfo(new RequestInfo())
                .email(email)
                .build();

        producer.push(ePostConfiguration.getEmailTopic(), emailRequest);
        log.info("Email notification task completed successfully");
    }

    private String getFileStoreIdOfPdf(List<EPostTracker> ePostTrackers, String fileName, String monthName, LocalDate today) {
        try {
            double totalAmount = ePostTrackers.stream()
                    .mapToDouble(e -> parseAmount(e.getTotalAmount()))
                    .sum();

            EPostTrackerPdf ePostTrackerPdf = EPostTrackerPdf.builder()
                    .totalAmount(String.valueOf(totalAmount))
                    .totalBookedPost(ePostTrackers.size())
                    .courtName(configuration.getCourtName())
                    .monthlyReportYear(String.valueOf(today.getYear()))
                    .reportMonthName(monthName)
                    .generatedDateTime(getFormattedDate())
                    .build();

            EPostTrackerPdfRequest pdfRequest = EPostTrackerPdfRequest.builder()
                    .ePostTrackerPdf(ePostTrackerPdf)
                    .requestInfo(createInternalRequestInfo())
                    .build();

            byte[] pdfBytes = pdfServiceUtil.generatePdf(
                    pdfRequest,
                    ePostConfiguration.getEgovStateTenantId(),
                    ePostConfiguration.getEPostPdfTemplateKey()
            );

            String fileStoreId = fileStoreService.upload(
                    pdfBytes,
                    fileName,
                    "application/pdf",
                    ePostConfiguration.getEgovStateTenantId()
            );

            log.info("Uploaded PDF to filestore with id {}", fileStoreId);
            return fileStoreId;
        } catch (Exception e) {
            log.error("Failed to generate/upload PDF: {}", e.getMessage(), e);
            return null;
        }
    }

    /**
     * Safely parse totalAmount String to double.
     * Handles null, empty, or invalid values by returning 0.0
     */
    private double parseAmount(String amount) {
        if (amount == null || amount.trim().isEmpty()) {
            return 0.0;
        }
        try {
            return Double.parseDouble(amount.trim());
        } catch (NumberFormatException ex) {
            log.warn("Invalid totalAmount value: '{}'. Defaulting to 0.0", amount);
            return 0.0;
        }
    }

    private String getFormattedDate() {
        ZonedDateTime now = ZonedDateTime.now(ZoneId.of(ePostConfiguration.getZoneId()));

        // Create a DateTimeFormatter with the desired format
        DateTimeFormatter formatter = DateTimeFormatter.ofPattern("d MMMM yyyy, h:mm a z");

        // Format the ZonedDateTime

        return now.format(formatter);
    }

    private RequestInfo createInternalRequestInfo() {
        User userInfo = new User();
        userInfo.setUuid(userService.internalMicroserviceRoleUuid);
        userInfo.setRoles(userService.internalMicroserviceRoles);
        userInfo.setTenantId(configuration.getEgovStateTenantId());
        return RequestInfo.builder().userInfo(userInfo).msgId(msgId).build();
    }

}
