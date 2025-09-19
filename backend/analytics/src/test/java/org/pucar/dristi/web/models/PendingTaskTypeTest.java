package org.pucar.dristi.web.models;

import org.junit.jupiter.api.Test;
import org.pucar.dristi.web.models.PendingTaskType;

import java.util.Arrays;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;

class PendingTaskTypeTest {

    @Test
    void testNoArgsConstructor() {
        PendingTaskType pendingTaskType = new PendingTaskType();
        assertNull(pendingTaskType.getId());
        assertNull(pendingTaskType.getPendingTask());
        assertNull(pendingTaskType.getActor());
        assertNull(pendingTaskType.getTriggerAction());
        assertNull(pendingTaskType.getState());
        assertNull(pendingTaskType.getWorkflowModule());
        assertNotNull(pendingTaskType.getCloserAction());
    }

    @Test
    void testAllArgsConstructor() {
        String id = "123";
        String pendingTask = "task1";
        String actor = "actor1";
        List<String> triggerAction = Arrays.asList("action1", "action2");
        String state = "state1";
        String workflowModule = "module1";
        List<String> closerAction = Arrays.asList("close1", "close2");

        // Create reference entity type name mapping list
        ReferenceEntityTypeNameMapping mapping1 = new ReferenceEntityTypeNameMapping("profileEditing", "Review Litigant Details Change","actionCategory");
        ReferenceEntityTypeNameMapping mapping2 = new ReferenceEntityTypeNameMapping("documentSubmission", "Review Document Submission","actionCategory");
        List<ReferenceEntityTypeNameMapping> referenceEntityTypeNameMapping = Arrays.asList(mapping1, mapping2);

        PendingTaskType pendingTaskType = new PendingTaskType(id, pendingTask, actor,false, triggerAction, state, workflowModule, "home","actionCategory",closerAction,referenceEntityTypeNameMapping, null, null);

        assertEquals(id, pendingTaskType.getId());
        assertEquals(pendingTask, pendingTaskType.getPendingTask());
        assertEquals(actor, pendingTaskType.getActor());
        assertEquals(false, pendingTaskType.getIsgeneric());
        assertEquals(triggerAction, pendingTaskType.getTriggerAction());
        assertEquals(state, pendingTaskType.getState());
        assertEquals(workflowModule, pendingTaskType.getWorkflowModule());
        assertEquals("home", pendingTaskType.getScreenType());
        assertEquals(closerAction, pendingTaskType.getCloserAction());
        assertEquals(referenceEntityTypeNameMapping, pendingTaskType.getReferenceEntityTypeNameMapping());

        // Additional assertions for the new field
        assertEquals(2, pendingTaskType.getReferenceEntityTypeNameMapping().size());
        assertEquals("profileEditing", pendingTaskType.getReferenceEntityTypeNameMapping().get(0).getReferenceEntityType());
        assertEquals("Review Litigant Details Change", pendingTaskType.getReferenceEntityTypeNameMapping().get(0).getPendingTaskName());
        assertEquals("documentSubmission", pendingTaskType.getReferenceEntityTypeNameMapping().get(1).getReferenceEntityType());
        assertEquals("Review Document Submission", pendingTaskType.getReferenceEntityTypeNameMapping().get(1).getPendingTaskName());
    }

    @Test
    void testBuilder() {
        String id = "123";
        String pendingTask = "task1";
        String actor = "actor1";
        List<String> triggerAction = Arrays.asList("action1", "action2");
        String state = "state1";
        String workflowModule = "module1";
        List<String> closerAction = Arrays.asList("close1", "close2");

        PendingTaskType pendingTaskType = PendingTaskType.builder()
                .id(id)
                .pendingTask(pendingTask)
                .actor(actor)
                .triggerAction(triggerAction)
                .state(state)
                .workflowModule(workflowModule)
                .closerAction(closerAction)
                .build();

        assertEquals(id, pendingTaskType.getId());
        assertEquals(pendingTask, pendingTaskType.getPendingTask());
        assertEquals(actor, pendingTaskType.getActor());
        assertEquals(triggerAction, pendingTaskType.getTriggerAction());
        assertEquals(state, pendingTaskType.getState());
        assertEquals(workflowModule, pendingTaskType.getWorkflowModule());
        assertEquals(closerAction, pendingTaskType.getCloserAction());
    }

