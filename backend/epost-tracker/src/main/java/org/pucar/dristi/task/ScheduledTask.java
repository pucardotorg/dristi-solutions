package org.pucar.dristi.task;

import lombok.extern.slf4j.Slf4j;
import org.pucar.dristi.config.EPostConfiguration;
import org.pucar.dristi.model.EPostTrackerSearchCriteria;
import org.pucar.dristi.model.EPostTrackerSearchRequest;
import org.pucar.dristi.model.Pagination;
import org.pucar.dristi.service.ExcelService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.scheduling.annotation.Async;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.pucar.dristi.kafka.Producer;
import org.pucar.dristi.model.email.Email;
import org.pucar.dristi.model.email.EmailRequest;
import org.egov.common.contract.request.RequestInfo;
import org.pucar.dristi.service.FileStoreService;

import java.util.Arrays;
import java.util.HashSet;
import java.util.Set;
import java.util.HashMap;
import java.util.Map;
import java.time.LocalDate;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import java.time.format.TextStyle;
import java.util.Locale;

@Component
@Slf4j
public class ScheduledTask {

    private final ExcelService excelService;

    private final EPostConfiguration ePostConfiguration;

    private final Producer producer;

    private final FileStoreService fileStoreService;

    @Autowired
    public ScheduledTask(ExcelService excelService, EPostConfiguration ePostConfiguration, Producer producer, FileStoreService fileStoreService) {
        this.excelService = excelService;
        this.ePostConfiguration = ePostConfiguration;
        this.producer = producer;
        this.fileStoreService = fileStoreService;
    }

    @Async
    @Scheduled(cron = "${epost.tracker.cron.expression}", zone = "Asia/Kolkata")
    public void sendEmailNotification() {
        log.info("Sending email notification");

        EPostTrackerSearchCriteria ePostTrackerSearchCriteria = EPostTrackerSearchCriteria.builder()
                .deliveryStatusList(ePostConfiguration.getBookedDeliveryStatusList())
                .pagination(Pagination.builder().build())
                .build();

        EPostTrackerSearchRequest request = EPostTrackerSearchRequest.builder()
                .ePostTrackerSearchCriteria(ePostTrackerSearchCriteria)
                .build();
        byte[] excelBytes = excelService.generateExcel(request);

        // Upload Excel to filestore and prepare attachment map
        String tenantId = ePostConfiguration.getEgovStateTenantId();
        LocalDate today = LocalDate.now(ZoneId.of("Asia/Kolkata"));
        String formattedDate = today.format(DateTimeFormatter.ofPattern("dd-MM-yyyy"));
        String monthName = today.getMonth().getDisplayName(TextStyle.FULL, Locale.ENGLISH);
        String fileName = String.format("%d_%s_Epost_Report.xlsx", today.getYear(), monthName);

        Map<String, String> fileStoreMap = null;
        try {
            String fileStoreId = fileStoreService.upload(
                    excelBytes,
                    fileName,
                    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
                    tenantId
            );
            if (fileStoreId != null) {
                fileStoreMap = new HashMap<>();
                fileStoreMap.put(fileStoreId, fileName);
                log.info("Uploaded Excel to filestore with id {}", fileStoreId);
            } else {
                log.warn("Excel filestore upload returned null fileStoreId; proceeding without attachment");
            }
        } catch (Exception ex) {
            log.error("Failed to upload Excel to filestore: {}", ex.getMessage(), ex);
        }

        String recipientsStr = ePostConfiguration.getEpostEmailRecipients();
        Set<String> recipients = new HashSet<>();
        if (recipientsStr != null && !recipientsStr.isBlank()) {
            recipients.addAll(Arrays.stream(recipientsStr.split(","))
                    .map(String::trim)
                    .filter(s -> !s.isEmpty())
                    .toList());
        }

        String subject = ePostConfiguration.getEpostEmailSubject();

        Map<String, String> bodyMap = new HashMap<>();
        bodyMap.put("monthName", monthName);
        bodyMap.put("year", String.valueOf(today.getYear()));

        Email email = Email.builder()
                .subject(subject + " " + monthName + " " + today.getYear())
                .body(bodyMap.toString())
                .emailTo(recipients)
                .isHTML(true)
                .tenantId(tenantId)
                .templateCode(ePostConfiguration.getEpostEmailTemplateCode())
                .fileStoreId(fileStoreMap)
                .build();

        EmailRequest emailRequest = EmailRequest.builder()
                .requestInfo(new RequestInfo())
                .email(email)
                .build();

        String topic = ePostConfiguration.getEmailTopic();
        producer.push(topic, emailRequest);

        // TODO : need to send pdf as well in email
        log.info("Email notification sent successfully");
    }

}
