package org.pucar.dristi.util;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.jayway.jsonpath.JsonPath;
import com.jayway.jsonpath.PathNotFoundException;
import lombok.extern.slf4j.Slf4j;
import org.egov.common.contract.models.AuditDetails;
import org.egov.common.contract.request.RequestInfo;
import org.egov.common.models.individual.Individual;
import org.json.JSONArray;
import org.json.JSONException;
import org.json.JSONObject;
import org.pucar.dristi.config.Configuration;
import org.pucar.dristi.config.MdmsDataConfig;
import org.pucar.dristi.kafka.Producer;
import org.pucar.dristi.service.IndividualService;
import org.pucar.dristi.service.SmsNotificationService;
import org.pucar.dristi.util.HearingUtil;
import org.pucar.dristi.util.OrderUtil;
import org.pucar.dristi.web.models.*;
import org.pucar.dristi.web.models.CaseOutcome;
import org.pucar.dristi.web.models.CaseOutcomeType;
import org.pucar.dristi.web.models.CaseOverallStatus;
import org.pucar.dristi.web.models.CaseOverallStatusType;
import org.pucar.dristi.web.models.CaseStageSubStage;
import org.pucar.dristi.web.models.Outcome;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.Set;

import static org.pucar.dristi.config.ServiceConstants.*;

@Slf4j
@Component
public class CaseOverallStatusUtil {

	private final Configuration config;
    private final HearingUtil hearingUtil;
	private final OrderUtil orderUtil;
	private final Producer producer;
	private final ObjectMapper mapper;
	private final MdmsDataConfig mdmsDataConfig;
	private List<org.pucar.dristi.web.models.CaseOverallStatusType> caseOverallStatusTypeList;
	private final Util util;

	private final CaseUtil caseUtil;

	private final AdvocateUtil advocateUtil;

	private final IndividualService individualService;

	private final SmsNotificationService notificationService;


	@Autowired
	public CaseOverallStatusUtil(Configuration config, HearingUtil hearingUtil, OrderUtil orderUtil, Producer producer, ObjectMapper mapper, MdmsDataConfig mdmsDataConfig, CaseUtil caseUtil, AdvocateUtil advocateUtil, IndividualService individualService, SmsNotificationService notificationService,Util util) {
		this.config = config;
        this.hearingUtil = hearingUtil;
        this.orderUtil = orderUtil;
        this.producer = producer;
		this.mapper = mapper;
        this.mdmsDataConfig = mdmsDataConfig;
        this.caseUtil = caseUtil;
        this.advocateUtil = advocateUtil;
        this.individualService = individualService;
        this.notificationService = notificationService;
		this.util = util;
    }

	public Object checkCaseOverAllStatus(String entityType, String referenceId, String status, String action, String tenantId, JSONObject requestInfo) throws JsonProcessingException {
		try {
			JSONObject request = new JSONObject();
			request.put("RequestInfo", requestInfo);
			caseOverallStatusTypeList = mdmsDataConfig.getCaseOverallStatusTypeMap().get(entityType);
			if(config.getCaseBusinessServiceList().contains(entityType)){
				//Due to two actions with same name case stage is not updating correctly. So added check for status along with actions
				//Currently only implemented this logic for case, might have to for other modules in case of similar issue
				return processCaseOverallStatus(request, referenceId, status, action, tenantId);
			} else if (config.getHearingBusinessServiceList().contains(entityType)) {
				return processHearingCaseOverallStatus(request, referenceId, action, tenantId);
			} else if (config.getOrderBusinessServiceList().contains(entityType)) {
				return processOrderOverallStatus(request, referenceId, status, tenantId);
			}
			log.error("Case overall status not supported for entityType: {}", entityType);
			return null;
		} catch (InterruptedException e) {
			log.error("Processing interrupted for entityType: {}", entityType, e);
			Thread.currentThread().interrupt(); // Restore the interrupted status
			throw new RuntimeException(e);
		}
	}

