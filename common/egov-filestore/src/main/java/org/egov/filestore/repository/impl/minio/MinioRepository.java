package org.egov.filestore.repository.impl.minio;

import java.awt.image.BufferedImage;
import java.io.ByteArrayInputStream;
import java.io.ByteArrayOutputStream;
import java.io.File;
import java.io.IOException;
import java.io.InputStream;
import java.nio.file.Paths;
import java.security.InvalidKeyException;
import java.security.NoSuchAlgorithmException;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import javax.imageio.ImageIO;

import io.minio.PutObjectArgs;
import io.minio.RemoveObjectArgs;
import io.minio.errors.*;
import org.apache.commons.io.FilenameUtils;
import org.apache.tika.Tika;
import org.egov.filestore.config.FileStoreConfig;
import org.egov.filestore.domain.model.FileLocation;
import org.egov.filestore.persistence.entity.Artifact;
import org.egov.filestore.repository.CloudFilesManager;
import org.egov.filestore.repository.impl.CloudFileMgrUtils;
import org.egov.tracer.model.CustomException;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.core.io.FileSystemResource;
import org.springframework.core.io.Resource;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import io.minio.MinioClient;
import io.minio.PutObjectOptions;
import lombok.extern.slf4j.Slf4j;

@Slf4j
@Service
@ConditionalOnProperty(value = "isS3Enabled", havingValue = "true")
public class MinioRepository implements CloudFilesManager {

	private static final String ERROR_IN_CONFIGURATION = "Error in Configuration";

	@Autowired
	private MinioClient minioClient;
	
	@Autowired
	private MinioConfig minioConfig;

	@Autowired
	private CloudFileMgrUtils util;
	
	@Autowired
	private FileStoreConfig fileStoreConfig;

	@Override
	public void saveFiles(List<org.egov.filestore.domain.model.Artifact> artifacts) {

		List<org.egov.filestore.persistence.entity.Artifact> persistList = new ArrayList<>();
		artifacts.forEach(artifact -> {
			FileLocation fileLocation = artifact.getFileLocation();
			String completeName = fileLocation.getFileName();
			int index = completeName.indexOf('/');
			String fileNameWithPath = completeName.substring(index + 1, completeName.length());
			push(artifact.getMultipartFile(), fileNameWithPath);

			if (artifact.getThumbnailImages() != null && !artifact.getThumbnailImages().isEmpty())
				pushThumbnailImages(artifact);

			fileLocation.setFileSource(minioConfig.getSource());
			persistList.add(mapToEntity(artifact));

        });
    }

    

    private void push(MultipartFile multipartFile, String fileNameWithPath) {
        try {
            InputStream is = multipartFile.getInputStream();
            long contentLength = multipartFile.getSize();

            long fileSize = is.available();
            String contentTypeDetected;
            try {
                Tika tika = new Tika();
                contentTypeDetected = tika.detect(multipartFile.getInputStream(), multipartFile.getOriginalFilename());
            } catch (IOException e) {
                contentTypeDetected = multipartFile.getContentType();
            }
            PutObjectArgs.Builder putObjectArgsBuilder = PutObjectArgs.builder()
                    .bucket(minioConfig.getBucketName())
                    .object(fileNameWithPath)
                    .stream(is, fileSize, -1) // Set part size to -1 for auto detection
                    .contentType(contentTypeDetected); // use detected MIME type

            minioClient.putObject(putObjectArgsBuilder.build());

			log.debug("Upload Successful");

		} catch (MinioException | InvalidKeyException | IllegalArgumentException | NoSuchAlgorithmException
				| IOException e) {
			log.error("Error occurred: ", e);
			throw new RuntimeException(ERROR_IN_CONFIGURATION);
		}

	}

	private void push(InputStream is, long contentLength, String contentType, String fileNameWithPath) {
		try {
			/*PutObjectOptions putObjectOptions = new PutObjectOptions(contentLength, PutObjectOptions.MAX_PART_SIZE);
			putObjectOptions.setContentType(contentType);
			minioClient.putObject(minioConfig.getBucketName(), fileNameWithPath, is, putObjectOptions);*/

			long fileSize = is.available();
			PutObjectArgs.Builder putObjectArgsBuilder = PutObjectArgs.builder()
					.bucket(minioConfig.getBucketName())
					.object(fileNameWithPath)
					.stream(is, fileSize, -1) // Set part size to -1 for auto detection
					.contentType(contentType); // Change this as per your file's content type
			minioClient.putObject(putObjectArgsBuilder.build());

		} catch (MinioException | InvalidKeyException | IllegalArgumentException | NoSuchAlgorithmException
				| IOException e) {
			log.error("Error occurred: " + e);
			throw new RuntimeException(ERROR_IN_CONFIGURATION);
		}

	}

