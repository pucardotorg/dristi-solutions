package org.pucar.dristi.util;

import lombok.extern.slf4j.Slf4j;
import org.apache.commons.lang3.StringUtils;
import org.egov.tracer.model.CustomException;
import org.pucar.dristi.web.models.Artifact;
import org.pucar.dristi.web.models.EvidenceRequest;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestTemplate;
import java.util.HashMap;
import org.pucar.dristi.config.Configuration;
import static org.pucar.dristi.config.ServiceConstants.*;

@Slf4j
@Component
public class UrlShortenerUtil {

	private final RestTemplate restTemplate;
	private final Configuration configs;

	@Autowired
	public UrlShortenerUtil(RestTemplate restTemplate, Configuration configs) {
		this.restTemplate = restTemplate;
		this.configs = configs;
	}

	public String getShortenedUrl(String url, String artifactNumber) {

		HashMap<String, String> body = new HashMap<>();
		body.put(URL, url);
		body.put(REFERENCE_ID, artifactNumber);
		StringBuilder builder = new StringBuilder(configs.getUrlShortnerHost());
		builder.append(configs.getUrlShortnerEndpoint());
		String res = restTemplate.postForObject(builder.toString(), body, String.class);

		if (StringUtils.isEmpty(res)) {
			log.error(URL_SHORTENING_ERROR_CODE, URL_SHORTENING_ERROR_MESSAGE + url);
			return url;
		} else
			return res;
	}

	public String createShortenedUrl(String tenantId, String artifactNumber) {

		try {
			String baseUrl = configs.getDomainUrl() + configs.getBaseUrl();

			// Build the final long URL with query parameters
			String longUrl = String.format(configs.getLongUrl(), baseUrl, tenantId, artifactNumber);

			// Return shortened version
			return getShortenedUrl(longUrl, artifactNumber);
		} catch (CustomException e) {
			log.error(URL_SHORTENING_ERROR_CODE + "{}", e.getMessage());
			throw new CustomException(URL_SHORTENING_ERROR_CODE, URL_SHORTENING_ERROR_MESSAGE + e.getMessage());
		}
	}

	public void expireTheUrl(EvidenceRequest evidenceRequest) {
		Artifact artifact = evidenceRequest.getArtifact();
		String url = artifact.getShortenedUrl();
		HashMap<String,String> body = new HashMap<>();
		body.put(URL,url);
		body.put(REFERENCE_ID, artifact.getArtifactNumber());
		StringBuilder builder = new StringBuilder(configs.getUrlShortnerHost());
		builder.append(configs.getUrlShortenerExpireEndpoint());
		String res = restTemplate.postForObject(builder.toString(), body, String.class);
	}


}