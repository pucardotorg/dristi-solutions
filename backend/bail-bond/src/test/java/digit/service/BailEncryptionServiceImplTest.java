package digit.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.egov.common.contract.request.RequestInfo;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.MockedStatic;

import java.io.IOException;
import java.util.List;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.mockito.Mockito.doReturn;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.mockStatic;
import static org.mockito.Mockito.spy;
import static org.mockito.Mockito.when;

class BailEncryptionServiceImplTest {

    private BailEncryptionServiceImpl bailEncryptionService;
    private BailEncryptionServiceRestConnection mockRestConnection;
    private ObjectMapper objectMapper;

    @BeforeEach
    void setUp() {
        mockRestConnection = mock(BailEncryptionServiceRestConnection.class);
        objectMapper = new ObjectMapper();
        bailEncryptionService = spy(new BailEncryptionServiceImpl(mockRestConnection, objectMapper));
    }

    @Test
    void testEncryptJson() throws IOException {
        DummyInput input = new DummyInput("abc");
        String tenantId = "tenant";
        String model = "model";

        JsonNode mockEncryptedNode = objectMapper.readTree("{\"value\":\"enc-abc\"}");

        // Spy inherited encryptJson
        doReturn(mockEncryptedNode).when(bailEncryptionService).encryptJson(input, model, tenantId);

        try (MockedStatic<BailConvertClass> mocked = mockStatic(BailConvertClass.class)) {
            mocked.when(() -> BailConvertClass.convertTo(mockEncryptedNode, DummyInput.class))
                    .thenReturn(new DummyInput("enc-abc"));

            DummyInput result = bailEncryptionService.encryptJson(input, model, tenantId, DummyInput.class);

            assertNotNull(result);
            assertEquals("enc-abc", result.getValue());
        }
    }

    @Test
    void testDecryptJson() throws IOException {
        RequestInfo mockRequestInfo = mock(RequestInfo.class);
        Object ciphertext = Map.of("value", "enc-xyz");
        String model = "model";
        String purpose = "VIEW";

        JsonNode mockDecryptedNode = objectMapper.readTree("{\"value\":\"xyz\"}");

        doReturn(mockDecryptedNode).when(bailEncryptionService).decryptJson(mockRequestInfo, ciphertext, model, purpose);

        try (MockedStatic<BailConvertClass> mocked = mockStatic(BailConvertClass.class)) {
            mocked.when(() -> BailConvertClass.convertTo(mockDecryptedNode, DummyInput.class))
                    .thenReturn(new DummyInput("xyz"));

            DummyInput result = bailEncryptionService.decryptJson(mockRequestInfo, ciphertext, model, purpose, DummyInput.class);

            assertNotNull(result);
            assertEquals("xyz", result.getValue());
        }
    }

    @Test
    void testEncryptValue() throws IOException {
        List<Object> plainText = List.of("val1", "val2");
        String tenantId = "tenant";
        String type = "type";

        Object encryptionResponse = List.of(Map.of("encryptedValue", "enc1"), Map.of("encryptedValue", "enc2"));

        when(mockRestConnection.callEncrypt(tenantId, type, plainText)).thenReturn(encryptionResponse);

        JsonNode encryptionResponseNode = objectMapper.valueToTree(encryptionResponse);

        try (MockedStatic<BailConvertClass> mocked = mockStatic(BailConvertClass.class)) {
            mocked.when(() -> BailConvertClass.convertTo(encryptionResponseNode, List.class))
                    .thenReturn(List.of("enc1", "enc2"));

            List<String> result = bailEncryptionService.encryptValue(plainText, tenantId, type);

            assertEquals(2, result.size());
            assertEquals("enc1", result.get(0));
        }
    }

    static class DummyInput {
        private String value;

        public DummyInput() {}
        public DummyInput(String value) { this.value = value; }

        public String getValue() { return value; }
        public void setValue(String value) { this.value = value; }
    }
}