	private void pushThumbnailImages(org.egov.filestore.domain.model.Artifact artifact) {

		try {

			for (Map.Entry<String, BufferedImage> entry : artifact.getThumbnailImages().entrySet()) {
				ByteArrayOutputStream os = new ByteArrayOutputStream();
				String ext = FilenameUtils.getExtension(artifact.getMultipartFile().getOriginalFilename());
                ImageIO.write(entry.getValue(), ext, os);
                byte[] byteArray = os.toByteArray();

                String thumbContentType;
                try {
                    Tika tika = new Tika();
                    thumbContentType = tika.detect(new ByteArrayInputStream(byteArray), entry.getKey());
                } catch (IOException e) {
                    // Fallback to a generic guess based on extension
                    if ("jpg".equalsIgnoreCase(ext) || "jpeg".equalsIgnoreCase(ext)) {
                        thumbContentType = "image/jpeg";
                    } else if ("png".equalsIgnoreCase(ext)) {
                        thumbContentType = "image/png";
                    } else {
                        thumbContentType = artifact.getMultipartFile().getContentType();
                    }
                }

                ByteArrayInputStream is = new ByteArrayInputStream(byteArray);
                push(is, byteArray.length, thumbContentType, entry.getKey());
                os.flush();
			}

		} catch (Exception ioe) {

			Map<String, String> map = new HashMap<>();
			log.error("Exception while uploading the image: ", ioe);
			map.put("ERROR_MINIO_UPLOAD", "An error has occured while trying to upload image to filestore system .");
			throw new CustomException(map);
		}
	}

	@Override
	public Map<String, String> getFiles(List<Artifact> artifacts) {

		Map<String, String> mapOfIdAndSASUrls = new HashMap<>();

		for(Artifact artifact : artifacts) {
			
			String fileLocation = artifact.getFileLocation().getFileName();
			String fileName = fileLocation.
					substring(fileLocation.indexOf('/') + 1, fileLocation.length());
			String signedUrl = getSignedUrl(fileName);
			if (util.isFileAnImage(artifact.getFileName())) {
				try {
					signedUrl = setThumnailSignedURL(fileName, new StringBuilder(signedUrl));
				} catch (InvalidKeyException | ErrorResponseException | IllegalArgumentException
						| InsufficientDataException | InternalException | InvalidBucketNameException
						| InvalidExpiresRangeException | InvalidResponseException | NoSuchAlgorithmException
						| XmlParserException | IOException e) {
					// TODO Auto-generated catch block
					e.printStackTrace();
				}
			}
			
			mapOfIdAndSASUrls.put(artifact.getFileStoreId(), signedUrl);
			
		}
		return mapOfIdAndSASUrls;
	}

	@Override
	public void deleteFiles(List<Artifact> artifacts) {
		for (Artifact artifact : artifacts) {
			try {
				log.info("Deleting files from MinIO.");
				String fileLocation = artifact.getFileLocation().getFileName();
				String fileName = fileLocation.substring(fileLocation.indexOf('/') + 1);
				removeObject(fileName);
				log.info("Successfully deleted file: {}", fileName);
			} catch (Exception e) {
				log.error("Error deleting file for artifact: {}", artifact.getFileStoreId(), e);
			}
		}
	}

	private void removeObject(String fileName) {
		try {
			RemoveObjectArgs removeObjectArgs = RemoveObjectArgs.builder()
					.bucket(minioConfig.getBucketName())
					.object(fileName)
					.build();
			minioClient.removeObject(removeObjectArgs);
			log.info("Successfully deleted object: {}", fileName);
		} catch (MinioException e) {
			log.error("Minio error occurred while deleting object: {}", fileName, e);
			throw new CustomException();
		} catch (InvalidKeyException | IllegalArgumentException | NoSuchAlgorithmException e) {
			log.error("Configuration error while deleting object: {}", fileName, e);
			throw new CustomException();
		} catch (IOException e) {
			log.error("I/O error occurred while deleting object: {}", fileName, e);
			throw new CustomException();
		}
	}

