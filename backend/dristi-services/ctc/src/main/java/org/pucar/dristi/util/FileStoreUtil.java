package org.pucar.dristi.util;

import lombok.extern.slf4j.Slf4j;
import org.apache.pdfbox.Loader;
import org.apache.pdfbox.pdmodel.PDDocument;
import org.apache.pdfbox.pdmodel.PDPage;
import org.apache.pdfbox.pdmodel.PDPageContentStream;
import org.apache.pdfbox.pdmodel.common.PDRectangle;
import org.apache.pdfbox.pdmodel.graphics.image.LosslessFactory;
import org.apache.pdfbox.pdmodel.graphics.image.PDImageXObject;
import org.egov.tracer.model.CustomException;
import org.json.JSONObject;
import org.pucar.dristi.config.Configuration;
import org.pucar.dristi.repository.ServiceRequestRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.core.io.Resource;
import org.springframework.http.*;
import org.springframework.stereotype.Component;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.multipart.MultipartFile;

import javax.imageio.ImageIO;
import java.awt.image.BufferedImage;
import java.io.ByteArrayInputStream;
import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.util.List;

import static org.pucar.dristi.config.ServiceConstants.*;


@Component
@Slf4j
public class FileStoreUtil {

    private final Configuration configs;

    private final RestTemplate restTemplate;

    private final ServiceRequestRepository repository;

    @Autowired
    public FileStoreUtil(RestTemplate restTemplate, Configuration configs, ServiceRequestRepository repository) {
        this.restTemplate = restTemplate;
        this.configs = configs;
        this.repository = repository;
    }

    /**
     * Returns whether the file exists or not in the filestore.
     *
     * @param tenantId
     * @param fileStoreId
     * @return
     */
    public boolean doesFileExist(String tenantId, String fileStoreId) {
        boolean fileExists = false;
        try {
            StringBuilder uri = new StringBuilder(configs.getFileStoreHost()).append(configs.getFileStorePath());
            uri.append("tenantId=").append(tenantId).append("&").append("fileStoreId=").append(fileStoreId);
            ResponseEntity<String> responseEntity = restTemplate.getForEntity(uri.toString(), String.class);
            fileExists = responseEntity.getStatusCode().equals(HttpStatus.OK);
        } catch (Exception e) {
            log.error("Document {} is not found in the Filestore for tenantId {} ! An exception occurred!",
                    fileStoreId,
                    tenantId,
                    e);
        }
        return fileExists;
    }

    /**
     * Downloads a file from file store and returns its content as byte array.
     *
     * @param tenantId    tenant id
     * @param fileStoreId file store id of the file
     * @return byte array of the file content, or null if download fails
     */
    public byte[] fetchFileAsBytes(String tenantId, String fileStoreId) {
        try {
            StringBuilder uri = new StringBuilder(configs.getFileStoreHost()).append(configs.getFileStorePath());
            uri.append("tenantId=").append(tenantId).append("&").append("fileStoreId=").append(fileStoreId);
            ResponseEntity<byte[]> responseEntity = restTemplate.getForEntity(uri.toString(), byte[].class);
            if (responseEntity.getStatusCode().equals(HttpStatus.OK) && responseEntity.getBody() != null) {
                return responseEntity.getBody();
            }
            log.error("FileStore returned status {} for fileStoreId: {}", responseEntity.getStatusCode(), fileStoreId);
        } catch (Exception e) {
            log.error("Error downloading file from filestore. fileStoreId: {}, tenantId: {}", fileStoreId, tenantId, e);
        }
        return null;
    }

    /**
     * Counts the number of pages in a document.
     * Supports PDF files (counts pages) and Image files (counts as 1 page).
     *
     * @param fileContent byte array of the file
     * @return number of pages, or 0 if the content is not a valid PDF or Image
     */
    public int countPages(byte[] fileContent) {
        if (fileContent == null || fileContent.length == 0) {
            return 0;
        }

        // 1. Try to read as PDF
        try (PDDocument document = Loader.loadPDF(fileContent)) {
            int pages = document.getNumberOfPages();
            log.info("PDF page count: {}", pages);
            return pages;
        } catch (Exception e) {
            log.debug("Not a valid PDF, checking if it is an image...");
        }

        // 2. Try to read as Image
        try (java.io.ByteArrayInputStream inputStream = new java.io.ByteArrayInputStream(fileContent)) {
            java.awt.image.BufferedImage image = javax.imageio.ImageIO.read(inputStream);
            if (image != null) {
                log.info("Image detected, counting as 1 page.");
                return 1;
            }
        } catch (Exception e) {
            log.error("Not a valid image either.");
        }

        log.error("File is neither a valid PDF nor a valid image. Returning 0 pages.");
        return 0;
    }

    /**
     * Fetches all files by their file store IDs and returns the total page count across all PDFs and images.
     * Files that fail to download or are unrecognized are skipped (counted as 0 pages).
     *
     * @param tenantId     tenant id
     * @param fileStoreIds list of file store ids
     * @return total page count across all files
     */
    public int getTotalPageCount(String tenantId, List<String> fileStoreIds) {
        if (fileStoreIds == null || fileStoreIds.isEmpty()) {
            return 0;
        }
        int totalPages = 0;
        for (String fileStoreId : fileStoreIds) {
            byte[] fileContent = fetchFileAsBytes(tenantId, fileStoreId);
            int pages = countPages(fileContent);
            log.info("FileStoreId: {} has {} pages", fileStoreId, pages);
            totalPages += pages;
        }
        log.info("Total page count across {} files: {}", fileStoreIds.size(), totalPages);
        return totalPages;
    }

