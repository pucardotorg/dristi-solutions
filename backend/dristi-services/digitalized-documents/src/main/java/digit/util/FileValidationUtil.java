package digit.util;

import org.springframework.http.MediaType;
import org.springframework.web.multipart.MultipartFile;

public class FileValidationUtil {

    public static boolean isValidFile(MultipartFile file) {
        String contentType = file.getContentType();
        return contentType != null && (
                contentType.equals(MediaType.IMAGE_JPEG_VALUE) ||
                        contentType.equals(MediaType.IMAGE_PNG_VALUE) ||
                        contentType.equals(MediaType.APPLICATION_PDF_VALUE) ||
                        "application/vnd.oasis.opendocument.text".equals(contentType) ||
                        "application/vnd.oasis.opendocument.spreadsheet".equals(contentType) ||
                        "application/vnd.openxmlformats-officedocument.wordprocessingml.document".equals(contentType) ||
                        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet".equals(contentType) ||
                        "application/msword".equals(contentType) ||
                        "application/vnd.ms-excel".equals(contentType) ||
                        "application/dxf".equals(contentType) ||
                        "text/csv".equals(contentType) ||
                        "text/plain".equals(contentType)
        );
    }
}
