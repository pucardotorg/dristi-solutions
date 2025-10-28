package digit.service;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.jayway.jsonpath.JsonPath;
import digit.util.MdmsUtil;
import digit.web.models.payment.Bill;
import digit.web.models.payment.BillResponse;
import digit.web.models.payment.PaymentDetail;
import digit.web.models.payment.PaymentRequest;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import net.minidev.json.JSONArray;
import org.egov.common.contract.request.RequestInfo;
import org.egov.tracer.model.CustomException;
import org.springframework.stereotype.Service;

import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;

import static digit.config.ServiceConstants.*;

@Service
@Slf4j
@RequiredArgsConstructor
public class PaymentUpdateService {

    private final ObjectMapper objectMapper;
    private final MdmsUtil mdmsUtil;

    public void process(Map<String, Object> record) {
        try {
            PaymentRequest paymentRequest = objectMapper.convertValue(record, PaymentRequest.class);
            RequestInfo requestInfo = paymentRequest.getRequestInfo();

            List<PaymentDetail> paymentDetails = paymentRequest.getPayment().getPaymentDetails();
            String tenantId = paymentRequest.getPayment().getTenantId();
            for(PaymentDetail paymentDetail: paymentDetails) {
                String businessService = paymentDetail.getBusinessService();
                if(businessService.equalsIgnoreCase("task-management-payment")) {
                   createTaskForCompletedPayment(requestInfo, tenantId, paymentDetail);
                }
            }
        } catch (Exception exception) {
            log.error("Error while updating payment:: {}", exception.getMessage());
            throw new CustomException("PAYMENT_UPDATE_ERR", "Error while updating payment");
        }
    }

    private void createTaskForCompletedPayment(RequestInfo requestInfo, String tenantId, PaymentDetail paymentDetail) {
        try {

            Bill bill = paymentDetail.getBill();
            String consumerCode = bill.getConsumerCode();
            String businessService = bill.getBusinessService();
            //todo: might need to change as per consumer code format
            String[] consumerCodeSplitArray = consumerCode.split("_", 2);
            String taskNumber = consumerCodeSplitArray[0];
            String suffix = consumerCodeSplitArray[1];

            JSONArray paymentType = mdmsUtil.fetchMdmsData(requestInfo, tenantId, PAYMENT_MODULE_NAME, List.of(PAYMENT_TYPE_MASTER_NAME))
                    .get(PAYMENT_MODULE_NAME).get(PAYMENT_TYPE_MASTER_NAME);

            String filterString = String.format(FILTER_PAYMENT_TYPE, suffix, businessService);
            JSONArray paymentMaster = JsonPath.read(paymentType, filterString);
            List<String> deliveryChannels = JsonPath.read(paymentMaster, "$..deliveryChannel");

            String filterStringDeliveryChannel = String.format(FILTER_PAYMENT_TYPE_DELIVERY_CHANNEL, deliveryChannels.get(0), businessService);
            JSONArray paymentMasterWithDeliveryChannel = JsonPath.read(paymentType, filterStringDeliveryChannel);
            List<Map<String, Object>> maps = filterServiceCode(paymentMasterWithDeliveryChannel, businessService);
            int paymentCountForDeliveryChannel = maps.size();
            if (paymentCountForDeliveryChannel > 1) {
                List<String> suffixes = JsonPath.read(paymentMasterWithDeliveryChannel, "$..suffix");
                Set<String> consumerCodeSet = new HashSet<>();
                for (String element : suffixes) {
                    if (!element.equalsIgnoreCase(suffix)) {
                        String newConsumerCode = taskNumber + "_" + element;
                        consumerCodeSet.add(newConsumerCode);
                    }
                }
//                BillResponse billResponse = getBill(requestInfo, bill.getTenantId(), consumerCodeSet, businessService);
//                List<Bill> partsBill = billResponse.getBill();
//                boolean canUpdateWorkflow = !partsBill.isEmpty();
//                for (Bill element : partsBill) {
//                    if (!element.getStatus().equals(Bill.StatusEnum.PAID)) {
//                        canUpdateWorkflow = false;
//                        break;
//                    }
//                }
//                if (canUpdateWorkflow) {
//                    updatePaymentSuccessWorkflow(requestInfo, tenantId, taskNumber);
//                }
//            } else {
//                updatePaymentSuccessWorkflow(requestInfo, tenantId, taskNumber);
            }

        } catch (Exception e) {
            log.error("Error updating workflow for task payment: {}", e.getMessage(), e);
        }
    }

    public List<Map<String, Object>> filterServiceCode(JSONArray paymentMasterWithDeliveryChannel, String serviceCode) throws JsonProcessingException {


        String jsonString = paymentMasterWithDeliveryChannel.toString();
        List<Map<String, Object>> jsonList = objectMapper.readValue(jsonString, new TypeReference<>() {
        });

        return jsonList.stream()
                .filter(item ->
                        ((List<Map<String, Object>>) item.get("businessService")).stream()
                                .anyMatch(service -> serviceCode.equals(service.get("businessCode")))
                )
                .toList();


    }
}
