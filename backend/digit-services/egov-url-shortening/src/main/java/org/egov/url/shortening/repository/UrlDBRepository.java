package org.egov.url.shortening.repository;

import java.sql.PreparedStatement;
import java.sql.SQLException;
import java.util.List;

import org.egov.url.shortening.model.ShortenRequest;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.core.annotation.Order;
import org.springframework.dao.DataAccessException;
import org.springframework.jdbc.core.BeanPropertyRowMapper;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.core.PreparedStatementCallback;
import org.springframework.stereotype.Repository;

import lombok.extern.slf4j.Slf4j;

@Repository
@Slf4j
@Order(1)
public class UrlDBRepository implements URLRepository{
	
	
	private JdbcTemplate jdbcTemplate;
	
	
	@Autowired
	public UrlDBRepository(JdbcTemplate jdbcTemplate){
		this.jdbcTemplate = jdbcTemplate;
	}
	
	@Override
	public Long incrementID() {
		String query = "SELECT nextval('eg_url_shorter_id')";
        //Long id = jdbcTemplate.queryForObject(query, new Object[] {}, Long.class);
        Long id = jdbcTemplate.queryForObject(query, Long.class);
        log.info("Incrementing ID: {}", id-1);
        return id - 1;
    }

	@Override
    public void saveUrl(String key, ShortenRequest shortenRequest) {

    	String query = "INSERT INTO eg_url_shortener "
    			+ "(id,validfrom,validto,url,reference_id) "
    			+ "values (?,?,?,?,?)";
    	log.info("Saving: {} at {}", shortenRequest.getUrl(), key);
        Boolean b = jdbcTemplate.execute(query,new PreparedStatementCallback<Boolean>(){  
            @Override  
            public Boolean doInPreparedStatement(PreparedStatement ps)  
                    throws SQLException, DataAccessException {  
                      
                ps.setString(1,key);
                ps.setObject(2,shortenRequest.getValidFrom());
                ps.setObject(3,shortenRequest.getValidTo());
                ps.setString(4,shortenRequest.getUrl());
                ps.setString(5,shortenRequest.getReferenceId());
                return ps.execute();  
                      
            }  
            });  
    }

	@Override
    public String getUrl(Long id) throws Exception {
    	String query =  "SELECT url FROM EG_URL_SHORTENER WHERE id=?";
    	
    	String strprepStmtArgs = "url:"+id;
    	//String url = jdbcTemplate.queryForObject(query, new Object[] {strprepStmtArgs}, String.class);
        String url = jdbcTemplate.queryForObject(query, String.class, strprepStmtArgs);

        log.info("Retrieved {} at {}", url ,id);
        if (url == null) {
            throw new Exception("URL at key" + id + " does not exist");
        }
        return url;
    }

    @Override
    public ShortenRequest getShortenRequestByReferenceId(String referenceId) {
        String query = "SELECT * FROM EG_URL_SHORTENER WHERE reference_id = ?";

        List<ShortenRequest> results = jdbcTemplate.query(query, new BeanPropertyRowMapper<>(ShortenRequest.class), referenceId);

        if (results.isEmpty()) {
            return null;
        } else {
            ShortenRequest shortenRequest = results.stream()
                    .filter(r -> r.getValidTo() == null).findFirst()
                    .orElse(null);

            if (shortenRequest != null) {
                log.info("Retrieved {} at {}", shortenRequest.getUrl(), referenceId);
            } else
                log.info("URL at key" + referenceId + " does not exist");
            return shortenRequest;
        }
    }

    @Override
    public ShortenRequest getShortenRequestById(Long id) throws Exception {
        String query = "SELECT * FROM EG_URL_SHORTENER WHERE id = ?";

        String strprepStmtArgs = "url:"+id;

        List<ShortenRequest> results = jdbcTemplate.query(query, new BeanPropertyRowMapper<>(ShortenRequest.class), strprepStmtArgs);

        if (results.isEmpty()) {
            return null;
        } else {
            return results.get(0);
        }
    }

    @Override
    public void expireTheURL(String key, ShortenRequest shortenRequest) {
        String query = "UPDATE eg_url_shortener SET validto = ? WHERE id = ?";
        jdbcTemplate.update(query, System.currentTimeMillis(), key);
    }


}
