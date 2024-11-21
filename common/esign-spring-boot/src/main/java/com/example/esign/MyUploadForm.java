package com.example.esign;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.web.multipart.MultipartFile;


@Data
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class MyUploadForm {

    private String authType;
    private String consent;
    private String aadhar;
    private String xml;

    // Upload files.
    private MultipartFile fileDatas;
}
