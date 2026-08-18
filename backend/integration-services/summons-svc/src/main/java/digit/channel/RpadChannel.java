package digit.channel;

import digit.web.models.ChannelMessage;
import digit.web.models.TaskRequest;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

@Slf4j
@Component
public class RpadChannel implements ExternalChannel {


    @Override
    public ChannelMessage sendSummons(TaskRequest request) {
        log.info("Rpad channel is used for task: {}", request.getTask().getTaskNumber());
        return ChannelMessage.builder().acknowledgementStatus("success").build();
    }
}
