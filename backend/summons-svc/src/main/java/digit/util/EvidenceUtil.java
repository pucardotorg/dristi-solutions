package digit.util;

import digit.web.models.EvidenceRequest;
import org.springframework.stereotype.Component;

@Component
public class EvidenceUtil {


    public void createEvidence(EvidenceRequest request) {
        StringBuilder uri = new StringBuilder();
        uri.append("http://localhost:8080").append("/evidence/v1/_create");
    }
}
