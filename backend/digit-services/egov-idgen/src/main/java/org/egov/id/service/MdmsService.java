package org.egov.id.service;

import com.jayway.jsonpath.DocumentContext;
import com.jayway.jsonpath.JsonPath;
import lombok.extern.log4j.Log4j2;
import org.egov.id.model.IdRequest;
import org.egov.id.model.RequestInfo;
import org.egov.mdms.model.MasterDetail;
import org.egov.mdms.model.MdmsResponse;
import org.egov.mdms.service.MdmsClientService;
import org.egov.tracer.model.CustomException;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.io.IOException;
import java.util.*;

@Service
@Log4j2
public class MdmsService {

    @Autowired
    private MdmsClientService mdmsClientService;

    private static final String tenantMaster = "tenants";
    private static final String tenantModule = "tenant";
    private static final String formatMaster = "IdFormat";
    private static final String formatModule = "common-masters";

    public MdmsResponse getMasterData(RequestInfo requestInfo, String tenantId,
                                      Map<String, List<MasterDetail>> masterDetails) {
        try {
            return mdmsClientService.getMaster(RequestInfo.toCommonRequestInfo(requestInfo), tenantId, masterDetails);
        } catch (IOException e) {
            log.error("Error occurred while fetching MDMS data", e);
            return null;
        }
    }

    public String getCity(RequestInfo requestInfo, IdRequest idRequest) {
        Map<String, String> getCityMap = doMdmsServiceCall(requestInfo, idRequest);
        String cityCode = getCityMap != null ? getCityMap.get(tenantMaster) : null;

        if (cityCode == null) {
            throw new CustomException("PARSING ERROR", "City code is Null/not valid");
        }
        return cityCode;
    }

    public String getIdFormat(RequestInfo requestInfo, IdRequest idRequest) {
        Map<String, String> getIdFormatMap = doMdmsServiceCall(requestInfo, idRequest);
        return getIdFormatMap != null ? getIdFormatMap.get(formatMaster) : null;
    }

    private Map<String, String> doMdmsServiceCall(RequestInfo requestInfo, IdRequest idRequest) {
        String idname = idRequest.getIdName();
        String tenantId = idRequest.getTenantId();

        Map<String, List<MasterDetail>> masterDetails = new HashMap<>();

        masterDetails.put(tenantModule, Collections.singletonList(
                MasterDetail.builder().name(tenantMaster).filter("[?(@.code=='" + tenantId + "')]").build()
        ));

        masterDetails.put(formatModule, Collections.singletonList(
                MasterDetail.builder().name(formatMaster).filter("[?(@.idname=='" + idname + "')]").build()
        ));

        String idFormatFromMdms = null;
        String cityCodeFromMdms = null;

        try {
            MdmsResponse mdmsResponse = getMasterData(requestInfo, tenantId, masterDetails);

            if (mdmsResponse != null && mdmsResponse.getMdmsRes() != null) {
                if (mdmsResponse.getMdmsRes().containsKey(tenantModule)
                        && mdmsResponse.getMdmsRes().get(tenantModule).get(tenantMaster) != null
                        && !mdmsResponse.getMdmsRes().get(tenantModule).get(tenantMaster).isEmpty()) {

                    Object cityData = mdmsResponse.getMdmsRes().get(tenantModule).get(tenantMaster).get(0);
                    if (cityData != null) {
                        DocumentContext documentContext = JsonPath.parse(cityData);
                        cityCodeFromMdms = documentContext.read("$.city.code");
                        log.debug("Found city code: {}", cityCodeFromMdms);
                    }
                }

                if (mdmsResponse.getMdmsRes().containsKey(formatModule)
                        && mdmsResponse.getMdmsRes().get(formatModule).get(formatMaster) != null
                        && !mdmsResponse.getMdmsRes().get(formatModule).get(formatMaster).isEmpty()) {

                    Object formatData = mdmsResponse.getMdmsRes().get(formatModule).get(formatMaster).get(0);
                    if (formatData != null) {
                        DocumentContext documentContext = JsonPath.parse(formatData);
                        idFormatFromMdms = documentContext.read("$.format");
                    }
                }
            }
        } catch (Exception e) {
            log.error("MDMS Fetch failed", e);
            throw new CustomException("PARSING ERROR", "Failed to get citycode/formatid from MDMS");
        }

        Map<String, String> mdmsCallMap = new HashMap<>();
        mdmsCallMap.put(formatMaster, idFormatFromMdms);
        mdmsCallMap.put(tenantMaster, cityCodeFromMdms);

        return mdmsCallMap;
    }
}