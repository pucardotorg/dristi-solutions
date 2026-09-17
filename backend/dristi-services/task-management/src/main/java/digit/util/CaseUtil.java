package digit.util;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import digit.config.Configuration;
import digit.web.models.CaseCriteria;
import digit.web.models.CaseSearchRequest;
import digit.web.models.TaskRequest;
import digit.web.models.cases.CaseListResponse;
import digit.web.models.cases.CourtCase;
import digit.web.models.cases.POAHolder;
import digit.web.models.cases.Party;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.egov.common.contract.request.RequestInfo;
import org.egov.tracer.model.CustomException;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestTemplate;

import java.util.*;
import java.util.stream.Collectors;

import static digit.config.ServiceConstants.ERROR_FROM_CASE;
import static digit.config.ServiceConstants.ERROR_WHILE_FETCHING_FROM_CASE;


@Slf4j
@Component
@RequiredArgsConstructor
public class CaseUtil {

    private final Configuration configs;
    private final RestTemplate restTemplate;
    private final ObjectMapper mapper;

    public JsonNode searchCaseDetails(CaseSearchRequest caseSearchRequest) {
        StringBuilder uri = new StringBuilder();
        uri.append(configs.getCaseHost()).append(configs.getCaseSearchEndPoint());

        Object response = new HashMap<>();
        try {
            response = restTemplate.postForObject(uri.toString(), caseSearchRequest, Map.class);
            JsonNode jsonNode = mapper.readTree(mapper.writeValueAsString(response));
            JsonNode caseList = jsonNode.get("criteria").get(0).get("responseList");
            return caseList.get(0);
        } catch (Exception e) {
            log.error(ERROR_WHILE_FETCHING_FROM_CASE, e);
            throw new CustomException(ERROR_WHILE_FETCHING_FROM_CASE, e.getMessage());
        }
    }

    public List<CourtCase> getCaseDetails(TaskRequest taskRequest) {

        String filingNumber = taskRequest.getTask().getFilingNumber();
        RequestInfo requestInfo = taskRequest.getRequestInfo();

        StringBuilder uri = new StringBuilder();
        uri.append(configs.getCaseHost()).append(configs.getCaseSearchEndPoint());

        CaseCriteria caseCriteria = CaseCriteria.builder().filingNumber(filingNumber)
                .defaultFields(false)
                .build();

        CaseSearchRequest caseSearchRequest = CaseSearchRequest.builder()
                .requestInfo(requestInfo)
                .criteria(Collections.singletonList(caseCriteria))
                .build();

        Object response;
        CaseListResponse caseListResponse;

        try {
            response = restTemplate.postForObject(uri.toString(), caseSearchRequest, Map.class);
            caseListResponse = mapper.convertValue(response, CaseListResponse.class);
            log.info("Case response : {} ", caseListResponse);
        } catch (Exception e) {
            log.error("Error while fetching from case service");
            throw new CustomException(ERROR_FROM_CASE, e.getMessage());
        }

        if (caseListResponse != null && caseListResponse.getCriteria() != null && !caseListResponse.getCriteria().isEmpty()) {
            return caseListResponse.getCriteria().get(0).getResponseList();
        }
        return null;
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

    public List<Party> getRespondentOrComplainant(CourtCase caseDetails, String type) {
        return caseDetails.getLitigants()
                .stream()
                .filter(item -> item.getPartyType().contains(type))
                .collect(Collectors.toList());
    }

}