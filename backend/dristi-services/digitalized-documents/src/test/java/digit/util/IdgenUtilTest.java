package digit.util;

import com.fasterxml.jackson.databind.ObjectMapper;
import digit.config.Configuration;
import digit.repository.ServiceRequestRepository;
import digit.web.models.idgen.IdGenerationRequest;
import org.egov.common.contract.idgen.IdGenerationResponse;
import org.egov.common.contract.idgen.IdResponse;
import org.egov.common.contract.request.RequestInfo;
import org.egov.tracer.model.CustomException;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class IdgenUtilTest {

    @Mock private ObjectMapper mapper;
    @Mock private ServiceRequestRepository restRepo;
    @Mock private Configuration configs;

    @InjectMocks private IdgenUtil util;

    @BeforeEach
    void setup() {
        when(configs.getIdGenHost()).thenReturn("http://idgen");
        when(configs.getIdGenPath()).thenReturn("/generate");
    }

    @Test
    void getIdList_ReturnsIds() {
        RequestInfo ri = RequestInfo.builder().build();

        IdResponse r1 = new IdResponse(); r1.setId("A1");
        IdResponse r2 = new IdResponse(); r2.setId("A2");
        IdGenerationResponse resp = new IdGenerationResponse();
        resp.setIdResponses(List.of(r1, r2));

        when(restRepo.fetchResult(any(StringBuilder.class), any(IdGenerationRequest.class))).thenReturn(new Object());
        when(mapper.convertValue(any(), eq(IdGenerationResponse.class))).thenReturn(resp);

        List<String> out = util.getIdList(ri, "t1", "NAME", "FMT", 2, true);
        assertEquals(List.of("A1", "A2"), out);
    }

    @Test
    void getIdList_WhenEmpty_Throws() {
        RequestInfo ri = RequestInfo.builder().build();
        IdGenerationResponse resp = new IdGenerationResponse();
        resp.setIdResponses(java.util.Collections.emptyList());
        when(restRepo.fetchResult(any(StringBuilder.class), any(IdGenerationRequest.class))).thenReturn(new Object());
        when(mapper.convertValue(any(), eq(IdGenerationResponse.class))).thenReturn(resp);

        CustomException ex = assertThrows(CustomException.class, () -> util.getIdList(ri, "t1", "NAME", "FMT", 1, false));
        assertEquals("IDGEN ERROR", ex.getCode());
    }
}
