package digit.web.controllers;

import digit.TestConfiguration;
import org.junit.Ignore;
import org.junit.Test;
import org.junit.runner.RunWith;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.context.annotation.Import;
import org.springframework.http.MediaType;
import org.springframework.test.context.junit4.SpringRunner;
import org.springframework.test.web.servlet.MockMvc;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
* API tests for DigitalizedDocumentsApiController
*/
@Ignore
@RunWith(SpringRunner.class)
@WebMvcTest(DigitalizedDocumentsApiController.class)
@Import(TestConfiguration.class)
public class DigitalizedDocumentsApiControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Test
    public void digitalizedDocumentsV1CreatePostSuccess() throws Exception {
        mockMvc.perform(post("/digitalized-documents/v1/_create").contentType(MediaType
        .APPLICATION_JSON_UTF8))
        .andExpect(status().isOk());
    }

    @Test
    public void digitalizedDocumentsV1CreatePostFailure() throws Exception {
        mockMvc.perform(post("/digitalized-documents/v1/_create").contentType(MediaType
        .APPLICATION_JSON_UTF8))
        .andExpect(status().isBadRequest());
    }

    @Test
    public void digitalizedDocumentsV1SearchPostSuccess() throws Exception {
        mockMvc.perform(post("/digitalized-documents/v1/_search").contentType(MediaType
        .APPLICATION_JSON_UTF8))
        .andExpect(status().isOk());
    }

    @Test
    public void digitalizedDocumentsV1SearchPostFailure() throws Exception {
        mockMvc.perform(post("/digitalized-documents/v1/_search").contentType(MediaType
        .APPLICATION_JSON_UTF8))
        .andExpect(status().isBadRequest());
    }

    @Test
    public void digitalizedDocumentsV1UpdatePostSuccess() throws Exception {
        mockMvc.perform(post("/digitalized-documents/v1/_update").contentType(MediaType
        .APPLICATION_JSON_UTF8))
        .andExpect(status().isOk());
    }

    @Test
    public void digitalizedDocumentsV1UpdatePostFailure() throws Exception {
        mockMvc.perform(post("/digitalized-documents/v1/_update").contentType(MediaType
        .APPLICATION_JSON_UTF8))
        .andExpect(status().isBadRequest());
    }

}
