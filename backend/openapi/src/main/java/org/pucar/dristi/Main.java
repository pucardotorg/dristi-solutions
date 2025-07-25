package org.pucar.dristi;


import org.egov.common.utils.MultiStateInstanceUtil;
import org.egov.tracer.config.TracerConfiguration;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.context.annotation.ComponentScan;
import org.springframework.context.annotation.Import;

@Import({ TracerConfiguration.class, MultiStateInstanceUtil.class })
@SpringBootApplication
@ComponentScan(basePackages = { "org.pucar.dristi", "org.pucar.dristi.web.controllers" , "org.pucar.dristi.config"})
public class Main {


    public static void main(String[] args) throws Exception {
        SpringApplication.run(Main.class, args);
    }

}
