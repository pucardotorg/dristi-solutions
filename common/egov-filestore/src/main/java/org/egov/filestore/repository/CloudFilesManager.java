package org.egov.filestore.repository;

import java.util.List;
import java.util.Map;

import org.egov.filestore.domain.model.Artifact;

public interface CloudFilesManager {
	
	/**
	 * Interface to save the files to a cloud storage. Current implmentations:
	 * 1. AWS S3
	 * 2. Azure Blob Storage
	 * 
	 * @param artifacts
	 */
	public void saveFiles(List<Artifact> artifacts);
	
	/**
	 * Interface to fetch files from the cloud storage. 
	 * Takes a map of filestoreid and file path as input and returns a map of filestoreid and urls with access permissions. 
	 * Current Implementations:
	 * 1. Signed Urls from AWS S3
	 * 2. SAS Urls from Azure
	 * 
	 * @param mapOfIdAndFilePath
	 * @return
	 */
	public Map<String, String> getFiles(List<org.egov.filestore.persistence.entity.Artifact> artifacts);

	/**
	 * Interface to delete files from cloud storage.
	 * Takes a list of artifacts to be deleted.
	 * Current Implementations:
	 * 1. AWS S3
	 * 2. Azure Blob Storage
	 *
	 * @param artifacts List of artifacts to be deleted
	 */
	public void deleteFiles(List<org.egov.filestore.persistence.entity.Artifact> artifacts);
}
