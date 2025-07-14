package digit.service;

import digit.config.Configuration;
import digit.enrichment.SuretyEnrichment;
import digit.kafka.Producer;
import digit.repository.SuretyRepository;
import digit.validator.SuretyValidator;
import digit.web.models.Surety;
import digit.web.models.SuretyRequest;
import digit.web.models.SuretySearchRequest;
import lombok.extern.slf4j.Slf4j;
import org.egov.tracer.model.CustomException;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.util.CollectionUtils;

import java.util.ArrayList;
import java.util.List;

import static digit.config.ServiceConstants.*;


@Service
@Slf4j
public class SuretyService {
    
    private final SuretyEnrichment enrichmentUtil;
    private final SuretyValidator validator;
    private final Configuration config;
    private final Producer producer;
    private final SuretyRepository repository;

    @Autowired
    public SuretyService(SuretyEnrichment enrichmentUtil, SuretyValidator validator, Configuration config, Producer producer, SuretyRepository repository) {
        this.enrichmentUtil = enrichmentUtil;
        this.validator = validator;
        this.config = config;
        this.producer = producer;
        this.repository = repository;
    }

    public Surety create(SuretyRequest suretyRequest) {
        try {
            validator.validateSurety(suretyRequest);
            enrichmentUtil.enrichSurety(suretyRequest);
            producer.push(config.getSuretyCreateTopic(), suretyRequest);
            return suretyRequest.getSurety();
        } catch (Exception e) {
            log.error("Error occurred while creating Surety {}", e.getMessage());
            throw new CustomException(CREATE_SURETY_ERR, e.getMessage());
        }
    }

    public Surety update(SuretyRequest suretyRequest) {
        try {
            validator.validateSuretyOnUpdate(suretyRequest);

            enrichmentUtil.enrichSuretyUponUpdate(suretyRequest);

            producer.push(config.getSuretyUpdateTopic(), suretyRequest);

            return suretyRequest.getSurety();

        } catch (CustomException e) {
            log.error("Custom Exception occurred while updating Surety {}", e.getMessage());
            throw e;
        } catch (Exception e) {
            log.error("Error occurred while updating Surety {}", e.getMessage());
            throw new CustomException(UPDATE_SURETY_ERR, "Error occurred while updating Surety: " + e.getMessage());
        }
    }

    public List<Surety> search(SuretySearchRequest request) {
        try {
            // Fetch Suretys from database according to the given search params
            log.info("Starting Surety search with parameters :: {}", request);
            List<Surety> SuretyList = repository.getSureties(request);
            log.info("Surety list fetched with size :: {}", SuretyList.size());
            // If no Suretys are found, return an empty list
            if (CollectionUtils.isEmpty(SuretyList))
                return new ArrayList<>();
            return SuretyList;
        } catch (Exception e) {
            log.error("Error while fetching to search results {}", e.toString());
            throw new CustomException(SURETY_SEARCH_ERR, e.getMessage());
        }
    }

}
