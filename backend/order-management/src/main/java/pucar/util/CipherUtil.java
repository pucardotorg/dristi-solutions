package pucar.util;

import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.core.io.Resource;
import org.springframework.stereotype.Component;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.io.InputStream;
import java.util.Base64;

@Component
@Slf4j
public class CipherUtil {

    private final ByteArrayMultipartFile multipartFileUtil;

    @Autowired
    public CipherUtil(ByteArrayMultipartFile multipartFileUtil) {
        this.multipartFileUtil = multipartFileUtil;
    }

    public String encodePdfToBase64(Resource resource) throws IOException {
        try (InputStream inputStream = resource.getInputStream()) {
            byte[] pdfBytes = inputStream.readAllBytes();
            return Base64.getEncoder().encodeToString(pdfBytes);
        }
    }

    public MultipartFile decodeBase64ToPdf(String base64) throws IOException {
        byte[] decodedBytes = Base64.getDecoder().decode(base64);




    }
}
