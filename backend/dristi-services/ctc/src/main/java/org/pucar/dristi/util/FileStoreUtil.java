package org.pucar.dristi.util;

import lombok.extern.slf4j.Slf4j;
import org.apache.pdfbox.Loader;
import org.apache.pdfbox.pdmodel.PDDocument;
import org.egov.tracer.model.CustomException;
import org.pucar.dristi.config.Configuration;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Component;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.web.client.RestTemplate;

import java.util.List;


@Component
@Slf4j
public class FileStoreUtil {

    private Configuration configs;

    private RestTemplate restTemplate;

    @Autowired
    public FileStoreUtil(RestTemplate restTemplate, Configuration configs) {
        this.restTemplate = restTemplate;
        this.configs = configs;
    }

    /**
     * Returns whether the file exists or not in the filestore.
     * @param tenantId
     * @param fileStoreId
     * @return
     */
    public boolean doesFileExist(String tenantId,  String fileStoreId) {
    		boolean fileExists = false;
        try{
            StringBuilder uri = new StringBuilder(configs.getFileStoreHost()).append(configs.getFileStorePath());
            uri.append("tenantId=").append(tenantId).append("&").append("fileStoreId=").append(fileStoreId);
            ResponseEntity<String> responseEntity= restTemplate.getForEntity(uri.toString(), String.class);
            fileExists = responseEntity.getStatusCode().equals(HttpStatus.OK);
        }catch (Exception e){
        		log.error("Document {} is not found in the Filestore for tenantId {} ! An exception occurred!", 
        			  fileStoreId, 
        			  tenantId, 
        			  e);
        }
        return fileExists;
    }

    /**
     * Downloads a file from file store and returns its content as byte array.
     * @param tenantId tenant id
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
     * Counts the number of pages in a PDF file.
     * @param fileContent byte array of the PDF file
     * @return number of pages, or 0 if the content is not a valid PDF
     */
    public int countPdfPages(byte[] fileContent) {
        if (fileContent == null || fileContent.length == 0) {
            return 0;
        }
        try (PDDocument document = Loader.loadPDF(fileContent)) {
            int pages = document.getNumberOfPages();
            log.info("PDF page count: {}", pages);
            return pages;
        } catch (Exception e) {
            log.error("Error counting PDF pages: {}", e.getMessage(), e);
            return 0;
        }
    }

    /**
     * Fetches all files by their file store IDs and returns the total page count across all PDFs.
     * Non-PDF files or files that fail to download are skipped (counted as 0 pages).
     * @param tenantId tenant id
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
            int pages = countPdfPages(fileContent);
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
}
