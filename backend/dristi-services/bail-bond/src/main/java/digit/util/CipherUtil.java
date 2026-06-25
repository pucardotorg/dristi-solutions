package digit.util;

import digit.config.Configuration;
import lombok.extern.slf4j.Slf4j;
import org.apache.tika.Tika;
import org.egov.tracer.model.CustomException;
import org.springframework.core.io.Resource;
import org.springframework.stereotype.Component;
import org.springframework.web.multipart.MultipartFile;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.io.InputStream;
import java.util.Arrays;
import java.util.Base64;


@Component
@Slf4j
public class CipherUtil {

    private static final int BUFFER_SIZE = 8192; // 8KB buffer for streaming
    private final Tika tika;
    private final Configuration configuration;

    public CipherUtil(Tika tika, Configuration configuration) {
        this.tika = tika;
        this.configuration = configuration;
    }

    /**
     * Encodes a PDF file to Base64 string with validation
     * @param resource The PDF file resource to encode
     * @return Base64 encoded string of the PDF
     * @throws IOException If there's an error reading the file
     * @throws IllegalArgumentException If the file is not a valid PDF or exceeds size limit
     */
    public String encodePdfToBase64(Resource resource) throws IOException {
        if (resource == null || !resource.exists() || !resource.isReadable()) {
            throw new IllegalArgumentException("Invalid or unreadable resource");
        }

        try (InputStream inputStream = resource.getInputStream()) {
            // Check file size first
            if (resource.contentLength() > configuration.getMaxFileSize()) {
                throw new CustomException("FILE_SIZE_EXCEEDED","File size exceeds maximum allowed size of: " + configuration.getMaxFileSize());
            }

            // Read file in chunks for memory efficiency
            ByteArrayOutputStream buffer = new ByteArrayOutputStream();
            byte[] data = new byte[BUFFER_SIZE];
            int bytesRead;
            long totalBytesRead = 0;

            while ((bytesRead = inputStream.read(data, 0, data.length)) != -1) {
                totalBytesRead += bytesRead;
                if (totalBytesRead > configuration.getMaxFileSize()) {
                    throw new CustomException("FILE_SIZE_EXCEEDED","File size exceeds maximum allowed size of: " + configuration.getMaxFileSize());
                }
                buffer.write(data, 0, bytesRead);
            }

            byte[] fileBytes = buffer.toByteArray();

            // Validate file type
            validatePdfFile(fileBytes);

            return Base64.getEncoder().encodeToString(fileBytes);
        }
    }

    /**
     * Decodes a Base64 string to a MultipartFile with validation
     * @param base64 The Base64 encoded PDF string
     * @param fileName The name to give to the output file
     * @return MultipartFile containing the decoded PDF
     * @throws IOException If there's an error processing the file
     * @throws IllegalArgumentException If the input is not a valid PDF or exceeds size limit
     */
    public MultipartFile decodeBase64ToPdf(String base64, String fileName) throws IOException {
        if (base64 == null || base64.trim().isEmpty()) {
            throw new CustomException("INVALID_BASE64_STRING","Base64 string cannot be null or empty");
        }

        if (fileName == null || fileName.trim().isEmpty()) {
            throw new CustomException("INVALID_FILE_NAME","File name cannot be null or empty");
        }

        byte[] decodedBytes;
        try {
            // Decode and validate size before processing
            decodedBytes = Base64.getDecoder().decode(base64);
            if (decodedBytes.length > configuration.getMaxFileSize()) {
                throw new CustomException("FILE_SIZE_EXCEEDED","DecodedFile size exceeds maximum allowed size of: " + configuration.getMaxFileSize());
            }

            // Validate file type
            validatePdfFile(decodedBytes);

            return new ByteArrayMultipartFile(fileName, decodedBytes);

        } catch (Exception e) {
            throw new CustomException("Invalid Base64 string or file format.", e.getMessage());
        }
    }

    /**
     * Validates that the file data represents a valid PDF
     * @param fileData The file data to validate
     * @throws IllegalArgumentException If the file is not a valid PDF
     */
    private void validatePdfFile(byte[] fileData) {
        if (fileData == null || fileData.length == 0) {
            throw new CustomException("INVALID_FILE_DATA","File data cannot be empty");
        }

        String mimeType = tika.detect(fileData);
        boolean isValidType = Arrays.stream(configuration.getAllowedContentTypes())
                .map(String::toLowerCase)
                .anyMatch(mime -> mime.equals(mimeType));

        if (!isValidType) {
            throw new CustomException("INVALID_FILE_TYPE","Invalid file type. Only PDF files are allowed. Detected type: " + mimeType);
        }
    }
}
