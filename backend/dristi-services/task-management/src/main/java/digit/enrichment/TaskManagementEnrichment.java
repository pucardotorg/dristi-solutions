package digit.enrichment;

import digit.config.Configuration;
import digit.util.IdgenUtil;
import digit.util.TaskManagementUtil;
import digit.web.models.*;
import digit.web.models.cases.PartyAddress;
import digit.web.models.taskdetails.ProcessDeliveryDetailsStatus;
import jakarta.validation.Valid;
import lombok.extern.slf4j.Slf4j;
import org.egov.common.contract.models.AuditDetails;
import org.egov.common.contract.request.RequestInfo;
import org.egov.common.contract.request.User;
import org.egov.tracer.model.CustomException;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;

import java.util.ArrayList;
import java.util.List;

import static digit.config.ServiceConstants.WARRANT;

@Slf4j
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

    public void enrichWarrantUpfrontData(TaskManagementRequest request) {
        try {
            TaskManagement taskManagement = request.getTaskManagement();

            if (!WARRANT.equalsIgnoreCase(taskManagement.getTaskType())) {
                return;
            }

            if (taskManagement.getPartyDetails() == null || taskManagement.getPartyDetails().isEmpty()) {
                return;
            }

            for (PartyDetails partyDetail : taskManagement.getPartyDetails()) {

                if (partyDetail.getProcessDeliveryDetails() == null || partyDetail.getProcessDeliveryDetails().isEmpty()) {

                    List<PartyAddress> addresses = partyDetail.getAddresses();
                    List<DeliveryChannel> deliveryChannels = partyDetail.getDeliveryChannels();

                    if (addresses == null || addresses.isEmpty() || deliveryChannels == null || deliveryChannels.isEmpty()) {
                        continue;
                    }

                    List<ProcessDeliveryDetails> warrantUpfrontDataList = new ArrayList<>();

                    // Create combinations of Address + Delivery Channel
                    for (PartyAddress address : addresses) {
                        for (DeliveryChannel channel : deliveryChannels) {
                            ProcessDeliveryDetails data = ProcessDeliveryDetails.builder()
                                    .addressId(address.getId())
                                    .channelCode(channel.getChannelCode())
                                    .processDeliveryDetailsStatus(ProcessDeliveryDetailsStatus.NOT_COMPLETED)
                                    .build();

                            warrantUpfrontDataList.add(data);
                        }
                    }

                    // set generated upfront data
                    partyDetail.setProcessDeliveryDetails(warrantUpfrontDataList);
                }
            }

        } catch (CustomException e) {
            log.error("Error while enriching warrant up front data : {}", e.getMessage());
        }
    }

}
