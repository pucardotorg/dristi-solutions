package pucar.util;

import lombok.extern.slf4j.Slf4j;
import org.springframework.core.io.Resource;
import org.springframework.stereotype.Component;

import java.io.IOException;
import java.io.InputStream;
import java.util.Base64;

@Component
@Slf4j
public class CypherUtil {


    // Convert PDF to Base64
    public static String encodePdfToBase64(Resource resource) throws IOException {
        try (InputStream inputStream = resource.getInputStream()) {
            byte[] pdfBytes = inputStream.readAllBytes();
            return Base64.getEncoder().encodeToString(pdfBytes);
        }
    }

    // Decode Base64 and save as PDF
    public static void decodeBase64ToPdf(String base64) throws IOException {
        byte[] decodedBytes = Base64.getDecoder().decode(base64);

    }
}
