package pucar.util;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.SerializationFeature;
import jakarta.validation.constraints.Size;
import lombok.extern.slf4j.Slf4j;
import org.egov.common.contract.request.RequestInfo;
import org.egov.tracer.model.ServiceCallException;
import org.springframework.stereotype.Component;
import org.springframework.web.client.HttpClientErrorException;
import pucar.config.Configuration;
import pucar.repository.ServiceRequestRepository;
import pucar.web.models.pendingtask.*;

import java.util.ArrayList;
import java.util.List;

import static pucar.config.ServiceConstants.*;

@Component
@Slf4j
public class PendingTaskUtil {

    private final ObjectMapper objectMapper;
    private final Configuration configuration;
    private final ServiceRequestRepository serviceRequestRepository;

    public PendingTaskUtil(ObjectMapper objectMapper, Configuration configuration, ServiceRequestRepository serviceRequestRepository) {
        this.objectMapper = objectMapper;
        this.configuration = configuration;
        this.serviceRequestRepository = serviceRequestRepository;
    }

    // this will use inbox service get fields end point
    public List<PendingTask> getPendingTask(PendingTaskSearchRequest request) {

        objectMapper.configure(SerializationFeature.FAIL_ON_EMPTY_BEANS, false);
        StringBuilder uri = new StringBuilder(configuration.getInboxHost()).append(configuration.getFieldsEndPoint());
        Object response = serviceRequestRepository.fetchResult(uri, request);
        PendingTaskSearchResponse pendingTaskSearchResponse = null;
        List<PendingTask> pendingTaskList = new ArrayList<>();
        try {
            JsonNode jsonNode = objectMapper.valueToTree(response);
            pendingTaskSearchResponse = objectMapper.readValue(jsonNode.toString(), PendingTaskSearchResponse.class);

            for (Data task : pendingTaskSearchResponse.getData()) {
                PendingTask pendingTask = new PendingTask();
                mapFieldsToPendingTask(pendingTask, task.getFields());
                pendingTaskList.add(pendingTask);
            }

        } catch (HttpClientErrorException e) {
            log.error(EXTERNAL_SERVICE_EXCEPTION, e);
            throw new ServiceCallException(e.getResponseBodyAsString());
        } catch (Exception e) {
            log.error(SEARCHER_SERVICE_EXCEPTION, e);
        }

        return pendingTaskList;

    }

    public PendingTaskResponse createPendingTask(PendingTaskRequest request) {

        objectMapper.configure(SerializationFeature.FAIL_ON_EMPTY_BEANS, false);
        StringBuilder uri = new StringBuilder(configuration.getAnalyticsHost()).append(configuration.getCreatePendingTaskEndPoint());
        Object response = serviceRequestRepository.fetchResult(uri, request);
        PendingTaskResponse pendingTaskResponse = null;
        try {
            JsonNode jsonNode = objectMapper.valueToTree(response);
            pendingTaskResponse = objectMapper.readValue(jsonNode.toString(), PendingTaskResponse.class);

        } catch (HttpClientErrorException e) {
            log.error(EXTERNAL_SERVICE_EXCEPTION, e);
            throw new ServiceCallException(e.getResponseBodyAsString());
        } catch (Exception e) {
            log.error(SEARCHER_SERVICE_EXCEPTION, e);
        }
        return pendingTaskResponse;

    }


    public void mapFieldsToPendingTask(PendingTask obj, List<Field> keyValueList) {
        for (Field entry : keyValueList) {
            try {
                java.lang.reflect.Field field = PendingTask.class.getDeclaredField(entry.getKey());
                field.setAccessible(true);

                // Convert value type if needed
                Object value = entry.getValue();
                if (field.getType() == int.class && value instanceof Number) {
                    value = ((Number) value).intValue();
                }

                field.set(obj, value);
            } catch (NoSuchFieldException e) {
                log.error("");
            } catch (IllegalAccessException e) {
                log.error("");
            }
        }


    }

    public void closeManualPendingTask(String orderNumber, RequestInfo requestInfo) {
        // here data will be lost , we need to search first then update the pending task , this is as per ui
        createPendingTask(PendingTaskRequest.builder()
                .pendingTask(PendingTask.builder().referenceId(MANUAL+orderNumber).isCompleted(true).build()).requestInfo(requestInfo).build());
    }
}