    private Object processOrderOverallStatus(JSONObject request, String referenceId, String status, String tenantId) throws InterruptedException {
        Thread.sleep(config.getApiCallDelayInSeconds() * 1000);
        Object orderObject = orderUtil.getOrder(request, referenceId, config.getStateLevelTenantId());
        String filingNumber = JsonPath.read(orderObject.toString(), FILING_NUMBER_PATH);
        String orderCategory = JsonPath.read(orderObject.toString(), ORDER_CATEGORY_PATH);
        try {
            if (COMPOSITE.equalsIgnoreCase(orderCategory)) {

                JSONArray compositeItems = util.constructArray(orderObject.toString(), ORDER_COMPOSITE_ITEMS_PATH);
                if (compositeItems == null || compositeItems.length() == 0) {
                    log.warn("No composite items found for filing number: {}", filingNumber);
                    return orderObject;
                }
                for (int i = 0; i < compositeItems.length(); i++) {
                    JSONObject compositeItem = compositeItems.getJSONObject(i);
                    processIndividualOrder(request, filingNumber, tenantId, status, compositeItem.toString(), orderObject);
                }

            } else {
                processIndividualOrder(request, filingNumber, tenantId, status, orderObject.toString(), orderObject);
            }
        } catch (JSONException e) {
            log.error("Error processing JSON structure in composite items: {}, for filing number: {}", e.getMessage(), filingNumber, e);
        } catch (PathNotFoundException e) {
            log.error("Required JSON path not found in composite items: {} for filing number: {}", e.getMessage(), filingNumber, e);
        } catch (Exception e) {
            log.error("Unexpected error while processing composite items: {} for filing number: {}", e.getMessage(), filingNumber, e);
        }
        return orderObject;
    }

	private Object processCaseOverallStatus(JSONObject request, String referenceId, String status, String action, String tenantId) throws JsonProcessingException {
		RequestInfo requestInfo = mapper.readValue(request.getJSONObject("RequestInfo").toString(), RequestInfo.class);
		publishToCaseOverallStatus(determineCaseStage(referenceId,tenantId,status,action,requestInfo), request);
		return null;
	}

	private Object processHearingCaseOverallStatus(JSONObject request, String referenceId, String action, String tenantId) throws InterruptedException {
		Thread.sleep(config.getApiCallDelayInSeconds()*1000);
		Object hearingObject = hearingUtil.getHearing(request, null, null, referenceId, config.getStateLevelTenantId());
		List<String> filingNumberList = JsonPath.read(hearingObject.toString(), FILING_NUMBER_PATH);
		String filingNumber;
		if (filingNumberList != null && !filingNumberList.isEmpty()) {
			filingNumber = filingNumberList.get(0);
		}
		else {
			log.info("Inside indexer util processHearingCaseOverallStatus:: Filing number not present");
			throw new RuntimeException("Filing number not present for case overall status");
		}
		String hearingType = JsonPath.read(hearingObject.toString(), HEARING_TYPE_PATH);
		publishToCaseOverallStatus(determineHearingStage( filingNumber, tenantId, hearingType, action ), request);
		return hearingObject;
	}

	private org.pucar.dristi.web.models.CaseOverallStatus determineCaseStage(String filingNumber, String tenantId, String status, String action,RequestInfo requestInfo) {
		for (org.pucar.dristi.web.models.CaseOverallStatusType statusType : caseOverallStatusTypeList) {
			log.info("CaseOverallStatusType MDMS action ::{} and status :: {}",statusType.getAction(),statusType.getState());
			if (statusType.getAction().equalsIgnoreCase(action) && statusType.getState().equalsIgnoreCase(status)){
				log.info("Creating CaseOverallStatus for action ::{} and status :: {}",statusType.getAction(),statusType.getState());
				sendSmsForCaseStatusChange(filingNumber,requestInfo);
				return new org.pucar.dristi.web.models.CaseOverallStatus(filingNumber, tenantId, statusType.getStage(), statusType.getSubstage());
			}
		}
		return null;
	}

