package pucar.util;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.SerializationFeature;
import lombok.extern.slf4j.Slf4j;
import org.egov.tracer.model.CustomException;
import org.egov.tracer.model.ServiceCallException;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;
import org.springframework.web.client.HttpClientErrorException;
import org.springframework.web.client.RestTemplate;
import pucar.config.Configuration;
import pucar.repository.ServiceRequestRepository;
import pucar.web.models.courtCase.*;

import java.util.*;
import java.util.stream.Collectors;

import static pucar.config.ServiceConstants.*;

@Component
@Slf4j
public class CaseUtil {

    private final RestTemplate restTemplate;
    private final ObjectMapper objectMapper;
    private final Configuration configuration;
    private final ServiceRequestRepository serviceRequestRepository;
    private final CacheUtil cacheUtil;

    @Autowired
    public CaseUtil(RestTemplate restTemplate, ObjectMapper objectMapper, Configuration configuration, ServiceRequestRepository serviceRequestRepository, CacheUtil cacheUtil) {
        this.restTemplate = restTemplate;
        this.objectMapper = objectMapper;
        this.configuration = configuration;
        this.serviceRequestRepository = serviceRequestRepository;
        this.cacheUtil = cacheUtil;
    }

    public CaseExistsResponse existCaseSearch(CaseExistsRequest caseExistsRequest) {
        StringBuilder uri = new StringBuilder();
        uri.append(configuration.getCaseHost()).append(configuration.getCaseExistsEndPoint());

        Object response = new HashMap<>();
        CaseExistsResponse caseExistsResponse = new CaseExistsResponse();
        try {
            response = restTemplate.postForObject(uri.toString(), caseExistsRequest, Map.class);
            caseExistsResponse = objectMapper.convertValue(response, CaseExistsResponse.class);
        } catch (Exception e) {
            log.error(ERROR_WHILE_FETCHING_FROM_CASE, e);
            throw new CustomException(ERROR_WHILE_FETCHING_FROM_CASE, e.getMessage());

        }
        return caseExistsResponse;
    }

    public CaseListResponse searchCaseDetails(CaseSearchRequest caseSearchRequest) {
        StringBuilder uri = new StringBuilder();
        uri.append(configuration.getCaseHost()).append(configuration.getCaseSearchEndPoint());

        Object response;
        try {
            response = restTemplate.postForObject(uri.toString(), caseSearchRequest, Map.class);
            JsonNode jsonNode = objectMapper.readTree(objectMapper.writeValueAsString(response));
            CaseListResponse caseListResponse = objectMapper.convertValue(jsonNode, CaseListResponse.class);
            return caseListResponse;
        } catch (Exception e) {
            log.error(ERROR_WHILE_FETCHING_FROM_CASE, e);
            throw new CustomException(ERROR_WHILE_FETCHING_FROM_CASE, e.getMessage());
        }
    }

    public List<CourtCase> getCaseDetailsForSingleTonCriteria(CaseSearchRequest caseSearchRequest) {

        // add redis cache here based on filing number
        Object courtCase = cacheUtil.findById(caseSearchRequest.getCriteria().get(0).getTenantId() + ":" + caseSearchRequest.getCriteria().get(0).getFilingNumber());
        if (courtCase != null) {
            return List.of(objectMapper.convertValue(courtCase, CourtCase.class));
        }
        CaseListResponse caseListResponse = searchCaseDetails(caseSearchRequest);
        cacheUtil.save(caseListResponse.getCriteria().get(0).getTenantId() + ":" + caseListResponse.getCriteria().get(0).getFilingNumber(),
                caseListResponse.getCriteria().get(0).getResponseList().get(0));
        return caseListResponse.getCriteria().get(0).getResponseList();
    }


    public CaseResponse updateCase(CaseRequest request) {

        objectMapper.configure(SerializationFeature.FAIL_ON_EMPTY_BEANS, false);
        StringBuilder uri = new StringBuilder(configuration.getCaseHost()).append(configuration.getCaseUpdateEndPoint());
        Object response = serviceRequestRepository.fetchResult(uri, request);

        try {
            JsonNode jsonNode = objectMapper.valueToTree(response);
            CaseResponse caseResponse = objectMapper.readValue(jsonNode.toString(), CaseResponse.class);
            if (caseResponse != null) {
                CourtCase courtCase = objectMapper.convertValue(caseResponse.getCases().get(0), CourtCase.class);
                cacheUtil.save(courtCase.getTenantId() + ":" + courtCase.getFilingNumber(), courtCase);
            }
            return caseResponse;
        } catch (HttpClientErrorException e) {
            log.error(EXTERNAL_SERVICE_EXCEPTION, e);
            throw new ServiceCallException(e.getResponseBodyAsString());
        } catch (Exception e) {
            log.error(SEARCHER_SERVICE_EXCEPTION, e);
            throw new CustomException();  // write msg and code here
        }


    }

