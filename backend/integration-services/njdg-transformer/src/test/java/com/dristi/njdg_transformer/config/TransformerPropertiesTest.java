package com.dristi.njdg_transformer.config;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.HashSet;
import java.util.Set;

import static org.junit.jupiter.api.Assertions.*;

@ExtendWith(MockitoExtension.class)
class TransformerPropertiesTest {

    @Test
    void testDefaultConstructor() {
        TransformerProperties properties = new TransformerProperties();
        
        assertNotNull(properties);
    }

    @Test
    void testAllArgsConstructor() {
        Set<String> allowedTenantIds = new HashSet<>();
        allowedTenantIds.add("kl.kollam");

        TransformerProperties properties = new TransformerProperties(
                "http://filestore",
                "/filestore/v1/files",
                "http://mdms",
                "/egov-mdms-service/v1/_search",
                "http://hrms",
                "/egov-hrms/employees/_search",
                "JUDICIAL_MAGISTRATE",
                "JC001",
                "http://order",
                "/order/v1/_search",
                "http://hearing",
                "/hearing/v1/_search",
                1,
                32,
                '1',
                "http://case",
                "/case/v1/_search",
                "JUDGEMENT",
                3,
                "http://individual",
                "/individual/v1/_search",
                "Asia/Kolkata",
                allowedTenantIds,
                "order.notification.template",
                "http://inbox",
                "/inbox/v1/_search",
                10,
                0,
                5000L
        );

        assertEquals("http://filestore", properties.getFileStoreHost());
        assertEquals("/filestore/v1/files", properties.getFileStorePath());
        assertEquals("http://mdms", properties.getMdmsHost());
        assertEquals("/egov-mdms-service/v1/_search", properties.getMdmsEndPoint());
        assertEquals("http://hrms", properties.getHrmsHost());
        assertEquals("/egov-hrms/employees/_search", properties.getHrmsEndPoint());
        assertEquals("JUDICIAL_MAGISTRATE", properties.getJudgeDesignation());
        assertEquals("JC001", properties.getJudgeCode());
        assertEquals("http://order", properties.getOrderHost());
        assertEquals("/order/v1/_search", properties.getOrderSearchEndPoint());
        assertEquals("http://hearing", properties.getHearingHost());
        assertEquals("/hearing/v1/_search", properties.getHearingSearchPath());
        assertEquals(1, properties.getCourtNumber());
        assertEquals(32, properties.getStateCode());
        assertEquals('1', properties.getCicriType());
        assertEquals("http://case", properties.getCaseHost());
        assertEquals("/case/v1/_search", properties.getCaseSearchPath());
        assertEquals("JUDGEMENT", properties.getJudgementOrderType());
        assertEquals(3, properties.getJudgementOrderDocumentType());
        assertEquals("http://individual", properties.getIndividualHost());
        assertEquals("/individual/v1/_search", properties.getIndividualSearchPath());
        assertEquals("Asia/Kolkata", properties.getApplicationZoneId());
        assertEquals(allowedTenantIds, properties.getAllowedTenantIds());
        assertEquals(10, properties.getLimit());
        assertEquals(0, properties.getOffset());
        assertEquals(5000L, properties.getNotificationOrderProcessingDelay());
    }

    @Test
    void testBuilder() {
        TransformerProperties properties = TransformerProperties.builder()
                .fileStoreHost("http://filestore")
                .fileStorePath("/filestore/v1/files")
                .mdmsHost("http://mdms")
                .mdmsEndPoint("/egov-mdms-service/v1/_search")
                .hrmsHost("http://hrms")
                .hrmsEndPoint("/egov-hrms/employees/_search")
                .judgeDesignation("JUDICIAL_MAGISTRATE")
                .judgeCode("JC001")
                .orderHost("http://order")
                .orderSearchEndPoint("/order/v1/_search")
                .hearingHost("http://hearing")
                .hearingSearchPath("/hearing/v1/_search")
                .courtNumber(1)
                .stateCode(32)
                .cicriType('1')
                .caseHost("http://case")
                .caseSearchPath("/case/v1/_search")
                .judgementOrderType("JUDGEMENT")
                .judgementOrderDocumentType(3)
                .individualHost("http://individual")
                .individualSearchPath("/individual/v1/_search")
                .applicationZoneId("Asia/Kolkata")
                .notificationOrderBusinessTemplate("order.notification.template")
                .inboxHost("http://inbox")
                .inboxSearchEndPoint("/inbox/v1/_search")
                .limit(10)
                .offset(0)
                .notificationOrderProcessingDelay(5000L)
                .build();

        assertEquals("http://filestore", properties.getFileStoreHost());
        assertEquals("http://mdms", properties.getMdmsHost());
    }

