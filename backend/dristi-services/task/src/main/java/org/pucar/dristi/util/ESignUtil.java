package org.pucar.dristi.util;

import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.extern.slf4j.Slf4j;
import org.egov.tracer.model.CustomException;
import org.pucar.dristi.config.Configuration;
import org.pucar.dristi.repository.ServiceRequestRepository;
import org.pucar.dristi.web.models.Coordinate;
import org.pucar.dristi.web.models.CoordinateRequest;
import org.pucar.dristi.web.models.CoordinateResponse;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;

import java.util.Collections;
import java.util.List;

import static org.pucar.dristi.config.ServiceConstants.ESIGN_SERVICE_EXCEPTION;

@Component
@Slf4j
public class ESignUtil {

    private final Configuration configuration;
    private final ServiceRequestRepository repository;
    private final ObjectMapper mapper;

    @Autowired
    public ESignUtil(Configuration configuration, ServiceRequestRepository repository, ObjectMapper mapper) {
        this.configuration = configuration;
        this.repository = repository;
        this.mapper = mapper;
    }


    public List<Coordinate> getCoordinateForSign(CoordinateRequest request) {
        StringBuilder uri = new StringBuilder();
        uri.append(configuration.getEsignHost()).append(configuration.getEsignLocationEndPoint());
        log.debug("Getting coordinates for sign: criteriaCount={}", request != null && request.getCriteria() != null ? request.getCriteria().size() : 0);
        try {
            Object response = repository.fetchResult(uri, request);
            CoordinateResponse coordinateResponse = mapper.convertValue(response, CoordinateResponse.class);
            List<Coordinate> coords = (coordinateResponse != null && coordinateResponse.getCoordinates() != null)
                    ? coordinateResponse.getCoordinates()
                    : Collections.emptyList();
            log.debug("Received coordinates: count={}", coords.size());
            return coords;

        } catch (Exception e) {
            log.error("ESIGN coordinate fetch failed", e);
            throw new CustomException(ESIGN_SERVICE_EXCEPTION, "Error occurred while getting coordinates");
        }

    }
}
