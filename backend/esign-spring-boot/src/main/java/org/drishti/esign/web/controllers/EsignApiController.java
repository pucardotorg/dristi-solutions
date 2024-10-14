package org.drishti.esign.web.controllers;


import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.enums.ParameterIn;
import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpSession;
import jakarta.validation.Valid;
import lombok.extern.slf4j.Slf4j;
import org.drishti.esign.service.ESignService;
import org.drishti.esign.util.ResponseInfoFactory;
import org.drishti.esign.web.models.*;
import org.egov.common.contract.request.RequestInfo;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.*;


@jakarta.annotation.Generated(value = "org.egov.codegen.SpringBootCodegen", date = "2024-06-19T13:37:37.165763478+05:30[Asia/Kolkata]")
@Controller
@RequestMapping("")
@Slf4j
public class EsignApiController {

    private final ESignService eSignService;

    @Autowired
    public EsignApiController(ESignService eSignService) {
        this.eSignService = eSignService;
    }

    @PostMapping("/v1/_esign")
    public ResponseEntity<ESignResponse> eSignDoc(@Parameter(in = ParameterIn.DEFAULT, description = "ESign Doc Details and Request Info", required = true, schema = @Schema()) @Valid @RequestBody ESignRequest request) {
        log.info("api=/v1/_esign, result = IN_PROGRESS");
        ESignXmlForm eSignXmlForm = eSignService.signDoc(request);
        ESignResponse response = ESignResponse.builder().responseInfo(ResponseInfoFactory.createResponseInfoFromRequestInfo(request.getRequestInfo(), true))
                .eSignForm(eSignXmlForm).build();
        log.info("api=/v1/_esign, result = SUCCESS");
        return ResponseEntity.accepted().body(response);
    }


    @PostMapping("/v1/_signed")
    public ResponseEntity<String> eSignDOC(@Parameter(in = ParameterIn.DEFAULT, description = "ESign Doc Details and Request Info", required = true, schema = @Schema()) @Valid @RequestBody SignDocRequest request) {
        log.info("api=/v1/_signed, result = IN_PROGRESS");
        String fileStoreId = eSignService.signDocWithDigitalSignature(request);
        log.info("api=/v1/_signed, result = SUCCESS");
        return ResponseEntity.accepted().body(fileStoreId);
    }


    @RequestMapping(value = "/esign-its")
    public String uploadOneFileHandler(Model model) {
        Form form = new Form();
        model.addAttribute("myUploadForm", form);
        return "uploadOneFile";
    }


    @PostMapping(value = "/esign")
    @ResponseBody
    public ESignXmlForm esignRequest(@ModelAttribute @Valid Form myUploadForm, Model model) {

        ESignRequest request = ESignRequest.builder().requestInfo(new RequestInfo())
                .eSignParameter(ESignParameter.builder().fileStoreId(myUploadForm.getFilestoreId())
                        .tenantId("kl").build()).build();
        ESignXmlForm eSignXmlForm = eSignService.signDoc(request);
        log.info("transaction Id : {}",eSignXmlForm.getAspTxnID());
        return eSignXmlForm;
    }

    @PostMapping(value = "/redirect")
    public void redirectRequest(@RequestParam("eSignResponse") String response, @RequestParam("espTxnID") String espId) {

        log.info("E-Sign Response : {}",response);

        int firstHyphenIndex = espId.indexOf("-");
        int secondHyphenIndex = espId.indexOf("-", firstHyphenIndex + 1);
        log.info("calculating tenantId,pageModule,fileStore id");
        String fileStoreId = espId.substring(secondHyphenIndex + 1);
        SignDocRequest request =SignDocRequest.builder()
                .requestInfo(new RequestInfo()).eSignParameter(SignDocParameter.builder()
                        .fileStoreId(fileStoreId)
                        .response(response)
                        .tenantId("kl").build()).build();
        String signedFileStoreId = eSignService.signDocWithDigitalSignature(request);

        log.info("file after sign :{}",signedFileStoreId);
    }


}


