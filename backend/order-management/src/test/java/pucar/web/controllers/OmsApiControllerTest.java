package pucar.web.controllers;

import org.junit.Test;
import org.junit.Ignore;
import org.junit.runner.RunWith;
import org.springframework.test.context.junit4.SpringRunner;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.context.annotation.Import;
import org.springframework.http.MediaType;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import pucar.TestConfiguration;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
* API tests for OmsApiController
*/
@Ignore
@RunWith(SpringRunner.class)
@WebMvcTest(OmsApiController.class)
@Import(TestConfiguration.class)
public class OmsApiControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Test
    public void getOrdersToSignSuccess() throws Exception {
        mockMvc.perform(post("/oms/v1/_getOrdersToSign").contentType(MediaType
        .APPLICATION_JSON_UTF8))
        .andExpect(status().isOk());
    }

    @Test
    public void getOrdersToSignFailure() throws Exception {
        mockMvc.perform(post("/oms/v1/_getOrdersToSign").contentType(MediaType
        .APPLICATION_JSON_UTF8))
        .andExpect(status().isBadRequest());
    }

    @Test
    public void updateSignedOrdersSuccess() throws Exception {
        mockMvc.perform(post("/oms/v1/_updateSignedOrders").contentType(MediaType
        .APPLICATION_JSON_UTF8))
        .andExpect(status().isOk());
    }

    @Test
    public void updateSignedOrdersFailure() throws Exception {
        mockMvc.perform(post("/oms/v1/_updateSignedOrders").contentType(MediaType
        .APPLICATION_JSON_UTF8))
        .andExpect(status().isBadRequest());
    }

}
