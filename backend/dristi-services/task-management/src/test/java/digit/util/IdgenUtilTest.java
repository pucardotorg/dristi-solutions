package digit.util;

import com.fasterxml.jackson.databind.ObjectMapper;
import digit.config.Configuration;
import digit.repository.ServiceRequestRepository;
import org.egov.common.contract.idgen.IdGenerationResponse;
import org.egov.common.contract.idgen.IdResponse;
import org.egov.common.contract.request.RequestInfo;
import org.egov.tracer.model.CustomException;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.Spy;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Arrays;
import java.util.Collections;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class IdgenUtilTest {

    @Spy
    private ObjectMapper mapper = new ObjectMapper();

    @Mock
    private ServiceRequestRepository restRepo;

    @Mock
    private Configuration configs;

    @InjectMocks
    private IdgenUtil idgenUtil;

    private RequestInfo requestInfo;

    @BeforeEach
    void setUp() {
        requestInfo = RequestInfo.builder().build();
    }

    @Test
    void getIdList_SingleId_ReturnsIdList() {
        when(configs.getIdGenHost()).thenReturn("http://localhost:8080");
        when(configs.getIdGenPath()).thenReturn("/egov-idgen/id/_generate");

        IdResponse idResponse = new IdResponse();
        idResponse.setId("TM-001");
        IdGenerationResponse response = new IdGenerationResponse();
        response.setIdResponses(Collections.singletonList(idResponse));

        when(restRepo.fetchResult(any(), any())).thenReturn(response);

        List<String> result = idgenUtil.getIdList(requestInfo, "kl", "task.id", "TM-[SEQ]", 1, false);

        assertEquals(1, result.size());
        assertEquals("TM-001", result.get(0));
    }

    @Test
    void getIdList_MultipleIds_ReturnsAllIds() {
        when(configs.getIdGenHost()).thenReturn("http://localhost:8080");
        when(configs.getIdGenPath()).thenReturn("/egov-idgen/id/_generate");

        IdResponse idResponse1 = new IdResponse();
        idResponse1.setId("TM-001");
        IdResponse idResponse2 = new IdResponse();
        idResponse2.setId("TM-002");
        IdResponse idResponse3 = new IdResponse();
        idResponse3.setId("TM-003");
        
        IdGenerationResponse response = new IdGenerationResponse();
        response.setIdResponses(Arrays.asList(idResponse1, idResponse2, idResponse3));

        when(restRepo.fetchResult(any(), any())).thenReturn(response);

        List<String> result = idgenUtil.getIdList(requestInfo, "kl", "task.id", "TM-[SEQ]", 3, false);

        assertEquals(3, result.size());
        assertTrue(result.contains("TM-001"));
        assertTrue(result.contains("TM-002"));
        assertTrue(result.contains("TM-003"));
    }

    @Test
    void getIdList_EmptyResponse_ThrowsCustomException() {
        when(configs.getIdGenHost()).thenReturn("http://localhost:8080");
        when(configs.getIdGenPath()).thenReturn("/egov-idgen/id/_generate");

        IdGenerationResponse response = new IdGenerationResponse();
        response.setIdResponses(Collections.emptyList());

        when(restRepo.fetchResult(any(), any())).thenReturn(response);

        assertThrows(CustomException.class, () -> 
            idgenUtil.getIdList(requestInfo, "kl", "task.id", "TM-[SEQ]", 1, false));
    }

    @Test
    void getIdList_NullResponse_ThrowsCustomException() {
        when(configs.getIdGenHost()).thenReturn("http://localhost:8080");
        when(configs.getIdGenPath()).thenReturn("/egov-idgen/id/_generate");

        IdGenerationResponse response = new IdGenerationResponse();
        response.setIdResponses(null);

        when(restRepo.fetchResult(any(), any())).thenReturn(response);

        assertThrows(CustomException.class, () -> 
            idgenUtil.getIdList(requestInfo, "kl", "task.id", "TM-[SEQ]", 1, false));
    }

    @Test
    void getIdList_CorrectUriBuilt() {
        when(configs.getIdGenHost()).thenReturn("http://localhost:8080");
        when(configs.getIdGenPath()).thenReturn("/egov-idgen/id/_generate");

        IdResponse idResponse = new IdResponse();
        idResponse.setId("TM-001");
        IdGenerationResponse response = new IdGenerationResponse();
        response.setIdResponses(Collections.singletonList(idResponse));

        when(restRepo.fetchResult(any(), any())).thenReturn(response);

        idgenUtil.getIdList(requestInfo, "kl", "task.id", "TM-[SEQ]", 1, false);

        verify(restRepo).fetchResult(
            argThat(uri -> uri.toString().equals("http://localhost:8080/egov-idgen/id/_generate")),
            any()
        );
    }
}
