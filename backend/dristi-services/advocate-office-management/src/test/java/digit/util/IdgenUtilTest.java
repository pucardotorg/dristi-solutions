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
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Arrays;
import java.util.Collections;
import java.util.List;

import static digit.config.ServiceConstants.IDGEN_ERROR;
import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class IdgenUtilTest {

    @Mock
    private ObjectMapper mapper;

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
        when(configs.getIdGenHost()).thenReturn("http://idgen-host");
        when(configs.getIdGenPath()).thenReturn("/idgen/v1/_generate");
    }

    @Test
    void testGetIdList_Success() {
        IdResponse idResponse1 = IdResponse.builder().id("ID-001").build();
        IdResponse idResponse2 = IdResponse.builder().id("ID-002").build();
        IdResponse idResponse3 = IdResponse.builder().id("ID-003").build();

        IdGenerationResponse idGenerationResponse = IdGenerationResponse.builder()
                .idResponses(Arrays.asList(idResponse1, idResponse2, idResponse3))
                .build();

        when(restRepo.fetchResult(any(StringBuilder.class), any())).thenReturn(new Object());
        when(mapper.convertValue(any(), eq(IdGenerationResponse.class))).thenReturn(idGenerationResponse);

        List<String> result = idgenUtil.getIdList(requestInfo, "pg.citya", "advocate.id", "ADV-[cy:yyyy]-[SEQ_ADV]", 3);

        assertNotNull(result);
        assertEquals(3, result.size());
        assertEquals("ID-001", result.get(0));
        assertEquals("ID-002", result.get(1));
        assertEquals("ID-003", result.get(2));

        verify(restRepo, times(1)).fetchResult(any(StringBuilder.class), any());
        verify(mapper, times(1)).convertValue(any(), eq(IdGenerationResponse.class));
    }

    @Test
    void testGetIdList_SingleId() {
        IdResponse idResponse = IdResponse.builder().id("ID-001").build();

        IdGenerationResponse idGenerationResponse = IdGenerationResponse.builder()
                .idResponses(Collections.singletonList(idResponse))
                .build();

        when(restRepo.fetchResult(any(StringBuilder.class), any())).thenReturn(new Object());
        when(mapper.convertValue(any(), eq(IdGenerationResponse.class))).thenReturn(idGenerationResponse);

        List<String> result = idgenUtil.getIdList(requestInfo, "pg.citya", "advocate.id", "ADV-[cy:yyyy]-[SEQ_ADV]", 1);

        assertNotNull(result);
        assertEquals(1, result.size());
        assertEquals("ID-001", result.get(0));
    }

    @Test
    void testGetIdList_EmptyResponse() {
        IdGenerationResponse idGenerationResponse = IdGenerationResponse.builder()
                .idResponses(Collections.emptyList())
                .build();

        when(restRepo.fetchResult(any(StringBuilder.class), any())).thenReturn(new Object());
        when(mapper.convertValue(any(), eq(IdGenerationResponse.class))).thenReturn(idGenerationResponse);

        CustomException exception = assertThrows(CustomException.class, () -> idgenUtil.getIdList(requestInfo, "pg.citya", "advocate.id", "ADV-[cy:yyyy]-[SEQ_ADV]", 3));

        assertEquals(IDGEN_ERROR, exception.getCode());
    }

    @Test
    void testGetIdList_NullIdResponses() {
        IdGenerationResponse idGenerationResponse = IdGenerationResponse.builder()
                .idResponses(null)
                .build();

        when(restRepo.fetchResult(any(StringBuilder.class), any())).thenReturn(new Object());
        when(mapper.convertValue(any(), eq(IdGenerationResponse.class))).thenReturn(idGenerationResponse);

        CustomException exception = assertThrows(CustomException.class, () -> idgenUtil.getIdList(requestInfo, "pg.citya", "advocate.id", "ADV-[cy:yyyy]-[SEQ_ADV]", 3));

        assertEquals(IDGEN_ERROR, exception.getCode());
    }

    @Test
    void testGetIdList_MultipleIds() {
        IdResponse idResponse1 = IdResponse.builder().id("ID-001").build();
        IdResponse idResponse2 = IdResponse.builder().id("ID-002").build();
        IdResponse idResponse3 = IdResponse.builder().id("ID-003").build();
        IdResponse idResponse4 = IdResponse.builder().id("ID-004").build();
        IdResponse idResponse5 = IdResponse.builder().id("ID-005").build();

        IdGenerationResponse idGenerationResponse = IdGenerationResponse.builder()
                .idResponses(Arrays.asList(idResponse1, idResponse2, idResponse3, idResponse4, idResponse5))
                .build();

        when(restRepo.fetchResult(any(StringBuilder.class), any())).thenReturn(new Object());
        when(mapper.convertValue(any(), eq(IdGenerationResponse.class))).thenReturn(idGenerationResponse);

        List<String> result = idgenUtil.getIdList(requestInfo, "pg.citya", "advocate.id", "ADV-[cy:yyyy]-[SEQ_ADV]", 5);

        assertNotNull(result);
        assertEquals(5, result.size());
        assertTrue(result.contains("ID-001"));
        assertTrue(result.contains("ID-005"));
    }

    @Test
    void testGetIdList_VerifyUrlConstruction() {
        IdResponse idResponse = IdResponse.builder().id("ID-001").build();
        IdGenerationResponse idGenerationResponse = IdGenerationResponse.builder()
                .idResponses(Collections.singletonList(idResponse))
                .build();

        when(restRepo.fetchResult(any(StringBuilder.class), any())).thenReturn(new Object());
        when(mapper.convertValue(any(), eq(IdGenerationResponse.class))).thenReturn(idGenerationResponse);

        idgenUtil.getIdList(requestInfo, "pg.citya", "advocate.id", "ADV-[cy:yyyy]-[SEQ_ADV]", 1);

        verify(configs, times(1)).getIdGenHost();
        verify(configs, times(1)).getIdGenPath();
    }
}
