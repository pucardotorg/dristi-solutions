package org.pucar.dristi.config;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;
import org.springframework.stereotype.Component;

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

}