	private void sendSmsForCaseStatusChange(String filingNumber,RequestInfo requestInfo) {
		org.pucar.dristi.web.models.CaseSearchRequest caseSearchRequest = createCaseSearchRequest(requestInfo, filingNumber);
		JsonNode caseDetails = caseUtil.searchCaseDetails(caseSearchRequest);
		String courtCaseNumber = caseUtil.getCourtCaseNumber(caseDetails);
		JsonNode litigants = caseUtil.getLitigants(caseDetails);
		Set<String> individualIds = caseUtil.getIndividualIds(litigants);
		JsonNode representatives = caseUtil.getRepresentatives(caseDetails);
		Set<String> representativeIds = caseUtil.getAdvocateIds(representatives);
		Set<String> powerOfAttorneyIds = caseUtil.extractPowerOfAttorneyIds(caseDetails,individualIds);
		if(!powerOfAttorneyIds.isEmpty()){
			individualIds.addAll(powerOfAttorneyIds);
		}

		if(!representativeIds.isEmpty()){
			representativeIds = advocateUtil.getAdvocate(requestInfo,representativeIds.stream().toList());
		}
		individualIds.addAll(representativeIds);
		org.pucar.dristi.web.models.SmsTemplateData smsTemplateData = enrichSmsTemplateData(filingNumber, courtCaseNumber, requestInfo);
		List<String> phoneNumbers = callIndividualService(requestInfo, new ArrayList<>(individualIds));
		for (String number : phoneNumbers) {
			notificationService.sendNotification(requestInfo, smsTemplateData, CASE_STATUS_CHANGED_MESSAGE, number);
		}
	}

	private SmsTemplateData enrichSmsTemplateData(String filingNumber, String courtCaseNumber, RequestInfo requestInfo) {
		return SmsTemplateData.builder()
				.efilingNumber(filingNumber)
				.courtCaseNumber(courtCaseNumber)
				.tenantId(requestInfo.getUserInfo().getTenantId())
				.build();
	}

	private CaseSearchRequest createCaseSearchRequest(RequestInfo requestInfo, String filingNumber) {
		CaseSearchRequest caseSearchRequest = new CaseSearchRequest();
		caseSearchRequest.setRequestInfo(requestInfo);
		CaseCriteria caseCriteria = CaseCriteria.builder().filingNumber(filingNumber).defaultFields(false).build();
		caseSearchRequest.addCriteriaItem(caseCriteria);
		return caseSearchRequest;
	}

	private List<String> callIndividualService(RequestInfo requestInfo, List<String> individualIds) {

		List<String> mobileNumber = new ArrayList<>();
		for(String id : individualIds){
			List<Individual> individuals = individualService.getIndividualsByIndividualId(requestInfo, id);
			if(individuals.get(0).getMobileNumber() != null){
				mobileNumber.add(individuals.get(0).getMobileNumber());
			}
		}
		return mobileNumber;
	}

	private org.pucar.dristi.web.models.CaseOverallStatus determineHearingStage(String filingNumber, String tenantId, String hearingType, String action) {
		for (org.pucar.dristi.web.models.CaseOverallStatusType statusType : caseOverallStatusTypeList) {
			if (statusType.getAction().equalsIgnoreCase(action) && statusType.getTypeIdentifier().equalsIgnoreCase(hearingType))
                return new org.pucar.dristi.web.models.CaseOverallStatus(filingNumber, tenantId, statusType.getStage(), statusType.getSubstage());
		}
		return null;
	}

	private org.pucar.dristi.web.models.CaseOverallStatus determineOrderStage(String filingNumber, String tenantId, String orderType, String status) {
		for (CaseOverallStatusType statusType : caseOverallStatusTypeList){
			if(statusType.getTypeIdentifier().equalsIgnoreCase(orderType) && statusType.getState().equalsIgnoreCase(status)) {
				return new org.pucar.dristi.web.models.CaseOverallStatus(filingNumber, tenantId, statusType.getStage(), statusType.getSubstage());
			}
		}
		return null;
	}

	private void publishToCaseOverallStatus(CaseOverallStatus caseOverallStatus, JSONObject request) {
		try {
			if(caseOverallStatus==null){
				log.info("Case overall workflow update not eligible");
			}
			else if(caseOverallStatus.getFilingNumber()==null){
				log.error("Filing number not present for Case overall workflow update");
			}
			else{
				RequestInfo requestInfo = mapper.readValue(request.getJSONObject("RequestInfo").toString(), RequestInfo.class);
                String filingNumber = caseOverallStatus.getFilingNumber();
                request.put("RequestInfo", requestInfo);
                Object caseObject = caseUtil.getCase(request, config.getStateLevelTenantId(), null, filingNumber, null);
                Boolean isLprCase = JsonPath.read(caseObject.toString(), IS_LPR_CASE_PATH);
				String caseStage = JsonPath.read(caseObject.toString(), CASE_STAGE_PATH);
                if (isLprCase != null && isLprCase) {
                    if (!config.getLprStage().equalsIgnoreCase(caseStage)) {
                        caseOverallStatus.setStage(config.getLprStage());
                        caseOverallStatus.setSubstage(config.getLprSubStage());
                    } else {
                        log.info("case is already in lpr stage : {} ", filingNumber);
                        return;
                    }
                } else {
                    caseOverallStatus.setStage(caseOverallStatus.getStage());
                    caseOverallStatus.setSubstage(caseOverallStatus.getSubstage());
                }
				AuditDetails auditDetails = new AuditDetails();
				auditDetails.setLastModifiedBy(requestInfo.getUserInfo().getUuid());
				auditDetails.setLastModifiedTime(System.currentTimeMillis());
				caseOverallStatus.setAuditDetails(auditDetails);
				org.pucar.dristi.web.models.CaseStageSubStage caseStageSubStage = new CaseStageSubStage(requestInfo,caseOverallStatus);
				log.info("Publishing to kafka topic: {}, caseStageSubstage: {}",config.getCaseOverallStatusTopic(), caseStageSubStage);
				producer.push(config.getCaseOverallStatusTopic(), caseStageSubStage);
			}
		} catch (Exception e) {
			log.error("Error in publishToCaseOverallStatus method", e);
		}
	}