    @Test
    void testSettersAndGetters() {
        PendingTaskType pendingTaskType = new PendingTaskType();
        String id = "123";
        String pendingTask = "task1";
        String actor = "actor1";
        List<String> triggerAction = Arrays.asList("action1", "action2");
        String state = "state1";
        String workflowModule = "module1";
        List<String> closerAction = Arrays.asList("close1", "close2");

        pendingTaskType.setId(id);
        pendingTaskType.setPendingTask(pendingTask);
        pendingTaskType.setActor(actor);
        pendingTaskType.setTriggerAction(triggerAction);
        pendingTaskType.setState(state);
        pendingTaskType.setWorkflowModule(workflowModule);
        pendingTaskType.setCloserAction(closerAction);

        assertEquals(id, pendingTaskType.getId());
        assertEquals(pendingTask, pendingTaskType.getPendingTask());
        assertEquals(actor, pendingTaskType.getActor());
        assertEquals(triggerAction, pendingTaskType.getTriggerAction());
        assertEquals(state, pendingTaskType.getState());
        assertEquals(workflowModule, pendingTaskType.getWorkflowModule());
        assertEquals(closerAction, pendingTaskType.getCloserAction());
    }

    @Test
    void testToString() {
        String id = "123";
        String pendingTask = "task1";
        String actor = "actor1";
        List<String> triggerAction = Arrays.asList("action1", "action2");
        String state = "state1";
        String workflowModule = "module1";
        List<String> closerAction = Arrays.asList("close1", "close2");

        PendingTaskType pendingTaskType = PendingTaskType.builder()
                .id(id)
                .pendingTask(pendingTask)
                .actor(actor)
                .triggerAction(triggerAction)
                .state(state)
                .workflowModule(workflowModule)
                .closerAction(closerAction)
                .build();
        String expected = "PendingTaskType(id=123, pendingTask=task1, actor=actor1, isgeneric=null, triggerAction=[action1, action2], state=state1, workflowModule=module1, screenType=null, actionCategory=null, closerAction=[close1, close2], referenceEntityTypeNameMapping=null, stateSla=null, defaultRoles=null)";
        assertEquals(expected, pendingTaskType.toString());
    }

    @Test
    void testEqualsAndHashCode() {
        String id = "123";
        String pendingTask = "task1";
        String actor = "actor1";
        List<String> triggerAction = Arrays.asList("action1", "action2");
        String state = "state1";
        String workflowModule = "module1";
        List<String> closerAction = Arrays.asList("close1", "close2");

        PendingTaskType pendingTaskType1 = PendingTaskType.builder()
                .id(id)
                .pendingTask(pendingTask)
                .actor(actor)
                .triggerAction(triggerAction)
                .state(state)
                .workflowModule(workflowModule)
                .closerAction(closerAction)
                .build();

        PendingTaskType pendingTaskType2 = PendingTaskType.builder()
                .id(id)
                .pendingTask(pendingTask)
                .actor(actor)
                .triggerAction(triggerAction)
                .state(state)
                .workflowModule(workflowModule)
                .closerAction(closerAction)
                .build();

        assertEquals(pendingTaskType1, pendingTaskType2);
        assertEquals(pendingTaskType1.hashCode(), pendingTaskType2.hashCode());

        pendingTaskType2.setCloserAction(null);
        assertNotEquals(pendingTaskType1, pendingTaskType2);
        assertNotEquals(pendingTaskType1.hashCode(), pendingTaskType2.hashCode());
    }
}
