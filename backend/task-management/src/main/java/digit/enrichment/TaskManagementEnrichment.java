package digit.enrichment;

import digit.config.Configuration;
import digit.util.IdgenUtil;
import digit.util.TaskManagementUtil;
import digit.web.models.TaskManagement;
import digit.web.models.TaskManagementRequest;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotNull;
import org.egov.common.contract.models.AuditDetails;
import org.egov.common.contract.request.RequestInfo;
import org.egov.common.contract.request.User;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;

import java.util.List;

@Component
public class TaskManagementEnrichment {

    private final TaskManagementUtil taskManagementUtil;
    private final IdgenUtil idgenUtil;
    private final Configuration configuration;

    @Autowired
    public TaskManagementEnrichment(TaskManagementUtil taskManagementUtil, IdgenUtil idgenUtil, Configuration configuration) {
        this.taskManagementUtil = taskManagementUtil;
        this.idgenUtil = idgenUtil;
        this.configuration = configuration;
    }

    public void enrichCreateRequest(TaskManagementRequest request) {

        request.getTaskManagement().setId(taskManagementUtil.generateUUID().toString());
        request.getTaskManagement().setAuditDetails(getAuditDetailsForCreate(request.getRequestInfo()));

        request.getTaskManagement().setTaskManagementNumber(enrichTaskManagementNumber(request));

    }

    public void enrichUpdateRequest(TaskManagementRequest request) {
        request.getTaskManagement().setAuditDetails(getAuditDetailsForUpdate(request.getRequestInfo()));
    }

    private String enrichTaskManagementNumber(TaskManagementRequest request) {
        String idName = configuration.getTaskManagementIdName();
        String idFormat = configuration.getTaskManagementIdFormat();

        RequestInfo requestInfo = request.getRequestInfo();
        String filingNumber = request.getTaskManagement().getFilingNumber();
        String tenantId = filingNumber.replace("-", "");

        List<String> taskManagementNumberList = idgenUtil.getIdList(requestInfo, tenantId, idName, idFormat, 1, false);

        return filingNumber + "-" + taskManagementNumberList.get(0);
    }

    private AuditDetails getAuditDetailsForCreate(RequestInfo requestinfo) {

        User user = requestinfo.getUserInfo();

        return AuditDetails.builder().createdBy(user.getUuid()).lastModifiedBy(user.getUuid())
                .createdTime(taskManagementUtil.getCurrentTimeInMilliSec()).lastModifiedTime(taskManagementUtil.getCurrentTimeInMilliSec())
                .build();

    }

    private @Valid AuditDetails getAuditDetailsForUpdate(RequestInfo requestInfo) {

        User user = requestInfo.getUserInfo();

        return AuditDetails.builder().lastModifiedBy(user.getUuid()).lastModifiedTime(taskManagementUtil.getCurrentTimeInMilliSec())
                .build();

    }

}
