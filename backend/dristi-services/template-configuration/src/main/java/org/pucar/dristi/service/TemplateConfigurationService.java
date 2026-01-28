package org.pucar.dristi.service;

import lombok.extern.slf4j.Slf4j;
import org.egov.tracer.model.CustomException;
import org.pucar.dristi.config.Configuration;
import org.pucar.dristi.enrichment.TemplateConfigurationEnrichment;
import org.pucar.dristi.kafka.Producer;
import org.pucar.dristi.repository.TemplateConfigurationRepository;
import org.pucar.dristi.web.models.*;
import org.springframework.stereotype.Service;
import org.springframework.util.CollectionUtils;

import java.util.*;

import static org.pucar.dristi.config.ServiceConstants.*;

@Service
@Slf4j
public class TemplateConfigurationService {

    private final TemplateConfigurationEnrichment enrichmentUtil;

    private final TemplateConfigurationRepository templateConfigurationRepository;

    private final Configuration config;

    private final Producer producer;

    public TemplateConfigurationService(TemplateConfigurationEnrichment enrichmentUtil, TemplateConfigurationRepository templateConfigurationRepository, Configuration config, Producer producer) {
        this.enrichmentUtil = enrichmentUtil;
        this.templateConfigurationRepository = templateConfigurationRepository;
        this.config = config;
        this.producer = producer;
    }


    public TemplateConfiguration createTemplateConfiguration(TemplateConfigurationRequest body) {
        try {
            enrichmentUtil.enrichTemplateConfigurationOnCreate(body);

            producer.push(config.getSaveTemplateConfigurationKafkaTopic(), body);

            return body.getTemplateConfiguration();
        } catch (CustomException e) {
            log.error("Custom Exception occurred while creating template");
            throw e;
        } catch (Exception e) {
            log.error("Error occurred while creating template :: {}", e.toString());
            throw new CustomException(TEMPLATE_CREATE_EXCEPTION, e.getMessage());
        }
    }

    public List<TemplateConfiguration> searchTemplateConfiguration(TemplateConfigurationSearchRequest request) {
        try {
            List<TemplateConfiguration> templateConfigurations = templateConfigurationRepository.getTemplateConfigurations(request.getCriteria(), request.getPagination());

            if (CollectionUtils.isEmpty(templateConfigurations))
                return new ArrayList<>();
            return templateConfigurations;

        } catch (Exception e) {
            log.error("Error while fetching to search results :: {}", e.toString());
            throw new CustomException(TEMPLATE_SEARCH_EXCEPTION, e.getMessage());
        }
    }

    public TemplateConfiguration updateTemplateConfiguration(TemplateConfigurationRequest body) {

        try {
            enrichmentUtil.enrichTemplateConfigurationOnUpdate(body);

            producer.push(config.getUpdateTemplateConfigurationKafkaTopic(), body);

            return body.getTemplateConfiguration();

        } catch (CustomException e) {
            log.error("Custom Exception occurred while updating template :: {}", e.toString());
            throw e;
        } catch (Exception e) {
            log.error("Error occurred while updating template");
            throw new CustomException(TEMPLATE_UPDATE_EXCEPTION, "Error occurred while updating template: " + e.getMessage());
        }

    }
}
