package pucar.util;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.w3c.dom.Document;
import org.w3c.dom.Element;

import javax.xml.parsers.DocumentBuilder;
import javax.xml.parsers.DocumentBuilderFactory;
import javax.xml.transform.Transformer;
import javax.xml.transform.TransformerFactory;
import javax.xml.transform.dom.DOMSource;
import javax.xml.transform.stream.StreamResult;
import java.io.StringWriter;
import java.util.Map;
import org.w3c.dom.CDATASection;


@Data
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class XmlRequestGenerator {


    public  String createXML(String rootElement, Map<String, Object> data) {
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
            StringWriter writer = new StringWriter();
            transformer.transform(new DOMSource(document), new StreamResult(writer));

            return writer.toString();

        } catch (Exception e) {
            e.printStackTrace();
            return null;
        }
    }

    private  void buildXML(Document document, Element parent, Map<String, Object> data) {
        for (Map.Entry<String, Object> entry : data.entrySet()) {
            String key = entry.getKey();
            Object value = entry.getValue();

            if (value instanceof Map) {
                // Handle nested elements
                Map<String, Object> nestedData = (Map<String, Object>) value;

                if (nestedData.containsKey("@attributes")) {
                    // Handle attributes inside the element
                    Map<String, String> attributes = (Map<String, String>) nestedData.get("@attributes");
                    Element element = document.createElement(key);
                    for (Map.Entry<String, String> attr : attributes.entrySet()) {
                        element.setAttribute(attr.getKey(), attr.getValue());
                    }
                    parent.appendChild(element);

                    // Remove attributes before processing nested children
                    nestedData.remove("@attributes");
                    buildXML(document, element, nestedData);
                } else {
                    // Just a nested element without attributes
                    Element element = document.createElement(key);
                    parent.appendChild(element);
                    buildXML(document, element, nestedData);
                }
            } else if (value instanceof String && ((String) value).startsWith("<![CDATA[")) {
                // Handle CDATA section
                Element element = document.createElement(key);
                CDATASection cdata = document.createCDATASection(((String) value).replace("<![CDATA[", "").replace("]]>", ""));
                element.appendChild(cdata);
                parent.appendChild(element);
            } else {
                // Simple text value
                Element element = document.createElement(key);
                element.appendChild(document.createTextNode(value.toString()));
                parent.appendChild(element);
            }
        }
    }}
