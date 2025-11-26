package com.dristi.njdg_transformer.controller;


import com.dristi.njdg_transformer.model.cases.*;
import com.dristi.njdg_transformer.producer.Producer;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/cases")
@RequiredArgsConstructor
@Slf4j
public class TestController {

    private final Producer producer;
    private final ObjectMapper objectMapper;

    /**
     * Publish message to case topic → triggers CaseConsumer.listen()
     */
    @PostMapping("/publish")
    public String publishCase(@RequestBody CaseRequest caseRequest) {
        String topic = "update-case-application"; // or use from config: ${kafka.topics.case}
        producer.push(topic, caseRequest);
        log.info("Published CaseRequest to topic: {} | filingNumber: {}", topic, caseRequest.getCourtCase().getFilingNumber());
        return "✅ Case message published successfully to topic: " + topic;
    }

    /**
     * Publish message to join case topic → triggers CaseConsumer.listenJoinCase()
     */
    @PostMapping("/publish/join")
    public String publishJoinCase(@RequestBody CourtCase courtCase) {
        String topic = "litigant-join-case"; // or ${kafka.topics.join.case}
        producer.push(topic, courtCase);
        log.info("Published Join Case to topic: {} | filingNumber: {}", topic, courtCase.getFilingNumber());
        return "✅ Join case message published successfully to topic: " + topic;
    }

    /**
     * Publish message to case outcome topic → triggers CaseConsumer.listenCaseOutcome()
     */
    @PostMapping("/publish/outcome")
    public String publishCaseOutcome(@RequestBody CaseOutcome caseOutcome) {
        String topic = "case-outcome-topic";
        producer.push(topic, caseOutcome);
        log.info("Published CaseOutcome to topic: {} | filingNumber: {}", topic, caseOutcome.getOutcome().getFilingNumber());
        return "✅ Case outcome message published successfully to topic: " + topic;
    }

    /**
     * Publish message to case overall status topic → triggers CaseConsumer.listenCaseOverallStatus()
     */
    @PostMapping("/publish/status")
    public String publishCaseOverallStatus(@RequestBody CaseStageSubStage stageSubStage) {
        String topic = "case-overall-status-topic";
        producer.push(topic, stageSubStage);
        log.info("Published CaseOverallStatus to topic: {} | filingNumber: {}", topic, stageSubStage.getCaseOverallStatus().getFilingNumber());
        return "✅ Case overall status message published successfully to topic: " + topic;
    }

    /**
     * Generic endpoint for debugging – publish any JSON to any topic
     */
    @PostMapping("/publish/raw")
    public String publishRawMessage(@RequestParam String topic, @RequestBody String rawJson) {
        try {
            Object payload = objectMapper.readTree(rawJson);
            producer.push(topic, payload);
            log.info("Published raw message to topic: {}", topic);
            return "✅ Raw message published successfully to topic: " + topic;
        } catch (Exception e) {
            log.error("❌ Failed to publish raw message | topic: {} | error: {}", topic, e.getMessage());
            return "Failed to publish message: " + e.getMessage();
        }
    }
}

