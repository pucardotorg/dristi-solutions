package org.egov.filestore.persistence.repository;

import java.io.IOException;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;
import java.util.stream.Collectors;

import org.egov.common.contract.request.RequestInfo;
import org.egov.filestore.domain.model.FileInfo;
import org.egov.filestore.domain.model.FileLocation;
import org.egov.filestore.domain.model.Resource;
import org.egov.filestore.persistence.entity.Artifact;
import org.egov.filestore.repository.CloudFilesManager;
import org.egov.filestore.repository.impl.AzureBlobStorageImpl;
import org.egov.filestore.repository.impl.minio.MinioRepository;
import org.egov.tracer.model.CustomException;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

@Service
public class ArtifactRepository {

	private static final Logger log = LoggerFactory.getLogger(ArtifactRepository.class);
	private FileStoreJpaRepository fileStoreJpaRepository;
	
	@Autowired
	private CloudFilesManager cloudFilesManager;

	@Value("${isAzureStorageEnabled}")
	private Boolean isAzureStorageEnabled;

	@Value("${source.azure.blob}")
	private String azureBlobSource;

	

	public ArtifactRepository(FileStoreJpaRepository fileStoreJpaRepository) {

		this.fileStoreJpaRepository = fileStoreJpaRepository;
	}

	public List<String> save(List<org.egov.filestore.domain.model.Artifact> artifacts, RequestInfo requestInfo) {
		cloudFilesManager.saveFiles(artifacts);
		List<Artifact> artifactEntities = new ArrayList<>();
		artifacts.forEach(artifact -> {
			artifactEntities.add(mapToEntity(artifact, requestInfo));
		});
		return fileStoreJpaRepository.saveAll(artifactEntities).stream().map(Artifact::getFileStoreId)
				.collect(Collectors.toList());
	}

	/**
	 * Converts POJO artifact to JPA Entity artifact
	 * 
	 * @param artifact
	 * @return
	 */
	private Artifact mapToEntity(org.egov.filestore.domain.model.Artifact artifact, RequestInfo requestInfo) {

		FileLocation fileLocation = artifact.getFileLocation();
		Artifact entityArtifact = Artifact.builder().fileStoreId(fileLocation.getFileStoreId())
				.fileName(fileLocation.getFileName()).contentType(artifact.getMultipartFile().getContentType())
				.module(fileLocation.getModule()).tag(fileLocation.getTag()).tenantId(fileLocation.getTenantId())
				.fileSource(fileLocation.getFileSource())
				//.createdBy(requestInfo.getUserInfo().getUuid())
				//.lastModifiedBy(requestInfo.getUserInfo().getUuid())
				//.createdTime(System.currentTimeMillis())
				//.lastModifiedTime(System.currentTimeMillis())
				.build();
		if (isAzureStorageEnabled)
			entityArtifact.setFileSource(azureBlobSource);
	

		return entityArtifact;
	}

