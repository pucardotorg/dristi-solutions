package org.egov.id.service;

import org.egov.id.model.IdGenerationRequest;
import org.egov.id.model.IdRequest;
import org.egov.id.model.RequestInfo;
import org.egov.id.model.ResponseInfoFactory;
import org.egov.tracer.model.CustomException;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.jdbc.core.JdbcTemplate;

import java.util.ArrayList;
import java.util.Collections;

import static org.junit.jupiter.api.Assertions.assertThrows;

@ExtendWith(MockitoExtension.class)
class IdGenerationServiceTest {

    @Mock
    private ResponseInfoFactory responseInfoFactory;

    @Mock
    private JdbcTemplate jdbcTemplate;

    @Mock
    private MdmsService mdmsService;

    @InjectMocks
    private IdGenerationService idGenerationService;

    @Test
    void testGenerateIdResponse_EmptyRequest() {
        IdGenerationRequest request = new IdGenerationRequest();
        request.setIdRequests(new ArrayList<>());
        request.setRequestInfo(new RequestInfo());

        assertThrows(CustomException.class, () -> idGenerationService.generateIdResponse(request));
    }

    @Test
    void testGenerateIdResponse_TenantIdNull() throws Exception {
        IdRequest idRequest = new IdRequest();
        idRequest.setIdName("IdName");
        idRequest.setTenantId(null);
        idRequest.setFormat("TEST-[city]");
        idRequest.setCount(1);

        IdGenerationRequest request = new IdGenerationRequest();
        request.setIdRequests(Collections.singletonList(idRequest));
        request.setRequestInfo(new RequestInfo());

        assertThrows(CustomException.class, () -> idGenerationService.generateIdResponse(request));
    }

    @Test
    void testGenerateIdResponse_IdNameNull() {
        IdRequest idRequest = new IdRequest();
        idRequest.setIdName(null);
        idRequest.setTenantId("pb.amritsar");
        idRequest.setCount(1);

        IdGenerationRequest request = new IdGenerationRequest();
        request.setIdRequests(Collections.singletonList(idRequest));
        request.setRequestInfo(new RequestInfo());

        assertThrows(CustomException.class, () -> idGenerationService.generateIdResponse(request));
    }

    @Test
    void testGenerateIdResponse_NullCount() {
        IdRequest idRequest = new IdRequest();
        idRequest.setIdName("IdName");
        idRequest.setTenantId("pb.amritsar");
        idRequest.setCount(null);

        IdGenerationRequest request = new IdGenerationRequest();
        request.setIdRequests(Collections.singletonList(idRequest));
        request.setRequestInfo(new RequestInfo());

        assertThrows(CustomException.class, () -> idGenerationService.generateIdResponse(request));
    }
}