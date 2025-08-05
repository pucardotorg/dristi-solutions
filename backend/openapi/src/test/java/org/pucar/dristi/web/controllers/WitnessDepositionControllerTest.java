package org.pucar.dristi.web.controllers;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.pucar.dristi.service.WitnessDepositionService;
import org.pucar.dristi.web.models.witnessdeposition.OpenApiEvidenceResponse;
import org.pucar.dristi.web.models.witnessdeposition.OpenApiEvidenceSearchRequest;
import org.pucar.dristi.web.models.witnessdeposition.OpenApiEvidenceUpdateRequest;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
public class WitnessDepositionControllerTest {

    @Mock
    private WitnessDepositionService witnessDepositionService;

    @InjectMocks
    private WitnessDepositionController witnessDepositionController;

    @Test
    void testSearchWitnessDeposition_success() {
        OpenApiEvidenceSearchRequest request = new OpenApiEvidenceSearchRequest();
        OpenApiEvidenceResponse mockResponse = new OpenApiEvidenceResponse();

        when(witnessDepositionService.searchWitnessDepositionByMobileNumber(request)).thenReturn(mockResponse);

        ResponseEntity<OpenApiEvidenceResponse> response = witnessDepositionController.searchWitnessDeposition(request);

        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertEquals(mockResponse, response.getBody());
        verify(witnessDepositionService, times(1)).searchWitnessDepositionByMobileNumber(request);
    }

    @Test
    void testUpdateWitnessDeposition_success() {
        OpenApiEvidenceUpdateRequest request = new OpenApiEvidenceUpdateRequest();
        OpenApiEvidenceResponse mockResponse = new OpenApiEvidenceResponse();

        when(witnessDepositionService.updateWitnessDeposition(request)).thenReturn(mockResponse);

        ResponseEntity<OpenApiEvidenceResponse> response = witnessDepositionController.updateWitnessDeposition(request);

        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertEquals(mockResponse, response.getBody());
        verify(witnessDepositionService, times(1)).updateWitnessDeposition(request);
    }

    @Test
    void testSearchWitnessDeposition_serviceReturnsNull() {
        OpenApiEvidenceSearchRequest request = new OpenApiEvidenceSearchRequest();
        when(witnessDepositionService.searchWitnessDepositionByMobileNumber(request)).thenReturn(null);

        ResponseEntity<OpenApiEvidenceResponse> response = witnessDepositionController.searchWitnessDeposition(request);

        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertNull(response.getBody());
        verify(witnessDepositionService, times(1)).searchWitnessDepositionByMobileNumber(request);
    }

    @Test
    void testUpdateWitnessDeposition_serviceReturnsNull() {
        OpenApiEvidenceUpdateRequest request = new OpenApiEvidenceUpdateRequest();
        when(witnessDepositionService.updateWitnessDeposition(request)).thenReturn(null);

        ResponseEntity<OpenApiEvidenceResponse> response = witnessDepositionController.updateWitnessDeposition(request);

        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertNull(response.getBody());
        verify(witnessDepositionService, times(1)).updateWitnessDeposition(request);
    }

}
