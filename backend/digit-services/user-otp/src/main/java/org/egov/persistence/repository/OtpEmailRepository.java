package org.egov.persistence.repository;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.extern.slf4j.Slf4j;
import org.egov.common.contract.request.RequestInfo;
import org.egov.common.utils.MultiStateInstanceUtil;
import org.egov.domain.model.OtpRequest;
import org.egov.domain.model.OtpRequestType;
import org.egov.domain.service.LocalizationService;
import org.egov.persistence.contract.Email;
import org.egov.persistence.contract.EmailRequest;
import org.egov.tracer.kafka.CustomKafkaTemplate;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.util.ObjectUtils;

import java.util.Collections;
import java.util.HashMap;
import java.util.Map;

@Service
@Slf4j
public class OtpEmailRepository {

	private static final String LOCALIZATION_KEY_LOGIN_SUBJECT_EMAIL = "email.login.otp.sub";
	private static final String LOCALIZATION_KEY_PWD_RESET_SUBJECT_EMAIL = "email.pwd.reset.otp.sub";
	private static final String PWD_RESET_SUBJECT_EMAIL = 	"Password Reset";
	private static final String LOGIN_SUBJECT_EMAIL = "OTP for 24X7 OnCourt Login";
	private static final String LOGIN_OTP_TEMPLATE = "USER_LOGIN_OTP";
	private static final String OTP_NUMBER_VARIABLE = "otpNumber";
    private CustomKafkaTemplate<String, EmailRequest> kafkaTemplate;
    private String emailTopic;

	private LocalizationService localizationService;
	@Value("${egov.localisation.tenantid.strip.suffix.count}")
	private int tenantIdStripSuffixCount;

	@Autowired
	private MultiStateInstanceUtil centralInstanceUtil;

	@Autowired
	private ObjectMapper objectMapper;

	@Value("${egov.pwd.reset.email.template.code}")
	private String pwdResetTemplateCode;

    @Autowired
    public OtpEmailRepository(CustomKafkaTemplate<String, EmailRequest> kafkaTemplate,
							  @Value("${email.topic}") String emailTopic, LocalizationService localizationService) {
        this.kafkaTemplate = kafkaTemplate;
        this.emailTopic = emailTopic;
		this.localizationService = localizationService;
    }

    public void send(String emailId, String otpNumber, OtpRequest otpRequest) {
    	if (emailId == null || emailId.isEmpty()) {
			return;
		}
		sendEmail(emailId, otpNumber, otpRequest);
    }

	private void sendEmail(String emailId, String otpNumber, OtpRequest otpRequest) {
		Email email = Email.builder()
			.body(getBody(otpNumber))
			.subject(getSubject(otpRequest))
			.isHTML(true)
			.templateCode(getTemplateCode(otpRequest))
			.emailTo(Collections.singleton(emailId))
			.build();
		EmailRequest emailRequest = EmailRequest.builder().requestInfo(RequestInfo.builder().build()).email(email).build();
		String updatedTopic = centralInstanceUtil.getStateSpecificTopicName(otpRequest.getTenantId(), emailTopic);
		kafkaTemplate.send(updatedTopic, emailRequest);
	}

	/**
	 * The template code drives both the handlebars shell in MDMS and the wording in
	 * localization, so a code has to exist in both before it can be configured here.
	 */
	private String getTemplateCode(OtpRequest otpRequest) {
		if (otpRequest.getType() == OtpRequestType.PASSWORD_RESET)
			return pwdResetTemplateCode;
		return LOGIN_OTP_TEMPLATE;
	}

	private String getLocale(OtpRequest otpRequest){
		String locale;
		if(otpRequest.getRequestInfo() != null && otpRequest.getRequestInfo().getMsgId() != null && otpRequest.getRequestInfo().getMsgId().contains("|"))
		{
			locale = otpRequest.getRequestInfo().getMsgId().split("\\|")[1];
		}
		else {
			locale = "en_IN";
		}
		return locale;
	}

	private String getMessages(OtpRequest otpRequest, String localizationKey){
		String tenantId = getRequiredTenantId(otpRequest.getTenantId());
		String locale = getLocale(otpRequest);
		Map<String, String> localisedMessages = localizationService.getLocalisedMessages(tenantId, locale, "egov-user");
		if (localisedMessages.isEmpty()) {
			log.info("Localization Service didn't return any Subject so using default...");
			localisedMessages.put(LOCALIZATION_KEY_PWD_RESET_SUBJECT_EMAIL, PWD_RESET_SUBJECT_EMAIL);
			localisedMessages.put(LOCALIZATION_KEY_LOGIN_SUBJECT_EMAIL, LOGIN_SUBJECT_EMAIL);
		}
		return localisedMessages.get(localizationKey);
	}

	private String getSubject(OtpRequest otpRequest) {
		String subject;
		if(otpRequest.getType() == OtpRequestType.PASSWORD_RESET){
			subject = getMessages(otpRequest, LOCALIZATION_KEY_PWD_RESET_SUBJECT_EMAIL);
			if(ObjectUtils.isEmpty(subject))
				subject = PWD_RESET_SUBJECT_EMAIL;
		}
		else {
			subject = getMessages(otpRequest, LOCALIZATION_KEY_LOGIN_SUBJECT_EMAIL);
			if(ObjectUtils.isEmpty(subject))
				subject = LOGIN_SUBJECT_EMAIL;
		}
		return subject;
	}

	/**
	 * egov-notification-mail treats the body as the JSON variables for the handlebars template
	 * resolved from the template code, not as the message itself. Anything that is not a JSON
	 * object fails in MessageConstruction and the mail is never sent.
	 */
	private String getBody(String otpNumber) {
		Map<String, String> variables = new HashMap<>();
		variables.put(OTP_NUMBER_VARIABLE, otpNumber);
		try {
			return objectMapper.writeValueAsString(variables);
		} catch (JsonProcessingException e) {
			throw new IllegalStateException("Could not build the email body", e);
		}
	}


	private String getRequiredTenantId(String tenantId) {
		String[] tenantList = tenantId.split("\\.");
		if(tenantIdStripSuffixCount>0 && tenantIdStripSuffixCount<tenantList.length) {    // handeled case if tenantIdStripSuffixCount
			int cutIndex = tenantList.length - tenantIdStripSuffixCount;                  // is in between 0 and tenantList size
			String requriedTenantId = tenantList[0];                                      // (excluding 0 & tenantList size)
			for(int idx =1; idx<cutIndex; idx++)
				requriedTenantId = requriedTenantId + "." + tenantList[idx];

			return requriedTenantId;
		}
		else if(tenantIdStripSuffixCount>=tenantList.length)                              // handled case if tenantIdStripSuffixCount
			return tenantList[0];                                                         // is greater than or equal to tenantList size
		else
			return tenantId;                                                              // handled case if tenantIdStripSuffixCount
		// is less than or equal to 0
	}
}
