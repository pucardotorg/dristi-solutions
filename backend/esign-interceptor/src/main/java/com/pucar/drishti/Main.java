package com.pucar.drishti;


import org.egov.tracer.config.TracerConfiguration;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.autoconfigure.jdbc.DataSourceAutoConfiguration;
import org.springframework.context.annotation.ComponentScan;
import org.springframework.context.annotation.Import;

@Import({TracerConfiguration.class})
@SpringBootApplication(exclude = {DataSourceAutoConfiguration.class})
@ComponentScan(basePackages = {"com.pucar.drishti", "com.pucar.drishti.web.controllers", "com.pucar.drishti.config"})
public class Main {


    public static void main(String[] args) {
        SpringApplication.run(Main.class, args);
    }

}
