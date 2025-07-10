package digit.service;

import digit.config.Configuration;
import digit.kafka.Producer;
import digit.web.models.Email;
import digit.web.models.EmailRequest;
import digit.web.models.SMSRequest;
import lombok.AllArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.egov.common.contract.request.RequestInfo;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.Set;

import static digit.config.ServiceConstants.BAIL_BOND_TEMPLATE_CODE;
import static digit.config.ServiceConstants.NOTIFICATION;
import static digit.config.ServiceConstants.NOTIFICATION_ENG_LOCALE_CODE;
import static digit.config.ServiceConstants.TEXT;

@Slf4j
@Component
@AllArgsConstructor
public class NotificationService {

    private final Producer producer;
    private final Configuration config;

    public void sendSMS(List<String> mobileNumbers, String tenantId){
        mobileNumbers.forEach(mobileNumber -> {
            SMSRequest smsRequest = SMSRequest.builder()
                    .contentType(TEXT)
                    .category(NOTIFICATION)
                    .locale(NOTIFICATION_ENG_LOCALE_CODE)
                    .tenantId(tenantId)
                    .expiryTime(System.currentTimeMillis() + 60 * 60 * 1000)
                    .mobileNumber(mobileNumber)
                    .message("") //TODO
                    .build();

            log.info("Sending SMS {}", smsRequest);
            producer.push(config.getSmsNotificationTopic(), smsRequest);
        });
    }

    public void sendEmail(RequestInfo requestInfo, Set <String> emailIds, String subject, String body, String tenantId){
        Email email = Email.builder()
                .tenantId(tenantId)
                .subject(subject)
//                    .fileStoreId() // TODO
                .emailTo(emailIds)
                    .templateCode(BAIL_BOND_TEMPLATE_CODE) //TODO
                .isHTML(true)
                .body(body)  // TODO
                .build();

        EmailRequest emailRequest = EmailRequest.builder()
                .requestInfo(requestInfo)
                .email(email)
                .build();

        log.info("Sending Email {}", emailRequest);
        producer.push(config.getMailNotificationTopic(), emailRequest);
    }
}
