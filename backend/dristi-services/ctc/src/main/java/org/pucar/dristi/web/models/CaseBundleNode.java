package org.pucar.dristi.web.models;

import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CaseBundleNode {

    private String id;
    private String title;
    private String fileStoreId;
    private boolean isSelected;
    private String status;//accepted rejected pending
    private List<CaseBundleNode> children;
}
