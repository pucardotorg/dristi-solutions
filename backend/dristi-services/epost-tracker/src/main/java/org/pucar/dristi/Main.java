package org.pucar.dristi;

import org.egov.common.utils.MultiStateInstanceUtil;
import org.egov.tracer.config.TracerConfiguration;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.context.annotation.ComponentScan;
import org.springframework.context.annotation.Import;
import org.springframework.scheduling.annotation.EnableAsync;
import org.springframework.scheduling.annotation.EnableScheduling;

@Import({ TracerConfiguration.class , MultiStateInstanceUtil.class})
@SpringBootApplication
@EnableScheduling
@EnableAsync
@ComponentScan(basePackages = { "org.pucar.dristi", "org.pucar.dristi.controller", "org.pucar.dristi.config" })
public class Main {

    public static void main(String[] args) {
        SpringApplication.run(Main.class, args);
    }
}