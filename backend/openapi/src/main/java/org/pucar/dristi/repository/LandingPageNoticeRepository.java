package org.pucar.dristi.repository;

import lombok.extern.slf4j.Slf4j;
import org.pucar.dristi.web.models.landingpagenotices.LandingPageNotice;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface LandingPageNoticeRepository extends JpaRepository<LandingPageNotice, Integer> {

    List<LandingPageNotice> findByTitleContainingIgnoreCase(String title);

    Page<LandingPageNotice> findByTitleContainingIgnoreCase(String title, Pageable pageable);

    Page<LandingPageNotice> findAll(Pageable pageable);

    long countByTitleContainingIgnoreCase(String title);

    // Native queries for limit/offset pagination
    @Query(value = "SELECT * FROM landing_page_notices LIMIT :limit OFFSET :offset", nativeQuery = true)
    List<LandingPageNotice> findAllWithPagination(@Param("limit") int limit, @Param("offset") int offset);

    @Query(value = "SELECT * FROM landing_page_notices WHERE LOWER(title) LIKE LOWER(CONCAT('%', :title, '%')) LIMIT :limit OFFSET :offset", nativeQuery = true)
    List<LandingPageNotice> findByTitleContainingIgnoreCaseWithPagination(@Param("title") String title, @Param("limit") int limit, @Param("offset") int offset);
}