	/*
	 * private List<Artifact>
	 * mapArtifactsListToEntitiesList(List<org.egov.filestore.domain.model.
	 * Artifact> artifacts) { return artifacts.stream() .map(this::mapToEntity)
	 * .collect(Collectors.toList()); }
	 * 
	 * private Artifact mapToEntity(org.egov.filestore.domain.model.Artifact
	 * artifact) {
	 * 
	 * FileLocation fileLocation = artifact.getFileLocation(); return
	 * Artifact.builder().fileStoreId(fileLocation.getFileStoreId()).fileName(
	 * fileLocation.getFileName())
	 * .contentType(artifact.getMultipartFile().getContentType()).module(
	 * fileLocation.getModule())
	 * .tag(fileLocation.getTag()).tenantId(fileLocation.getTenantId()).build();
	 * }
	 */
/**
 * 
 * @param fileStoreId
 * @param tenantId
 * @return
 * @throws IOException
 * This api needs to be enhanced to pick right object .All repositories should implement cloudmanager and it should provide 
 * simple get api too
 */
	public Resource find(String fileStoreId, String tenantId, String module) throws IOException {
		Artifact artifact = fileStoreJpaRepository.findByFileStoreIdAndTenantId(fileStoreId, tenantId);
		if (artifact == null)
			throw new CustomException("NOT_FOUND", "Invalid filestoreid or tenantid");

		if (module != null && !module.isEmpty() &&
				Arrays.stream(module.split(","))
						.map(String::trim)
						.filter(m -> !m.isEmpty())
				        .noneMatch(m -> m.equalsIgnoreCase(artifact.getModule()))) {
			throw new CustomException("module_mismatch", "Invalid module");
		}

		org.springframework.core.io.Resource resource = null;

		if (artifact.getFileLocation().getFileSource().equals("minio")) {
			// if only DiskFileStoreRepository use read else ignore
			MinioRepository repo = (MinioRepository) cloudFilesManager;
			resource = repo.read(artifact.getFileLocation(), true);
		} else if (artifact.getFileLocation().getFileSource().equals("AzureBlobStorage")) {
			AzureBlobStorageImpl repo = (AzureBlobStorageImpl) cloudFilesManager;
			resource = repo.read(artifact.getFileLocation());
		}
		 
      if(null!=resource)
		return new Resource(artifact.getContentType(), artifact.getFileName(), resource, artifact.getTenantId(),
				"" + resource.getFile().length() + " bytes");
      else
    	  return null;
	}

	public List<FileInfo> findByTag(String tag, String tenantId) {
		return fileStoreJpaRepository.findByTagAndTenantId(tag, tenantId).stream().map(this::mapArtifactToFileInfo)
				.collect(Collectors.toList());
	}

	private FileInfo mapArtifactToFileInfo(Artifact artifact) {
		FileLocation fileLocation = new FileLocation(artifact.getFileStoreId(), artifact.getModule(), artifact.getTag(),
				artifact.getTenantId(), artifact.getFileName(), artifact.getFileSource());

		return new FileInfo(artifact.getContentType(), fileLocation, artifact.getTenantId());
	}

	public List<Artifact> getByTenantIdAndFileStoreIdList(String tenantId, List<String> fileStoreIds) {
		return fileStoreJpaRepository.findByTenantIdAndFileStoreIdList(tenantId, fileStoreIds);
	}

	public List<String> delete(List<String> fileStoreIds, String tenantId,String module, boolean isSoftDelete) {
		List<Artifact> artifacts = getArtifacts(fileStoreIds, tenantId, module);
		if (artifacts == null || artifacts.isEmpty()) {
			log.error("Error deleting files.");
			throw new CustomException("EG_FILESTORE_NOT_FOUND", "No files found for the given filestore ids and tenant");
		}
		if (isSoftDelete) {
			log.info("Soft Deleting Files in database");
			artifacts.forEach(artifact -> artifact.setIsDeleted(true));
			fileStoreJpaRepository.saveAll(artifacts);
		} else {
			try {
				log.info("Hard Deleting Files.");
				cloudFilesManager.deleteFiles(artifacts);
				fileStoreJpaRepository.deleteAll(artifacts);
				log.info("Deleted files from cloud and database.");
			} catch (Exception e) {
				log.error("Error deleting files: {}", e.getMessage());
				throw new CustomException("EG_FILESTORE_DELETE_ERROR",
						"Error deleting files from storage: " + e.getMessage());
			}
		}

		return artifacts.stream()
				.map(Artifact::getFileStoreId)
				.collect(Collectors.toList());

	}

	private List<Artifact> getArtifacts(List<String> fileStoreIds, String tenantId, String module) {
		List<Artifact> artifacts;
		if(module != null && !module.isEmpty()){
			artifacts = fileStoreJpaRepository.findByFileStoreAndModule(module, fileStoreIds, tenantId);
		} else {
			artifacts = getByTenantIdAndFileStoreIdList(tenantId, fileStoreIds);
		}
		return artifacts;
	}
}
