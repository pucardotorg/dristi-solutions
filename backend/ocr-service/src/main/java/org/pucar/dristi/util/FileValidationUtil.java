package org.pucar.dristi.util;

import org.apache.tika.Tika;
import org.springframework.http.MediaType;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.Arrays;
import java.util.HashSet;
import java.util.Locale;
import java.util.Set;

public class FileValidationUtil {

    public static boolean isValidFile(MultipartFile file) {
        if (file == null || file.isEmpty()) {
            return false;
        }

        String originalFilename = file.getOriginalFilename();
        String ext = getExtension(originalFilename);
        if (ext == null || !ALLOWED_EXTENSIONS.contains(ext)) {
            return false;
        }

        String declaredContentType = file.getContentType();
        if (declaredContentType == null || !ALLOWED_MIME_TYPES.contains(declaredContentType)) {
            return false;
        }

        String detectedMime;
        try {
            detectedMime = TIKA.detect(file.getInputStream(), originalFilename);
        } catch (IOException e) {
            return false;
        }

        if (detectedMime == null || !ALLOWED_MIME_TYPES.contains(detectedMime)) {
            return false;
        }

        if (!isMimeExtensionCompatible(ext, detectedMime)) {
            return false;
        }

        if (!declaredContentType.equals(detectedMime)) {
            if (!("csv".equals(ext) &&
                    (("text/csv".equals(declaredContentType) && "text/plain".equals(detectedMime)) ||
                            ("text/plain".equals(declaredContentType) && "text/csv".equals(detectedMime))))) {
                return false;
            }
        }

        return true;
    }

    private static final Set<String> ALLOWED_EXTENSIONS = new HashSet<>(Arrays.asList(
            "pdf", "jpg", "jpeg", "png", "doc", "docx", "xls", "xlsx", "odt", "ods", "csv", "txt", "dxf"
    ));

    private static final Set<String> ALLOWED_MIME_TYPES = new HashSet<>(Arrays.asList(
            MediaType.IMAGE_JPEG_VALUE,
            MediaType.IMAGE_PNG_VALUE,
            MediaType.APPLICATION_PDF_VALUE,
            "application/vnd.oasis.opendocument.text",
            "application/vnd.oasis.opendocument.spreadsheet",
            "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
            "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            "application/msword",
            "application/vnd.ms-excel",
            "application/dxf",
            "image/vnd.dxf",
            "image/x-dxf",
            "text/csv",
            "text/plain"
    ));

    private static final Tika TIKA = new Tika();

    private static String getExtension(String filename) {
        if (filename == null) return null;
        int lastDot = filename.lastIndexOf('.') ;
        if (lastDot < 0 || lastDot == filename.length() - 1) return null;
        return filename.substring(lastDot + 1).toLowerCase(Locale.ROOT);
    }

    private static boolean isMimeExtensionCompatible(String ext, String mime) {
        switch (ext) {
            case "pdf":
                return "application/pdf".equals(mime);
            case "jpg":
            case "jpeg":
                return "image/jpeg".equals(mime);
            case "png":
                return "image/png".equals(mime);
            case "doc":
                return "application/msword".equals(mime);
            case "docx":
                return "application/vnd.openxmlformats-officedocument.wordprocessingml.document".equals(mime);
            case "xls":
                return "application/vnd.ms-excel".equals(mime);
            case "xlsx":
                return "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet".equals(mime);
            case "odt":
                return "application/vnd.oasis.opendocument.text".equals(mime);
            case "ods":
                return "application/vnd.oasis.opendocument.spreadsheet".equals(mime);
            case "csv":
                return "text/csv".equals(mime) || "text/plain".equals(mime);
            case "txt":
                return "text/plain".equals(mime);
            case "dxf":
                return "application/dxf".equals(mime) || "image/vnd.dxf".equals(mime) || "image/x-dxf".equals(mime);
            default:
                return false;
        }
    }
}
