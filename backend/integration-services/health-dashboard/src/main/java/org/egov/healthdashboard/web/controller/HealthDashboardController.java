package org.egov.healthdashboard.web.controller;

import lombok.extern.slf4j.Slf4j;
import org.egov.healthdashboard.repository.ServiceHealthRepository;
import org.egov.healthdashboard.web.models.ServiceHealthStatus;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/v1")
@Slf4j
public class HealthDashboardController {

    private final ServiceHealthRepository serviceHealthRepository;

    @Autowired
    public HealthDashboardController(ServiceHealthRepository serviceHealthRepository) {
        this.serviceHealthRepository = serviceHealthRepository;
    }

    @GetMapping("/services/status")
    public ResponseEntity<List<ServiceHealthStatus>> getAllStatuses() {
        List<ServiceHealthStatus> statuses = serviceHealthRepository.findAll();
        return new ResponseEntity<>(statuses, HttpStatus.OK);
    }

    @GetMapping("/services/status/{serviceName}")
    public ResponseEntity<ServiceHealthStatus> getStatusByService(@PathVariable String serviceName) {
        ServiceHealthStatus status = serviceHealthRepository.findByServiceName(serviceName.toUpperCase());
        if (status == null) {
            return ResponseEntity.notFound().build();
        }
        return ResponseEntity.ok(status);
    }

}