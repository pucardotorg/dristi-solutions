package org.pucar.dristi.web.models.address;

import lombok.Data;

import java.util.ArrayList;
import java.util.List;

@Data
public class PhoneNumbers {
    private List<String> mobileNumber = new ArrayList<>();
    private String textfieldValue;
}
