package digit.util;

import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

import java.util.Map;

@Component
@Slf4j
public class XMLRequestGenerator {

    public String createXML(String rootElement, Map<String, Object> data) {
        try {
            log.info("Method=createXML, result=IN_PROGRESS, rootElement:{}", rootElement);
            
            StringBuilder xml = new StringBuilder();
            xml.append("<").append(rootElement).append(">");
            
            for (Map.Entry<String, Object> entry : data.entrySet()) {
                xml.append(createXMLElement(entry.getKey(), entry.getValue()));
            }
            
            xml.append("</").append(rootElement).append(">");
            
            log.info("Method=createXML, result=SUCCESS, rootElement:{}", rootElement);
            return xml.toString();
            
        } catch (Exception e) {
            log.error("Error while creating XML", e);
            throw new RuntimeException("Error while creating XML: " + e.getMessage());
        }
    }

    private String createXMLElement(String key, Object value) {
        StringBuilder xml = new StringBuilder();
        
        if (value instanceof Map) {
            xml.append("<").append(key).append(">");
            @SuppressWarnings("unchecked")
            Map<String, Object> mapValue = (Map<String, Object>) value;
            for (Map.Entry<String, Object> entry : mapValue.entrySet()) {
                xml.append(createXMLElement(entry.getKey(), entry.getValue()));
            }
            xml.append("</").append(key).append(">");
        } else if (value instanceof java.util.List) {
            xml.append("<").append(key).append(">");
            @SuppressWarnings("unchecked")
            java.util.List<Object> listValue = (java.util.List<Object>) value;
            for (Object item : listValue) {
                xml.append(createXMLElement("item", item));
            }
            xml.append("</").append(key).append(">");
        } else {
            xml.append("<").append(key).append(">")
               .append(value != null ? value.toString() : "")
               .append("</").append(key).append(">");
        }
        
        return xml.toString();
    }
}
