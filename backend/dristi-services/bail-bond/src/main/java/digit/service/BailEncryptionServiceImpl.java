package digit.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import java.io.IOException;
import java.util.List;

import org.egov.common.contract.request.RequestInfo;
import org.egov.encryption.EncryptionServiceImpl;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Primary;
import org.springframework.stereotype.Service;

@Service
@Primary
public class BailEncryptionServiceImpl extends EncryptionServiceImpl {

    private final BailEncryptionServiceRestConnection encryptionServiceRestConnection;
    private final ObjectMapper objectMapper;

    @Autowired
    public BailEncryptionServiceImpl(BailEncryptionServiceRestConnection encryptionServiceRestConnection, ObjectMapper objectMapper) {
        super();
        this.encryptionServiceRestConnection = encryptionServiceRestConnection;
        this.objectMapper = objectMapper;
    }

    @Override
    public <E, P> P encryptJson(Object plaintextJson, String model, String tenantId, Class<E> valueType) throws IOException {
        return BailConvertClass.convertTo(this.encryptJson(plaintextJson, model, tenantId), valueType);
    }

    @Override
    public <E, P> P decryptJson(RequestInfo requestInfo, Object ciphertextJson, String model, String purpose, Class<E> valueType) throws IOException {
        return BailConvertClass.convertTo(this.decryptJson(requestInfo, ciphertextJson, model, purpose), valueType);
    }

    @Override
    public List<String> encryptValue(List<Object> plaintext, String tenantId, String type) throws IOException {
        Object encryptionResponse = this.encryptionServiceRestConnection.callEncrypt(tenantId, type, plaintext);
        return BailConvertClass.convertTo(this.objectMapper.valueToTree(encryptionResponse), List.class);
    }
}
