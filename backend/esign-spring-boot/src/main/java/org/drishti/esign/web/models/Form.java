package org.drishti.esign.web.models;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.web.multipart.MultipartFile;

@Data
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class Form {

    private String authType;
    private String consent;
    private String aadhar;
    private String xml;

    // Upload files.
   private String filestoreId;
}
