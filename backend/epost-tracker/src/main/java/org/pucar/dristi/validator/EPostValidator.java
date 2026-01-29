package org.pucar.dristi.validator;

import lombok.extern.slf4j.Slf4j;
import org.egov.tracer.model.CustomException;
import org.pucar.dristi.model.EPostRequest;
import org.pucar.dristi.model.EPostTracker;
import org.pucar.dristi.model.EPostTrackerSearchCriteria;
import org.pucar.dristi.repository.EPostRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.Objects;

import static org.pucar.dristi.config.ServiceConstants.*;

@Component
@Slf4j
public class EPostValidator {

    private final EPostRepository ePostRepository;

    @Autowired
    public EPostValidator(EPostRepository ePostRepository) {
        this.ePostRepository = ePostRepository;
    }

    public void validateUpdateRequest(EPostRequest request) {
        EPostTracker ePostTracker = request.getEPostTracker();
        String speedPostId = ePostTracker != null ? ePostTracker.getSpeedPostId() : null;
        if (speedPostId != null) {
            EPostTrackerSearchCriteria searchCriteria = EPostTrackerSearchCriteria.builder().speedPostId(speedPostId).build();
            List<EPostTracker> ePostTrackers = ePostRepository.getEPostTrackerList(searchCriteria,5,0);
            if (!ePostTrackers.isEmpty() && (!Objects.equals(ePostTrackers.get(0).getTaskNumber(), ePostTracker.getTaskNumber()))) {
                throw new CustomException(DUPLICATE_SPEED_POST_ID_ERROR,DUPLICATE_SPEED_POST_ERROR + speedPostId);
            }
        }
    }

}
