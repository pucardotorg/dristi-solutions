package org.egov.filestore.config;

import java.util.List;
import java.util.Map;
import java.util.Set;


import jakarta.annotation.PostConstruct;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;

import lombok.Getter;

@Configuration
@Getter
public class FileStoreConfig {

	@Value("${image.charset.type}")
	private String imageCharsetType;
	
	@Value("#{${allowed.formats.map}}")
	private Map<String,List<String>> allowedFormatsMap;
	
	private Set<String> allowedKeySet;
	
	@Value("${image.small}")
	private String _small;

	@Value("${image.medium}")
	private String _medium;

	@Value("${image.large}")
	private String _large;
	
	@Value("${image.small.width}")
	private Integer smallWidth;

	@Value("${image.medium.width}")
	private Integer mediumWidth;

	@Value("${image.large.width}")
	private Integer largeWidth;
	
	@Value("${presigned.url.expiry.time.in.secs}")
	private Integer preSignedUrlTimeOut;
	
	@Value("#{'${image.formats}'.split(',')}") 
	private List<String> imageFormats;

	@Value("${max.file.size}")
	private Long fileSizeMax;

    // PDF security scanning flags
    @Value("${pdf.scan.enabled:false}")
    private boolean pdfScanEnabled;

    @Value("${pdf.disallow.javascript:false}")
    private boolean pdfDisallowJavascript;

    @Value("${pdf.disallow.openaction:false}")
    private boolean pdfDisallowOpenAction;

    @Value("${pdf.disallow.aa:false}")
    private boolean pdfDisallowAA;

    @Value("${pdf.disallow.launch:false}")
    private boolean pdfDisallowLaunch;

    @Value("${pdf.disallow.embedded_files:false}")
    private boolean pdfDisallowEmbeddedFiles;

    @Value("${pdf.disallow.richmedia:false}")
    private boolean pdfDisallowRichMedia;

    @Value("${pdf.disallow.acroform_actions:false}")
    private boolean pdfDisallowAcroform;

    @Value("${pdf.disallow.file_attachments:false}")
    private boolean pdfDisallowFileAttachments;

    @Value("${pdf.disallow.encrypted:false}")
    private boolean pdfDisallowEncrypted;

    @Value("${pdf.disallow.xfa:false}")
    private boolean pdfDisallowXfa;

    @Value("${pdf.disallow.stream_javascript:false}")
    private boolean pdfDisallowStreamJavascript;

    @Value("${pdf.disallow.object_streams:false}")
    private boolean pdfDisallowObjectStreams;

    @Value("${pdf.disallow.xref_streams:false}")
    private boolean pdfDisallowXrefStreams;

    @Value("${pdf.disallow.suspicious_filters:false}")
    private boolean pdfDisallowSuspiciousFilters;

    // ClamAV virus scanning configuration
    @Value("${clamav.host:localhost}")
    private String clamavHost;

    @Value("${clamav.port:3310}")
    private String clamavPort;

    @Value("${clamav.enabled:false}")
    private boolean clamavEnabled;

	@PostConstruct
	private void enrichKeysetForFormats() {
		allowedKeySet = allowedFormatsMap.keySet();
	}
}
