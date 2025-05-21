package digit.util;


import com.fasterxml.jackson.databind.ObjectMapper;
import digit.config.Configuration;
import digit.models.coremodels.RequestInfoWrapper;
import digit.repository.ServiceRequestRepository;
import digit.web.models.hrms.Assignment;
import digit.web.models.hrms.Employee;
import digit.web.models.hrms.EmployeeResponse;
import lombok.extern.slf4j.Slf4j;
import org.egov.common.contract.request.RequestInfo;
import org.egov.tracer.model.CustomException;
import org.jetbrains.annotations.NotNull;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestTemplate;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

@Component
@Slf4j
public class HrmsUtil {

    private final Configuration configs;
    private final RestTemplate restTemplate;
    private final ObjectMapper objectMapper;
    private final ServiceRequestRepository serviceRequestRepository;

    @Autowired
    public HrmsUtil(Configuration configs, RestTemplate restTemplate, ObjectMapper objectMapper, ServiceRequestRepository serviceRequestRepository) {
        this.configs = configs;
        this.restTemplate = restTemplate;
        this.objectMapper = objectMapper;
        this.serviceRequestRepository = serviceRequestRepository;
    }

    public String getCourtId(RequestInfo requestInfo) {
        String tenantId = requestInfo.getUserInfo().getTenantId();
        String uuid = requestInfo.getUserInfo().getUuid();

        StringBuilder uri = new StringBuilder()
                .append(configs.getHrmsHost())
                .append(configs.getHrmsEndPoint())
                .append("?tenantId=").append(tenantId)
                .append("&uuids=").append(uuid);

        RequestInfoWrapper requestInfoWrapper = RequestInfoWrapper.builder()
                .requestInfo(requestInfo)
                .build();

        try {

            Object response = serviceRequestRepository.fetchResult(uri, requestInfoWrapper);
            EmployeeResponse employeeResponse = objectMapper.convertValue(objectMapper.writeValueAsString(response), EmployeeResponse.class);
            List<Assignment> assignments = getAssignments(employeeResponse);

            String courtroom = assignments.get(0).getCourtroom();

            if (courtroom == null || courtroom.isEmpty()) {
                throw new CustomException("COURTROOM_NOT_FOUND", "Courtroom information is missing in assignment");
            }

            return courtroom;

        } catch (Exception e) {
            log.error("Error while fetching courtId from HRMS", e);
            throw new CustomException("ERROR_WHILE_FETCHING_FROM_HRMS", "Error while fetching courtId from HRMS");
        }
    }

    @NotNull
    private List<Assignment> getAssignments(EmployeeResponse employeeResponse) {
        List<Employee> employees = employeeResponse.getEmployees();

        if (employees.isEmpty()) {
            throw new CustomException("EMPLOYEE_NOT_FOUND", "No employee found in HRMS response");
        }
        List<Assignment> assignments = employees.get(0).getAssignments();

        if (assignments == null || assignments.isEmpty()) {
            throw new CustomException("ASSIGNMENT_NOT_FOUND", "No assignments found for employee in HRMS response");
        }
        return assignments;
    }


    public Map<String, List<Employee>> getJudgeByCourtRooms(RequestInfo internalRequestInfo, List<String> courtRooms, String designation, String tenantId) {

        ConcurrentHashMap<String, List<Employee>> courtRoomJudgeMap = new ConcurrentHashMap<>();

        StringBuilder uri = new StringBuilder()
                .append(configs.getHrmsHost())
                .append(configs.getHrmsEndPoint())
                .append("?courtrooms=").append(String.join(",", courtRooms))
                .append("&employeetypes=Judge")
                .append("&designations").append(designation)
                .append("&isActive=true")
                .append("&tenantId=)").append(tenantId);

        RequestInfoWrapper requestInfoWrapper = RequestInfoWrapper.builder()
                .requestInfo(internalRequestInfo)
                .build();

        try {

            Object response = serviceRequestRepository.fetchResult(uri, requestInfoWrapper);
            EmployeeResponse employeeResponse = objectMapper.convertValue(objectMapper.writeValueAsString(response), EmployeeResponse.class);

            for (Employee employee : employeeResponse.getEmployees()) {
                if (employee.getAssignments() != null && !employee.getAssignments().isEmpty()) {
                    for (Assignment assignment : employee.getAssignments()) {
                        if (assignment.getCourtroom() != null && !assignment.getCourtroom().isEmpty()) {
                            String courtroom = assignment.getCourtroom();
                            if (courtRoomJudgeMap.containsKey(courtroom)) {
                                List<Employee> employees = courtRoomJudgeMap.get(courtroom);
                                employees.add(employee);
                            } else {
                                List<Employee> employees = new ArrayList<>();
                                employees.add(employee);
                                courtRoomJudgeMap.put(courtroom, employees);
                            }
                        }
                    }
                }
            }

        } catch (Exception e) {
            log.error("Error while fetching courtId from HRMS", e);
            throw new CustomException("ERROR_WHILE_FETCHING_FROM_HRMS", "Error while fetching courtId from HRMS");
        }

        return courtRoomJudgeMap;
    }

}
