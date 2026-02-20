package org.pucar.dristi.validator;

import lombok.extern.slf4j.Slf4j;
import org.pucar.dristi.config.Configuration;
import org.pucar.dristi.web.models.LandingPageFileRequest;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;

@Component
@Slf4j
public class FileStoreValidator {

    private final Configuration configs;

    @Autowired
    public FileStoreValidator(Configuration configs) {
        this.configs = configs;
    }

    public void validatePayLoad(LandingPageFileRequest landingPageFileRequest) {
        if (landingPageFileRequest == null) {
            throw new IllegalArgumentException("Invalid input. Please provide a valid request.");
        }
        if(!isModuleNameValid(landingPageFileRequest.getModuleName())) {
            throw new IllegalArgumentException("Invalid input. Please provide a valid module name.");
        }
    }

    private boolean isModuleNameValid(String moduleName) {
        return configs.getModuleNamesEnabled().stream()
                .anyMatch(module -> module.equalsIgnoreCase(moduleName));
    }

}
