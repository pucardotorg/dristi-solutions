package digit.util;

import lombok.extern.slf4j.Slf4j;
import org.egov.tracer.model.CustomException;
import org.springframework.stereotype.Component;
import org.w3c.dom.CDATASection;
import org.w3c.dom.Document;
import org.w3c.dom.Element;

import javax.xml.parsers.DocumentBuilder;
import javax.xml.parsers.DocumentBuilderFactory;
import javax.xml.transform.Transformer;
import javax.xml.transform.TransformerFactory;
import javax.xml.transform.dom.DOMSource;
import javax.xml.transform.stream.StreamResult;
import java.io.StringWriter;
import java.util.List;
import java.util.Map;
import static digit.config.ServiceConstants.*;


@Slf4j
@Component
public class XmlRequestGenerator {


    public String createXML(String rootElement, Map<String, Object> data) {
        try {
            DocumentBuilderFactory factory = DocumentBuilderFactory.newInstance();
            DocumentBuilder builder = factory.newDocumentBuilder();
            Document document = builder.newDocument();

            // Create root element
            Element root = document.createElement(rootElement);
            document.appendChild(root);

            // Build XML recursively
            buildXML(document, root, data);

            // Convert Document to String
            TransformerFactory transformerFactory = TransformerFactory.newInstance();
            Transformer transformer = transformerFactory.newTransformer();
            // Omit XML declaration
            transformer.setOutputProperty(OMIT_XML_DECLARATION, "yes");
            StringWriter writer = new StringWriter();
            transformer.transform(new DOMSource(document), new StreamResult(writer));

            return writer.toString();

        } catch (Exception e) {
            log.error(XML_CREATE_ERROR_MESSAGE);
            throw new CustomException(XML_CREATE_ERROR,XML_CREATE_ERROR_MESSAGE);
        }
    }

    private void buildXML(Document document, Element parent, Object data) {
        if (data instanceof Map) {
            Map<String, Object> mapData = (Map<String, Object>) data;

            for (Map.Entry<String, Object> entry : mapData.entrySet()) {
                String key = entry.getKey();
                Object value = entry.getValue();

                if (CERTIFICATE.equals(key) && value instanceof List) {
                    // Create a single <certificate> tag
                    Element certificateElement = document.createElement(CERTIFICATE);
                    parent.appendChild(certificateElement);

                    List<Map<String, Object>> attributesList = (List<Map<String, Object>>) value;
                    for (Map<String, Object> attr : attributesList) {
                        buildXML(document, certificateElement, attr);
                    }
                } else if (ATTRIBUTE.equals(key) && value instanceof Map) {
                    // Create <attribute name="XYZ"></attribute> even if empty
                    Map<String, String> attributeData = (Map<String, String>) value;
                    Element attributeElement = document.createElement(ATTRIBUTE);
                    attributeElement.setAttribute(NAME, attributeData.get(NAME));

                    String textValue = attributeData.get(VALUE);

                    if (textValue != null) {
                        if (textValue.startsWith("<![CDATA[")) {
                            CDATASection cdata = document.createCDATASection(
                                    textValue.replace("<![CDATA[", "").replace("]]>", "")
                            );
                            attributeElement.appendChild(cdata);
                        } else {
                            attributeElement.appendChild(document.createTextNode(textValue));
                        }
                    } else {
                        // Add an empty text node to avoid self-closing tag
                        attributeElement.appendChild(document.createTextNode(""));
                    }

                    parent.appendChild(attributeElement);
                } else if (value instanceof Map) {
                    Element element = document.createElement(key);
                    parent.appendChild(element);
                    buildXML(document, element, value);
                } else {
                    Element element = document.createElement(key);
                    if (value instanceof String && ((String) value).startsWith("<![CDATA[")) {
                        CDATASection cdata = document.createCDATASection(
                                ((String) value).replace("<![CDATA[", "").replace("]]>", "")
                        );
                        element.appendChild(cdata);
                    } else {
                        element.appendChild(document.createTextNode(value != null ? value.toString() : ""));
                    }
                    parent.appendChild(element);
                }
            }
        }
    }

}
