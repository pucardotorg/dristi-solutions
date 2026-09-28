package org.egov.id.service;

import org.egov.id.model.IdRequest;
import org.egov.id.model.RequestInfo;
import org.egov.mdms.model.MdmsResponse;
import org.egov.mdms.service.MdmsClientService;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.mockito.junit.jupiter.MockitoSettings;
import org.mockito.quality.Strictness;

import java.io.IOException;
import java.util.HashMap;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
class MdmsServiceTest {

    @Mock
    private MdmsClientService mdmsClientService;

    @InjectMocks
    private MdmsService mdmsService;

    @Test
    void testGetMasterData4() throws IOException {
        when(mdmsClientService.getMaster(any(), anyString(), any()))
                .thenThrow(new RuntimeException("MDMS Error"));

        RequestInfo requestInfo = new RequestInfo();
        assertThrows(RuntimeException.class, () -> mdmsService.getMasterData(requestInfo, "42", new HashMap<>()));
    }

    @Test
    void testGetIdFormat_ThrowsExceptionOnClientError() throws IOException {
        when(mdmsClientService.getMaster(any(), anyString(), any()))
                .thenThrow(new RuntimeException("Connection Failed"));

        RequestInfo requestInfo = new RequestInfo();
        assertNull(mdmsService.getIdFormat(requestInfo, new IdRequest()));
    }

    @Test
    void testGetIdFormat_ReturnsNullOnEmptyResponse() throws IOException {
        MdmsResponse emptyResponse = new MdmsResponse();
        emptyResponse.setMdmsRes(new HashMap<>());

        when(mdmsClientService.getMaster(any(), anyString(), any())).thenReturn(emptyResponse);

        RequestInfo requestInfo = new RequestInfo();
        assertNull(mdmsService.getIdFormat(requestInfo, new IdRequest()));
    }
}