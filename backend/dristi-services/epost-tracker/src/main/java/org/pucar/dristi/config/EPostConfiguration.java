package org.pucar.dristi.config;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;
import org.springframework.stereotype.Component;

import java.util.List;

@Component
@Configuration
@NoArgsConstructor
@AllArgsConstructor
@Setter
@Getter
public class EPostConfiguration {

    @Value("${egov-state-level-tenant-id}")
    private String egovStateTenantId;

    @Value("${egov.idgen.host}")
    private String idGenHost;

    @Value("${egov.idgen.path}")
    private String idGenPath;

    @Value("${egov.idgen.name}")
    private String idName;

    //Summons
    @Value("${egov.summons.host}")
    private String summonsHost;

    @Value("${egov.summons.update.endpoint}")
    private String summonsUpdateEndPoint;

    //MDMS
    @Value("${egov.mdms.host}")
    private String mdmsHost;

    @Value("${egov.mdms.search.endpoint}")
    private String mdmsEndPoint;


    @Value("${egov.mdms.epost.module.name}")
    private String mdmsEPostModuleName;

    @Value("${egov.mdms.epost.master.name}")
    private String mdmsEPostMasterName;

    @Value("${egov.mdms.epost.username.module.name}")
    private String mdmsEPostAndUserNameModuleName;

    @Value("${egov.mdms.epost.username.master.name}")
    private String mdmsEPostAndUserNameMasterName;

    @Value("${get.data.based.user.logged.in}")
    private boolean getDataBasedOnUserLoggedIn;

    @Value("${default.postal.hub}")
    private String defaultPostalHub;

    // Email Config
    @Value("${email.topic}")
    private String emailTopic;

    @Value("${email.epost.subject}")
    private String epostEmailSubject;

    @Value("${email.epost.recipients}")
    private String epostEmailRecipients;

    @Value("${email.epost.template.code}")
    private String epostEmailTemplateCode;

    // Filestore Config
    @Value("${egov.filestore.host}")
    private String fileStoreHost;

    @Value("${egov.file.store.save.endpoint}")
    private String fileStoreSaveEndPoint;

    @Value("${egov.filestore.module}")
    private String fileStoreModule;

    // PDF Config
    @Value("${egov.pdf.service.host}")
    private String pdfServiceHost;

    @Value("${egov.pdf.service.create.endpoint}")
    private String pdfServiceEndpoint;

    @Value("${egov.pdf.service.template.key}")
    private String ePostPdfTemplateKey;

    @Value("${court.name}")
    private String courtName;

    // User Config
    @Value("${egov.user.host}")
    private String userHost;

    @Value("${egov.user.search.path}")
    private String userSearchEndpoint;

    @Value("${egov.user.create.path}")
    private String userCreateEndpoint;

    // excel sheet configs

    @Value("${epost.physical.weight}")
    private String epostPhysicalWeight;

    @Value("${epost.reg}")
    private String epostReg;

    @Value("${epost.otp}")
    private String epostOtp;

    @Value("${epost.ack}")
    private String epostAck;

    @Value("${epost.sender.mobile.no}")
    private String epostSenderMobileNo;

    @Value("${epost.sender.name}")
    private String epostSenderName;

    @Value("${epost.sender.city}")
    private String epostSenderCity;

    @Value("${epost.sender.state}")
    private String epostSenderState;

    @Value("${epost.sender.pin.code}")
    private String epostSenderPinCode;

    @Value("${epost.sender.address.line.one}")
    private String epostSenderAddressLineOne;

    @Value("${epost.sender.address.line.two}")
    private String epostSenderAddressLineTwo;

    @Value("${epost.alt.address.flag}")
    private String epostAltAddressFlag;

    @Value("${app.zone.id}")
    private String zoneId;

}
