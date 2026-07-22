package org.pucar.dristi.config;

import com.fasterxml.jackson.databind.ObjectMapper;
import net.minidev.json.JSONArray;
import org.egov.mdms.model.MdmsResponse;
import org.egov.tracer.model.CustomException;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.Mock;
import org.mockito.MockitoAnnotations;
import org.pucar.dristi.util.MdmsUtil;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.lenient;
import static org.mockito.Mockito.when;

public class MdmsDataConfigTest {

    private static final String TENANT_ID = "pg";
    private static final String ORDER_MODULE = "order";
    private static final String NON_OVERLAPPING = "NonOverlappingOrders";
    private static final String NON_REPEATING = "NonRepeatingCompositeOrders";
    private static final String ITEM_TEXT = "ItemText";

    @Mock
    private MdmsUtil mdmsUtil;

    @Mock
    private Configuration configuration;

    private final ObjectMapper objectMapper = new ObjectMapper();

    private MdmsDataConfig mdmsDataConfig;

    @BeforeEach
    public void setUp() {
        MockitoAnnotations.openMocks(this);
        lenient().when(configuration.getTenantId()).thenReturn(TENANT_ID);
        lenient().when(configuration.getOrderModule()).thenReturn(ORDER_MODULE);
        lenient().when(configuration.getMdmsNonOverlappingOrders()).thenReturn(NON_OVERLAPPING);
        lenient().when(configuration.getMdmsNonRepeatingCompositeOrders()).thenReturn(NON_REPEATING);
        lenient().when(configuration.getMdmsItemText()).thenReturn(ITEM_TEXT);
        mdmsDataConfig = new MdmsDataConfig(mdmsUtil, objectMapper, configuration);
    }

    /**
     * Builds a serialized MdmsResponse containing every master with either one dummy entry (populated)
     * or none (empty), so the loader's parse + empty-check paths can be exercised.
     */
    private String buildResponse(boolean populated) throws Exception {
        Map<String, JSONArray> module = new HashMap<>();
        for (String master : List.of(NON_OVERLAPPING, NON_REPEATING, ITEM_TEXT)) {
            JSONArray arr = new JSONArray();
            if (populated) {
                arr.add(new HashMap<>());
            }
            module.put(master, arr);
        }
        Map<String, Map<String, JSONArray>> res = new HashMap<>();
        res.put(ORDER_MODULE, module);
        MdmsResponse response = new MdmsResponse();
        response.setMdmsRes(res);
        return objectMapper.writeValueAsString(response);
    }

    @Test
    public void loadConfigData_populatesAllMasters_whenDataPresent() throws Exception {
        when(mdmsUtil.fetchMdmsData(any(), anyString(), anyString(), any())).thenReturn(buildResponse(true));

        assertDoesNotThrow(() -> mdmsDataConfig.loadConfigData());

        assertEquals(1, mdmsDataConfig.getNonOverlappingOrdersMdmsData().size());
        assertEquals(1, mdmsDataConfig.getNonRepeatingOrdersMdmsData().size());
        assertEquals(1, mdmsDataConfig.getItemTextMdmsData().size());
    }

    @Test
    public void loadConfigData_throws_whenFetchReturnsEmptyString() {
        // MdmsUtil.fetchMdmsData returns "" on failure; objectMapper.readValue("") then throws.
        when(mdmsUtil.fetchMdmsData(any(), anyString(), anyString(), any())).thenReturn("");

        CustomException ex = assertThrows(CustomException.class, () -> mdmsDataConfig.loadConfigData());
        assertEquals("MDMS_DATA_LOAD_ERROR", ex.getCode());
    }

    @Test
    public void loadConfigData_throws_whenMasterLoadsEmpty() throws Exception {
        when(mdmsUtil.fetchMdmsData(any(), anyString(), anyString(), any())).thenReturn(buildResponse(false));

        CustomException ex = assertThrows(CustomException.class, () -> mdmsDataConfig.loadConfigData());
        assertEquals("MDMS_DATA_LOAD_ERROR", ex.getCode());
    }

    @Test
    public void loadConfigData_reportsAllBrokenMasters_inSingleException() {
        // All three masters fail; the combined message must mention every one of them.
        when(mdmsUtil.fetchMdmsData(any(), anyString(), anyString(), any())).thenReturn("");

        CustomException ex = assertThrows(CustomException.class, () -> mdmsDataConfig.loadConfigData());
        assertTrue(ex.getMessage().contains("NonOverlappingOrdersMdmsData"));
        assertTrue(ex.getMessage().contains("NonRepeatingOrdersMdmsData"));
        assertTrue(ex.getMessage().contains("ItemTextMdmsData"));
    }
}