    public void deleteFilesByFileStore(List<String> fileStoreIds, String tenantId) {
        if (fileStoreIds == null || fileStoreIds.isEmpty()) {
            log.error("No file store IDs provided for deletion");
            return;
        }
        String url = configs.getFileStoreHost() + configs.getFileStoreDeleteEndPoint() + "?tenantId=" + tenantId;

        MultiValueMap<String, Object> body = new LinkedMultiValueMap<>();
        body.add("fileStoreIds", String.join(",", fileStoreIds));
        body.add("isSoftDelete", false);

        HttpEntity<MultiValueMap<String, Object>> requestEntity = new HttpEntity<>(body, new HttpHeaders());
        Object response = null;
        try {
            ResponseEntity<Object> responseEntity = restTemplate.postForEntity(url, requestEntity, Object.class);
            log.info("Files deleted from filestore: {}, status: {}", fileStoreIds, responseEntity.getStatusCode());
        } catch (CustomException e) {
            log.error("Error while deleting files from file store: {}", e.getMessage(), e);
            throw new CustomException("FILE_STORE_UTILITY_EXCEPTION", "Error occurred when deleting files in File Store");
        }
    }

    public Resource fetchFileStoreObjectById(String fileStoreId, String tenantId) {
        if (fileStoreId == null || tenantId == null) {
            throw new CustomException(INVALID_INPUT, "Invalid fileStoreId or tenantId");
        }
        StringBuilder uri = new StringBuilder();
        uri.append(configs.getFileStoreHost()).append(configs.getFileStoreSearchEndpoint());
        uri.append("?fileStoreId=").append(fileStoreId).append("&tenantId=").append(tenantId);
        try {
            return repository.fetchResultGetForResource(uri);
        } catch (Exception e) {
            throw new CustomException(FILE_STORE_SERVICE_EXCEPTION_CODE, FILE_STORE_SERVICE_EXCEPTION_MESSAGE);
        }
    }

    public String storeFileInFileStore(MultipartFile file, String tenantId) {
        String module = "signed";
        StringBuilder uri = new StringBuilder();
        uri.append(configs.getFileStoreHost()).append(configs.getFileStoreSaveEndPoint());

        MultiValueMap<String, Object> request = new LinkedMultiValueMap<>();
        request.add("file", file.getResource());
        request.add("tenantId", tenantId);
        request.add("module", module);
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.MULTIPART_FORM_DATA);

        HttpEntity<MultiValueMap<String, Object>> entity = new HttpEntity<>(request, headers);
        ResponseEntity<String> response = restTemplate.exchange(uri.toString(), HttpMethod.POST, entity, String.class);
        String body = response.getBody();
        JSONObject jsonObject = new JSONObject(body);
        JSONObject fileObject = jsonObject.getJSONArray("files").getJSONObject(0);
        return fileObject.getString("fileStoreId");
    }

    public String mergeFiles(String fileStoreId1, String fileStoreId2, String tenantId) {

        log.info("Merging files: {} and {} for tenant: {}", fileStoreId1, fileStoreId2, tenantId);

        byte[] file1Bytes = fetchFileAsBytes(tenantId, fileStoreId1);
        byte[] file2Bytes = fetchFileAsBytes(tenantId, fileStoreId2);

        if (file1Bytes == null || file2Bytes == null) {
            throw new CustomException(FILE_STORE_UTILITY_EXCEPTION,
                    "Failed to download one or both files for merging");
        }

        try (PDDocument doc1 = loadDocument(file1Bytes);
             PDDocument doc2 = loadDocument(file2Bytes);
             ByteArrayOutputStream output = new ByteArrayOutputStream()) {

            for (PDPage page : doc2.getPages()) {
                doc1.importPage(page);
            }

            doc1.save(output);

            byte[] mergedBytes = output.toByteArray();

            ByteArrayMultipartFile mergedFile =
                    new ByteArrayMultipartFile("MergedCtcDocument.pdf", mergedBytes);

            String mergedFileStoreId = storeFileInFileStore(mergedFile, tenantId);

            log.info("Merged PDF uploaded to filestore, fileStoreId: {}", mergedFileStoreId);

            return mergedFileStoreId;

        } catch (IOException e) {
            log.error("Error merging files", e);
            throw new CustomException(FILE_STORE_UTILITY_EXCEPTION,
                    "Error merging files: " + e.getMessage());
        }
    }


    private PDDocument convertImageToPdf(byte[] imageBytes) throws IOException {

        BufferedImage image = ImageIO.read(new ByteArrayInputStream(imageBytes));

        if (image == null) {
            throw new IOException("Unsupported image format");
        }

        PDDocument document = new PDDocument();

        PDPage page = new PDPage(new PDRectangle(image.getWidth(), image.getHeight()));
        document.addPage(page);

        PDImageXObject pdImage = LosslessFactory.createFromImage(document, image);

        try (PDPageContentStream contentStream = new PDPageContentStream(document, page)) {
            contentStream.drawImage(pdImage, 0, 0);
        }

        return document;
    }
    private PDDocument loadDocument(byte[] fileBytes) throws IOException {

        if (isPdf(fileBytes)) {
            return Loader.loadPDF(fileBytes);
        }

        log.info("File is not PDF. Converting image to PDF");

        return convertImageToPdf(fileBytes);
    }

    private boolean isPdf(byte[] file) {

        return file.length > 4 &&
                file[0] == '%' &&
                file[1] == 'P' &&
                file[2] == 'D' &&
                file[3] == 'F';
    }


}
