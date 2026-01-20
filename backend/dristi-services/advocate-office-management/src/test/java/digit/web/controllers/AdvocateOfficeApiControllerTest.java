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
 * API tests for AdvocateOfficeApiController
 */
@Ignore
@RunWith(SpringRunner.class)
@WebMvcTest(AdvocateOfficeApiController.class)
@Import(TestConfiguration.class)
public class AdvocateOfficeApiControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Test
    public void advocateOfficeV1AddMemberPostSuccess() throws Exception {
        mockMvc.perform(post("/advocate-office/v1/_addMember").contentType(MediaType
                        .APPLICATION_JSON_UTF8))
                .andExpect(status().isOk());
    }

    @Test
    public void advocateOfficeV1AddMemberPostFailure() throws Exception {
        mockMvc.perform(post("/advocate-office/v1/_addMember").contentType(MediaType
                        .APPLICATION_JSON_UTF8))
                .andExpect(status().isBadRequest());
    }

    @Test
    public void advocateOfficeV1LeaveOfficePostSuccess() throws Exception {
        mockMvc.perform(post("/advocate-office/v1/_leaveOffice").contentType(MediaType
                        .APPLICATION_JSON_UTF8))
                .andExpect(status().isOk());
    }

    @Test
    public void advocateOfficeV1LeaveOfficePostFailure() throws Exception {
        mockMvc.perform(post("/advocate-office/v1/_leaveOffice").contentType(MediaType
                        .APPLICATION_JSON_UTF8))
                .andExpect(status().isBadRequest());
    }

    @Test
    public void advocateOfficeV1SearchMemberPostSuccess() throws Exception {
        mockMvc.perform(post("/advocate-office/v1/_searchMember").contentType(MediaType
                        .APPLICATION_JSON_UTF8))
                .andExpect(status().isOk());
    }

    @Test
    public void advocateOfficeV1SearchMemberPostFailure() throws Exception {
        mockMvc.perform(post("/advocate-office/v1/_searchMember").contentType(MediaType
                        .APPLICATION_JSON_UTF8))
                .andExpect(status().isBadRequest());
    }

}
