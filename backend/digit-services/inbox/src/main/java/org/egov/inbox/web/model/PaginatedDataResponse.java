package org.egov.inbox.web.model;// File: src/main/java/your/package/name/PaginatedDataResponse.java (or similar)

import lombok.AllArgsConstructor;
import lombok.NoArgsConstructor;
import org.egov.inbox.web.model.V2.Data;

import java.util.List;

@lombok.Data
@NoArgsConstructor
@AllArgsConstructor
public class PaginatedDataResponse {
    private List<Data> records;
    private int totalSize;
}