package org.pucar.dristi.config;

import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.annotation.PostConstruct;
import lombok.Getter;
import lombok.extern.slf4j.Slf4j;
import net.minidev.json.JSONArray;
import org.egov.common.contract.request.RequestInfo;
import org.egov.mdms.model.MdmsResponse;
import org.egov.tracer.model.CustomException;
import org.pucar.dristi.util.MdmsUtil;
import org.pucar.dristi.web.models.CompositeOrderMdms;
import org.pucar.dristi.web.models.ItemTextMdms;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.util.CollectionUtils;

import java.util.ArrayList;
import java.util.List;

@Service
@Slf4j
public class MdmsDataConfig {

    private static final String MDMS_DATA_LOAD_ERROR = "MDMS_DATA_LOAD_ERROR";

    private final MdmsUtil mdmsUtil;
    private final ObjectMapper objectMapper;
    private final Configuration configuration;

    @Getter
    private List<CompositeOrderMdms> nonOverlappingOrdersMdmsData;

    @Getter
    private List<CompositeOrderMdms> nonRepeatingOrdersMdmsData;

    @Getter
    private List<ItemTextMdms> itemTextMdmsData;

    @Autowired
    public MdmsDataConfig(MdmsUtil mdmsUtil, ObjectMapper objectMapper, Configuration configuration) {
        this.mdmsUtil = mdmsUtil;
        this.objectMapper = objectMapper;
        this.configuration = configuration;
    }

    /**
     * Loads all MDMS-backed config at startup. Every master is attempted, and any that fails to load
     * or comes back empty is collected; if the collection is non-empty this throws so bean initialization
     * (and hence the whole application context) fails fast, listing every broken master in a single message.
     * This prevents pods from coming up with empty MDMS data and serving broken traffic in prod, while
     * surfacing all broken masters in one restart cycle instead of one at a time.
     */
    @PostConstruct
    public void loadConfigData() {
        List<String> failures = new ArrayList<>();

        nonOverlappingOrdersMdmsData = loadMdmsMasterData(configuration.getMdmsNonOverlappingOrders(), CompositeOrderMdms.class, "NonOverlappingOrdersMdmsData", failures);
        nonRepeatingOrdersMdmsData = loadMdmsMasterData(configuration.getMdmsNonRepeatingCompositeOrders(), CompositeOrderMdms.class, "NonRepeatingOrdersMdmsData", failures);
        itemTextMdmsData = loadMdmsMasterData(configuration.getMdmsItemText(), ItemTextMdms.class, "ItemTextMdmsData", failures);

        if (!failures.isEmpty()) {
            String message = "Failed to load MDMS data for: " + String.join("; ", failures);
            log.error(message);
            throw new CustomException(MDMS_DATA_LOAD_ERROR, message);
        }
    }

    /**
     * Fetches and parses a single MDMS master. On fetch/parse failure or an empty result the failure is
     * recorded in {@code failures} (rather than thrown here) so that every master is still attempted and
     * all failures can be reported together by {@link #loadConfigData()}.
     */
    private <T> List<T> loadMdmsMasterData(String masterName, Class<T> targetClass, String label, List<String> failures) {
        try {
            RequestInfo requestInfo = RequestInfo.builder().build();
            String mdmsDataResponse = mdmsUtil.fetchMdmsData(requestInfo, configuration.getTenantId(), configuration.getOrderModule(), List.of(masterName));
            MdmsResponse mdmsResponse = objectMapper.readValue(mdmsDataResponse, MdmsResponse.class);
            JSONArray mdmsData = mdmsResponse.getMdmsRes().get(configuration.getOrderModule()).get(masterName);

            List<T> result = new ArrayList<>();
            for (Object o : mdmsData) {
                result.add(objectMapper.convertValue(o, targetClass));
            }
            log.info("{} :: {}", label, result);

            if (CollectionUtils.isEmpty(result)) {
                log.error("{} loaded empty from MDMS", label);
                failures.add(label + " (empty)");
            }
            return result;
        } catch (Exception e) {
            log.error("Unable to create {}", label, e);
            failures.add(label + " (" + e.getMessage() + ")");
            return new ArrayList<>();
        }
    }
}
