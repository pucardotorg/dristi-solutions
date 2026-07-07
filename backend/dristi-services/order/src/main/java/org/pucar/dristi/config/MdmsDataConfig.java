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
     * Loads all MDMS-backed config at startup. If any dataset fails to load or comes back empty,
     * this throws so bean initialization (and hence the whole application context) fails fast.
     * This prevents pods from coming up with empty MDMS data and serving broken traffic in prod.
     */
    @PostConstruct
    public void loadConfigData(){
        loadNonOverlappingMdmsData();
        loadNonRepeatingOrdersMdmsData();
        loadItemTextMdmsData();
    }

    private void loadNonOverlappingMdmsData(){
        try {
            RequestInfo requestInfo = RequestInfo.builder().build();
            String mdmsDataResponse = mdmsUtil.fetchMdmsData(requestInfo, configuration.getTenantId(), configuration.getOrderModule(), List.of(configuration.getMdmsNonOverlappingOrders()));
            MdmsResponse mdmsResponse = objectMapper.readValue(mdmsDataResponse, MdmsResponse.class);
            JSONArray mdmsData = mdmsResponse.getMdmsRes().get(configuration.getOrderModule()).get(configuration.getMdmsNonOverlappingOrders());

            nonOverlappingOrdersMdmsData = new ArrayList<>();
            for (Object o : mdmsData) {
                CompositeOrderMdms compositeOrderMdmsMdmsData = objectMapper.convertValue(o, CompositeOrderMdms.class);
                nonOverlappingOrdersMdmsData.add(compositeOrderMdmsMdmsData);
            }
            log.info("NonOverlappingOrdersMdmsData ::{}", nonOverlappingOrdersMdmsData);

        } catch (Exception e) {
            log.error("Unable to create NonOverlappingOrdersMdmsData :: {}", e.getMessage(), e);
            throw new CustomException(MDMS_DATA_LOAD_ERROR, "Unable to load NonOverlappingOrdersMdmsData from MDMS: " + e.getMessage());
        }

        if (CollectionUtils.isEmpty(nonOverlappingOrdersMdmsData)) {
            log.error("NonOverlappingOrdersMdmsData loaded empty from MDMS");
            throw new CustomException(MDMS_DATA_LOAD_ERROR, "NonOverlappingOrdersMdmsData loaded empty from MDMS");
        }
    }

    private void loadNonRepeatingOrdersMdmsData() {
        try {
            RequestInfo requestInfo = RequestInfo.builder().build();
            String mdmsDataResponse = mdmsUtil.fetchMdmsData(requestInfo, configuration.getTenantId(), configuration.getOrderModule(), List.of(configuration.getMdmsNonRepeatingCompositeOrders()));
            MdmsResponse mdmsResponse = objectMapper.readValue(mdmsDataResponse, MdmsResponse.class);
            JSONArray mdmsData = mdmsResponse.getMdmsRes().get(configuration.getOrderModule()).get(configuration.getMdmsNonRepeatingCompositeOrders());

            nonRepeatingOrdersMdmsData = new ArrayList<>();

            for (Object o : mdmsData) {
                CompositeOrderMdms compositeOrderMdmsMdmsData = objectMapper.convertValue(o, CompositeOrderMdms.class);
                nonRepeatingOrdersMdmsData.add(compositeOrderMdmsMdmsData);
            }
            log.info("NonRepeatingOrdersMdmsData ::{}", nonRepeatingOrdersMdmsData);
        } catch (Exception e) {
            log.error("Unable to create NonRepeatingOrdersMdmsData :: {}", e.getMessage(), e);
            throw new CustomException(MDMS_DATA_LOAD_ERROR, "Unable to load NonRepeatingOrdersMdmsData from MDMS: " + e.getMessage());
        }

        if (CollectionUtils.isEmpty(nonRepeatingOrdersMdmsData)) {
            log.error("NonRepeatingOrdersMdmsData loaded empty from MDMS");
            throw new CustomException(MDMS_DATA_LOAD_ERROR, "NonRepeatingOrdersMdmsData loaded empty from MDMS");
        }
    }

    private void loadItemTextMdmsData() {
        try {
            RequestInfo requestInfo = RequestInfo.builder().build();
            String mdmsDataResponse = mdmsUtil.fetchMdmsData(requestInfo, configuration.getTenantId(), configuration.getOrderModule(), List.of(configuration.getMdmsItemText()));
            MdmsResponse mdmsResponse = objectMapper.readValue(mdmsDataResponse, MdmsResponse.class);
            JSONArray mdmsData = mdmsResponse.getMdmsRes().get(configuration.getOrderModule()).get(configuration.getMdmsItemText());

            itemTextMdmsData = new ArrayList<>();

            for (Object o : mdmsData) {
                ItemTextMdms itemTextMdms = objectMapper.convertValue(o, ItemTextMdms.class);
                itemTextMdmsData.add(itemTextMdms);
            }
            log.info("ItemTextMdmsData ::{}", itemTextMdmsData);
        } catch (Exception e) {
            log.error("Unable to create ItemTextMdmsData :: {}", e.getMessage(), e);
            throw new CustomException(MDMS_DATA_LOAD_ERROR, "Unable to load ItemTextMdmsData from MDMS: " + e.getMessage());
        }

        if (CollectionUtils.isEmpty(itemTextMdmsData)) {
            log.error("ItemTextMdmsData loaded empty from MDMS");
            throw new CustomException(MDMS_DATA_LOAD_ERROR, "ItemTextMdmsData loaded empty from MDMS");
        }
    }
}
