package notification.web.controllers;

import org.junit.Test;
import org.junit.Ignore;
import org.junit.runner.RunWith;
import org.springframework.test.context.junit4.SpringRunner;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.context.annotation.Import;
import org.springframework.http.MediaType;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import notification.TestConfiguration;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
* API tests for NotificationApiController
*/
@Ignore
@RunWith(SpringRunner.class)
@WebMvcTest(NotificationApiController.class)
@Import(TestConfiguration.class)
public class NotificationApiControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Test
    public void notificationV1CreatePostSuccess() throws Exception {
        mockMvc.perform(post("/notification/v1/create").contentType(MediaType
        .APPLICATION_JSON_UTF8))
        .andExpect(status().isOk());
    }

    @Test
    public void notificationV1CreatePostFailure() throws Exception {
        mockMvc.perform(post("/notification/v1/create").contentType(MediaType
        .APPLICATION_JSON_UTF8))
        .andExpect(status().isBadRequest());
    }

    @Test
    public void notificationV1ExistsPostSuccess() throws Exception {
        mockMvc.perform(post("/notification/v1/exists").contentType(MediaType
        .APPLICATION_JSON_UTF8))
        .andExpect(status().isOk());
    }

    @Test
    public void notificationV1ExistsPostFailure() throws Exception {
        mockMvc.perform(post("/notification/v1/exists").contentType(MediaType
        .APPLICATION_JSON_UTF8))
        .andExpect(status().isBadRequest());
    }

    @Test
    public void notificationV1SearchPostSuccess() throws Exception {
        mockMvc.perform(post("/notification/v1/search").contentType(MediaType
        .APPLICATION_JSON_UTF8))
        .andExpect(status().isOk());
    }

    @Test
    public void notificationV1SearchPostFailure() throws Exception {
        mockMvc.perform(post("/notification/v1/search").contentType(MediaType
        .APPLICATION_JSON_UTF8))
        .andExpect(status().isBadRequest());
    }

    @Test
    public void notificationV1UpdatePostSuccess() throws Exception {
        mockMvc.perform(post("/notification/v1/update").contentType(MediaType
        .APPLICATION_JSON_UTF8))
        .andExpect(status().isOk());
    }

    @Test
    public void notificationV1UpdatePostFailure() throws Exception {
        mockMvc.perform(post("/notification/v1/update").contentType(MediaType
        .APPLICATION_JSON_UTF8))
        .andExpect(status().isBadRequest());
    }

}
