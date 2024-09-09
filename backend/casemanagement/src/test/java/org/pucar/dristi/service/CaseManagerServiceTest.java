package org.pucar.dristi.service;

import org.egov.tracer.model.CustomException;
import org.json.JSONArray;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.MockitoAnnotations;
import org.pucar.dristi.config.Configuration;
import org.pucar.dristi.repository.CaseSummaryRepository;
import org.pucar.dristi.repository.ElasticSearchRepository;
import org.pucar.dristi.util.jsonmapper.*;
import org.pucar.dristi.web.models.*;
import java.util.List;
import java.util.ArrayList;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

class CaseManagerServiceTest {

    @Mock
    private ElasticSearchRepository esRepository;
    @Mock
    private Configuration configuration;
    @Mock
    private CourtCaseMapper courtCaseMapper;
    @Mock
    private HearingMapper hearingMapper;
    @Mock
    private WitnessMapper witnessMapper;
    @Mock
    private OrderMapper orderMapper;
    @Mock
    private TaskMapper taskMapper;
    @Mock
    private ApplicationMapper applicationMapper;
    @Mock
    private ArtifactMapper artifactMapper;
    @Mock
    private CaseSummaryRepository caseSummaryRepository;

    @InjectMocks
    private CaseManagerService caseManagerService;

    @BeforeEach
    void setUp() {
        MockitoAnnotations.openMocks(this);
    }

    @Test
    void testRetrieveDocuments_success() {
        // Arrange
        String searchKeyValue = "123";
        String indexName = "testIndex";
        String searchKeyPath = "path1";
        String sortKeyPath = "path2";
        String sortOrder = "asc";
        String uri = "http://mockuri";
        String esResponse = "{ \"hits\": { \"hits\": [ { \"_source\": { \"mockField\": \"mockValue\" } } ] } }";

        when(configuration.getEsHostUrl()).thenReturn("http://mockuri");
        when(configuration.getSearchPath()).thenReturn("/_search");
        when(esRepository.fetchDocuments(anyString(), anyString())).thenReturn(esResponse);

        // Act
        List<CourtCase> courtCases = caseManagerService.retrieveDocuments(searchKeyValue, indexName, searchKeyPath, sortKeyPath, sortOrder, json -> new CourtCase(), "MOCK_ERROR");

        // Assert
        assertNotNull(courtCases);
        assertEquals(1, courtCases.size());
    }

    @Test
    void testRetrieveDocuments_exceptionHandling() {
        // Arrange
        when(esRepository.fetchDocuments(anyString(), anyString())).thenThrow(new RuntimeException("Mocked Exception"));

        // Act & Assert
        CustomException exception = assertThrows(CustomException.class, () -> {
            caseManagerService.retrieveDocuments("123", "testIndex", "path1", "path2", "asc", json -> new CourtCase(), "MOCK_ERROR");
        });
        assertEquals("MOCK_ERROR", exception.getCode());
    }

    @Test
    void testConstructJsonArray_success() {
        // Arrange
        String json = "{ \"hits\": { \"hits\": [ { \"_source\": { \"mockField\": \"mockValue\" } } ] } }";

        // Act
        JSONArray jsonArray = caseManagerService.constructJsonArray(json, "$.hits.hits");

        // Assert
        assertNotNull(jsonArray);
        assertEquals(1, jsonArray.length());
    }

    @Test
    void testConstructJsonArray_pathNotFound() {
        // Arrange
        String json = "{}"; // No valid path

        // Act & Assert
        CustomException exception = assertThrows(CustomException.class, () -> {
            caseManagerService.constructJsonArray(json, "$.invalid.path");
        });
        assertEquals("JSON_PATH_NOT_FOUND", exception.getCode());
    }

    @Test
    void testGetCaseSummary_success() {
        // Arrange
        CaseRequest caseRequest = new CaseRequest();
        List<CaseSummary> mockSummary = new ArrayList<>();
        when(caseSummaryRepository.getCaseSummary(caseRequest)).thenReturn(mockSummary);

        // Act
        List<CaseSummary> caseSummaries = caseManagerService.getCaseSummary(caseRequest);

        // Assert
        assertNotNull(caseSummaries);
        verify(caseSummaryRepository, times(1)).getCaseSummary(caseRequest);
    }

    @Test
    void testGetCaseSummary_exceptionHandling() {
        // Arrange
        CaseRequest caseRequest = new CaseRequest();
        when(caseSummaryRepository.getCaseSummary(caseRequest)).thenThrow(new RuntimeException("Mocked Exception"));

        // Act & Assert
        CustomException exception = assertThrows(CustomException.class, () -> caseManagerService.getCaseSummary(caseRequest));
        assertEquals("CASE_SUMMARY_ERROR", exception.getCode());
    }
}

