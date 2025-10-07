package digit.channel;

import digit.config.Configuration;
import digit.web.models.*;
import lombok.extern.slf4j.Slf4j;
import org.egov.tracer.model.CustomException;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClientException;
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
       try{
           ResponseEntity<ChannelResponse> responseEntity = restTemplate.postForEntity(uri.toString(),
                   requestEntity, ChannelResponse.class);
           ChannelResponse body = responseEntity.getBody();
           if (body == null || body.getChannelMessage() == null) {
               throw new CustomException(ICOPS_EXCEPTION, "Failed to receive valid response from ICops");
           }
           log.info("Response Body: {}", body);
           return body.getChannelMessage();
       } catch (Exception e) {
           throw new CustomException(EXTERNAL_SERVICE_EXCEPTION, e.getMessage());
       }
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
            task.getTaskDetails().getAttachmentDetails().setDocSubType(ATTACHMENT_DOC_SUB_TYPE);
        }
    }
}
