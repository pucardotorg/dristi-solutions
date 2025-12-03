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
    @Value("${pdf.scan.enabled:true}")
    private boolean pdfScanEnabled;

    @Value("${pdf.disallow.javascript:true}")
    private boolean pdfDisallowJavascript;

    @Value("${pdf.disallow.openaction:true}")
    private boolean pdfDisallowOpenAction;

    @Value("${pdf.disallow.aa:true}")
    private boolean pdfDisallowAA;

    @Value("${pdf.disallow.launch:true}")
    private boolean pdfDisallowLaunch;

    @Value("${pdf.disallow.embedded_files:true}")
    private boolean pdfDisallowEmbeddedFiles;

    @Value("${pdf.disallow.richmedia:true}")
    private boolean pdfDisallowRichMedia;

    @Value("${pdf.disallow.acroform_actions:true}")
    private boolean pdfDisallowAcroform;

    @Value("${pdf.disallow.file_attachments:true}")
    private boolean pdfDisallowFileAttachments;

    @Value("${pdf.disallow.encrypted:true}")
    private boolean pdfDisallowEncrypted;

    @Value("${pdf.disallow.xfa:true}")
    private boolean pdfDisallowXfa;

    @Value("${pdf.disallow.stream_javascript:true}")
    private boolean pdfDisallowStreamJavascript;

    @Value("${pdf.disallow.object_streams:true}")
    private boolean pdfDisallowObjectStreams;

    @Value("${pdf.disallow.xref_streams:true}")
    private boolean pdfDisallowXrefStreams;

    @Value("${pdf.disallow.suspicious_filters:true}")
    private boolean pdfDisallowSuspiciousFilters;

	@PostConstruct
	private void enrichKeysetForFormats() {
		allowedKeySet = allowedFormatsMap.keySet();
	}
}
