package digit.service;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import digit.config.Configuration;
import digit.util.CaseUtil;
import digit.util.HearingUtil;
import digit.util.MdmsV2Util;
import digit.web.mdms.Mdms;
import digit.web.models.cases.CaseCriteria;
import digit.web.models.cases.SearchCaseRequest;
import lombok.extern.slf4j.Slf4j;
import org.egov.common.contract.request.RequestInfo;
import org.egov.common.contract.request.User;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.Duration;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.Map;

import static digit.config.ServiceConstants.FLOW_JAC;
import static digit.config.ServiceConstants.msgId;

@Service
@Slf4j
public class LandingPageService {

    private final CaseUtil caseUtil;

    private final Configuration config;

    private final UserService userService;

    private final ObjectMapper objectMapper;

    private final MdmsV2Util mdmsV2Util;

    private final HearingUtil hearingUtil;

    @Autowired
    public LandingPageService(CaseUtil caseUtil, Configuration config, UserService userService, ObjectMapper objectMapper, MdmsV2Util mdmsV2Util, HearingUtil hearingUtil) {
        this.caseUtil = caseUtil;
        this.config = config;
        this.userService = userService;
        this.objectMapper = objectMapper;
        this.mdmsV2Util = mdmsV2Util;
        this.hearingUtil = hearingUtil;
    }

    public void updateDashboardMetrics() {
        try {
            log.info("operation = updateDashboardMetrics, result = IN_PROGRESS");
            Integer totalFiledCases = getTotalFiledCases();

            Integer totalDisposedCases = getTotalDisposedCases();

//            TODO : commenting this code as it is not required now need to be uncommented when required and need to modify the logic and need to write a new api in case service
//            Integer daysToCaseRegistration = getDaysToCaseRegistration();

            Integer averageNumberOfDaysBetweenHearingsForCase = getAverageDaysToHearings();

            updateMdmsDashboardMetrics(totalFiledCases, totalDisposedCases, averageNumberOfDaysBetweenHearingsForCase);

            log.info("operation = updateDashboardMetrics, result = SUCCESS");
        } catch (Exception e) {
            log.error("operation = updateDashboardMetrics, result = FAILURE", e);
        }
    }

    private Integer getAverageDaysToHearings() {
        try {
            log.info("operation = getAverageDaysToHearings, result = IN_PROGRESS");
            List<Integer> averageDaysToHearings = hearingUtil.getNoOfDaysToHearing();
            if (averageDaysToHearings != null && !averageDaysToHearings.isEmpty()) {
                Integer median = calculateMedian(averageDaysToHearings);
                log.info("operation = getAverageDaysToHearings, result = SUCCESS, median = {}", median);
                return median;
            }
            log.info("operation = getAverageDaysToHearings, result = SUCCESS");
        } catch (Exception e) {
            log.error("operation = getAverageDaysToHearings, result = FAILURE", e);
            return null;
        }
        return null;
    }

//    private Integer getDaysToCaseRegistration() {
//        try {
//            log.info("operation = getDaysToCaseRegistration, result = IN_PROGRESS");
//
//            CaseCriteria criteria = CaseCriteria.builder()
//                    .status(config.getCaseStatusesAfterRegistration())
//                    .build();
//
//            SearchCaseRequest searchCaseRequest = SearchCaseRequest.builder()
//                    .RequestInfo(createInternalRequestInfo())
//                    .tenantId(config.getEgovStateTenantId())
//                    .criteria(Collections.singletonList(criteria))
//                    .flow(FLOW_JAC)
//                    .build();
//
//            JsonNode caseList = caseUtil.getCases(searchCaseRequest);
//
//            if (caseList == null || !caseList.isArray() || caseList.isEmpty()) {
//                log.warn("operation = getDaysToCaseRegistration, result = NO_CASES_FOUND");
//                return null;
//            }
//
//            List<Integer> daysDifferences = new ArrayList<>();
//
//            for (JsonNode caseNode : caseList) {
//                if (caseNode.has("registrationDate") && !caseNode.get("registrationDate").isNull()
//                        && caseNode.has("filingDate") && !caseNode.get("filingDate").isNull()) {
//
//                    Integer registrationDate = caseNode.get("registrationDate").asInt();
//                    Integer filingDate = caseNode.get("filingDate").asInt();
//
//                    if (registrationDate >= filingDate) {
//                        long days = Duration.ofMillis(registrationDate - filingDate).toDays();
//                        daysDifferences.add((int) days);
//                    }
//                }
//            }
//
//            if (daysDifferences.isEmpty()) {
//                log.warn("operation = getDaysToCaseRegistration, result = NO_VALID_DATES");
//                return null;
//            }
//
//            Integer median = calculateMedian(daysDifferences);
//
//            log.info("operation = getDaysToCaseRegistration, result = SUCCESS, median = {}", median);
//            return median;
//
//        } catch (Exception e) {
//            log.error("operation = getDaysToCaseRegistration, result = FAILURE", e);
//            return null;
//        }
//    }


