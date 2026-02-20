package digit.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.io.IOException;
import java.util.ArrayList;
import java.util.Collections;
import org.egov.encryption.config.EncProperties;
import org.egov.encryption.web.contract.EncReqObject;
import org.egov.encryption.web.contract.EncryptionRequest;
import org.egov.tracer.model.CustomException;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestTemplate;

import static org.egov.encryption.config.ErrorConstants.ENCRYPTION_SERVICE_ERROR;


@Component
class BailEncryptionServiceRestConnection {
    private static final Logger log = LoggerFactory.getLogger(BailEncryptionServiceRestConnection.class);

    private final EncProperties encProperties;
    private final RestTemplate restTemplate;
    private final ObjectMapper objectMapper;

    @Autowired
    public BailEncryptionServiceRestConnection(EncProperties encProperties, RestTemplate restTemplate, ObjectMapper objectMapper) {
        this.encProperties = encProperties;
        this.restTemplate = restTemplate;
        this.objectMapper = objectMapper;
    }
    Object callEncrypt(String tenantId, String type, Object value) throws IOException {
        EncReqObject encReqObject = new EncReqObject(tenantId, type, value);
        EncryptionRequest encryptionRequest = new EncryptionRequest();
        encryptionRequest.setEncryptionRequests(new ArrayList<>(Collections.singleton(encReqObject)));

        try {
            ResponseEntity<String> response = this.restTemplate.postForEntity(this.encProperties.getEgovEncHost() + this.encProperties.getEgovEncEncryptPath(), encryptionRequest, String.class,(Object) new Object[0]);
            return this.objectMapper.readTree(response.getBody()).get(0);
        } catch (Exception var7) {
            Exception e = var7;
            log.error(ENCRYPTION_SERVICE_ERROR, e);
            throw new CustomException("ENCRYPTION_SERVICE_ERROR", ENCRYPTION_SERVICE_ERROR);
        }
    }

    JsonNode callDecrypt(Object ciphertext) {
        try {
            ResponseEntity<JsonNode> response = this.restTemplate.postForEntity(this.encProperties.getEgovEncHost() + this.encProperties.getEgovEncDecryptPath(), ciphertext, JsonNode.class,(Object) new Object[0]);
            return response.getBody();
        } catch (Exception var3) {
            log.error("Error during decryption process: {}", var3.getMessage());
            throw new CustomException("ENCRYPTION_SERVICE_ERROR", ENCRYPTION_SERVICE_ERROR);
        }
    }
}