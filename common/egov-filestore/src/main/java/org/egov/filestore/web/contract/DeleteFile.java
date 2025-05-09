package org.egov.filestore.web.contract;

import lombok.*;

import java.util.List;


@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DeleteFile {

    private String tenantId;
    private boolean isSoftDelete;
    private List<String> fileStoreIds;
    private String module;
}
