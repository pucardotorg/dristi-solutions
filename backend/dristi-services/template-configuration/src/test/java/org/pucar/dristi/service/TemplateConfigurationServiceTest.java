package org.pucar.dristi.service;

import org.egov.tracer.model.CustomException;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.*;
import org.pucar.dristi.config.Configuration;
import org.pucar.dristi.enrichment.TemplateConfigurationEnrichment;
import org.pucar.dristi.kafka.Producer;
import org.pucar.dristi.repository.TemplateConfigurationRepository;
import org.pucar.dristi.web.models.*;

import java.util.*;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;
import static org.pucar.dristi.config.ServiceConstants.*;

@ExtendWith(org.mockito.junit.jupiter.MockitoExtension.class)
class TemplateConfigurationServiceTest {

    @Mock
    private TemplateConfigurationEnrichment enrichment;

    @Mock
    private TemplateConfigurationRepository repository;

    @Mock
    private Configuration config;

    @Mock
    private Producer producer;

    @InjectMocks
    private TemplateConfigurationService service;

    private TemplateConfigurationRequest request;
    private TemplateConfiguration template;

    @BeforeEach
    void setUp() {
        template = new TemplateConfiguration();
        template.setId(UUID.randomUUID());

        request = new TemplateConfigurationRequest();
        request.setTemplateConfiguration(template);
    }

    // =====================================================
    // CREATE TESTS
    // =====================================================

    @Test
    void testCreateTemplateConfiguration_Success() {

        when(config.getSaveTemplateConfigurationKafkaTopic()).thenReturn("save-topic");

        TemplateConfiguration result = service.createTemplateConfiguration(request);

        verify(enrichment).enrichTemplateConfigurationOnCreate(request);
        verify(producer).push("save-topic", request);

        assertEquals(template, result);
    }

    @Test
    void testCreateTemplateConfiguration_CustomExceptionRethrow() {

        doThrow(new CustomException("ERR", "error"))
                .when(enrichment).enrichTemplateConfigurationOnCreate(request);

        assertThrows(CustomException.class,
                () -> service.createTemplateConfiguration(request));
    }

    @Test
    void testCreateTemplateConfiguration_GenericExceptionWrapped() {

        doThrow(new RuntimeException("runtime"))
                .when(enrichment).enrichTemplateConfigurationOnCreate(request);

        CustomException ex = assertThrows(CustomException.class,
                () -> service.createTemplateConfiguration(request));

        assertEquals(TEMPLATE_CREATE_EXCEPTION, ex.getCode());
    }

    // =====================================================
    // SEARCH TESTS
    // =====================================================

    @Test
    void testSearchTemplateConfiguration_Success() {

        TemplateConfigurationSearchRequest searchRequest = new TemplateConfigurationSearchRequest();
        searchRequest.setCriteria(new TemplateConfigurationCriteria());

        List<TemplateConfiguration> mockList = List.of(new TemplateConfiguration());

        when(repository.getTemplateConfigurations(any(), any()))
                .thenReturn(mockList);

        List<TemplateConfiguration> result = service.searchTemplateConfiguration(searchRequest);

        assertEquals(1, result.size());
    }

    @Test
    void testSearchTemplateConfiguration_EmptyList() {

        TemplateConfigurationSearchRequest searchRequest = new TemplateConfigurationSearchRequest();
        searchRequest.setCriteria(new TemplateConfigurationCriteria());

        when(repository.getTemplateConfigurations(any(), any()))
                .thenReturn(Collections.emptyList());

        List<TemplateConfiguration> result = service.searchTemplateConfiguration(searchRequest);

        assertNotNull(result);
        assertTrue(result.isEmpty());
    }

    @Test
    void testSearchTemplateConfiguration_ExceptionWrapped() {

        TemplateConfigurationSearchRequest searchRequest = new TemplateConfigurationSearchRequest();
        searchRequest.setCriteria(new TemplateConfigurationCriteria());

        when(repository.getTemplateConfigurations(any(), any()))
                .thenThrow(new RuntimeException("DB error"));

        CustomException ex = assertThrows(CustomException.class,
                () -> service.searchTemplateConfiguration(searchRequest));

        assertEquals(TEMPLATE_SEARCH_EXCEPTION, ex.getCode());
    }

    // =====================================================
    // UPDATE TESTS
    // =====================================================

    @Test
    void testUpdateTemplateConfiguration_IdNull() {

        request.getTemplateConfiguration().setId(null);

        CustomException ex = assertThrows(CustomException.class,
                () -> service.updateTemplateConfiguration(request));

        assertEquals(TEMPLATE_UPDATE_EXCEPTION, ex.getCode());
    }

    @Test
    void testUpdateTemplateConfiguration_InvalidId() {

        when(repository.getTemplateConfigurations(any(), isNull()))
                .thenReturn(Collections.emptyList());

        CustomException ex = assertThrows(CustomException.class,
                () -> service.updateTemplateConfiguration(request));

        assertEquals(TEMPLATE_UPDATE_EXCEPTION, ex.getCode());
    }

    @Test
    void testUpdateTemplateConfiguration_Success() {

        when(repository.getTemplateConfigurations(any(), isNull()))
                .thenReturn(List.of(template));

        when(config.getUpdateTemplateConfigurationKafkaTopic())
                .thenReturn("update-topic");

        TemplateConfiguration result = service.updateTemplateConfiguration(request);

        verify(enrichment).enrichTemplateConfigurationOnUpdate(request);
        verify(producer).push("update-topic", request);

        assertEquals(template, result);
    }

    @Test
    void testUpdateTemplateConfiguration_GenericExceptionWrapped() {

        when(repository.getTemplateConfigurations(any(), isNull()))
                .thenThrow(new RuntimeException("DB error"));

        CustomException ex = assertThrows(CustomException.class,
                () -> service.updateTemplateConfiguration(request));

        assertEquals(TEMPLATE_UPDATE_EXCEPTION, ex.getCode());
    }
}
