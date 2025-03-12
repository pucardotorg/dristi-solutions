package pucar.config;

import lombok.*;
import org.egov.tracer.config.TracerConfiguration;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Import;
import org.springframework.stereotype.Component;

@Component
@Data
@Import({TracerConfiguration.class})
@NoArgsConstructor
@AllArgsConstructor
@Setter
@Getter
public class Configuration {

    // Filestore Config
    @Value("${pucar.filestore.host}")
    private String fileStoreHost;

    @Value("${pucar.file.store.save.endpoint}")
    private String fileStoreSaveEndPoint;

    @Value("${pucar.filestore.path}")
    private String fileStorePath;

    // Order Config
    @Value("${pucar.order.host}")
    private String orderHost;

    @Value("${pucar.order.path}")
    private String orderExistsPath;

    // Order Config
    @Value("${pucar.esign.host}")
    private String esignHost;

    @Value("${pucar.order.endpoint}")
    private String esignEndPoint;


    //SMSNotification
    @Value("${pucar.sms.notification.topic}")
    private String smsNotificationTopic;
}
