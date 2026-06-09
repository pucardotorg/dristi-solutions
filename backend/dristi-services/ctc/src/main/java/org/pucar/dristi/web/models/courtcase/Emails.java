package org.pucar.dristi.web.models.courtcase;

import lombok.Data;

import java.util.ArrayList;
import java.util.List;

@Data
public class Emails {
    private List<String> emailId = new ArrayList<>();
    private String textfieldValue;
}
