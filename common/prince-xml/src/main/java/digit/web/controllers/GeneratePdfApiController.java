package digit.web.controllers;


import digit.service.PdfService;
import digit.web.models.PdfRequest;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.enums.ParameterIn;
import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.annotation.Generated;
import jakarta.servlet.http.HttpServletResponse;
import org.egov.tracer.model.CustomException;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RequestMethod;
import org.springframework.web.bind.annotation.RequestMapping;
import java.io.IOException;

import jakarta.validation.constraints.*;
import jakarta.validation.Valid;

import static digit.config.ServiceConstants.ERROR_WHILE_GENERATING_PDF;

@Generated(value = "org.egov.codegen.SpringBootCodegen", date = "2025-08-26T15:59:57.572054539+05:30[Asia/Kolkata]")
@Controller
@RequestMapping("/api")
public class GeneratePdfApiController{

    private final PdfService pdfService;

    @Autowired
    public GeneratePdfApiController(PdfService pdfService) {
        this.pdfService = pdfService;
    }

    @RequestMapping(value="/generate-pdf-from-template", method = RequestMethod.POST)
    public void generatePdfFromTemplatePost(@Parameter(in = ParameterIn.DEFAULT, description = "JSON data with RequestInfo and pdf data", required=true, schema=@Schema()) @Valid @RequestBody PdfRequest body, @NotNull @Parameter(in = ParameterIn.QUERY, description = "Name of pdf template" ,required=true,schema=@Schema()) @Valid @RequestParam(value = "templateName") String templateName, String tenantId, @Parameter(in = ParameterIn.QUERY, description = "Filename for the generated PDF" ,schema=@Schema( defaultValue="document")) @Valid @RequestParam(value = "filename", required = false, defaultValue="document") String filename, HttpServletResponse response) {
        byte[] pdfBytes = pdfService.generatePdf(templateName, body.getData(), body.getRequestInfo(), tenantId);
        response.setContentType("application/pdf");
        response.setHeader("Content-Disposition", "attachment; filename=" + filename + ".pdf");
        try {
            response.getOutputStream().write(pdfBytes);
        } catch (IOException e) {
            throw new CustomException(ERROR_WHILE_GENERATING_PDF, e.getMessage());
        }
    }

    @RequestMapping(value = "/generate")
    public ResponseEntity<?> generatePdf( @Parameter(in = ParameterIn.DEFAULT, description = "JSON data with RequestInfo and pdf data", required=true, schema=@Schema()) @Valid @RequestBody PdfRequest body, @NotNull @Parameter(in = ParameterIn.QUERY, description = "Name of pdf template" ,required=true,schema=@Schema()) @Valid @RequestParam(value = "templateName") String templateName, String tenantId, @Parameter(in = ParameterIn.QUERY, description = "Filename for the generated PDF" ,schema=@Schema( defaultValue="document")) @Valid @RequestParam(value = "filename", required = false, defaultValue="document") String filename ) {
        byte[] pdfBytes = pdfService.generatePdf(templateName, body.getData(), body.getRequestInfo(), tenantId);

        return ResponseEntity.ok()
                .header("Content-Type", "application/pdf")
                .header("Content-Disposition", "attachment; filename=" + filename + ".pdf")
                .body(pdfBytes);
    }
}
