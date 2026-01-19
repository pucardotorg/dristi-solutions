package org.pucar.dristi.web.models.witnessdeposition;

import org.egov.common.contract.request.RequestInfo;
import org.junit.jupiter.api.Assertions;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.Mock;
import org.mockito.MockitoAnnotations;

public class EvidenceRequestTest {

    private EvidenceRequest evidenceRequest;

    @Mock
    private Artifact artifact;

    @BeforeEach
    public void setup() {
        MockitoAnnotations.openMocks(this);
        evidenceRequest = new EvidenceRequest();
    }

    @Test
    public void testGettersAndSetters() {
        RequestInfo requestInfo = new RequestInfo();
        evidenceRequest.setRequestInfo(requestInfo);
        evidenceRequest.setArtifact(artifact);

        Assertions.assertEquals(requestInfo, evidenceRequest.getRequestInfo());
        Assertions.assertEquals(artifact, evidenceRequest.getArtifact());
    }

    @Test
    public void testBuilder() {
        RequestInfo requestInfo = new RequestInfo();
        Artifact artifact = new Artifact();
        EvidenceRequest evidenceRequest = EvidenceRequest.builder()
                .requestInfo(requestInfo)
                .artifact(artifact)
                .build();

        Assertions.assertEquals(requestInfo, evidenceRequest.getRequestInfo());
        Assertions.assertEquals(artifact, evidenceRequest.getArtifact());
    }


}

