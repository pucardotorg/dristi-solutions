package org.egov.filestore.validator;

import java.io.IOException;
import java.io.InputStream;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.apache.commons.io.FilenameUtils;
import org.apache.commons.io.IOUtils;
import org.apache.tika.Tika;
import org.egov.filestore.config.FileStoreConfig;
import org.egov.filestore.domain.model.Artifact;
import org.egov.tracer.model.CustomException;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;
import org.springframework.web.multipart.MultipartFile;

@Component
@Slf4j
public class StorageValidator {

	private final FileStoreConfig fileStoreConfig;
    private final ClamAVValidator clamAVValidator;

	
	@Autowired
	public StorageValidator(FileStoreConfig fileStoreConfig, ClamAVValidator clamAVValidator) {
        this.fileStoreConfig = fileStoreConfig;
        this.clamAVValidator = clamAVValidator;
    }

	private static final Map<String, byte[]> MAGIC_NUMBERS = new HashMap<>();

	static {
		MAGIC_NUMBERS.put("pdf", new byte[]{0x25, 0x50, 0x44, 0x46});
		MAGIC_NUMBERS.put("jpeg", new byte[]{(byte) 0xFF, (byte) 0xD8, (byte) 0xFF, (byte) 0xE0});
		MAGIC_NUMBERS.put("png", new byte[]{(byte) 0x89, 0x50, 0x4E, 0x47});
		MAGIC_NUMBERS.put("gif", new byte[]{0x47, 0x49, 0x46, 0x38});
		MAGIC_NUMBERS.put("zip", new byte[]{0x50, 0x4B, 0x03, 0x04});
		MAGIC_NUMBERS.put("mp4", new byte[]{0x00, 0x00, 0x00, 0x18, 0x66, 0x74, 0x79, 0x70, 0x6D, 0x70, 0x34, 0x32});
		MAGIC_NUMBERS.put("mov", new byte[]{0x00, 0x00, 0x00, 0x14, 0x66, 0x74, 0x79, 0x70, 0x71, 0x74});
	}

	public void validate(Artifact artifact) {
			
		String extension = (FilenameUtils.getExtension(artifact.getMultipartFile().getOriginalFilename())).toLowerCase();
		validateFileExtention(extension);
		validateContentType(artifact, extension);
		validateInputContentType(artifact);
		if ("pdf".equals(extension) && fileStoreConfig.isPdfScanEnabled()) {
			validatePdfSecurity(artifact);
		}
		validateMagicNumber(artifact.getMultipartFile(), extension);
		validateFileSize(artifact.getMultipartFile());
        validateVirusScan(artifact);
    }

    private void validateVirusScan(Artifact artifact) {
        try {
            boolean safe = clamAVValidator.isFileSafe(artifact.getMultipartFile().getInputStream());
            if (!safe) {
                throw new CustomException("EG_FILESTORE_VIRUS_FOUND", "File contains a virus");
            }
        } catch (IOException e) {
            throw new RuntimeException(e);
        }
    }

    private void validateFileExtention(String extension) {
		if(!fileStoreConfig.getAllowedFormatsMap().containsKey(extension)) {
			throw new CustomException("EG_FILESTORE_INVALID_INPUT","Inalvid input provided for file : " + extension + ", please upload any of the allowed formats : " + fileStoreConfig.getAllowedKeySet());
		}
	}
	
	private void validateContentType(Artifact artifact, String extension) {
		String detectedMime = null;
		Tika tika = new Tika();
		try (InputStream is = artifact.getMultipartFile().getInputStream()) {
			detectedMime = tika.detect(is, artifact.getMultipartFile().getOriginalFilename());
		} catch (IOException e) {
			throw new CustomException("EG_FILESTORE_PARSING_ERROR","not able to parse the input please upload a proper file of allowed type : " + e.getMessage());
		}

		if (!fileStoreConfig.getAllowedFormatsMap().get(extension).contains(detectedMime)) {
			throw new CustomException("EG_FILESTORE_INVALID_INPUT", "Inalvid input provided for file, the extension does not match the file format. Please upload any of the allowed formats : "
					+ fileStoreConfig.getAllowedKeySet());
		}
	}