    public List<Party> getRespondentOrComplainant(CourtCase caseDetails, String type) {
        return caseDetails.getLitigants()
                .stream()
                .filter(item -> item.getPartyType().contains(type))
                .collect(Collectors.toList());
    }


    public CaseResponse processProfileRequest(ProcessProfileRequest request) {
        objectMapper.configure(SerializationFeature.FAIL_ON_EMPTY_BEANS, false);
        StringBuilder uri = new StringBuilder(configuration.getCaseHost()).append(configuration.getProcessProfileEndPoint());
        Object response = serviceRequestRepository.fetchResult(uri, request);

        try {
            JsonNode jsonNode = objectMapper.valueToTree(response);
            return objectMapper.convertValue(jsonNode, CaseResponse.class);
        } catch (HttpClientErrorException e) {
            log.error(EXTERNAL_SERVICE_EXCEPTION, e);
            throw new ServiceCallException(e.getResponseBodyAsString());
        } catch (Exception e) {
            log.error(SEARCHER_SERVICE_EXCEPTION, e);
            throw new CustomException();  // write msg and code here
        }
    }

    public Map<String, List<POAHolder>> getLitigantPoaMapping(CourtCase cases) {
        List<String> litigantIds = Optional.ofNullable(cases.getLitigants()).orElse(Collections.emptyList()).stream().filter(Party::getIsActive).map(Party::getIndividualId).filter(Objects::nonNull).toList();
        Map<String, List<POAHolder>> litigantPoaMapping = Optional.ofNullable(cases.getPoaHolders())
                .orElse(Collections.emptyList())
                .stream()
                .filter(POAHolder::getIsActive)
                .flatMap(poa -> {
                    // Create pairs of (litigantId, poa) for each litigant this POA represents
                    return poa.getRepresentingLitigants().stream()
                            .filter(party -> party.getIndividualId() != null)
                            .map(party -> new AbstractMap.SimpleEntry<>(party.getIndividualId(), poa));
                })
                .collect(Collectors.groupingBy(
                        Map.Entry::getKey,  // Group by litigant ID
                        Collectors.mapping(Map.Entry::getValue, Collectors.toList())
                ));

        for (String id : litigantIds) {
            litigantPoaMapping.putIfAbsent(id, new ArrayList<>()); // fill in missing ones with empty list
        }
        return litigantPoaMapping;
    }

    public void addWitnessToCase(WitnessDetailsRequest witnessDetailsRequest) {
        StringBuilder uri = new StringBuilder(configuration.getCaseHost()).append(configuration.getAddWitnessEndPoint());
        Object response = serviceRequestRepository.fetchResult(uri, witnessDetailsRequest);
        try {
            objectMapper.valueToTree(response);
        } catch (HttpClientErrorException e) {
            log.error(EXTERNAL_SERVICE_EXCEPTION, e);
            throw new ServiceCallException(e.getResponseBodyAsString());
        } catch (Exception e) {
            log.error(ERROR_WHILE_FETCHING_FROM_CASE, e);
            throw new CustomException(ERROR_WHILE_FETCHING_FROM_CASE, e.getMessage());
        }
    }

    public void updateLprDetailsInCase(CaseRequest caseRequest) {
        StringBuilder uri = new StringBuilder(configuration.getCaseHost()).append(configuration.getUpdateLprDetailsEndPoint());
        Object response = serviceRequestRepository.fetchResult(uri, caseRequest);
        try {
            objectMapper.valueToTree(response);
        } catch (HttpClientErrorException e) {
            log.error(EXTERNAL_SERVICE_EXCEPTION, e);
            throw new ServiceCallException(e.getResponseBodyAsString());
        } catch (Exception e) {
            log.error(ERROR_WHILE_FETCHING_FROM_CASE, e);
            throw new CustomException(ERROR_WHILE_FETCHING_FROM_CASE, e.getMessage());
        }
    }
}
