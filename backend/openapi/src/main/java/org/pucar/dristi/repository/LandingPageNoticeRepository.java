package org.pucar.dristi.repository;

import lombok.extern.slf4j.Slf4j;
import org.pucar.dristi.web.models.landingpagenotices.LandingPageNotice;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface LandingPageNoticeRepository extends JpaRepository<LandingPageNotice, Integer> {


}
