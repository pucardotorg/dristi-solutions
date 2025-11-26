package org.pucar.dristi.web.models;

import com.fasterxml.jackson.databind.JsonNode;
import lombok.Data;
import lombok.Getter;
import lombok.Setter;

@Data
@Getter
@Setter
public class TaskUpdateState {
    private String filingNumber;
    private JsonNode taskDetailsBefore;
    private JsonNode taskDetailsAfter;
    private String status;

    // Getters and Setters

    public TaskUpdateState(String filingNumber, JsonNode taskDetailsBefore, JsonNode taskDetailsAfter, String status) {
        this.filingNumber = filingNumber;
        this.taskDetailsBefore = taskDetailsBefore;
        this.taskDetailsAfter = taskDetailsAfter;
        this.status = status;
    }
}

