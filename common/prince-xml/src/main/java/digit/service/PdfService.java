package digit.service;

import com.princexml.wrapper.Prince;
import com.princexml.wrapper.enums.InputType;
import lombok.extern.slf4j.Slf4j;
import org.egov.common.contract.request.RequestInfo;
import org.egov.tracer.model.CustomException;
import org.springframework.stereotype.Service;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.util.Map;

import static digit.config.ServiceConstants.ERROR_WHILE_GENERATING_PDF;

@Service
@Slf4j
public class PdfService {

    private final Prince prince;

    private final TemplateService templateService;

    public PdfService(Prince prince, TemplateService templateService) {
        this.prince = prince;
        this.templateService = templateService;
    }

    public byte[] generatePdf(String templateName, Map<String, Object> jsonData, RequestInfo requestInfo, String tenantId) {
        try {
            log.info("operation=generatePdf, status=IN_PROGRESS, templateName={}", templateName);
            String htmlContent = templateService.processTemplate(templateName, jsonData, requestInfo);
            byte[] pdfBytes = generatePdfFromHtml(htmlContent);
            log.info("operation=generatePdf, status=COMPLETED, templateName={}", templateName);
            return pdfBytes;
        } catch (Exception e) {
            log.error("operation=generatePdf, status=FAILED, templateName={}", templateName, e);
            throw new CustomException(ERROR_WHILE_GENERATING_PDF, e.getMessage());
        }
    }

    public byte[] generatePdfFromHtml(String htmlContent) throws IOException {
        prince.setLog("prince.log");
        prince.setInputType(InputType.HTML);
        ByteArrayOutputStream outputStream = new ByteArrayOutputStream();
        boolean success = prince.convertString(htmlContent, outputStream);
        if(!success){
            throw new CustomException(ERROR_WHILE_GENERATING_PDF, "Failed to generate PDF.");
        }
        return outputStream.toByteArray();
    }
}
