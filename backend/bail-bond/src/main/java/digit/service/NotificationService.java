package digit.service;

import digit.config.Configuration;
import digit.kafka.Producer;
import digit.web.models.BailRequest;
import digit.web.models.Email;
import digit.web.models.EmailRequest;
import digit.web.models.Surety;
import lombok.AllArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.egov.common.contract.request.RequestInfo;
import org.springframework.stereotype.Component;

import java.util.Set;
import java.util.stream.Collectors;

@Slf4j
@Component
@AllArgsConstructor
public class NotificationService {

    private final Producer producer;
    private final Configuration config;

    public void sendEmailToSuretiesOnInitiateESign(BailRequest bailRequest){
        RequestInfo requestInfo = bailRequest.getRequestInfo();
        String tenantId = bailRequest.getBail().getTenantId();
        String subject = config.getBailbondSignatureSubject();
        String body = config.getBailbondSignatureBody();
        body=body.replace("\\n","\n");
        Set<String> emailIds = bailRequest.getBail().getSureties().stream()
                .map(Surety::getEmail)
                .collect(Collectors.toSet());


        Email email = Email.builder()
                .tenantId(tenantId)
                .subject(subject)
                .emailTo(emailIds)
                .body(body)
                .build();

        EmailRequest emailRequest = EmailRequest.builder()
                .requestInfo(requestInfo)
                .email(email)
                .build();

        log.info("Sending Email {}", emailRequest);
        producer.push(config.getEmailTopic(), emailRequest);
    }
}
