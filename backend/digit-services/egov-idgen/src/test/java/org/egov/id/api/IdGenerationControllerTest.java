package org.egov.id.api;

import com.fasterxml.jackson.databind.ObjectMapper;
import java.util.ArrayList;
import org.egov.id.model.IdGenerationRequest;
import org.egov.id.model.RequestInfo;
import org.egov.id.service.IdGenerationService;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.test.context.TestPropertySource;
import org.springframework.http.MediaType;
import org.springframework.test.context.ContextConfiguration;
import org.springframework.test.context.junit.jupiter.SpringExtension;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.request.MockMvcRequestBuilders;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;

import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(IdGenerationController.class)
@ExtendWith(SpringExtension.class)
@ContextConfiguration(classes = IdGenerationControllerTest.TestApplication.class)
@TestPropertySource(properties = "logging.system=org.springframework.boot.logging.log4j2.Log4J2LoggingSystem")
class IdGenerationControllerTest {

    static {
        System.setProperty("org.springframework.boot.logging.LoggingSystem", "org.springframework.boot.logging.log4j2.Log4J2LoggingSystem");
    }

    @SpringBootApplication
    static class TestApplication {
    }

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockBean
    private IdGenerationService idGenerationService;

    @Test
    void testGenerateIdResponse() throws Exception {
        IdGenerationRequest idGenerationRequest = new IdGenerationRequest();
        idGenerationRequest.setIdRequests(new ArrayList<>());
        idGenerationRequest.setRequestInfo(new RequestInfo());

        when(idGenerationService.generateIdResponse(any(IdGenerationRequest.class)))
                .thenReturn(new org.egov.id.model.IdGenerationResponse());

        String content = objectMapper.writeValueAsString(idGenerationRequest);

        mockMvc.perform(MockMvcRequestBuilders.post("/id/_generate")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(content))
                .andExpect(status().isOk());
    }
}