package org.pucar.dristi.web.controllers;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.egov.common.contract.request.RequestInfo;
import org.egov.common.contract.response.ResponseInfo;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mockito;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.context.annotation.Import;
import org.springframework.http.MediaType;
import org.springframework.test.context.junit.jupiter.SpringExtension;
import org.springframework.test.web.servlet.MockMvc;
import org.pucar.dristi.TestConfiguration;
import org.pucar.dristi.service.BankDetailsService;
import org.pucar.dristi.util.ResponseInfoFactory;
import org.pucar.dristi.web.models.BankDetails;
import org.pucar.dristi.web.models.BankDetailsSearchRequest;

import java.util.Collections;

import static org.hamcrest.Matchers.hasSize;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
* API tests for BankDetailsApiController
*/
@ExtendWith(SpringExtension.class)
@WebMvcTest(BankDetailsApiController.class)
@Import(TestConfiguration.class)
class BankDetailsApiControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private BankDetailsService bankDetailsService;

    @MockBean
    private ResponseInfoFactory responseInfoFactory;

    @Autowired
    private ObjectMapper objectMapper;

    @Test
    void bankDetailsV1SearchPostSuccess() throws Exception {
        when(bankDetailsService.searchBankDetails(any(BankDetailsSearchRequest.class)))
                .thenReturn(Collections.singletonList(BankDetails.builder().ifsc("IFSC1").name("Bank").branch("Branch").build()));
        when(responseInfoFactory.createResponseInfoFromRequestInfo(any(RequestInfo.class), Mockito.eq(true)))
                .thenReturn(ResponseInfo.builder().apiId("api").build());

        String body = "{\"RequestInfo\":{},\"criteria\":[{\"ifsc\":\"IFSC1\"}]}";

        mockMvc.perform(post("/v1/_search")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body))
                .andExpect(status().isAccepted())
                .andExpect(jsonPath("$.bankDetails", hasSize(1)))
                .andExpect(jsonPath("$.bankDetails[0].ifsc").value("IFSC1"));
    }

    @Test
    void bankDetailsV1SearchPostBadRequestWhenMissingBody() throws Exception {
        mockMvc.perform(post("/v1/_search")
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isBadRequest());
    }

}
