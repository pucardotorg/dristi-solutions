package com.dristi.njdg_transformer.enrichment;

import com.dristi.njdg_transformer.model.*;
import com.dristi.njdg_transformer.model.cases.*;
import com.dristi.njdg_transformer.model.enums.PartyType;
import com.dristi.njdg_transformer.producer.Producer;
import com.dristi.njdg_transformer.repository.AdvocateRepository;
import com.dristi.njdg_transformer.repository.CaseRepository;
import com.dristi.njdg_transformer.utils.JsonUtil;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ArrayNode;
import com.fasterxml.jackson.databind.node.ObjectNode;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.ArrayList;
import java.util.Collections;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class CaseEnrichmentTest {

    @Mock
    private ObjectMapper objectMapper;

    @Mock
    private AdvocateRepository advocateRepository;

    @Mock
    private CaseRepository repository;

    @Mock
    private JsonUtil jsonUtil;

    @Mock
    private Producer producer;

    @InjectMocks
    private CaseEnrichment caseEnrichment;

    private CourtCase courtCase;
    private NJDGTransformRecord record;
    private ObjectMapper realMapper;

    @BeforeEach
    void setUp() {
        realMapper = new ObjectMapper();

        courtCase = new CourtCase();
        courtCase.setCnrNumber("CNR-001");
        courtCase.setFilingNumber("FN-001");

        Party complainant = new Party();
        complainant.setPartyType("complainant.primary");
        complainant.setIndividualId("IND-001");

        Party respondent = new Party();
        respondent.setPartyType("respondent.primary");
        respondent.setIndividualId("IND-002");

        courtCase.setLitigants(List.of(complainant, respondent));

        record = new NJDGTransformRecord();
        record.setCino("CNR-001");
    }

    @Test
    void testEnrichPrimaryPartyDetails_Complainant_Success() {
        ObjectNode additionalDetails = realMapper.createObjectNode();
        ObjectNode complainantDetails = realMapper.createObjectNode();
        ArrayNode formdata = realMapper.createArrayNode();
        ObjectNode formItem = realMapper.createObjectNode();
        ObjectNode data = realMapper.createObjectNode();
        data.put("firstName", "John");
        data.put("lastName", "Doe");
        data.put("complainantAge", "30");
        
        ObjectNode complainantVerification = realMapper.createObjectNode();
        ObjectNode individualDetails = realMapper.createObjectNode();
        individualDetails.put("individualId", "IND-001");
        complainantVerification.set("individualDetails", individualDetails);
        data.set("complainantVerification", complainantVerification);
        
        ObjectNode addressDetails = realMapper.createObjectNode();
        addressDetails.put("locality", "Test Locality");
        addressDetails.put("city", "Test City");
        data.set("addressDetails", addressDetails);
        
        formItem.set("data", data);
        formdata.add(formItem);
        complainantDetails.set("formdata", formdata);
        additionalDetails.set("complainantDetails", complainantDetails);

        when(objectMapper.convertValue(any(), eq(JsonNode.class))).thenReturn(additionalDetails);

        caseEnrichment.enrichPrimaryPartyDetails(courtCase, record, "complainant.primary");

        assertNotNull(record.getPetName());
    }

    @Test
    void testEnrichPrimaryPartyDetails_Respondent_Success() {
        ObjectNode additionalDetails = realMapper.createObjectNode();
        ObjectNode respondentDetails = realMapper.createObjectNode();
        ArrayNode formdata = realMapper.createArrayNode();
        ObjectNode formItem = realMapper.createObjectNode();
        formItem.put("displayindex", 0);
        ObjectNode data = realMapper.createObjectNode();
        data.put("respondentFirstName", "Jane");
        data.put("respondentLastName", "Smith");
        data.put("respondentAge", "25");
        
        ObjectNode respondentVerification = realMapper.createObjectNode();
        ObjectNode individualDetails = realMapper.createObjectNode();
        individualDetails.put("individualId", "IND-002");
        respondentVerification.set("individualDetails", individualDetails);
        data.set("respondentVerification", respondentVerification);
        
        ArrayNode addressArray = realMapper.createArrayNode();
        ObjectNode addressWrapper = realMapper.createObjectNode();
        ObjectNode addressDetailsNode = realMapper.createObjectNode();
        addressDetailsNode.put("locality", "Test Locality");
        addressWrapper.set("addressDetails", addressDetailsNode);
        addressArray.add(addressWrapper);
        data.set("addressDetails", addressArray);
        
        formItem.set("data", data);
        formdata.add(formItem);
        respondentDetails.set("formdata", formdata);
        additionalDetails.set("respondentDetails", respondentDetails);

        when(objectMapper.convertValue(any(), eq(JsonNode.class))).thenReturn(additionalDetails);

        caseEnrichment.enrichPrimaryPartyDetails(courtCase, record, "respondent.primary");

        assertNotNull(record.getResName());
    }

    @Test
    void testEnrichPrimaryPartyDetails_NoAdditionalDetails() {
        lenient().when(objectMapper.convertValue(any(), eq(JsonNode.class))).thenReturn(null);

        caseEnrichment.enrichPrimaryPartyDetails(courtCase, record, "complainant.primary");

        // Service may set empty string instead of null
        assertTrue(record.getPetName() == null || record.getPetName().isEmpty());
    }

    @Test
    void testEnrichPrimaryPartyDetails_NoLitigants() {
        courtCase.setLitigants(null);

        lenient().when(objectMapper.convertValue(any(), eq(JsonNode.class))).thenReturn(realMapper.createObjectNode());

        caseEnrichment.enrichPrimaryPartyDetails(courtCase, record, "complainant.primary");

        // Service may set empty string instead of null
        assertTrue(record.getPetName() == null || record.getPetName().isEmpty());
    }

    @Test
    void testEnrichAdvocateDetails_Complainant_Success() {
        AdvocateMapping advocateMapping = new AdvocateMapping();
        advocateMapping.setAdvocateId("ADV-001");
        
        Party representingParty = new Party();
        representingParty.setPartyType("complainant.primary");
        representingParty.setIndividualId("IND-001");
        advocateMapping.setRepresenting(Collections.singletonList(representingParty));

        courtCase.setRepresentatives(Collections.singletonList(advocateMapping));

        AdvocateDetails advocateDetails = new AdvocateDetails();
        advocateDetails.setAdvocateCode(1);
        advocateDetails.setAdvocateName("Advocate One");
        advocateDetails.setBarRegNo("BAR-001");

        when(advocateRepository.getAdvocateDetails("ADV-001")).thenReturn(advocateDetails);
        when(repository.getExtraAdvocateDetails(anyString(), anyInt())).thenReturn(Collections.emptyList());

        caseEnrichment.enrichAdvocateDetails(courtCase, record, "complainant.primary");

        assertEquals(1, record.getPetAdvCd());
        assertEquals("Advocate One", record.getPetAdv());
        assertEquals("BAR-001", record.getPetAdvBarReg());
    }

    @Test
    void testEnrichAdvocateDetails_Respondent_Success() {
        AdvocateMapping advocateMapping = new AdvocateMapping();
        advocateMapping.setAdvocateId("ADV-002");
        
        Party representingParty = new Party();
        representingParty.setPartyType("respondent.primary");
        representingParty.setIndividualId("IND-002");
        advocateMapping.setRepresenting(Collections.singletonList(representingParty));

        courtCase.setRepresentatives(Collections.singletonList(advocateMapping));

        AdvocateDetails advocateDetails = new AdvocateDetails();
        advocateDetails.setAdvocateCode(2);
        advocateDetails.setAdvocateName("Advocate Two");
        advocateDetails.setBarRegNo("BAR-002");

        when(advocateRepository.getAdvocateDetails("ADV-002")).thenReturn(advocateDetails);
        when(repository.getExtraAdvocateDetails(anyString(), anyInt())).thenReturn(Collections.emptyList());

        caseEnrichment.enrichAdvocateDetails(courtCase, record, "respondent.primary");

        assertEquals(2, record.getResAdvCd());
        assertEquals("Advocate Two", record.getResAdv());
        assertEquals("BAR-002", record.getResAdvBarReg());
    }

    @Test
    void testEnrichAdvocateDetails_NoRepresentatives() {
        courtCase.setRepresentatives(null);

        caseEnrichment.enrichAdvocateDetails(courtCase, record, "complainant.primary");

        // Service may return null or 0 for advocate code
        assertTrue(record.getPetAdvCd() == null || record.getPetAdvCd() == 0);
    }

    @Test
    void testEnrichAdvocateDetails_AdvocateNotFound() {
        AdvocateMapping advocateMapping = new AdvocateMapping();
        advocateMapping.setAdvocateId("ADV-001");
        
        Party representingParty = new Party();
        representingParty.setPartyType("complainant.primary");
        representingParty.setIndividualId("IND-001");
        advocateMapping.setRepresenting(Collections.singletonList(representingParty));

        courtCase.setRepresentatives(Collections.singletonList(advocateMapping));

        lenient().when(advocateRepository.getAdvocateDetails("ADV-001")).thenReturn(null);

        caseEnrichment.enrichAdvocateDetails(courtCase, record, "complainant.primary");

        // Service may return null or 0 for advocate code
        assertTrue(record.getPetAdvCd() == null || record.getPetAdvCd() == 0);
    }

    @Test
    void testGetComplainantExtraParties() {
        ObjectNode additionalDetails = realMapper.createObjectNode();
        ObjectNode complainantDetails = realMapper.createObjectNode();
        ArrayNode formdata = realMapper.createArrayNode();
        
        // Add two parties
        for (int i = 0; i < 2; i++) {
            ObjectNode formItem = realMapper.createObjectNode();
            formItem.put("displayindex", i + 1);
            ObjectNode data = realMapper.createObjectNode();
            data.put("firstName", "Party " + i);
            
            ObjectNode complainantVerification = realMapper.createObjectNode();
            ObjectNode individualDetails = realMapper.createObjectNode();
            individualDetails.put("individualId", "IND-10" + i);
            complainantVerification.set("individualDetails", individualDetails);
            data.set("complainantVerification", complainantVerification);
            
            formItem.set("data", data);
            formdata.add(formItem);
        }
        complainantDetails.set("formdata", formdata);
        additionalDetails.set("complainantDetails", complainantDetails);

        when(objectMapper.convertValue(any(), eq(JsonNode.class))).thenReturn(additionalDetails);

        List<PartyDetails> result = caseEnrichment.getComplainantExtraParties(courtCase);

        assertNotNull(result);
    }

    @Test
    void testGetRespondentExtraParties() {
        ObjectNode additionalDetails = realMapper.createObjectNode();
        ObjectNode respondentDetails = realMapper.createObjectNode();
        ArrayNode formdata = realMapper.createArrayNode();
        
        // Add two parties
        for (int i = 0; i < 2; i++) {
            ObjectNode formItem = realMapper.createObjectNode();
            formItem.put("displayindex", i + 1);
            ObjectNode data = realMapper.createObjectNode();
            data.put("respondentFirstName", "Party " + i);
            
            ObjectNode respondentVerification = realMapper.createObjectNode();
            ObjectNode individualDetails = realMapper.createObjectNode();
            individualDetails.put("individualId", "IND-20" + i);
            respondentVerification.set("individualDetails", individualDetails);
            data.set("respondentVerification", respondentVerification);
            
            formItem.set("data", data);
            formdata.add(formItem);
        }
        respondentDetails.set("formdata", formdata);
        additionalDetails.set("respondentDetails", respondentDetails);

        when(objectMapper.convertValue(any(), eq(JsonNode.class))).thenReturn(additionalDetails);

        List<PartyDetails> result = caseEnrichment.getRespondentExtraParties(courtCase);

        assertNotNull(result);
    }

    @Test
    void testGetWitnessDetails_Success() {
        WitnessDetails witness = new WitnessDetails();
        witness.setUniqueId("W-001");
        witness.setFirstName("Witness");
        witness.setLastName("One");
        witness.setWitnessAge("40");
        witness.setOwnerType("COMPLAINANT");
        courtCase.setWitnessDetails(Collections.singletonList(witness));

        when(repository.getPartyDetails(anyString(), any(PartyType.class)))
                .thenReturn(Collections.emptyList());

        List<PartyDetails> result = caseEnrichment.getWitnessDetails(courtCase, PartyType.PET);

        assertNotNull(result);
        assertEquals(1, result.size());
        assertEquals("W-001", result.get(0).getPartyId());
    }

    @Test
    void testGetWitnessDetails_NoWitnesses() {
        courtCase.setWitnessDetails(null);

        List<PartyDetails> result = caseEnrichment.getWitnessDetails(courtCase, PartyType.PET);

        assertNotNull(result);
        assertTrue(result.isEmpty());
    }

    @Test
    void testGetWitnessDetails_WrongOwnerType() {
        WitnessDetails witness = new WitnessDetails();
        witness.setUniqueId("W-001");
        witness.setFirstName("Witness");
        witness.setOwnerType("ACCUSED");
        courtCase.setWitnessDetails(Collections.singletonList(witness));

        when(repository.getPartyDetails(anyString(), any(PartyType.class)))
                .thenReturn(Collections.emptyList());

        List<PartyDetails> result = caseEnrichment.getWitnessDetails(courtCase, PartyType.PET);

        assertNotNull(result);
        assertTrue(result.isEmpty());
    }

    @Test
    void testGetWitnessDetails_ExistingWitness() {
        WitnessDetails witness = new WitnessDetails();
        witness.setUniqueId("W-001");
        witness.setFirstName("Witness");
        witness.setLastName("One");
        witness.setOwnerType("COMPLAINANT");
        courtCase.setWitnessDetails(Collections.singletonList(witness));

        PartyDetails existingParty = PartyDetails.builder()
                .partyId("W-001")
                .partyNo(2)
                .build();

        when(repository.getPartyDetails(anyString(), any(PartyType.class)))
                .thenReturn(Collections.singletonList(existingParty));

        List<PartyDetails> result = caseEnrichment.getWitnessDetails(courtCase, PartyType.PET);

        assertNotNull(result);
        assertEquals(1, result.size());
    }
}
