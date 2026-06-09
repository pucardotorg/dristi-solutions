package org.pucar.dristi;


import org.egov.tracer.config.TracerConfiguration;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.context.annotation.ComponentScan;
import org.springframework.context.annotation.Import;

@Import({ TracerConfiguration.class })
@SpringBootApplication
@ComponentScan(basePackages = { "org.pucar.dristi", "org.pucar.dristi.web.controllers" , "org.pucar.dristi.config"})
@EnableConfigurationProperties
public class Main {


    public static void main(String[] args) {
        SpringApplication.run(Main.class, args);
    }

}
