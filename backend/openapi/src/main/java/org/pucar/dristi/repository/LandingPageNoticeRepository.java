package org.pucar.dristi.repository;

import org.pucar.dristi.web.models.landingpagenotices.LandingPageNotice;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface LandingPageNoticeRepository extends JpaRepository<LandingPageNotice, Integer> {

    long countByTitleContainingIgnoreCase(String title);

    // Native queries for limit/offset pagination
    @Query(value = "SELECT * FROM landing_page_notice LIMIT :limit OFFSET :offset", nativeQuery = true)
    List<LandingPageNotice> findAllWithPagination(@Param("limit") int limit, @Param("offset") int offset);

    @Query(value = "SELECT * FROM landing_page_notice WHERE LOWER(title) LIKE LOWER(CONCAT('%', :title, '%')) LIMIT :limit OFFSET :offset", nativeQuery = true)
    List<LandingPageNotice> findByTitleContainingIgnoreCaseWithPagination(@Param("title") String title, @Param("limit") int limit, @Param("offset") int offset);

}
