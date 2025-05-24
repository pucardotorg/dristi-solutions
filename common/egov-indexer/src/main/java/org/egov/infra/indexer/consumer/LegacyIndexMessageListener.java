package org.egov.infra.indexer.consumer;

import com.fasterxml.jackson.annotation.JsonInclude;
import org.apache.kafka.clients.consumer.ConsumerRecord;
import org.egov.infra.indexer.custom.application.ApplicationCustomDecorator;
import org.egov.infra.indexer.custom.application.ApplicationResponse;
import org.egov.infra.indexer.custom.bill.BillCustomDecorator;
import org.egov.infra.indexer.custom.bill.BillingResponse;
import org.egov.infra.indexer.custom.courtCase.CaseCustomDecorator;
import org.egov.infra.indexer.custom.courtCase.CaseResponse;
import org.egov.infra.indexer.custom.hearing.HearingCustomDecorator;
import org.egov.infra.indexer.custom.hearing.HearingResponse;
import org.egov.infra.indexer.service.IndexerService;
import org.egov.infra.indexer.service.LegacyIndexService;
import org.egov.infra.indexer.util.IndexerUtils;
import org.egov.infra.indexer.web.contract.LegacyIndexRequest;
import org.slf4j.MDC;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.kafka.listener.MessageListener;
import org.springframework.stereotype.Service;

import com.fasterxml.jackson.databind.ObjectMapper;

import lombok.extern.slf4j.Slf4j;

import static org.egov.infra.indexer.util.IndexerConstants.TENANTID_MDC_STRING;

@Service
@Slf4j
public class LegacyIndexMessageListener implements MessageListener<String, String> {


	@Autowired
	private IndexerUtils indexerUtils;
	
	@Autowired
	private LegacyIndexService legacyIndexService;
	
	@Autowired
	private IndexerService indexerService;

	@Autowired
	private ApplicationCustomDecorator applicationCustomDecorator;

	@Autowired
	private CaseCustomDecorator caseCustomDecorator;

	@Autowired
	private HearingCustomDecorator hearingCustomDecorator;

	@Autowired
	private BillCustomDecorator billCustomDecorator;
	
	@Value("${egov.core.legacyindex.topic.name}")
	private String legacyIndexTopic;

	@Value("${egov.statelevel.tenantId}")
	private  String stateLevelTenantId ;

	@Override
	/**
	 * Messages listener which acts as consumer. This message listener is injected inside a kafkaContainer.
	 * This consumer is a start point to the following index jobs:
	 * 1. Re-index
	 * 2. Legacy Index
	 * 3. PGR custom index
	 * 4. PT custom index
	 * 5. Core indexing
	 */
	public void onMessage(ConsumerRecord<String, String> data) {
		log.info("Topic: " + data.topic());
		// Adding in MDC so that tracer can add it in header
		MDC.put(TENANTID_MDC_STRING, stateLevelTenantId );
		ObjectMapper mapper = indexerUtils.getObjectMapper();
		if(data.topic().equals(legacyIndexTopic)) {
			try {
				LegacyIndexRequest legacyIndexRequest = mapper.readValue(data.value(), LegacyIndexRequest.class);
				legacyIndexService.beginLegacyIndex(legacyIndexRequest);
			}catch(Exception e) {
				log.error("Couldn't parse legacyindex request: ", e);
			}
		}else {
			try {
				if (data.topic().equalsIgnoreCase("application-legacy-topic") || data.topic().equalsIgnoreCase("case-legacy-topic") || data.topic().equalsIgnoreCase("hearing-legacy-topic") || data.topic().equalsIgnoreCase("billing-legacy-topic")) {
					data = transformData(data);
				}
				indexerService.esIndexer(data.topic(), data.value());
			} catch (Exception e) {
				log.error("error while indexing: ", e);
			}
		}
	}

	private ConsumerRecord<String, String> transformData(ConsumerRecord<String, String> data) {
		try {
			ObjectMapper mapper = indexerUtils.getObjectMapper();
			mapper.setSerializationInclusion(JsonInclude.Include.ALWAYS);
			String topic = data.topic();
			String value = data.value();
			String newValue = value;

			switch (topic) {
				case "application-legacy-topic" -> {
					ApplicationResponse applicationResponse = mapper.readValue(value, ApplicationResponse.class);
					applicationResponse.setApplicationList(
							applicationCustomDecorator.transformData(applicationResponse.getApplicationList())
					);
					newValue = mapper.writeValueAsString(applicationResponse);
				}
				case "case-legacy-topic" -> {
					CaseResponse caseResponse = mapper.readValue(value, CaseResponse.class);
					caseResponse.setCriteria(
							caseCustomDecorator.transformData(caseResponse.getCriteria())
					);
					newValue = mapper.writeValueAsString(caseResponse);
				}
				case "hearing-legacy-topic" -> {
					HearingResponse hearingResponse = mapper.readValue(value, HearingResponse.class);
					hearingResponse.setHearingList(
							hearingCustomDecorator.transformData(hearingResponse.getHearingList())
					);
					newValue = mapper.writeValueAsString(hearingResponse);
				}
				case "billing-legacy-topic" -> {
					BillingResponse billingResponse = mapper.readValue(value, BillingResponse.class);
					billingResponse.setBill(
							billCustomDecorator.transformData(billingResponse.getBill())
					);
					newValue = mapper.writeValueAsString(billingResponse);
				}
			}

			return new ConsumerRecord<>(
					data.topic(),
					data.partition(),
					data.offset(),
					data.key(),
					newValue
			);

		} catch (Exception e) {
			log.error("Error while enriching dates for topic {}: ", data.topic(), e);
			return data; // return original if enrichment fails
		}
	}


}
