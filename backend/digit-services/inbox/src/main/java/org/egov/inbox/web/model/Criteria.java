package org.egov.inbox.web.model;

import lombok.Data;

import java.util.ArrayList;
import java.util.List;

@Data
public class Criteria {
    Long date = null;
    Boolean isOnlyCountRequired = false;
    Integer count = 0;
    Integer totalCount = 0;
    String actionCategory = null;
    String searchableFields = null;
    List<String> status = null;
    String referenceEntityType = null;
    String substage = null;
    List<org.egov.inbox.web.model.V2.Data> data = new ArrayList<>();
}
