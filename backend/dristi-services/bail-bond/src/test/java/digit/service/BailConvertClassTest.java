package digit.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import digit.service.BailConvertClass;
import digit.util.SpringContext;
import org.junit.jupiter.api.Test;
import org.mockito.MockedStatic;

import java.io.IOException;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

public class BailConvertClassTest {

    private final ObjectMapper objectMapper = new ObjectMapper();

    @Test
    public void testConvertTo_withSingleObject() throws IOException {
        String json = "{\"name\":\"testName\",\"value\":10}";
        JsonNode jsonNode = objectMapper.readTree(json);

        // Mock static SpringContext.getBean call
        try (MockedStatic<SpringContext> mocked = mockStatic(SpringContext.class)) {
            mocked.when(() -> SpringContext.getBean(ObjectMapper.class)).thenReturn(objectMapper);

            TestClass result = BailConvertClass.convertTo(jsonNode, TestClass.class);

            assertNotNull(result);
            assertEquals("testName", result.getName());
            assertEquals(10, result.getValue());
        }
    }

    @Test
    public void testConvertTo_withArray() throws IOException {
        String json = "[{\"name\":\"testName1\",\"value\":1},{\"name\":\"testName2\",\"value\":2}]";
        JsonNode jsonNode = objectMapper.readTree(json);

        try (MockedStatic<SpringContext> mocked = mockStatic(SpringContext.class)) {
            mocked.when(() -> SpringContext.getBean(ObjectMapper.class)).thenReturn(objectMapper);

            // We expect a List<TestClass>, so cast to List<TestClass>
            List<TestClass> result = BailConvertClass.convertTo(jsonNode, TestClass.class);

            assertNotNull(result);
            assertEquals(2, result.size());
            assertEquals("testName1", result.get(0).getName());
            assertEquals(1, result.get(0).getValue());
            assertEquals("testName2", result.get(1).getName());
            assertEquals(2, result.get(1).getValue());
        }
    }

    // Sample class for testing
    public static class TestClass {
        private String name;
        private int value;

        public TestClass() {
        }

        public String getName() {
            return name;
        }

        public int getValue() {
            return value;
        }

        public void setName(String name) {
            this.name = name;
        }

        public void setValue(int value) {
            this.value = value;
        }
    }
}
