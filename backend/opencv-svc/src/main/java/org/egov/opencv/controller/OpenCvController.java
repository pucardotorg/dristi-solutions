package org.egov.opencv.controller;

import org.egov.common.contract.request.RequestInfo;
import org.egov.opencv.model.FileReadableResponse;
import org.egov.opencv.service.ImageValidationService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;

@jakarta.annotation.Generated(value = "org.egov.codegen.SpringBootCodegen", date = "2024-04-18T11:14:50.003326400+05:30[Asia/Calcutta]")
@Controller
@RequestMapping("")
public class OpenCvController {

    private final ImageValidationService imageValidationService;

    @Autowired
    public OpenCvController(ImageValidationService imageValidationService) {
        this.imageValidationService = imageValidationService;
    }

    @RequestMapping(value = "/v1/check-readability", method = RequestMethod.POST)
    public FileReadableResponse checkFileReadability(@RequestParam("file") MultipartFile file,
                                                     @RequestBody RequestInfo requestInfo) throws IOException {
        FileReadableResponse response = new FileReadableResponse();
        imageValidationService.validateImage(file, response);
        return response;
    }

}
