package org.pucar.dristi.util;

import lombok.extern.slf4j.Slf4j;
import org.apache.tika.Tika;
import org.egov.tracer.model.CustomException;
import org.pucar.dristi.config.Configuration;
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

    private static final int BUFFER_SIZE = 8192;
    private final Tika tika;
    private final Configuration configuration;

    public CipherUtil(Tika tika, Configuration configuration) {
        this.tika = tika;
        this.configuration = configuration;
    }

    public String encodePdfToBase64(Resource resource) throws IOException {
        if (resource == null || !resource.exists() || !resource.isReadable()) {
            throw new IllegalArgumentException("Invalid or unreadable resource");
        }

        try (InputStream inputStream = resource.getInputStream()) {
            if (resource.contentLength() > configuration.getMaxFileSize()) {
                throw new CustomException("FILE_SIZE_EXCEEDED", "File size exceeds maximum allowed size of: " + configuration.getMaxFileSize());
            }

            ByteArrayOutputStream buffer = new ByteArrayOutputStream();
            byte[] data = new byte[BUFFER_SIZE];
            int bytesRead;
            long totalBytesRead = 0;

            while ((bytesRead = inputStream.read(data, 0, data.length)) != -1) {
                totalBytesRead += bytesRead;
                if (totalBytesRead > configuration.getMaxFileSize()) {
                    throw new CustomException("FILE_SIZE_EXCEEDED", "File size exceeds maximum allowed size of: " + configuration.getMaxFileSize());
                }
                buffer.write(data, 0, bytesRead);
            }

            byte[] fileBytes = buffer.toByteArray();
            validatePdfFile(fileBytes);
            return Base64.getEncoder().encodeToString(fileBytes);
        }
    }

    public MultipartFile decodeBase64ToPdf(String base64, String fileName) throws IOException {
        if (base64 == null || base64.trim().isEmpty()) {
            throw new CustomException("INVALID_BASE64_STRING", "Base64 string cannot be null or empty");
        }
        if (fileName == null || fileName.trim().isEmpty()) {
            throw new CustomException("INVALID_FILE_NAME", "File name cannot be null or empty");
        }

        try {
            byte[] decodedBytes = Base64.getDecoder().decode(base64);
            if (decodedBytes.length > configuration.getMaxFileSize()) {
                throw new CustomException("FILE_SIZE_EXCEEDED", "Decoded file size exceeds maximum allowed size of: " + configuration.getMaxFileSize());
            }
            validatePdfFile(decodedBytes);
            return new ByteArrayMultipartFile(fileName, decodedBytes);
        } catch (CustomException e) {
            throw e;
        } catch (Exception e) {
            throw new CustomException("INVALID_BASE64_OR_FILE_FORMAT", "Invalid Base64 string or file format: " + e.getMessage());
        }
    }

    private void validatePdfFile(byte[] fileData) {
        if (fileData == null || fileData.length == 0) {
            throw new CustomException("INVALID_FILE_DATA", "File data cannot be empty");
        }
        String mimeType = tika.detect(fileData);
        boolean isValidType = Arrays.stream(configuration.getAllowedContentTypes())
                .map(String::toLowerCase)
                .anyMatch(mime -> mime.equals(mimeType));

        if (!isValidType) {
            throw new CustomException("INVALID_FILE_TYPE", "Invalid file type. Only PDF files are allowed. Detected type: " + mimeType);
        }
    }
}
