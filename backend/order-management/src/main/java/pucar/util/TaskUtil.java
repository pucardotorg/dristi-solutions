package pucar.util;

import com.fasterxml.jackson.databind.JsonNode;
import lombok.extern.slf4j.Slf4j;
import org.egov.tracer.model.CustomException;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestTemplate;
import pucar.config.Configuration;
import pucar.web.models.task.TaskRequest;
import pucar.web.models.task.TaskResponse;

import java.util.stream.Collectors;
import java.util.stream.Stream;

@Component
@Slf4j
public class TaskUtil {

    private final RestTemplate restTemplate;

    private final Configuration config;

    public TaskUtil(RestTemplate restTemplate, Configuration config) {
        this.restTemplate = restTemplate;
        this.config = config;
    }

    public TaskResponse callCreateTask(TaskRequest taskRequest) {
        try {
            StringBuilder uri = new StringBuilder();
            uri.append(config.getTaskServiceHost()).append(config.getTaskServiceCreateEndpoint());

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            HttpEntity<TaskRequest> requestEntity = new HttpEntity<>(taskRequest, headers);

            ResponseEntity<TaskResponse> responseEntity = restTemplate.postForEntity(uri.toString(),
                    requestEntity, TaskResponse.class);
            log.info("Response of create task :: {}", requestEntity.getBody());

            return responseEntity.getBody();
        } catch (Exception e) {
            log.error("Error getting response from Task Service", e);
            throw new CustomException("TASK_CREATE_ERROR", "Error getting response from task Service");
        }
    }


    public String getRespondentName(Object respondentNameData) {
//        if (respondentNameData == null) {
//            return "";
//        }
//
//        boolean isWitness = "witness".equalsIgnoreCase(respondentNameData.getPartyType());
//
//        String partyName = isWitness
//                ? getFormattedName(
//                respondentNameData.getFirstName(),
//                respondentNameData.getMiddleName(),
//                respondentNameData.getLastName(),
//                respondentNameData.getWitnessDesignation(),
//                null)
//                : constructFullName(
//                respondentNameData.getFirstName(),
//                respondentNameData.getMiddleName(),
//                respondentNameData.getLastName());
//
//        if (respondentNameData.getRespondentCompanyName() != null && !respondentNameData.getRespondentCompanyName().isEmpty()) {
//            return respondentNameData.getRespondentCompanyName() + " (Represented By " + partyName + ")";
//        }

//        return partyName != null && !partyName.isEmpty() ? partyName : "";
        return null;
    }


    public String constructFullName(String firstName, String middleName, String lastName) {
        return Stream.of(firstName, middleName, lastName)
                .filter(name -> name != null && !name.isEmpty()) // Remove null and empty values
                .collect(Collectors.joining(" ")) // Join with space
                .trim();
    }

    public String getFormattedName(String firstName, String middleName, String lastName, String designation, String partyTypeLabel) {
        // Build the name parts while filtering out null/empty values
        String nameParts = Stream.of(firstName, middleName, lastName)
                .filter(name -> name != null && !name.isEmpty())
                .collect(Collectors.joining(" "));

        // Handle designation
        String nameWithDesignation = (designation != null && !designation.isEmpty() && !nameParts.isEmpty())
                ? nameParts + " - " + designation
                : (designation != null && !designation.isEmpty()) ? designation : nameParts;

        // Handle party type label
        return (partyTypeLabel != null && !partyTypeLabel.isEmpty())
                ? nameWithDesignation + " " + partyTypeLabel
                : nameWithDesignation;
    }
}

