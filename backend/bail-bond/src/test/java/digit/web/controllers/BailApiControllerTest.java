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
* API tests for BailApiController
*/
@Ignore
@RunWith(SpringRunner.class)
@WebMvcTest(BailApiController.class)
@Import(TestConfiguration.class)
public class BailApiControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Test
    public void bailv1CreatePostSuccess() throws Exception {
        mockMvc.perform(post("/v1/_create").contentType(MediaType
        .APPLICATION_JSON_UTF8))
        .andExpect(status().isOk());
    }

    @Test
    public void bailV1CreatePostFailure() throws Exception {
        mockMvc.perform(post("/v1/_create").contentType(MediaType
        .APPLICATION_JSON_UTF8))
        .andExpect(status().isBadRequest());
    }

    @Test
    public void bailv1SearchPostSuccess() throws Exception {
        mockMvc.perform(post("/v1/_search").contentType(MediaType
        .APPLICATION_JSON_UTF8))
        .andExpect(status().isOk());
    }

    @Test
    public void bailv1SearchPostFailure() throws Exception {
        mockMvc.perform(post("/v1/_search").contentType(MediaType
        .APPLICATION_JSON_UTF8))
        .andExpect(status().isBadRequest());
    }

    @Test
    public void v1UpdatePostSuccess() throws Exception {
        mockMvc.perform(post("/v1/_update").contentType(MediaType
        .APPLICATION_JSON_UTF8))
        .andExpect(status().isOk());
    }

    @Test
    public void v1UpdatePostFailure() throws Exception {
        mockMvc.perform(post("/v1/_update").contentType(MediaType
        .APPLICATION_JSON_UTF8))
        .andExpect(status().isBadRequest());
    }

}
