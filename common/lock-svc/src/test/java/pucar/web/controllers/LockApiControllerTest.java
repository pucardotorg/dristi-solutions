package pucar.web.controllers;

import pucar.web.models.ErrorResponse;
import pucar.web.models.LockRequest;
import pucar.web.models.LockResponse;
import org.junit.Test;
import org.junit.Ignore;
import org.junit.runner.RunWith;
import org.springframework.test.context.junit4.SpringRunner;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.context.annotation.Import;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import pucar.TestConfiguration;

    import java.util.ArrayList;
    import java.util.HashMap;
    import java.util.List;
    import java.util.Map;

import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
* API tests for LockApiController
*/
@Ignore
@RunWith(SpringRunner.class)
@WebMvcTest(LockApiController.class)
@Import(TestConfiguration.class)
public class LockApiControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Test
    public void searchLockSuccess() throws Exception {
        mockMvc.perform(post("/lock/v1/get").contentType(MediaType
        .APPLICATION_JSON_UTF8))
        .andExpect(status().isOk());
    }

    @Test
    public void searchLockFailure() throws Exception {
        mockMvc.perform(post("/lock/v1/get").contentType(MediaType
        .APPLICATION_JSON_UTF8))
        .andExpect(status().isBadRequest());
    }

    @Test
    public void setLockSuccess() throws Exception {
        mockMvc.perform(post("/lock/v1/set").contentType(MediaType
        .APPLICATION_JSON_UTF8))
        .andExpect(status().isOk());
    }

    @Test
    public void setLockFailure() throws Exception {
        mockMvc.perform(post("/lock/v1/set").contentType(MediaType
        .APPLICATION_JSON_UTF8))
        .andExpect(status().isBadRequest());
    }

}
