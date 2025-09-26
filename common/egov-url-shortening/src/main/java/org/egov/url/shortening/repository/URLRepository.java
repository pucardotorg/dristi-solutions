package org.egov.url.shortening.repository;

import org.egov.url.shortening.model.ShortenRequest;

import com.fasterxml.jackson.core.JsonProcessingException;

public interface URLRepository {
	
	 public Long incrementID();
	 public void saveUrl(String key, ShortenRequest shortenRequest)throws JsonProcessingException ;
	 public String getUrl(Long id) throws Exception ;
	 public ShortenRequest getShortenRequestByReferenceId(String referenceId) throws Exception ;
	 public ShortenRequest getShortenRequestById(Long id) throws Exception ;
	 public void expireTheURL(String key, ShortenRequest shortenRequest) throws JsonProcessingException;

}
