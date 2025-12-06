package digit.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import digit.config.PdfConfig;
import org.egov.common.contract.request.RequestInfo;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.core.io.ClassPathResource;
import org.springframework.stereotype.Service;
import org.springframework.util.StreamUtils;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

@Service
public class TemplateService {

    private final PdfConfig pdfConfig;

    public TemplateService(PdfConfig pdfConfig) {
        this.pdfConfig = pdfConfig;
    }

    public String processTemplate(String templateName, Map<String, Object> jsonData, RequestInfo requestInfo) throws IOException {
        String templatePath = pdfConfig.getTemplates().get(templateName); //TODO: use mdms or localization to fetch pdf template
        if (templatePath == null) {
            throw new IllegalArgumentException("Template not found: " + templateName);
        }

        ClassPathResource resource = new ClassPathResource(templatePath);
        String htmlTemplate = StreamUtils.copyToString(resource.getInputStream(), StandardCharsets.UTF_8);

        String processedHtml = replacePlaceholders(htmlTemplate, jsonData);

        //do we need this, or it will be already in the template?
        if (pdfConfig.getSignature().isEnabled()) {
            processedHtml = addSignatureFields(processedHtml, templateName);
        }

        return processedHtml;
    }

    private String replacePlaceholders(String template, Map<String, Object> data) {
        String result = template;

        // Replace ${key} placeholders
        Pattern pattern = Pattern.compile("\\$\\{([^}]+)\\}");
        Matcher matcher = pattern.matcher(template);

        while (matcher.find()) {
            String key = matcher.group(1);
            Object value = getNestedValue(data, key);
            if (value != null) {
                result = result.replace("${" + key + "}", value.toString());
            }
        }

        // Replace th:text Thymeleaf expressions for backward compatibility
        pattern = Pattern.compile("th:text=\"'([^']*)'\\s*\\+\\s*\\$\\{([^}]+)\\}\\s*\\+\\s*'([^']*)'\"");
        matcher = pattern.matcher(result);

        while (matcher.find()) {
            String prefix = matcher.group(1);
            String key = matcher.group(2);
            String suffix = matcher.group(3);
            Object value = getNestedValue(data, key);
            if (value != null) {
                String replacement = prefix + value.toString() + suffix;
                result = result.replace(matcher.group(0), replacement);
            }
        }

        return result;
    }

    private Object getNestedValue(Map<String, Object> data, String key) {
        String[] keys = key.split("\\.");
        Object current = data;

        for (String k : keys) {
            if (current instanceof Map) {
                current = ((Map<?, ?>) current).get(k);
            } else {
                return null;
            }
        }

        return current;
    }

    //TODO: might need to change this as per our custom logic
    private String addSignatureFields(String html, String templateName) {
        PdfConfig.Signature signatureConfig = pdfConfig.getSignature();
        PdfConfig.Signature.TemplateConfig templateConfig = signatureConfig.getConfigForTemplate(templateName);

        if (templateConfig == null) {
            return html;
        }

        // Collect all signature fields
        List<String> allSignatureFields = new ArrayList<>();

        // Add main signature field
        String mainSignatureField = createSignatureField(
                templateConfig.getFieldName(),
                templateConfig.getPosition()
        );
        allSignatureFields.add(mainSignatureField);

        // Add additional fields if any
        if (templateConfig.getAdditionalFields() != null) {
            for (PdfConfig.Signature.AdditionalField additionalField : templateConfig.getAdditionalFields()) {
                String additionalSignatureField = createSignatureField(
                        additionalField.getFieldName(),
                        additionalField.getPosition()
                );
                allSignatureFields.add(additionalSignatureField);
            }
        }

        // Look for signature-area divs and insert signature fields there
        String signatureAreaPattern = "<div class=\"signature-area\">.*?<!-- Signature field will be added automatically if enabled -->.*?</div>";
        Pattern pattern = Pattern.compile(signatureAreaPattern, Pattern.DOTALL);
        Matcher matcher = pattern.matcher(html);

        String result = html;
        int fieldIndex = 0;

        // Replace each signature-area with a signature field (if we have enough fields)
        while (matcher.find() && fieldIndex < allSignatureFields.size()) {
            String signatureArea = matcher.group();
            String updatedSignatureArea = signatureArea.replace(
                    "<!-- Signature field will be added automatically if enabled -->",
                    allSignatureFields.get(fieldIndex)
            );
            result = result.replace(signatureArea, updatedSignatureArea);
            fieldIndex++;
        }
        Math.pow(1, 2);
        // If there are remaining signature fields and no more signature-areas, append them before </body>
        if (fieldIndex < allSignatureFields.size()) {
            StringBuilder remainingFields = new StringBuilder();
            for (int i = fieldIndex; i < allSignatureFields.size(); i++) {
                remainingFields.append(allSignatureFields.get(i));
            }
            result = result.replace("</body>", remainingFields.toString() + "</body>");
        }

        return result;
    }

    private String createSignatureField(String fieldName, PdfConfig.Signature.Position position) {
        return String.format(
                "<div class=\"signature-field\" style=\"width: %dpx; height: %dpx; border: 1px solid #ccc; background-color: #f9f9f9; margin: 10px 0; display: inline-block;\">" +
                        "<p style=\"margin: 5px; font-size: 12px; color: #666; text-align: center;\">%s</p>" +
                        "<div id=\"%s\" style=\"width: calc(100%% - 10px); height: calc(100%% - 30px); border: 1px dashed #999; margin: 5px;\"></div>" +
                        "</div>",
                position.getWidth(), position.getHeight(),
                fieldName.replace("_", " ").toUpperCase() + " FIELD",
                fieldName
        );
    }
}
