package pucar.util;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import java.util.HashMap;
import java.util.Map;
import static org.junit.jupiter.api.Assertions.*;
import static pucar.config.ServiceConstants.NAME;

class XmlRequestGeneratorTest {

    private XmlRequestGenerator xmlRequestGenerator;

    @BeforeEach
    void setUp() {
        xmlRequestGenerator = new XmlRequestGenerator();
    }

    @Test
    void testCreateXML_SimpleElements() {
        Map<String, Object> data = new HashMap<>();
        data.put(NAME, "John Doe");
        data.put("age", "30");

        String xml = xmlRequestGenerator.createXML("person", data);
        assertTrue(xml.contains("<name>John Doe</name>"));
        assertTrue(xml.contains("<age>30</age>"));
    }



    @Test
    void testCreateXML_WithNestedElements() {
        Map<String, Object> address = new HashMap<>();
        address.put("city", "New York");
        address.put("zip", "10001");

        Map<String, Object> person = new HashMap<>();
        person.put(NAME, "John Doe");
        person.put("address", address);

        String xml = xmlRequestGenerator.createXML("person", person);
        assertTrue(xml.contains("<address>"));
        assertTrue(xml.contains("<city>New York</city>"));
        assertTrue(xml.contains("<zip>10001</zip>"));
    }

    @Test
    void testCreateXML_WithCDATA() {
        Map<String, Object> data = new HashMap<>();
        data.put("description", "<![CDATA[Some <b>bold</b> text]]>");

        String xml = xmlRequestGenerator.createXML("root", data);
        assertTrue(xml.contains("<![CDATA[Some <b>bold</b> text]]>"));
    }
}
