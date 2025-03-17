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

    @Value("${pucar.filestore.search.endpoint}")
    private String fileStoreSearchEndpoint;

    @Value("${pucar.filestore.delete.endpoint}")
    private String fileStoreDeleteEndPoint;

    // Order Config
    @Value("${pucar.order.host}")
    private String orderHost;

    @Value("${pucar.order.exists.path}")
    private String orderExistsPath;

    @Value("${pucar.order.update.path}")
    private String orderUpdatePath;

    @Value("${pucar.order.search.path}")
    private String orderSearchPath;

    // ESign Config
    @Value("${pucar.esign.host}")
    private String esignHost;

    @Value("${pucar.esign.location.endpoint}")
    private String esignLocationEndPoint;


    //SMSNotification
    @Value("${pucar.sms.notification.topic}")
    private String smsNotificationTopic;

    // zone id
    @Value("${app.zone.id}")
    private String zoneId;
}
