package org.pucar.dristi.web.models;

import org.egov.common.contract.request.User;
import org.junit.jupiter.api.Test;
import org.pucar.dristi.web.models.PendingTask;

import java.util.ArrayList;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;

class PendingTaskTest {

    @Test
    void testNoArgsConstructor() {
        PendingTask pendingTask = new PendingTask();
        assertNull(pendingTask.getId());
        assertNull(pendingTask.getName());
        assertNull(pendingTask.getReferenceId());
        assertNull(pendingTask.getEntityType());
        assertNull(pendingTask.getStatus());
        assertNotNull(pendingTask.getAssignedTo());
        assertNotNull(pendingTask.getAssignedRole());
        assertNull(pendingTask.getCnrNumber());
        assertNull(pendingTask.getFilingNumber());
        assertNull(pendingTask.getIsCompleted());
        assertNull(pendingTask.getStateSla());
        assertNull(pendingTask.getBusinessServiceSla());
        assertNull(pendingTask.getAdditionalDetails());
    }

    @Test
    void testAllArgsConstructor() {
        List<User> assignedTo = new ArrayList<>();
        List<String> assignedRole = new ArrayList<>();
        Object additionalDetails = new Object();
        PendingTask pendingTask = new PendingTask("1", "TaskName", "Ref123", "EntityType1", "Status1",
                assignedTo, assignedRole, "CNR123", "Filing123","test1","test","test",
                true, 10L, 20L, additionalDetails, "home", "KLKM52" , 1L,  "NIA S138",1L, "test", null, null, null);

        assertEquals("1", pendingTask.getId());
        assertEquals("TaskName", pendingTask.getName());
        assertEquals("Ref123", pendingTask.getReferenceId());
        assertEquals("EntityType1", pendingTask.getEntityType());
        assertEquals("Status1", pendingTask.getStatus());
        assertEquals(assignedTo, pendingTask.getAssignedTo());
        assertEquals(assignedRole, pendingTask.getAssignedRole());
        assertEquals("CNR123", pendingTask.getCnrNumber());
        assertEquals("Filing123", pendingTask.getFilingNumber());
        assertTrue(pendingTask.getIsCompleted());
        assertEquals(10L, pendingTask.getStateSla());
        assertEquals(20L, pendingTask.getBusinessServiceSla());
        assertEquals(additionalDetails, pendingTask.getAdditionalDetails());
    }

    @Test
    void testBuilder() {
        List<User> assignedTo = new ArrayList<>();
        List<String> assignedRole = new ArrayList<>();
        Object additionalDetails = new Object();
        PendingTask pendingTask = PendingTask.builder()
                .id("1")
                .name("TaskName")
                .referenceId("Ref123")
                .entityType("EntityType1")
                .status("Status1")
                .assignedTo(assignedTo)
                .assignedRole(assignedRole)
                .cnrNumber("CNR123")
                .filingNumber("Filing123")
                .isCompleted(true)
                .stateSla(10L)
                .businessServiceSla(20L)
                .additionalDetails(additionalDetails)
                .build();

        assertEquals("1", pendingTask.getId());
        assertEquals("TaskName", pendingTask.getName());
        assertEquals("Ref123", pendingTask.getReferenceId());
        assertEquals("EntityType1", pendingTask.getEntityType());
        assertEquals("Status1", pendingTask.getStatus());
        assertEquals(assignedTo, pendingTask.getAssignedTo());
        assertEquals(assignedRole, pendingTask.getAssignedRole());
        assertEquals("CNR123", pendingTask.getCnrNumber());
        assertEquals("Filing123", pendingTask.getFilingNumber());
        assertTrue(pendingTask.getIsCompleted());
        assertEquals(10L, pendingTask.getStateSla());
        assertEquals(20L, pendingTask.getBusinessServiceSla());
        assertEquals(additionalDetails, pendingTask.getAdditionalDetails());
    }

    @Test
    void testSettersAndGetters() {
        PendingTask pendingTask = new PendingTask();
        List<User> assignedTo = new ArrayList<>();
        List<String> assignedRole = new ArrayList<>();
        Object additionalDetails = new Object();

        pendingTask.setId("1");
        pendingTask.setName("TaskName");
        pendingTask.setReferenceId("Ref123");
        pendingTask.setEntityType("EntityType1");
        pendingTask.setStatus("Status1");
        pendingTask.setAssignedTo(assignedTo);
        pendingTask.setAssignedRole(assignedRole);
        pendingTask.setCnrNumber("CNR123");
        pendingTask.setFilingNumber("Filing123");
        pendingTask.setIsCompleted(true);
        pendingTask.setStateSla(10L);
        pendingTask.setBusinessServiceSla(20L);
        pendingTask.setAdditionalDetails(additionalDetails);

        assertEquals("1", pendingTask.getId());
        assertEquals("TaskName", pendingTask.getName());
        assertEquals("Ref123", pendingTask.getReferenceId());
        assertEquals("EntityType1", pendingTask.getEntityType());
        assertEquals("Status1", pendingTask.getStatus());
        assertEquals(assignedTo, pendingTask.getAssignedTo());
        assertEquals(assignedRole, pendingTask.getAssignedRole());
        assertEquals("CNR123", pendingTask.getCnrNumber());
        assertEquals("Filing123", pendingTask.getFilingNumber());
        assertTrue(pendingTask.getIsCompleted());
        assertEquals(10L, pendingTask.getStateSla());
        assertEquals(20L, pendingTask.getBusinessServiceSla());
        assertEquals(additionalDetails, pendingTask.getAdditionalDetails());
    }

    @Test
    void testToString() {
        List<User> assignedTo = new ArrayList<>();
        List<String> assignedRole = new ArrayList<>();
        PendingTask pendingTask = PendingTask.builder()
                .id("1")
                .name("TaskName")
                .referenceId("Ref123")
                .entityType("EntityType1")
                .status("Status1")
                .assignedTo(assignedTo)
                .assignedRole(assignedRole)
                .cnrNumber("CNR123")
                .filingNumber("Filing123")
                .isCompleted(true)
                .stateSla(10L)
                .businessServiceSla(20L)
                .screenType("home")
                .courtId("KLKM52")
                .build();

        String expected ="PendingTask(id=1, name=TaskName, referenceId=Ref123, entityType=EntityType1, status=Status1, assignedTo=[], assignedRole=[], cnrNumber=CNR123, filingNumber=Filing123, actionCategory=null, caseId=null, caseTitle=null, isCompleted=true, stateSla=10, businessServiceSla=20, additionalDetails=null, screenType=home, courtId=KLKM52, expiryDate=null, sectionAndSubSection=null, filingDate=null, referenceEntityType=null, offices=null, dateOfApplication=null, nextHearingDate=null)";
        assertEquals(expected, pendingTask.toString());
    }
}