    @Test
    void testSettersAndGetters() {
        TransformerProperties properties = new TransformerProperties();

        properties.setFileStoreHost("http://filestore");
        properties.setFileStorePath("/filestore/v1/files");
        properties.setMdmsHost("http://mdms");
        properties.setMdmsEndPoint("/egov-mdms-service/v1/_search");
        properties.setHrmsHost("http://hrms");
        properties.setHrmsEndPoint("/egov-hrms/employees/_search");
        properties.setJudgeDesignation("JUDICIAL_MAGISTRATE");
        properties.setJudgeCode("JC001");
        properties.setOrderHost("http://order");
        properties.setOrderSearchEndPoint("/order/v1/_search");
        properties.setHearingHost("http://hearing");
        properties.setHearingSearchPath("/hearing/v1/_search");
        properties.setCourtNumber(1);
        properties.setStateCode(32);
        properties.setCicriType('1');
        properties.setCaseHost("http://case");
        properties.setCaseSearchPath("/case/v1/_search");
        properties.setJudgementOrderType("JUDGEMENT");
        properties.setJudgementOrderDocumentType(3);
        properties.setIndividualHost("http://individual");
        properties.setIndividualSearchPath("/individual/v1/_search");
        properties.setApplicationZoneId("Asia/Kolkata");
        properties.setNotificationOrderBusinessTemplate("order.notification.template");
        properties.setInboxHost("http://inbox");
        properties.setInboxSearchEndPoint("/inbox/v1/_search");
        properties.setLimit(10);
        properties.setOffset(0);
        properties.setNotificationOrderProcessingDelay(5000L);

        Set<String> allowedTenantIds = new HashSet<>();
        allowedTenantIds.add("kl.kollam");
        properties.setAllowedTenantIds(allowedTenantIds);

        assertEquals("http://filestore", properties.getFileStoreHost());
        assertEquals("/filestore/v1/files", properties.getFileStorePath());
        assertEquals("http://mdms", properties.getMdmsHost());
        assertEquals("/egov-mdms-service/v1/_search", properties.getMdmsEndPoint());
        assertEquals("http://hrms", properties.getHrmsHost());
        assertEquals("/egov-hrms/employees/_search", properties.getHrmsEndPoint());
        assertEquals("JUDICIAL_MAGISTRATE", properties.getJudgeDesignation());
        assertEquals("JC001", properties.getJudgeCode());
        assertEquals("http://order", properties.getOrderHost());
        assertEquals("/order/v1/_search", properties.getOrderSearchEndPoint());
        assertEquals("http://hearing", properties.getHearingHost());
        assertEquals("/hearing/v1/_search", properties.getHearingSearchPath());
        assertEquals(1, properties.getCourtNumber());
        assertEquals(32, properties.getStateCode());
        assertEquals('1', properties.getCicriType());
        assertEquals("http://case", properties.getCaseHost());
        assertEquals("/case/v1/_search", properties.getCaseSearchPath());
        assertEquals("JUDGEMENT", properties.getJudgementOrderType());
        assertEquals(3, properties.getJudgementOrderDocumentType());
        assertEquals("http://individual", properties.getIndividualHost());
        assertEquals("/individual/v1/_search", properties.getIndividualSearchPath());
        assertEquals("Asia/Kolkata", properties.getApplicationZoneId());
        assertTrue(properties.getAllowedTenantIds().contains("kl.kollam"));
        assertEquals(10, properties.getLimit());
        assertEquals(0, properties.getOffset());
        assertEquals(5000L, properties.getNotificationOrderProcessingDelay());
    }

    @Test
    void testEqualsAndHashCode() {
        TransformerProperties properties1 = TransformerProperties.builder()
                .fileStoreHost("http://filestore")
                .mdmsHost("http://mdms")
                .build();

        TransformerProperties properties2 = TransformerProperties.builder()
                .fileStoreHost("http://filestore")
                .mdmsHost("http://mdms")
                .build();

        assertEquals(properties1, properties2);
        assertEquals(properties1.hashCode(), properties2.hashCode());
    }

    @Test
    void testToString() {
        TransformerProperties properties = TransformerProperties.builder()
                .fileStoreHost("http://filestore")
                .build();

        String toString = properties.toString();
        
        assertNotNull(toString);
        assertTrue(toString.contains("fileStoreHost"));
    }

    @Test
    void testNullValues() {
        TransformerProperties properties = new TransformerProperties();

        assertNull(properties.getFileStoreHost());
        assertNull(properties.getMdmsHost());
        assertNull(properties.getHrmsHost());
        assertNull(properties.getOrderHost());
        assertNull(properties.getHearingHost());
        assertNull(properties.getCaseHost());
        assertNull(properties.getIndividualHost());
    }

    @Test
    void testAllowedTenantIds_Empty() {
        TransformerProperties properties = new TransformerProperties();
        properties.setAllowedTenantIds(new HashSet<>());

        assertNotNull(properties.getAllowedTenantIds());
        assertTrue(properties.getAllowedTenantIds().isEmpty());
    }

    @Test
    void testAllowedTenantIds_Multiple() {
        TransformerProperties properties = new TransformerProperties();
        Set<String> tenantIds = new HashSet<>();
        tenantIds.add("kl.kollam");
        tenantIds.add("kl.trivandrum");
        tenantIds.add("kl.kochi");
        properties.setAllowedTenantIds(tenantIds);

        assertEquals(3, properties.getAllowedTenantIds().size());
        assertTrue(properties.getAllowedTenantIds().contains("kl.kollam"));
        assertTrue(properties.getAllowedTenantIds().contains("kl.trivandrum"));
        assertTrue(properties.getAllowedTenantIds().contains("kl.kochi"));
    }
}