	private String setThumnailSignedURL(String fileName, StringBuilder url) throws InvalidKeyException, ErrorResponseException, IllegalArgumentException, InsufficientDataException, InternalException, InvalidBucketNameException, InvalidExpiresRangeException, InvalidResponseException, NoSuchAlgorithmException, XmlParserException, IOException {
		String[] imageFormats = { fileStoreConfig.get_large(), fileStoreConfig.get_medium(), fileStoreConfig.get_small() };
		for (String  format : Arrays.asList(imageFormats)) {
			url.append(",");
			String replaceString = fileName.substring(fileName.lastIndexOf('.'), fileName.length());
			String path = fileName.replaceAll(replaceString, format + replaceString);
			url.append(getSignedUrl(path));
		}
		return url.toString();
	}
	
	private String getSignedUrl(String fileName) {

		String signedUrl = null;
		try {
			signedUrl = minioClient.getPresignedObjectUrl(io.minio.http.Method.GET, minioConfig.getBucketName(), fileName,
					fileStoreConfig.getPreSignedUrlTimeOut(), new HashMap<String, String>());
		} catch (InvalidKeyException | ErrorResponseException | IllegalArgumentException | InsufficientDataException
				| InternalException | InvalidBucketNameException | InvalidExpiresRangeException
				| InvalidResponseException | NoSuchAlgorithmException | XmlParserException | ServerException | IOException e) {
			// TODO Auto-generated catch block
			e.printStackTrace();
		}
        return signedUrl;
	}

	public Resource read(FileLocation fileLocation, boolean isRetry) {

		Resource resource = null;
		File f = new File(fileLocation.getFileStoreId());

		if (fileLocation.getFileSource() == null || fileLocation.getFileSource().equals(minioConfig.getSource())) {
			String fileName = fileLocation.getFileName().substring(fileLocation.getFileName().indexOf('/') + 1,
					fileLocation.getFileName().length());

			try {
				if (f.exists()) {
					boolean deleted = f.delete();
					if (!deleted) {
						log.warn("Failed to delete existing destination file: {}", f.getAbsolutePath());
					}
				}
				minioClient.getObject(minioConfig.getBucketName(), fileName, f.getName());
			} catch (InvalidKeyException | ErrorResponseException |
                     InsufficientDataException | InternalException | InvalidBucketNameException |
                     InvalidResponseException | NoSuchAlgorithmException | XmlParserException | IOException |
                     ServerException e) {
				log.error("Error while downloading the file ", e);
				Map<String, String> map = new HashMap<>();
				map.put("ERROR_MINIO_DOWNLOAD",
						"An error has occured while trying to download image from filestore system .");
				throw new CustomException(map);

			} catch (IllegalArgumentException e) {
				handleDownloadRetry(isRetry, f, fileName, e);
			}
			resource = new FileSystemResource(Paths.get(f.getPath()).toFile());

		}
		return resource;
	}

	private void handleDownloadRetry(boolean isRetry, File f, String fileName, IllegalArgumentException e) {
		if(isRetry){
			log.warn("IllegalArgumentException caught while downloading the file. Retrying once...");
			try {
				if (f.exists()) {
					boolean deleted = f.delete();
					if (!deleted) {
						log.warn("Failed to delete existing local file before download: {}", f.getAbsolutePath());
					} else {
						log.info("Deleted local file before retrying download: {}", f.getAbsolutePath());
					}
				}
				minioClient.getObject(minioConfig.getBucketName(), fileName, f.getName());
			} catch (Exception exception) {
				log.error("Retry failed while downloading the file from Minio", exception);
				Map<String, String> map = new HashMap<>();
				map.put("ERROR_MINIO_RETRY_DOWNLOAD",
						"Retry failed while downloading file from filestore system.");
				throw new CustomException(map);
			}
		}
	}

	private Artifact mapToEntity(org.egov.filestore.domain.model.Artifact artifact) {

		FileLocation fileLocation = artifact.getFileLocation();
		return Artifact.builder().fileStoreId(fileLocation.getFileStoreId()).fileName(fileLocation.getFileName())
				.contentType(artifact.getMultipartFile().getContentType()).module(fileLocation.getModule())
				.tag(fileLocation.getTag()).tenantId(fileLocation.getTenantId())
				.fileSource(fileLocation.getFileSource()).build();
	}

}
