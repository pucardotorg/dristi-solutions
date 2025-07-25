package digit.util;

import com.fasterxml.jackson.databind.ObjectMapper;
import digit.config.Configuration;
import digit.repository.ServiceRequestRepository;
import digit.web.models.Coordinate;
import digit.web.models.CoordinateRequest;
import digit.web.models.CoordinateResponse;
import lombok.extern.slf4j.Slf4j;
import org.egov.tracer.model.CustomException;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;

import java.util.List;

import static digit.config.ServiceConstants.ESIGN_SERVICE_EXCEPTION;


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

        try {
            Object response = repository.fetchResult(uri, request);
            String jsonStringResponse = mapper.writeValueAsString(response);
            CoordinateResponse coordinateResponse = mapper.readValue(jsonStringResponse, CoordinateResponse.class);
            return coordinateResponse.getCoordinates();

        } catch (Exception e) {
            throw new CustomException(ESIGN_SERVICE_EXCEPTION, "Error occurred while getting coordinates");
        }

    }
}
