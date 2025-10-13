package org.egov.web.notification.mail.service;

import com.github.jknack.handlebars.Handlebars;
import com.github.jknack.handlebars.Template;
import com.google.gson.JsonObject;
import com.google.gson.JsonParseException;
import com.google.gson.JsonParser;
import lombok.extern.slf4j.Slf4j;
import net.minidev.json.JSONArray;
import org.apache.commons.lang3.StringUtils;
import org.egov.common.contract.request.RequestInfo;
import org.egov.tracer.model.CustomException;
import org.egov.web.notification.mail.config.ApplicationConfiguration;
import org.egov.web.notification.mail.consumer.contract.Email;
import org.egov.web.notification.mail.utils.Constants;
import org.egov.web.notification.mail.utils.LocalizationUtil;
import org.egov.web.notification.mail.utils.MdmsUtil;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;
import org.springframework.util.CollectionUtils;

import java.io.IOException;
import java.util.*;

import static org.egov.web.notification.mail.utils.Constants.*;

@Component
@Slf4j
public class MessageConstruction {

    @Autowired
    private MdmsUtil mdmsUtil;

    @Autowired
    private ApplicationConfiguration config;

    @Autowired
    private LocalizationUtil localizationUtil;


    /**
     * Constructs an email message by processing the template and applying the email data
     * @param email Email object containing template code and body data
     * @return Processed email message as string
     * @throws CustomException if there's any error in message construction
     */
    public String constructMessage(Email email) {
        if (email == null) {
            log.error("Email object cannot be null");
            throw new CustomException("INVALID_EMAIL_OBJECT", "Email object cannot be null");
        }

        log.info("Starting message construction for template: {}", email.getTemplateCode());
        
        try {
            // For bail bond notifications, skip template lookup/compilation.
            // The EmailNotificationListener will restore the original Email.body.
            List<String> bailBondTemplateCodes = config != null ? config.getCustomEmailSubject() : null;
            if (!CollectionUtils.isEmpty(bailBondTemplateCodes) && 
                email.getTemplateCode() != null &&
                bailBondTemplateCodes.stream().anyMatch(code -> code.equalsIgnoreCase(email.getTemplateCode()))) {
                log.debug("Skipping template processing for bail bond notification with template code: {}", email.getTemplateCode());
                return "";
            }
            String templateId = Constants.EMAIL_TEMPLATE_MASTER_NAME;
            String filter = "[?(@['code'] == '"+ email.getTemplateCode() + "')]";

            String moduleName = Constants.EMAIL_TEMPLATE_MODULE_NAME;
            HashMap<String, String> masterName = new HashMap<>();
            masterName.put(templateId, filter);

            RequestInfo requestInfo = new RequestInfo();
            String stateTenantId = config != null ? config.getStateTenantId() : null;

            if (StringUtils.isBlank(stateTenantId)) {
                log.error("State tenant ID is not configured");
                throw new CustomException("INVALID_STATE_TENANT_ID", "State tenant ID is not configured");
            }

            Map<String, Map<String, JSONArray>> mdmsData = mdmsUtil.fetchMdmsData(requestInfo, config.getStateTenantId(), moduleName, masterName);

            if (mdmsData == null || mdmsData.isEmpty() || !mdmsData.containsKey(moduleName) || 
                !mdmsData.get(moduleName).containsKey(templateId)) {
                log.error("No template found for code: {}", email.getTemplateCode());
                throw new CustomException("TEMPLATE_NOT_FOUND", 
                    String.format("No template found for code: %s", email.getTemplateCode()));
            }

            // Set message codes
            Set<String> messageCodes = new HashSet<>();
            messageCodes.add(GREETING);
            messageCodes.add(email.getTemplateCode());
            messageCodes.add(FOOTER);

            JSONArray templateArray = mdmsData.get(moduleName).get(templateId);
            if (CollectionUtils.isEmpty(templateArray)) {
                log.error("Template array is empty for template code: {}", email.getTemplateCode());
                throw new CustomException("EMPTY_TEMPLATE_ARRAY", 
                    String.format("No templates found for code: %s", email.getTemplateCode()));
            }

            // Process template
            try {
                LinkedHashMap templateMap = (LinkedHashMap) templateArray.get(0);
                String handlerTemplate = String.valueOf(templateMap.get("value"));
                
                if (StringUtils.isBlank(handlerTemplate)) {
                    log.error("Template content is empty for template code: {}", email.getTemplateCode());
                    throw new CustomException("EMPTY_TEMPLATE", 
                        String.format("Template content is empty for code: %s", email.getTemplateCode()));
                }

                // Get localized messages
                Map<String, Map<String, String>> messageResponse = localizationUtil.getLocalisedMessages(
                    requestInfo, stateTenantId, Constants.MESSAGE_LOCALE, 
                    Constants.LOCALIZATION_MODULE, messageCodes);

                if (messageResponse == null || messageResponse.isEmpty()) {
                    log.error("No localized messages found for template: {}", email.getTemplateCode());
                    throw new CustomException("LOCALIZATION_ERROR", 
                        "Failed to retrieve localized messages");
                }

                String localeKey = Constants.MESSAGE_LOCALE + "|" + stateTenantId;
                Map<String, String> messageMap = messageResponse.get(localeKey);
                
                if (messageMap == null) {
                    log.error("No messages found for locale: {}", localeKey);
                    throw new CustomException("LOCALE_NOT_FOUND", 
                        String.format("No messages found for locale: %s", localeKey));
                }

                // Compile and apply main template
                Handlebars handlebars = new Handlebars();
                Template template = handlebars.compileInline(handlerTemplate);
                
                Map<String, String> data = new HashMap<>();
                data.put("header", Objects.toString(messageMap.get(GREETING), ""));
                data.put("message", Objects.toString(messageMap.get(email.getTemplateCode()), ""));
                data.put("footer", Objects.toString(messageMap.get(FOOTER), ""));
                
                String mainTemplate = template.apply(data);
                Template compiledTemplate = handlebars.compileInline(mainTemplate);
                data.clear();

                // Process email body data
                String emailBody = email.getBody();
                if (StringUtils.isBlank(emailBody)) {
                    log.warn("Email body is empty for template: {}", email.getTemplateCode());
                    return compiledTemplate.apply(Collections.emptyMap());
                }

                try {
                    JsonObject jsonObject = JsonParser.parseString(emailBody).getAsJsonObject();
                    jsonObject.entrySet().forEach(entry -> 
                        data.put(entry.getKey(), entry.getValue().getAsString()));
                    
                    String result = compiledTemplate.apply(data);
                    log.debug("Successfully constructed message for template: {}", email.getTemplateCode());
                    return result;
                } catch (JsonParseException e) {
                    log.error("Failed to parse email body JSON for template: {}", email.getTemplateCode(), e);
                    throw new CustomException("INVALID_JSON_BODY", 
                        "Failed to parse email body JSON: " + e.getMessage());
                } catch (Exception e) {
                    log.error("Error applying template data for template: {}", email.getTemplateCode(), e);
                    throw new CustomException("TEMPLATE_APPLICATION_ERROR", 
                        "Error applying template data: " + e.getMessage());
                }
            } catch (CustomException ce) {
                throw ce;
            } catch (IOException e) {
                log.error("I/O error while processing template: {}", email.getTemplateCode(), e);
                throw new CustomException("TEMPLATE_PROCESSING_ERROR", 
                    "I/O error while processing template: " + e.getMessage());
            } catch (Exception e) {
                log.error("Unexpected error while processing template: {}", email.getTemplateCode(), e);
                throw new CustomException("TEMPLATE_PROCESSING_ERROR", 
                    "Error while processing template: " + e.getMessage());
            }
        } catch (CustomException ce) {
            log.error("Error in message construction for template: {}",
                    email.getTemplateCode(), ce);
            throw ce;
        } catch (Exception e) {
            log.error("Unexpected error in message construction for template: {}",
                    email.getTemplateCode(), e);
            throw new CustomException(MESSAGE_CONSTRUCTION_ERROR, 
                "Failed to construct message: " + e.getMessage());
        } finally {
            log.debug("Completed message construction for template: {}",
                    email.getTemplateCode());
        }
    }
}
