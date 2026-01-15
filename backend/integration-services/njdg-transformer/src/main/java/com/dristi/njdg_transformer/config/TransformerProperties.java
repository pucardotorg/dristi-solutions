package com.dristi.njdg_transformer.config;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import java.util.Set;

@Data
@AllArgsConstructor
@NoArgsConstructor
@Builder
@Component
public class TransformerProperties {

    // Filestore Config
    @Value("${egov.filestore.host}")
    private String fileStoreHost;

    @Value("${egov.filestore.path}")
    private String fileStorePath;

    //MDMS config
    @Value("${egov.mdms.host}")
    private String mdmsHost;

    @Value("${egov.mdms.search.endpoint}")
    private String mdmsEndPoint;

    // HRMS
    @Value("${egov.hrms.host}")
    private String hrmsHost;

    @Value("${egov.hrms.search.endpoint}")
    private String hrmsEndPoint;


    @Value("${judge.designation}")
    private String judgeDesignation;

    @Value("${judge.code}")
    private String judgeCode;


    //Order
    @Value("${dristi.order.host}")
    private String orderHost;

    @Value("${dristi.order.search.endpoint}")
    private String orderSearchEndPoint;

    //Hearing
    @Value("${egov.hearing.host}")
    private String hearingHost;

    @Value("${egov.hearing.search.path}")
    private String hearingSearchPath;

    @Value("${court.number}")
    private Integer courtNumber;

    @Value("${state.code}")
    private Integer stateCode;

    @Value("${cicri.type}")
    private Character cicriType;

    // Case Config
    @Value("${egov.case.host}")
    private String caseHost;

    @Value("${egov.case.search.path}")
    private String caseSearchPath;

    @Value("${judgement.order.type}")
    private String judgementOrderType;

    @Value("${judgement.order.document.type}")
    private Integer judgementOrderDocumentType;

    //Individual
    @Value("${egov.individual.host}")
    private String individualHost;

    @Value("${egov.individual.search.path}")
    private String individualSearchPath;

    @Value("${app.zone.id}")
    private String applicationZoneId;

    @Value("${app.allowed.tenant.ids:}")
    private Set<String> allowedTenantIds;

    @Value("${notification.order.business.template}")
    private String notificationOrderBusinessTemplate;
}
