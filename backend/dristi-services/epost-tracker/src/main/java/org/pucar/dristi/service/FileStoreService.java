package org.pucar.dristi.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.pucar.dristi.config.EPostConfiguration;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.util.UriComponentsBuilder;

import java.net.URI;
import java.util.List;
import java.util.Map;

@Service
@Slf4j
@RequiredArgsConstructor
public class FileStoreService {

    private final EPostConfiguration config;
    private final RestTemplate restTemplate = new RestTemplate();

    public String upload(byte[] content, String fileName, String contentType, String tenantId) {
        try {
            String url = config.getFileStoreHost() + config.getFileStoreSaveEndPoint();
            URI uri = UriComponentsBuilder.fromHttpUrl(url)
                    .queryParam("tenantId", tenantId)
                    .queryParam("module", config.getFileStoreModule())
                    .build(true)
                    .toUri();

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.MULTIPART_FORM_DATA);

            MultiValueMap<String, Object> body = new LinkedMultiValueMap<>();
            // Build file part
            body.add("file", new ByteArrayResourceWithFilename(content, fileName, contentType));

            HttpEntity<MultiValueMap<String, Object>> requestEntity = new HttpEntity<>(body, headers);

            ResponseEntity<Map> response = restTemplate.postForEntity(uri, requestEntity, Map.class);

            if (response.getStatusCode().is2xxSuccessful() && response.getBody() != null) {
                Map<String, Object> bodyMap = response.getBody();
                Object filesObj = bodyMap.get("files");
                if (filesObj instanceof List<?> list && !list.isEmpty()) {
                    Object first = list.get(0);
                    if (first instanceof Map<?, ?> fm) {
                        Object fsId = fm.get("fileStoreId");
                        if (fsId != null) {
                            return String.valueOf(fsId);
                        }
                    }
                }
            }
            log.error("Filestore upload failed: status={}, body={}", response.getStatusCode(), response.getBody());
            return null;
        } catch (Exception e) {
            log.error("Exception uploading to filestore: {}", e.getMessage(), e);
            return null;
        }
    }

    // Helper ByteArrayResource that preserves filename and content type
    static class ByteArrayResourceWithFilename extends org.springframework.core.io.ByteArrayResource {
        private final String filename;
        private final String contentType;

        public ByteArrayResourceWithFilename(byte[] byteArray, String filename, String contentType) {
            super(byteArray);
            this.filename = filename;
            this.contentType = contentType;
        }

        @Override
        public String getFilename() {
            return this.filename;
        }

        @Override
        public long contentLength() {
            return this.getByteArray().length;
        }

        @Override
        public String getDescription() {
            return "Byte array resource [" + filename + "]";
        }
    }
}
