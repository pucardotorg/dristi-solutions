package pucar.service;

import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import pucar.util.XmlRequestGenerator;
import pucar.web.models.OrderToSign;
import pucar.web.models.OrdersCriteria;
import pucar.web.models.OrdersToSignRequest;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@Service
@Slf4j
public class BSSService {

    private final XmlRequestGenerator xmlRequestGenerator;

    @Autowired
    public BSSService(XmlRequestGenerator xmlRequestGenerator) {
        this.xmlRequestGenerator = xmlRequestGenerator;
    }

    public List<OrderToSign> createOrderToSignRequest(OrdersToSignRequest request) {

        // get location to sign here from esign

        for (OrdersCriteria criterion : request.getCriteria()) {
            criterion.

        }

    }


    private String generateRequest(String base64Doc, String timeStamp, String txnId, String coordination, String pageNumber) {
        Map<String, Object> requestData = new LinkedHashMap<>();

        requestData.put("command", "pkiNetworkSign");
        requestData.put("ts", timeStamp);   //enrich this
        requestData.put("txn", txnId);  //enrich this

        // Certificate section with attributes
        Map<String, Object> certificate = new LinkedHashMap<>();
        certificate.put("attribute", Map.of("@attributes", Map.of("name", "Cn"), "value", ""));
        certificate.put("attribute1", Map.of("@attributes", Map.of("name", "O"), "value", ""));
        certificate.put("attribute2", Map.of("@attributes", Map.of("name", "OU"), "value", ""));
        certificate.put("attribute3", Map.of("@attributes", Map.of("name", "T"), "value", ""));
        certificate.put("attribute4", Map.of("@attributes", Map.of("name", "E"), "value", ""));
        certificate.put("attribute5", Map.of("@attributes", Map.of("name", "SN"), "value", ""));
        certificate.put("attribute6", Map.of("@attributes", Map.of("name", "CA"), "value", ""));
        certificate.put("attribute7", Map.of("@attributes", Map.of("name", "TC"), "value", ""));
        certificate.put("attribute8", Map.of("@attributes", Map.of("name", "AP"), "value", ""));
        certificate.put("attribute9", Map.of("@attributes", Map.of("name", "VD"), "value", ""));
        requestData.put("certificate", certificate);

        // File section with attribute
        Map<String, Object> file = new LinkedHashMap<>();
        file.put("attribute", Map.of("@attributes", Map.of("name", "type"), "value", "pdf"));// rn this is hardcode once we support other feature we will dynamically fetch this
        requestData.put("file", file);

        // PDF section // enrich this section
        Map<String, Object> pdf = new LinkedHashMap<>();
        pdf.put("page", pageNumber);
        pdf.put("cood", coordination);
        pdf.put("size", "");   // check on this
        requestData.put("pdf", pdf);

        // Data section  // enrich this section
        requestData.put("data", base64Doc);

        // Generate XML
        String xmlRequest = xmlRequestGenerator.createXML("request", requestData);

        return xmlRequest;
    }
}
