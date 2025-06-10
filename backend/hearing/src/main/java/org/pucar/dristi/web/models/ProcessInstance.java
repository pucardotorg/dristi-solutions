package org.pucar.dristi.web.models;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.*;
import org.egov.common.contract.request.User;
import org.egov.common.contract.workflow.Action;
import org.egov.common.contract.workflow.State;
import org.egov.tracer.model.AuditDetails;

import javax.validation.Valid;
import javax.validation.constraints.NotNull;
import javax.validation.constraints.Size;
import java.util.ArrayList;
import java.util.List;

@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
@Builder
@EqualsAndHashCode(of = {"id"})
@ToString
public class ProcessInstance   {

    @Size(max=64)
    @JsonProperty("id")
    private String id = null;

    @NotNull
    @Size(max=128)
    @JsonProperty("tenantId")
    private String tenantId = null;

    @NotNull
    @Size(max=128)
    @JsonProperty("businessService")
    private String businessService = null;

    @NotNull
    @Size(max=128)
    @JsonProperty("businessId")
    private String businessId = null;

    @NotNull
    @Size(max=128)
    @JsonProperty("action")
    private String action = null;

    @NotNull
    @Size(max=64)
    @JsonProperty("moduleName")
    private String moduleName = null;

    @JsonProperty("state")
    private State state = null;

    @Size(max=1024)
    @JsonProperty("comment")
    private String comment = null;

    @JsonProperty("documents")
    @Valid
    private List<Document> documents = null;

    @JsonProperty("assigner")
    private User assigner = null;

    @JsonProperty("assignes")
    private List<User> assignes = null;

    @JsonProperty("nextActions")
    @Valid
    private List<Action> nextActions = null;

    @JsonProperty("stateSla")
    private Long stateSla = null;

    @JsonProperty("businesssServiceSla")
    private Long businesssServiceSla = null;

    @JsonProperty("previousStatus")
    @Size(max=128)
    private String previousStatus = null;

    @JsonProperty("entity")
    private Object entity = null;

    @JsonProperty("auditDetails")
    private AuditDetails auditDetails = null;

    @JsonProperty("rating")
    private Integer rating = null;

    @JsonProperty("escalated")
    private Boolean escalated = false;


    public ProcessInstance addDocumentsItem(Document documentsItem) {
        if (this.documents == null) {
            this.documents = new ArrayList<>();
        }
        if(!this.documents.contains(documentsItem))
            this.documents.add(documentsItem);

        return this;
    }

    public ProcessInstance addNextActionsItem(Action nextActionsItem) {
        if (this.nextActions == null) {
            this.nextActions = new ArrayList<>();
        }
        this.nextActions.add(nextActionsItem);
        return this;
    }

    public ProcessInstance addUsersItem(User usersItem) {
        if (this.assignes == null) {
            this.assignes = new ArrayList<>();
        }
        if(!this.assignes.contains(usersItem))
            this.assignes.add(usersItem);

        return this;
    }

}