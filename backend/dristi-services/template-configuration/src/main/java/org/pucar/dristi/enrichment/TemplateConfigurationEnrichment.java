package org.pucar.dristi.enrichment;


import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.extern.slf4j.Slf4j;
import org.egov.common.contract.models.AuditDetails;
import org.egov.tracer.model.CustomException;
import org.pucar.dristi.config.Configuration;
import org.pucar.dristi.web.models.*;
import org.springframework.stereotype.Component;

import java.util.UUID;

@Component
@Slf4j
public class TemplateConfigurationEnrichment {

    private Configuration  configuration;
    private ObjectMapper objectMapper;

    public TemplateConfigurationEnrichment(Configuration configuration, ObjectMapper objectMapper) {
        this.configuration = configuration;
        this.objectMapper = objectMapper;
    }

    public void enrichTemplateConfigurationOnCreate(TemplateConfigurationRequest templateConfigurationRequest) {
        try {
            templateConfigurationRequest.getTemplateConfiguration().setId(UUID.randomUUID());
            templateConfigurationRequest.getTemplateConfiguration().setAuditDetails(new AuditDetails());
            templateConfigurationRequest.getTemplateConfiguration().getAuditDetails().setCreatedTime(System.currentTimeMillis());
            templateConfigurationRequest.getTemplateConfiguration().getAuditDetails().setCreatedBy(templateConfigurationRequest.getRequestInfo().getUserInfo().getUuid());
            templateConfigurationRequest.getTemplateConfiguration().getAuditDetails().setLastModifiedTime(System.currentTimeMillis());
            templateConfigurationRequest.getTemplateConfiguration().getAuditDetails().setLastModifiedBy(templateConfigurationRequest.getRequestInfo().getUserInfo().getUuid());
        } catch (CustomException e) {
            log.error("Custom Exception occurred while enriching template :: {}", e.toString());
            throw e;
        } catch (Exception e) {
            log.error("Exception occurred while enriching template :: {}", e.toString());
            throw e;
        }
    }

    public void enrichTemplateConfigurationOnUpdate(TemplateConfigurationRequest templateConfigurationRequest) {
        templateConfigurationRequest.getTemplateConfiguration().getAuditDetails().setLastModifiedTime(System.currentTimeMillis());
        templateConfigurationRequest.getTemplateConfiguration().getAuditDetails().setLastModifiedBy(templateConfigurationRequest.getRequestInfo().getUserInfo().getUuid());
    }

}