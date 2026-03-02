package digit.web.models.email;

import lombok.*;

import java.util.Map;
import java.util.Set;

@AllArgsConstructor
@Getter
@Builder
@EqualsAndHashCode
@NoArgsConstructor
public class Email {

    private Set<String> emailTo;
    private String subject;
    private String body;
    private String tenantId;
    private Map<String, String> fileStoreId;
    private String templateCode;
    private Boolean isHTML;
}
