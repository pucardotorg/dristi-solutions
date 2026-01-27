package org.pucar.dristi.kafka;

import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.extern.slf4j.Slf4j;
import org.apache.kafka.clients.consumer.ConsumerRecord;
import org.pucar.dristi.service.AdvocateOfficeCaseMemberService;
import org.pucar.dristi.web.models.advocateofficemember.AddMemberRequest;
import org.pucar.dristi.web.models.advocateofficemember.LeaveOfficeRequest;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.kafka.support.KafkaHeaders;
import org.springframework.messaging.handler.annotation.Header;
import org.springframework.stereotype.Component;

@Component
@Slf4j
public class AdvocateOfficeManagementConsumer {

    private final AdvocateOfficeCaseMemberService advocateOfficeCaseMemberService;
    private final ObjectMapper objectMapper;

    @Autowired
    public AdvocateOfficeManagementConsumer(AdvocateOfficeCaseMemberService advocateOfficeCaseMemberService, 
                                           ObjectMapper objectMapper) {
        this.advocateOfficeCaseMemberService = advocateOfficeCaseMemberService;
        this.objectMapper = objectMapper;
    }

    @KafkaListener(topics = {"${add.member.kafka.create.topic}"})
    public void listenAddMember(ConsumerRecord<String, Object> payload, @Header(KafkaHeaders.RECEIVED_TOPIC) String topic) {
        try {
            log.info("Received add member record on topic: {}", topic);
            AddMemberRequest request = objectMapper.convertValue(payload.value(), AddMemberRequest.class);
            advocateOfficeCaseMemberService.processAddMember(request);
            log.info("Successfully processed add member event for officeAdvocateId: {}", 
                    request.getAddMember().getOfficeAdvocateId());
        } catch (Exception e) {
            log.error("Error while listening to add member on topic: {}", topic, e);
        }
    }

    @KafkaListener(topics = {"${leave.office.kafka.create.topic}"})
    public void listenLeaveOffice(ConsumerRecord<String, Object> payload, @Header(KafkaHeaders.RECEIVED_TOPIC) String topic) {
        try {
            log.info("Received leave office record on topic: {}", topic);
            LeaveOfficeRequest request = objectMapper.convertValue(payload.value(), LeaveOfficeRequest.class);
            advocateOfficeCaseMemberService.processLeaveOffice(request);
            log.info("Successfully processed leave office event for officeAdvocateId: {}", 
                    request.getLeaveOffice().getOfficeAdvocateId());
        } catch (Exception e) {
            log.error("Error while listening to leave office on topic: {}", topic, e);
        }
    }
}