	private void validatePdfSecurity(Artifact artifact) {
		try {
			PdfSecurityScanner.Result r = PdfSecurityScanner.scan(artifact.getMultipartFile());
			if (fileStoreConfig.isPdfDisallowJavascript() && r.hasJavaScript()) {
				throw new CustomException("EG_FILESTORE_PDF_UNSAFE", "PDF contains JavaScript actions which are disallowed");
			}
			if (fileStoreConfig.isPdfDisallowOpenAction() && r.hasOpenAction()) {
				throw new CustomException("EG_FILESTORE_PDF_UNSAFE", "PDF contains OpenAction which is disallowed");
			}
			if (fileStoreConfig.isPdfDisallowAA() && r.hasAA()) {
				throw new CustomException("EG_FILESTORE_PDF_UNSAFE", "PDF contains additional actions (AA) which are disallowed");
			}
			if (fileStoreConfig.isPdfDisallowLaunch() && r.hasLaunch()) {
				throw new CustomException("EG_FILESTORE_PDF_UNSAFE", "PDF contains Launch actions which are disallowed");
			}
			if (fileStoreConfig.isPdfDisallowEmbeddedFiles() && r.hasEmbeddedFiles()) {
				throw new CustomException("EG_FILESTORE_PDF_UNSAFE", "PDF contains embedded files which are disallowed");
			}
			if (fileStoreConfig.isPdfDisallowRichMedia() && r.hasRichMedia()) {
				throw new CustomException("EG_FILESTORE_PDF_UNSAFE", "PDF contains RichMedia which is disallowed");
			}
			if (fileStoreConfig.isPdfDisallowAcroform() && r.hasAcroForm() &&
					(r.hasJavaScript() || r.hasAA() || r.hasLaunch() || r.hasXfa())) {
				throw new CustomException("EG_FILESTORE_PDF_UNSAFE", "PDF contains harmful AcroForm content which is disallowed");
			}
			if (fileStoreConfig.isPdfDisallowFileAttachments() && r.hasFileAttachments()) {
				throw new CustomException("EG_FILESTORE_PDF_UNSAFE", "PDF contains file attachments which are disallowed");
			}
			if (fileStoreConfig.isPdfDisallowEncrypted() && r.isEncrypted()) {
				throw new CustomException("EG_FILESTORE_PDF_UNSAFE", "Encrypted PDF is disallowed");
			}
			if (fileStoreConfig.isPdfDisallowXfa() && r.hasXfa()) {
				throw new CustomException("EG_FILESTORE_PDF_UNSAFE", "PDF contains XFA which is disallowed");
			}
			if (fileStoreConfig.isPdfDisallowStreamJavascript() && r.hasJsInStreams()) {
				throw new CustomException("EG_FILESTORE_PDF_UNSAFE", "PDF contains JavaScript in streams which is disallowed");
			}
			if (fileStoreConfig.isPdfDisallowObjectStreams() && r.hasObjStm()) {
				throw new CustomException("EG_FILESTORE_PDF_UNSAFE", "PDF contains object streams (ObjStm) which are disallowed");
			}
			if (fileStoreConfig.isPdfDisallowXrefStreams() && r.hasXRefStream()) {
				throw new CustomException("EG_FILESTORE_PDF_UNSAFE", "PDF contains cross-reference streams (XRef) which are disallowed");
			}
			if (fileStoreConfig.isPdfDisallowSuspiciousFilters() && r.hasSuspiciousFilters()) {
				throw new CustomException("EG_FILESTORE_PDF_UNSAFE", "PDF contains suspicious filters which are disallowed");
			}
		} catch (IOException e) {
			throw new CustomException("EG_FILESTORE_PDF_SCAN_ERROR", "Failed to scan PDF for unsafe features: " + e.getMessage());
		}
	}

	private void validateInputContentType(Artifact artifact){

		MultipartFile file =  artifact.getMultipartFile();
		String contentType = file.getContentType();
		String extension = (FilenameUtils.getExtension(artifact.getMultipartFile().getOriginalFilename())).toLowerCase();


		if (!fileStoreConfig.getAllowedFormatsMap().get(extension).contains(contentType)) {
			throw new CustomException("EG_FILESTORE_INVALID_INPUT", "Invalid Content Type");
		}
	}
	/*private void validateFilesToUpload(List<MultipartFile> filesToStore, String module, String tag, String tenantId) {
		if (CollectionUtils.isEmpty(filesToStore)) {
			throw new EmptyFileUploadRequestException(module, tag, tenantId);
		}
	}*/
	private void validateMagicNumber(MultipartFile file, String extension) {
		byte[] magicNumber = MAGIC_NUMBERS.get(extension);
		if (magicNumber == null) {
			return;
		}
		try (InputStream is = file.getInputStream()) {
			byte[] fileHeader = new byte[magicNumber.length];
			if (is.read(fileHeader) != fileHeader.length) {
				throw new CustomException("EG_FILESTORE_INVALID_INPUT", "File content does not match the expected format for " + extension);
			}
			for(int i=0; i<magicNumber.length; i++) {
				if(fileHeader[i] != magicNumber[i]) {
					throw new CustomException("EG_FILESTORE_INVALID_INPUT", "File content does not match the expected format for " + extension);
				}
			}
		} catch (IOException e) {
			throw new CustomException("EG_FILESTORE_IO_ERROR", "Error reading file: " + e.getMessage());
		}
	}

	private void validateFileSize(MultipartFile file) {
		if (file.getSize() > fileStoreConfig.getFileSizeMax()) {
			throw new CustomException("EG_FILESTORE_INVALID_INPUT", "File size exceeds the maximum allowed size of " + fileStoreConfig.getFileSizeMax() + " bytes");
		}
	}

	public void validateDeleteFiles(List<String> fileStoreIds, String tenantId){
		if (fileStoreIds == null || fileStoreIds.isEmpty()) {
			throw new CustomException("EG_FILESTORE_INVALID_INPUT", "fileStoreIds cannot be null or empty");
		}
		if (tenantId == null || tenantId.isEmpty()) {
			throw new CustomException("EG_FILESTORE_INVALID_INPUT", "tenantId cannot be null or empty");
		}
	}
}
