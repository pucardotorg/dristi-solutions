package digit.service;

import digit.config.Configuration;
import digit.kafka.Producer;
import digit.repository.SampleEntityRepository;
import digit.util.UuidUtil;
import digit.web.models.SampleEntity;
import digit.web.models.SampleEntityRequest;
import digit.web.models.SampleEntitySearchRequest;
import lombok.extern.slf4j.Slf4j;
import org.egov.tracer.model.CustomException;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.util.CollectionUtils;

import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Service
@Slf4j
public class SampleEntityService {

    private final UuidUtil uuidUtil;
    private final Producer producer;
    private final Configuration config;
    private final SampleEntityRepository repository;

    @Autowired
    public SampleEntityService(UuidUtil uuidUtil,
                               Producer producer,
                               Configuration config,
                               SampleEntityRepository repository) {
        this.uuidUtil = uuidUtil;
        this.producer = producer;
        this.config = config;
        this.repository = repository;
    }

    public SampleEntity createSampleEntity(SampleEntityRequest request) {
        try {
            SampleEntity entity = request.getSampleEntity();

            UUID uuidV7Id = uuidUtil.generateUuidV7AsUUID();
            UUID uuidV7Test = uuidUtil.generateUuidV7AsUUID();
            
            entity.setId(uuidV7Id);
            entity.setTestUuid(uuidV7Test);
            
            log.info("Generated UUID v7 id: {}", uuidV7Id);
            log.info("Generated UUID v7 testUuid: {}", uuidV7Test);
            log.info("UUID v7 id timestamp (ms since epoch): {}", uuidUtil.extractTimestampFromUuidV7(uuidV7Id));
            log.info("Is valid UUID v7: {}", uuidUtil.isValidUuidV7(uuidV7Id));

            // Push to Kafka - persister service will handle DB persistence
            producer.push(config.getSampleEntityCreateTopic(), request);

            log.info("SampleEntity pushed to Kafka for creation with UUID v7: {}", entity.getId());
            return entity;
        } catch (CustomException e) {
            log.error("Custom Exception occurred while creating sample entity");
            throw e;
        } catch (Exception e) {
            log.error("Error occurred while creating sample entity :: {}", e.toString());
            throw new CustomException("SAMPLE_ENTITY_CREATE_ERROR", e.getMessage());
        }
    }

    public SampleEntity updateSampleEntity(SampleEntityRequest request) {
        try {
            SampleEntity entity = request.getSampleEntity();

            if (entity.getId() == null) {
                throw new CustomException("INVALID_UPDATE", "ID is required for update operation");
            }

            log.info("Updating entity with UUID v7: {}", entity.getId());
            log.info("UUID v7 validation: {}", uuidUtil.isValidUuidV7(entity.getId()));

            // Push to Kafka - persister service will handle DB persistence
            producer.push(config.getSampleEntityUpdateTopic(), request);

            log.info("SampleEntity pushed to Kafka for update with UUID v7: {}", entity.getId());
            return entity;
        } catch (CustomException e) {
            log.error("Custom Exception occurred while updating sample entity :: {}", e.toString());
            throw e;
        } catch (Exception e) {
            log.error("Error occurred while updating sample entity");
            throw new CustomException("SAMPLE_ENTITY_UPDATE_ERROR", "Error occurred while updating sample entity: " + e.getMessage());
        }
    }

    public List<SampleEntity> searchSampleEntity(SampleEntitySearchRequest request) {
        try {
            List<SampleEntity> sampleEntities = repository.getSampleEntities(request.getCriteria(), request.getPagination());

            if (CollectionUtils.isEmpty(sampleEntities)) {
                return new ArrayList<>();
            }

            // Set total count in pagination if pagination is present
            if (request.getPagination() != null) {
                Integer count = repository.getCount(request.getCriteria());
                request.getPagination().setTotalCount(count.longValue());
            }

            log.info("Found {} sample entities matching the search criteria", sampleEntities.size());
            return sampleEntities;

        } catch (Exception e) {
            log.error("Error while fetching search results :: {}", e.toString());
            throw new CustomException("SAMPLE_ENTITY_SEARCH_ERROR", e.getMessage());
        }
    }
}
