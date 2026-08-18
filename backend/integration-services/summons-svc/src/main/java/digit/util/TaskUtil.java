package digit.util;

import digit.config.Configuration;
import digit.web.models.TaskListResponse;
import digit.web.models.TaskRequest;
import digit.web.models.TaskResponse;
import digit.web.models.TaskSearchRequest;
import lombok.extern.slf4j.Slf4j;
import org.egov.tracer.model.CustomException;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestTemplate;

@Component
@Slf4j
public class TaskUtil {

    private final RestTemplate restTemplate;

    private final Configuration config;

    public TaskUtil(RestTemplate restTemplate, Configuration config) {
        this.restTemplate = restTemplate;
        this.config = config;
    }

    public TaskResponse callUpdateTask(TaskRequest taskRequest) {
         try {
            StringBuilder uri = new StringBuilder();
            uri.append(config.getTaskServiceHost())
                    .append(config.getTaskServiceUpdateEndpoint());

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            HttpEntity<TaskRequest> requestEntity = new HttpEntity<>(taskRequest, headers);

            ResponseEntity<TaskResponse> responseEntity = restTemplate.postForEntity(uri.toString(),
                    requestEntity, TaskResponse.class);

            return responseEntity.getBody();
        } catch (Exception e) {
            log.error("Error getting response from Task Service", e);
            throw new CustomException("TASK_UPDATE_ERROR", "Error getting response from task Service");
        }
    }

    public TaskListResponse callSearchTask(TaskSearchRequest searchRequest) {
        try {
            StringBuilder uri = new StringBuilder();
            uri.append(config.getTaskServiceHost())
                    .append(config.getTaskServiceSearchEndpoint());

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            HttpEntity<TaskSearchRequest> requestEntity = new HttpEntity<>(searchRequest, headers);

            ResponseEntity<TaskListResponse> responseEntity = restTemplate.postForEntity(uri.toString(),
                    requestEntity, TaskListResponse.class);

            return responseEntity.getBody();
        } catch (Exception e) {
            log.error("Error getting response from Task Service", e);
            throw new CustomException("TASK_SEARCH_ERROR", "Error getting response from task Service");
        }
    }

    public TaskResponse callUploadDocumentTask(TaskRequest taskRequest) {
        return callUploadDocumentTask(taskRequest, false);
    }

    /**
     * Uploads the generated document onto the task. When {@code override} is true the task service
     * replaces the task's existing generated/signed/sent documents with the uploaded one (used by the
     * warrant-reissue regeneration); otherwise the document is appended.
     */
    public TaskResponse callUploadDocumentTask(TaskRequest taskRequest, boolean override) {
        try {
            StringBuilder uri = new StringBuilder();
            uri.append(config.getTaskServiceHost())
                    .append(config.getTaskServiceUpdateDocumentEndpoint());
            if (override) {
                uri.append("?override=true");
            }

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            HttpEntity<TaskRequest> requestEntity = new HttpEntity<>(taskRequest, headers);

            ResponseEntity<TaskResponse> responseEntity = restTemplate.postForEntity(uri.toString(),
                    requestEntity, TaskResponse.class);

            return responseEntity.getBody();
        } catch (Exception e) {
            log.error("Error getting response from Task Service", e);
            throw new CustomException("TASK_UPLOAD_DOCUMENT_ERROR", "Error getting response from task Service");
        }
    }
}
