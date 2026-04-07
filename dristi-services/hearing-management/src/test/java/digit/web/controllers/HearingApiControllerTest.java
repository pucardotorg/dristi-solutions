package digit.web.controllers;

import org.junit.Test;
import org.junit.Ignore;
import org.junit.runner.RunWith;
import org.springframework.test.context.junit4.SpringRunner;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.context.annotation.Import;
import org.springframework.http.MediaType;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import digit.TestConfiguration;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
* API tests for HearingApiController
*/
@Ignore
@RunWith(SpringRunner.class)
@WebMvcTest(HearingApiController.class)
@Import(TestConfiguration.class)
public class HearingApiControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Test
    public void hearingV1CreatePostSuccess() throws Exception {
        mockMvc.perform(post("/hearing/v1/create").contentType(MediaType
        .APPLICATION_JSON_UTF8))
        .andExpect(status().isOk());
    }

    @Test
    public void hearingV1CreatePostFailure() throws Exception {
        mockMvc.perform(post("/hearing/v1/create").contentType(MediaType
        .APPLICATION_JSON_UTF8))
        .andExpect(status().isBadRequest());
    }

    @Test
    public void hearingV1ExistsPostSuccess() throws Exception {
        mockMvc.perform(post("/hearing/v1/exists").contentType(MediaType
        .APPLICATION_JSON_UTF8))
        .andExpect(status().isOk());
    }

    @Test
    public void hearingV1ExistsPostFailure() throws Exception {
        mockMvc.perform(post("/hearing/v1/exists").contentType(MediaType
        .APPLICATION_JSON_UTF8))
        .andExpect(status().isBadRequest());
    }

    @Test
    public void hearingV1SearchPostSuccess() throws Exception {
        mockMvc.perform(post("/hearing/v1/search").contentType(MediaType
        .APPLICATION_JSON_UTF8))
        .andExpect(status().isOk());
    }

    @Test
    public void hearingV1SearchPostFailure() throws Exception {
        mockMvc.perform(post("/hearing/v1/search").contentType(MediaType
        .APPLICATION_JSON_UTF8))
        .andExpect(status().isBadRequest());
    }

    @Test
    public void hearingV1UpdatePostSuccess() throws Exception {
        mockMvc.perform(post("/hearing/v1/update").contentType(MediaType
        .APPLICATION_JSON_UTF8))
        .andExpect(status().isOk());
    }

    @Test
    public void hearingV1UpdatePostFailure() throws Exception {
        mockMvc.perform(post("/hearing/v1/update").contentType(MediaType
        .APPLICATION_JSON_UTF8))
        .andExpect(status().isBadRequest());
    }

    @Test
    public void hearingV1UpdateTimePostSuccess() throws Exception {
        mockMvc.perform(post("/hearing/v1/update/time").contentType(MediaType
        .APPLICATION_JSON_UTF8))
        .andExpect(status().isOk());
    }

    @Test
    public void hearingV1UpdateTimePostFailure() throws Exception {
        mockMvc.perform(post("/hearing/v1/update/time").contentType(MediaType
        .APPLICATION_JSON_UTF8))
        .andExpect(status().isBadRequest());
    }

    @Test
    public void hearingV1UpdateTranscriptPostSuccess() throws Exception {
        mockMvc.perform(post("/hearing/v1/updateTranscript").contentType(MediaType
        .APPLICATION_JSON_UTF8))
        .andExpect(status().isOk());
    }

    @Test
    public void hearingV1UpdateTranscriptPostFailure() throws Exception {
        mockMvc.perform(post("/hearing/v1/updateTranscript").contentType(MediaType
        .APPLICATION_JSON_UTF8))
        .andExpect(status().isBadRequest());
    }

}