	private org.pucar.dristi.web.models.Outcome determineCaseOutcome(String filingNumber, String tenantId, String orderType, String status, Object orderObject) {
		if (!"published".equalsIgnoreCase(status)) return null;

		org.pucar.dristi.web.models.CaseOutcomeType caseOutcomeType = mdmsDataConfig.getCaseOutcomeTypeMap().get(orderType);
		if (caseOutcomeType == null) {
			log.info("CaseOutcomeType not found for orderType: {}", orderType);
			return null;
		}

		try {
			if (caseOutcomeType.getIsJudgement()) {
				return handleJudgementCase(filingNumber, tenantId, caseOutcomeType, orderObject);
			} else {
				return new org.pucar.dristi.web.models.Outcome(filingNumber, tenantId, caseOutcomeType.getOutcome());
			}
		} catch (Exception e) {
			log.error("Error determining case outcome for filingNumber: {} and orderType: {}", filingNumber, orderType, e);
			return null;
		}
	}

	private org.pucar.dristi.web.models.Outcome handleJudgementCase(String filingNumber, String tenantId, CaseOutcomeType caseOutcomeType, Object orderObject) {
		try {
			String outcome = JsonPath.read(orderObject.toString(), ORDER_FINDINGS_PATH);
			if (caseOutcomeType.getJudgementList().contains(outcome)) {
				return new org.pucar.dristi.web.models.Outcome(filingNumber, tenantId, outcome);
			} else {
				log.info("Outcome not in judgement list for orderType: {}", caseOutcomeType.getOrderType());
				return null;
			}
		} catch (PathNotFoundException e) {
			log.error("JSON path not found: {}", ORDER_FINDINGS_PATH, e);
			return null;
		}
	}

	private void publishToCaseOutcome(Outcome outcome, JSONObject request) {
		try {
			if(outcome==null){
				log.info("Case outcome update not eligible");
			}
			else if(outcome.getFilingNumber()==null){
				log.error("Filing number not present for case outcome update");
			}
			else{
				RequestInfo requestInfo = mapper.readValue(request.getJSONObject("RequestInfo").toString(), RequestInfo.class);
				AuditDetails auditDetails = new AuditDetails();
				auditDetails.setLastModifiedBy(requestInfo.getUserInfo().getUuid());
				auditDetails.setLastModifiedTime(System.currentTimeMillis());
				outcome.setAuditDetails(auditDetails);
				org.pucar.dristi.web.models.CaseOutcome caseOutcome = new CaseOutcome(requestInfo,outcome);
				log.info("Publishing to kafka topic: {}, caseOutcome: {}",config.getCaseOutcomeTopic(), caseOutcome);
				producer.push(config.getCaseOutcomeTopic(), caseOutcome);
			}
		} catch (Exception e) {
			log.error("Error in publishToCaseOutcome method", e);
		}
	}

    private void processIndividualOrder(JSONObject request, String filingNumber, String tenantId, String status, String orderItemJson, Object orderObject) {
        String orderType = JsonPath.read(orderItemJson, ORDER_TYPE_PATH);
        publishToCaseOverallStatus(determineOrderStage(filingNumber, tenantId, orderType, status), request);
        publishToCaseOutcome(determineCaseOutcome(filingNumber, tenantId, orderType, status, orderObject), request);
    }
}
