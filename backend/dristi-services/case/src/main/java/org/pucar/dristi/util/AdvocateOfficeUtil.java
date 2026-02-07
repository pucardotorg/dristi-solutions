package org.pucar.dristi.util;

import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.extern.slf4j.Slf4j;
import org.egov.common.contract.request.RequestInfo;
import org.egov.tracer.model.CustomException;
import org.pucar.dristi.config.Configuration;
import org.pucar.dristi.web.models.advocateoffice.MemberSearchCriteria;
import org.pucar.dristi.web.models.advocateoffice.MemberSearchRequest;
import org.pucar.dristi.web.models.advocateoffice.MemberSearchResponse;
import org.pucar.dristi.web.models.advocateoffice.OfficeMember;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestTemplate;

import java.util.Collections;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@Slf4j
@Component
public class AdvocateOfficeUtil {

    private static final String ERROR_WHILE_FETCHING_OFFICE_MEMBERS = "ERROR_WHILE_FETCHING_OFFICE_MEMBERS";

    private final RestTemplate restTemplate;
    private final ObjectMapper mapper;
    private final Configuration config;

    @Autowired
    public AdvocateOfficeUtil(RestTemplate restTemplate, ObjectMapper mapper, Configuration config) {
        this.restTemplate = restTemplate;
        this.mapper = mapper;
        this.config = config;
    }

    /**
     * Search for office members by criteria
     */
    public List<OfficeMember> searchMembers(RequestInfo requestInfo, MemberSearchCriteria criteria) {
        StringBuilder uri = new StringBuilder();
        uri.append(config.getAdvocateOfficeHost()).append(config.getAdvocateOfficeSearchMemberEndpoint());

        MemberSearchRequest searchRequest = MemberSearchRequest.builder()
                .requestInfo(requestInfo)
                .searchCriteria(criteria)
                .build();

        try {
            Object response = restTemplate.postForObject(uri.toString(), searchRequest, Map.class);
            MemberSearchResponse memberResponse = mapper.convertValue(response, MemberSearchResponse.class);
            log.info("Advocate office member search response :: {}", memberResponse);

            if (memberResponse != null && memberResponse.getMembers() != null) {
                return memberResponse.getMembers();
            }
            return Collections.emptyList();
        } catch (Exception e) {
            log.error("Error while fetching office members: {}", e.getMessage(), e);
            throw new CustomException(ERROR_WHILE_FETCHING_OFFICE_MEMBERS, e.getMessage());
        }
    }

    /**
     * Check if a user is a member of an advocate's office
     *
     * @param requestInfo      RequestInfo
     * @param tenantId         Tenant ID
     * @param officeAdvocateId The advocate ID whose office to check
     * @param memberUserUuid   The user UUID to check membership for
     * @return true if the user is an active member of the advocate's office
     */
    public boolean isUserMemberOfAdvocateOffice(RequestInfo requestInfo, String tenantId,
                                                UUID officeAdvocateId, UUID memberUserUuid) {
        MemberSearchCriteria criteria = MemberSearchCriteria.builder()
                .tenantId(tenantId)
                .officeAdvocateId(officeAdvocateId)
                .memberUserUuid(memberUserUuid)
                .isActive(true)
                .build();

        List<OfficeMember> members = searchMembers(requestInfo, criteria);
        return !members.isEmpty();
    }

    /**
     * Get all active members of an advocate's office
     */
    public List<OfficeMember> getActiveMembersOfAdvocateOffice(RequestInfo requestInfo, String tenantId,
                                                               UUID officeAdvocateId) {
        MemberSearchCriteria criteria = MemberSearchCriteria.builder()
                .tenantId(tenantId)
                .officeAdvocateId(officeAdvocateId)
                .isActive(true)
                .build();

        return searchMembers(requestInfo, criteria);
    }

    /**
     * Get member details by memberUserUuid and officeAdvocateId
     */
    public OfficeMember getMemberDetails(RequestInfo requestInfo, String tenantId,
                                         UUID officeAdvocateId, UUID memberUserUuid) {
        MemberSearchCriteria criteria = MemberSearchCriteria.builder()
                .tenantId(tenantId)
                .officeAdvocateId(officeAdvocateId)
                .memberUserUuid(memberUserUuid)
                .isActive(true)
                .build();

        List<OfficeMember> members = searchMembers(requestInfo, criteria);
        return members.isEmpty() ? null : members.get(0);
    }
}
