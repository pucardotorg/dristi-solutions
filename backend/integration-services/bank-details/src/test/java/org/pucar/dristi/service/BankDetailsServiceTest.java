package org.pucar.dristi.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.node.JsonNodeFactory;
import com.fasterxml.jackson.databind.node.ObjectNode;
import org.egov.tracer.model.CustomException;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.pucar.dristi.repository.BankDetailsRepository;
import org.pucar.dristi.web.models.BankDetails;
import org.pucar.dristi.web.models.BankDetailsSearchCriteria;
import org.pucar.dristi.web.models.BankDetailsSearchRequest;

import java.util.Collections;
import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class BankDetailsServiceTest {

    @Mock
    private BankDetailsRepository bankDetailsRepository;

    @InjectMocks
    private BankDetailsService bankDetailsService;

    @Test
    void shouldReturnBankDetailsForEachCriteria() {
        BankDetailsSearchCriteria criteria = BankDetailsSearchCriteria.builder().ifsc("IFSC0001").build();
        BankDetailsSearchRequest request = BankDetailsSearchRequest.builder()
                .criteria(Collections.singletonList(criteria))
                .build();

        ObjectNode node = JsonNodeFactory.instance.objectNode();
        node.put("BANK", "Test Bank");
        node.put("BRANCH", "Test Branch");
        node.put("IFSC", "IFSC0001");

        when(bankDetailsRepository.fetchBankDetails("IFSC0001")).thenReturn(node);

        List<BankDetails> result = bankDetailsService.searchBankDetails(request);

        assertEquals(1, result.size());
        BankDetails bankDetails = result.get(0);
        assertEquals("Test Bank", bankDetails.getName());
        assertEquals("Test Branch", bankDetails.getBranch());
        assertEquals("IFSC0001", bankDetails.getIfsc());
    }

    @Test
    void shouldThrowWhenBankDetailsNotFound() {
        BankDetailsSearchCriteria criteria = BankDetailsSearchCriteria.builder().ifsc("MISSING").build();
        BankDetailsSearchRequest request = BankDetailsSearchRequest.builder()
                .criteria(Collections.singletonList(criteria))
                .build();

        when(bankDetailsRepository.fetchBankDetails("MISSING")).thenReturn(null);

        assertThrows(CustomException.class, () -> bankDetailsService.searchBankDetails(request));
    }
}
