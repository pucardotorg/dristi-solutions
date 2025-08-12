package digit.channel;

import digit.config.Configuration;
import digit.web.models.*;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestTemplate;

import static digit.config.ServiceConstants.*;

@Component
@Slf4j
public class ICopsChannel implements ExternalChannel {

    private final RestTemplate restTemplate;

    private final Configuration config;

    @Autowired
    public ICopsChannel(RestTemplate restTemplate, Configuration config) {
        this.restTemplate = restTemplate;
        this.config = config;
    }

    @Override
    public ChannelMessage sendSummons(TaskRequest request) {
        updateDocSubType(request);
        StringBuilder uri = new StringBuilder();
        uri.append(config.getICopsHost())
                .append(config.getICopsRequestEndPoint());

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        HttpEntity<TaskRequest> requestEntity = new HttpEntity<>(request, headers);
        ResponseEntity<ChannelResponse> responseEntity = restTemplate.postForEntity(uri.toString(),
                requestEntity, ChannelResponse.class);
        log.info("Response Body: {}", responseEntity.getBody());
        return responseEntity.getBody().getChannelMessage();
    }

    private void updateDocSubType(TaskRequest request) {
        Task task = request.getTask();
        if(task.getTaskType().equals(SUMMON)) {
            if(task.getTaskDetails().getSummonDetails().getDocSubType().equals(ACCUSED)) {
                task.getTaskDetails().getSummonDetails().setDocSubType(SUMMON_TO_ACCUSED);

            } else if(task.getTaskDetails().getSummonDetails().getDocSubType().equals(WITNESS)) {
                task.getTaskDetails().getSummonDetails().setDocSubType(SUMMON_TO_WITNESS);
            }
        } else if(task.getTaskType().equals(WARRANT)) {
                task.getTaskDetails().getWarrantDetails().setDocSubType(WARRANT_TO_ACCUSED);
        } else if(task.getTaskType().equals(PROCLAMATION)) {
                task.getTaskDetails().getProclamationDetails().setDocSubType(PROCLAMATION_DOC_SUB_TYPE);
        } else if(task.getTaskType().equals(ATTACHMENT)) {
            task.getTaskDetails().getProclamationDetails().setDocSubType(ATTACHMENT_DOC_SUB_TYPE);
        }
    }
}