    private Integer getTotalDisposedCases() {
        try {
            log.info("operation = getTotalDisposedCases, result = IN_PROGRESS");
            CaseCriteria criteria = CaseCriteria.builder().outcome(config.getCaseStatusesDisposed()).build();
            SearchCaseRequest searchCaseRequest = SearchCaseRequest.builder()
                    .RequestInfo(createInternalRequestInfo())
                    .tenantId(config.getEgovStateTenantId())
                    .criteria(Collections.singletonList(criteria))
                    .build();
            log.info("operation = getTotalDisposedCases, result = SUCCESS");
            return caseUtil.getCaseCount(searchCaseRequest);
        } catch (Exception e) {
            log.error("operation = getTotalDisposedCases, result = FAILURE", e);
            return null;
        }
    }

    private Integer getTotalFiledCases() {
        try {
            log.info("operation = getTotalCases, result = IN_PROGRESS");

            CaseCriteria criteria = CaseCriteria.builder().status(config.getCaseStatusesAfterPayment()).build();

            SearchCaseRequest searchCaseRequest = SearchCaseRequest.builder()
                    .RequestInfo(createInternalRequestInfo())
                    .tenantId(config.getEgovStateTenantId())
                    .criteria(Collections.singletonList(criteria))
                    .build();

            Integer totalFiledCases = caseUtil.getCaseCount(searchCaseRequest);
            log.info("operation = getTotalCases, result = SUCCESS");
            return totalFiledCases;

        } catch (Exception e) {
            log.error("operation = getTotalCases, result = FAILURE", e);
            return null;
        }
    }

    private Integer calculateMedian(List<Integer> values) {

        Collections.sort(values);
        int size = values.size();
        if (size % 2 == 0) {
            return (values.get(size / 2 - 1) + values.get(size / 2)) / 2;
        } else {
            return values.get(size / 2);
        }
    }


    private void updateMdmsDashboardMetrics(Integer totalCases, Integer totalDisposedCases, Integer averageNumberOfDaysBetweenHearingsForCase) {

        try {
            log.info("operation = updateMdmsDashboardMetrics, result = IN_PROGRESS");
            List<Mdms> mdmsData = mdmsV2Util.fetchMdmsV2Data(createInternalRequestInfo(), config.getEgovStateTenantId(), null, null, config.getLandingPageMetricsSchemaCode(), true, null);

            if (mdmsData != null && !mdmsData.isEmpty()) {
                Mdms mdms = mdmsData.get(0);
                if (mdms == null || mdms.getData() == null) {
                    log.info("mdms data not found");
                    return;
                }
                Map<String, Object> jsonMap = objectMapper.convertValue(mdms.getData(), new TypeReference<>() {
                });
                if (totalCases != null) {
                    log.info("numberOfCasesFiled = {}", totalCases);
                    jsonMap.put("numberOfCasesFiled", totalCases);
                    mdms.setData(objectMapper.convertValue(jsonMap, JsonNode.class));
                }

                if (totalDisposedCases != null) {
                    log.info("numberOfCasesDisposed = {}", totalDisposedCases);
                    jsonMap.put("numberOfCasesDisposed", totalDisposedCases);
                    mdms.setData(objectMapper.convertValue(jsonMap, JsonNode.class));
                }

                if (averageNumberOfDaysBetweenHearingsForCase != null) {
                    log.info("averageNumberOfDaysBetweenHearingsForCase = {}", averageNumberOfDaysBetweenHearingsForCase);
                    jsonMap.put("averageNumberOfDaysBetweenHearingsForCase", averageNumberOfDaysBetweenHearingsForCase);
                    mdms.setData(objectMapper.convertValue(jsonMap, JsonNode.class));
                }

                mdmsV2Util.updateMdmsV2Data(createInternalRequestInfo(), mdms);
            }

            log.info("operation = updateMdmsDashboardMetrics, result = SUCCESS");
        } catch (Exception e) {
            log.error("operation = updateMdmsDashboardMetrics, result = FAILURE", e);
        }

    }

    private RequestInfo createInternalRequestInfo() {
        User userInfo = new User();
        userInfo.setUuid(userService.internalMicroserviceRoleUuid);
        userInfo.setRoles(userService.internalMicroserviceRoles);
        userInfo.setTenantId(config.getEgovStateTenantId());
        return RequestInfo.builder().userInfo(userInfo).msgId(msgId).build();
    }

}
