package org.pucar.dristi.config;

import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.annotation.PostConstruct;
import lombok.Getter;
import lombok.extern.slf4j.Slf4j;
import net.minidev.json.JSONArray;
import org.egov.common.contract.request.RequestInfo;
import org.egov.mdms.model.MdmsResponse;
import org.pucar.dristi.util.MdmsUtil;
import org.pucar.dristi.web.models.CompositeOrderMdms;
import org.pucar.dristi.web.models.ItemTextMdms;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;

@Service
@Slf4j
public class MdmsDataConfig {

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
            log.error("Unable to create NonOverlappingOrdersMdmsData :: {}", e.getMessage());
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
            log.error("Unable to create NonRepeatingOrdersMdmsData :: {}", e.getMessage());
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
            log.error("Unable to create ItemTextMdmsData :: {}", e.getMessage());
        }
    }
}
