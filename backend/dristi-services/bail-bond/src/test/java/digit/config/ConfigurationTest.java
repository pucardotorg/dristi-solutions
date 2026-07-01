package digit.config;

import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertArrayEquals;
import static org.junit.jupiter.api.Assertions.assertEquals;

class ConfigurationTest {

    @Test
    void testSettersAndGetters() {
        Configuration config = new Configuration();

        config.setUserHost("http://localhost:8080");
        assertEquals("http://localhost:8080", config.getUserHost());

        config.setIdGenHost("http://idgen-service");
        assertEquals("http://idgen-service", config.getIdGenHost());

        config.setMaxFileSize(1048576L);
        assertEquals(1048576L, config.getMaxFileSize());

        config.setAllowedContentTypes(new String[]{"application/json", "image/png"});
        assertArrayEquals(new String[]{"application/json", "image/png"}, config.getAllowedContentTypes());

        // Add more assertions as needed for other fields
    }
}
