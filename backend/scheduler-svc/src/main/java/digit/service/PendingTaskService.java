package digit.service;

import digit.util.InboxUtil;
import digit.util.PendingTaskUtil;
import digit.web.models.inbox.Inbox;
import digit.web.models.inbox.InboxRequest;
import lombok.extern.slf4j.Slf4j;
import org.egov.tracer.model.CustomException;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;

@Slf4j
@Service
public class PendingTaskService {

    private final InboxUtil inboxUtil;

    private final PendingTaskUtil pendingTaskUtil;

    @Autowired
    public PendingTaskService(InboxUtil inboxUtil, PendingTaskUtil pendingTaskUtil) {
        this.inboxUtil = inboxUtil;
        this.pendingTaskUtil = pendingTaskUtil;
    }

    public void expirePendingTasks() {
        try {
            log.info("Starting Cron Job for expiring pending tasks");
            InboxRequest inboxRequest = inboxUtil.getOpenPendingTasks();
            List<Inbox> inboxList = inboxUtil.getPendingTasksForExpiry(inboxRequest);
            pendingTaskUtil.expirePendingTasks(inboxList);
            log.info("Completed Cron Job For expiring pending tasks");
        } catch (CustomException e) {
            throw e;
        }
        catch (Exception e) {
            log.error("Error occurred while expiring pending tasks: {}", e.getMessage());
        }
    }

}
