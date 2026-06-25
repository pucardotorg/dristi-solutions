package org.pucar.dristi.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ObjectNode;
import lombok.extern.slf4j.Slf4j;
import net.minidev.json.JSONArray;
import org.egov.common.contract.models.RequestInfoWrapper;
import org.egov.common.contract.request.RequestInfo;
import org.egov.common.contract.request.User;
import org.pucar.dristi.config.Configuration;
import org.pucar.dristi.kafka.Producer;
import org.pucar.dristi.util.AdvocateUtil;
import org.pucar.dristi.util.CaseUtil;
import org.pucar.dristi.util.DemandUtil;
import org.pucar.dristi.util.JsonUtil;
import org.pucar.dristi.util.MdmsUtil;
import org.pucar.dristi.util.OrderUtil;
import org.pucar.dristi.util.PendingTaskUtil;
import org.pucar.dristi.web.models.CourtCase;
import org.pucar.dristi.web.models.Demand;
import org.pucar.dristi.web.models.DemandCriteria;
import org.pucar.dristi.web.models.DemandRequest;
import org.pucar.dristi.web.models.DemandResponse;
import org.pucar.dristi.web.models.POAHolder;
import org.pucar.dristi.web.models.Party;
import org.pucar.dristi.web.models.Task;
import org.pucar.dristi.web.models.TaskCriteria;
import org.pucar.dristi.web.models.TaskRequest;
import org.pucar.dristi.web.models.TaskSearchRequest;
import org.pucar.dristi.web.models.WorkflowObject;
import org.pucar.dristi.web.models.order.Order;
import org.pucar.dristi.web.models.order.OrderRequest;
import org.pucar.dristi.web.models.pendingtask.PendingTask;
import org.pucar.dristi.web.models.pendingtask.PendingTaskRequest;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.util.CollectionUtils;

import java.time.ZoneId;
import java.time.ZonedDateTime;
import java.util.ArrayList;
import java.util.Collections;
import java.util.HashMap;
import java.util.HashSet;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;

import static org.pucar.dristi.config.ServiceConstants.*;

@Service
@Slf4j
public class WarrantReissueService {

    private static final long MILLIS_PER_DAY = 24L * 60 * 60 * 1000;
    private static final long IST_OFFSET_MILLIS = (5L * 60 + 30) * 60 * 1000;

    private final TaskService taskService;
    private final Configuration config;
    private final Producer producer;
    private final ObjectMapper objectMapper;
    private final UserService userService;
    private final OrderUtil orderUtil;
    private final PendingTaskUtil pendingTaskUtil;
    private final CaseUtil caseUtil;
    private final AdvocateUtil advocateUtil;
    private final JsonUtil jsonUtil;
    private final DemandUtil demandUtil;
    private final MdmsUtil mdmsUtil;

    @Autowired
    public WarrantReissueService(TaskService taskService, Configuration config, Producer producer,
                                  ObjectMapper objectMapper, UserService userService, OrderUtil orderUtil,
                                  PendingTaskUtil pendingTaskUtil, CaseUtil caseUtil, AdvocateUtil advocateUtil,
                                  JsonUtil jsonUtil, DemandUtil demandUtil, MdmsUtil mdmsUtil) {
        this.taskService = taskService;
        this.config = config;
        this.producer = producer;
        this.objectMapper = objectMapper;
        this.userService = userService;
        this.orderUtil = orderUtil;
        this.pendingTaskUtil = pendingTaskUtil;
        this.caseUtil = caseUtil;
        this.advocateUtil = advocateUtil;
        this.jsonUtil = jsonUtil;
        this.demandUtil = demandUtil;
        this.mdmsUtil = mdmsUtil;
    }

    /**
     * Handles Scenario 1: Hearing Rescheduled - Update warrants in-place.
     */
    public void handleHearingRescheduled(RequestInfo requestInfo, String filingNumber, Long newHearingDate) {
        log.info("Handling hearing reschedule for filingNumber: {}", filingNumber);

        requestInfo = userService.createInternalMicroserviceRequestInfo();

        // 1. Fetch all ACTIVE warrants for this case.
        // Do NOT filter by the hearing's SCHEDULE_OF_HEARING_DATE order id here: warrant tasks
        // are linked to the WARRANT order (or, for reissued clones, the new scheduling order),
        // never to the rescheduled hearing's original scheduling order, so an orderId filter
        // silently excludes every first-generation warrant. Scoping to the right hearing is
        // done by filterToPreviousHearingDate below.
        List<Task> activeWarrants = fetchActiveWarrants(requestInfo, filingNumber, false);
        if (activeWarrants.isEmpty()) {
            log.info("No active warrants for filing: {}", filingNumber);
            return;
        }

        // Only warrants tagged to the previous hearing date are reissued; older warrants are left untouched
        activeWarrants = filterToPreviousHearingDate(activeWarrants, newHearingDate);
        if (activeWarrants.isEmpty()) {
            log.info("No warrants tagged to the previous hearing date for filing: {}", filingNumber);
            return;
        }

        for (Task warrant : activeWarrants) {
            String currentState = warrant.getStatus();
            boolean isIcops = isIcopsDeliveryChannel(warrant);

            // Store previous state and increment revision number
            setAdditionalDetail(warrant, "previousState", currentState);
            incrementRevisionNumber(warrant);
            if (newHearingDate != null) {
                updateHearingDateInTaskDetails(warrant, newHearingDate, false);
            }

            WorkflowObject workflow = new WorkflowObject();
            // A warrant moving back into PENDING_PAYMENT from an already-issued/paid state needs a
            // fresh payment-pending task (and a fresh demand, which summons-svc raises off this same
            // WARRANT_REISSUE -> PENDING_PAYMENT transition). A warrant already in PENDING_PAYMENT
            // keeps the demand and pending task raised at order-publish time, so re-raising them
            // would leave the litigant with a duplicate payable bill.
            boolean reissueNeedsPayment = false;
            if (isIcops && !PENDING_PAYMENT.equalsIgnoreCase(currentState)) {
                // iCoPS channel: WARRANT_REISSUE_ICOPS -> WARRANT_REISSUED
                workflow.setAction(WARRANT_REISSUE_ICOPS);
            } else {
                // Non-iCoPS OR iCoPS still in PENDING_PAYMENT: WARRANT_REISSUE -> PENDING_PAYMENT
                workflow.setAction(WARRANT_REISSUE);
                reissueNeedsPayment = !PENDING_PAYMENT.equalsIgnoreCase(currentState);
            }
            workflow.setDocuments(Collections.singletonList(new org.egov.common.contract.models.Document()));

            warrant.setWorkflow(workflow);
            
            TaskRequest taskRequest = TaskRequest.builder()
                    .requestInfo(requestInfo)
                    .task(warrant)
                    .build();

            try {
                taskService.updateTask(taskRequest);
                log.info("Triggered reissue for warrant: {} with action: {}", warrant.getTaskNumber(), workflow.getAction());
                // The reissued warrant now sits in PENDING_PAYMENT for the rescheduled hearing, so it
                // requires the same "payment pending for warrant" task that order publish raises.
                if (reissueNeedsPayment) {
                    createPaymentPendingTaskForWarrant(requestInfo, warrant);
                }
            } catch (Exception e) {
                log.error("Error updating warrant during reschedule: {}", warrant.getTaskNumber(), e);
            }
        }
    }

    /**
     * Handles Scenario 2: Hearing Completed and New Hearing Scheduled
     * Terminates existing active warrants and creates new warrants.
     */
    public void handleHearingCompletedAndNewHearingScheduled(RequestInfo requestInfo, String filingNumber, Long newHearingDate, String newOrderId) {
        log.info("Handling hearing completed and new hearing scheduled for filingNumber: {}, newOrderId: {}", filingNumber, newOrderId);

        requestInfo = userService.createInternalMicroserviceRequestInfo();

        // Fetch all ACTIVE warrants plus EXPIRED-but-unpaid warrants (excluding bail-driven expiries)
        // so warrants the hearing service expired on completion can still be reissued
        List<Task> activeWarrants = fetchActiveWarrants(requestInfo, filingNumber, true);
        if (activeWarrants.isEmpty()) {
            log.info("No active or recently expired warrants for filing: {}", filingNumber);
            return;
        }

        // A duplicate hearing event (order publish emits a create + a scheduler-svc update for the
        // same hearing) must not reissue the same warrant twice. A warrant terminated on the first
        // event lands in WARRANT_REISSUED_WITH_NEW_WARRANT and so drops out of the active search, but
        // an EXPIRED warrant we recovered stays EXPIRED and keeps matching the previous hearing date,
        // so it would be reissued again. Its clone, however, is active and carries this warrant's id
        // as reissueSourceWarrantId; collect those source ids (from the full set, before scoping to
        // the previous hearing) and skip any warrant that already has a clone.
        Set<String> alreadyReissuedSourceIds = collectReissueSourceIds(activeWarrants);

        // Scope to the single previous cycle by the order that CREATED each warrant, not by hearing
        // date: a calendar-day comparison drops the previous cycle whenever its warrants happen to be
        // tagged to the same IST day as the new hearing (e.g. two hearings scheduled for the same day),
        // and is also sensitive to the IST/UTC-midnight epoch-encoding inconsistency. Order ids are
        // always distinct per cycle. Falls back to date scoping when orderId is unavailable.
        activeWarrants = filterToPreviousCycle(activeWarrants, newOrderId, newHearingDate);
        if (activeWarrants.isEmpty()) {
            log.info("No previous-cycle warrants to reissue for filing: {}", filingNumber);
            return;
        }

        List<String> collectedPartyUniqueIds = new ArrayList<>();

        for (Task warrant : activeWarrants) {
            if (warrant.getId() != null && alreadyReissuedSourceIds.contains(warrant.getId().toString())) {
                log.info("Skipping warrant {} - it already has a reissued clone (duplicate hearing event)", warrant.getTaskNumber());
                continue;
            }
            String currentState = warrant.getStatus();
            boolean isIcops = isIcopsDeliveryChannel(warrant);
            boolean isAlreadyExpired = EXPIRED.equalsIgnoreCase(currentState);

            if (!isAlreadyExpired) {
                // 1. Terminate old warrant
                WorkflowObject terminateWorkflow = new WorkflowObject();
                terminateWorkflow.setAction(REISSUE_WITH_NEW_WARRANT);
                terminateWorkflow.setDocuments(Collections.singletonList(new org.egov.common.contract.models.Document()));
                warrant.setWorkflow(terminateWorkflow);
                setAdditionalDetail(warrant, "previousState", currentState);

                TaskRequest terminateRequest = TaskRequest.builder()
                        .requestInfo(requestInfo)
                        .task(warrant)
                        .build();

                try {
                    taskService.updateTask(terminateRequest);
                    log.info("Terminated old warrant: {}", warrant.getTaskNumber());
                    // The terminated warrant is replaced by a freshly created clone, so the old
                    // warrant's outstanding payment artefacts are now stale. A "payment pending for
                    // warrant" task and a payable demand (bill) are only ever raised while the
                    // warrant sits in PENDING_PAYMENT, so both are cleaned up only for warrants
                    // leaving that state - otherwise the litigant is left with a stale payable bill
                    // on top of the new warrant's fresh demand.
                    if (PENDING_PAYMENT.equalsIgnoreCase(currentState)) {
                        closePaymentPendingTaskForWarrant(requestInfo, warrant);
                        cancelPaymentDemandForWarrant(requestInfo, warrant);
                    }
                } catch (Exception e) {
                    log.error("Error terminating warrant: {}", warrant.getTaskNumber(), e);
                    continue; // Skip creating new warrant if termination failed
                }
            } else {
                log.info("Warrant {} is already EXPIRED, skipping termination.", warrant.getTaskNumber());
            }

            // 2. Create new warrant using createTask
            Task newWarrant = cloneWarrantForReissue(warrant, newHearingDate, newOrderId);
            WorkflowObject createWorkflow = new WorkflowObject();

            boolean shouldSkipPayment =
                    (isIcops && !PENDING_PAYMENT.equalsIgnoreCase(currentState) && !isAlreadyExpired) || isCourtWitness(newWarrant.getTaskDetails());
            
            if (shouldSkipPayment) {
                createWorkflow.setAction(CREATE_WITH_OUT_PAYMENT);
            } else {
                createWorkflow.setAction(CREATE);
            }
            createWorkflow.setDocuments(Collections.singletonList(new org.egov.common.contract.models.Document()));
            newWarrant.setWorkflow(createWorkflow);

            TaskRequest createRequest = TaskRequest.builder()
                    .requestInfo(requestInfo)
                    .task(newWarrant)
                    .build();

            try {
                Task createdWarrant = taskService.createTask(createRequest);
                log.info("Created new warrant for reissue: {}, linked to old warrant: {}", createdWarrant.getTaskNumber(), warrant.getTaskNumber());
                String partyUniqueId = extractPartyUniqueId(createdWarrant);
                if (partyUniqueId != null && !collectedPartyUniqueIds.contains(partyUniqueId)) {
                    collectedPartyUniqueIds.add(partyUniqueId);
                }

                // The reissued warrant only requires a payment-pending task when it lands in
                // PENDING_PAYMENT (action == CREATE). When payment is skipped (CREATE_WITH_OUT_PAYMENT,
                // i.e. an already-issued iCoPS warrant or a court witness) there is nothing to pay for.
                if (!shouldSkipPayment) {
                    createPaymentPendingTaskForWarrant(requestInfo, createdWarrant);
                }
            } catch (Exception e) {
                log.error("Error creating new warrant for reissue", e);
            }
        }

        if (!collectedPartyUniqueIds.isEmpty() && newOrderId != null) {
            updateOrderPartyUniqueIds(requestInfo, newOrderId, collectedPartyUniqueIds);
        }
    }

    public boolean isCourtWitness(Object taskDetails) {
        if (!(taskDetails instanceof JsonNode taskDetailsNode)) {
            return false;
        }

        return COURT_WITNESS.equalsIgnoreCase(
                taskDetailsNode
                        .path("respondentDetails")
                        .path("ownerType")
                        .textValue()
        );
    }

    private Task cloneWarrantForReissue(Task oldWarrant, Long newHearingDate, String newOrderId) {
        Task newWarrant = new Task();
        newWarrant.setTenantId(oldWarrant.getTenantId());
        newWarrant.setFilingNumber(oldWarrant.getFilingNumber());
        newWarrant.setCaseId(oldWarrant.getCaseId());
        newWarrant.setReferenceId(oldWarrant.getReferenceId());
        newWarrant.setTaskType(oldWarrant.getTaskType());
        newWarrant.setTaskDescription(oldWarrant.getTaskDescription());
        newWarrant.setAssignedTo(oldWarrant.getAssignedTo());
        newWarrant.setAmount(oldWarrant.getAmount());
        newWarrant.setCourtId(oldWarrant.getCourtId());
        newWarrant.setCnrNumber(oldWarrant.getCnrNumber());
        newWarrant.setCaseTitle(oldWarrant.getCaseTitle());

        if (newOrderId != null) {
            try {
                newWarrant.setOrderId(UUID.fromString(newOrderId));
            } catch (Exception e) {
                log.warn("Invalid newOrderId format: {}", newOrderId);
            }
        }

        try {
            if (oldWarrant.getTaskDetails() != null) {
                ObjectNode taskDetails = (ObjectNode) objectMapper.readTree(objectMapper.writeValueAsString(oldWarrant.getTaskDetails()));
                newWarrant.setTaskDetails(taskDetails);
            }
        } catch (Exception e) {
            log.error("Error cloning task details", e);
        }

        if (newHearingDate != null) {
            updateHearingDateInTaskDetails(newWarrant, newHearingDate, true);
        }

        ObjectNode additionalDetails = objectMapper.createObjectNode();
        if (oldWarrant.getAdditionalDetails() != null && oldWarrant.getAdditionalDetails() instanceof ObjectNode) {
            ObjectNode oldAdditionalDetails = (ObjectNode) oldWarrant.getAdditionalDetails();
            if (oldAdditionalDetails.has("iCopsProcessNumber")) {
                additionalDetails.set("iCopsProcessNumber", oldAdditionalDetails.get("iCopsProcessNumber"));
            }
        }
        additionalDetails.put("reissueSourceWarrantId", oldWarrant.getId() != null ? oldWarrant.getId().toString() : null);
        
        int currentRevision = 0;
        if (oldWarrant.getAdditionalDetails() != null && oldWarrant.getAdditionalDetails() instanceof ObjectNode) {
             ObjectNode oldAdditionalDetails = (ObjectNode) oldWarrant.getAdditionalDetails();
             if (oldAdditionalDetails.has("reissueRevisionNumber")) {
                 currentRevision = oldAdditionalDetails.get("reissueRevisionNumber").asInt();
             }
        }
        additionalDetails.put("reissueRevisionNumber", currentRevision + 1);

        newWarrant.setAdditionalDetails(additionalDetails);

        return newWarrant;
    }

    public void handleBailAccepted(RequestInfo requestInfo, String filingNumber) {
        log.info("Handling bail accepted for filingNumber: {}", filingNumber);

        requestInfo = userService.createInternalMicroserviceRequestInfo();

        List<Task> activeWarrants = fetchActiveWarrants(requestInfo, filingNumber, false);
        if (activeWarrants.isEmpty()) {
            log.info("No active warrants to expire for filingNumber: {}", filingNumber);
            return;
        }

        for (Task warrant : activeWarrants) {
            WorkflowObject workflow = new WorkflowObject();
            workflow.setAction(EXPIRE);
            warrant.setWorkflow(workflow);
            // Mark this as a bail-driven expiry so the reissue flow never resurrects it: per PRD a
            // warrant expired because bail was granted must stay Expired (closed only by an iCoPS
            // status update, a manual update, or a second bail) and must NOT be auto-reissued when a
            // later hearing is scheduled. (EXPIRE is only valid from PENDING_PAYMENT, so only unpaid
            // warrants are actually expired+tagged here.)
            setAdditionalDetail(warrant, "expiredByBail", true);

            TaskRequest taskRequest = TaskRequest.builder()
                    .requestInfo(requestInfo)
                    .task(warrant)
                    .build();
            try {
                taskService.updateTask(taskRequest);
                log.info("Expired/abandoned warrant: {} with action: {}", warrant.getTaskNumber(), workflow.getAction());
            } catch (Exception e) {
                log.error("Error expiring warrant: {}", warrant.getTaskNumber(), e);
            }
        }
    }

    private List<Task> fetchActiveWarrants(RequestInfo requestInfo, String filingNumber, boolean includeExpiredToday) {
        TaskCriteria criteria = TaskCriteria.builder()
                .filingNumber(filingNumber)
                .taskType(WARRANT)
                .build();

        TaskSearchRequest searchRequest = new TaskSearchRequest();
        searchRequest.setRequestInfo(requestInfo);
        searchRequest.setCriteria(criteria);

        List<Task> tasks = taskService.searchTask(searchRequest);
        List<Task> activeWarrants = new ArrayList<>();
        
        for (Task task : tasks) {
            String status = task.getStatus();
            // Active states based on workflow: PENDING_PAYMENT, ISSUE_WARRANT, WARRANT_SENT, WARRANT_REISSUED
            if (PENDING_PAYMENT.equalsIgnoreCase(status) ||
                ISSUE_WARRANT.equalsIgnoreCase(status) ||
                WARRANT_REISSUED.equalsIgnoreCase(status) ||
                WARRANT_SENT.equalsIgnoreCase(status) ) {
                activeWarrants.add(task);
            } else if (includeExpiredToday && EXPIRED.equalsIgnoreCase(status) && !isExpiredByBail(task)) {
                // Recover EXPIRED-but-unpaid warrants so the reissue can regenerate them. In the
                // warrant workflow the EXPIRE action is only valid from PENDING_PAYMENT, so every
                // EXPIRED warrant was unpaid - exactly the PRD's "payment not completed (or channel
                // not iCoPS) -> regenerate the payment task" case. The hearing service expires these
                // the moment the previous hearing is marked COMPLETED, which may be a different
                // calendar day from the warrant's own scheduled hearing date (e.g. the hearing is
                // completed ahead of its date), so recovery must NOT be gated on the warrant's
                // hearing date - the earlier same-day-as-hearing-date check silently dropped exactly
                // these warrants (the RPAD/unpaid warrant went missing while the issued iCoPS warrant,
                // never in PENDING_PAYMENT and so never expired, survived to be reissued).
                // filterToPreviousHearingDate already scopes the recovered set to the previous
                // hearing, so older expired warrants are not affected. The one expiry we must never
                // resurrect is a bail-driven one (it must stay Expired per PRD), excluded above.
                activeWarrants.add(task);
            }
        }
        return activeWarrants;
    }

    /**
     * Scopes the candidate warrants to the single "previous cycle" that should roll forward to the
     * newly scheduled hearing, keyed by the order that CREATED each warrant (task.orderId) rather
     * than by hearing date. Every warrant carries its creating order's id, and reissued clones are
     * stamped with the scheduling order's id, so each scheduling cycle is a distinct orderId. This
     * is robust to the two failure modes of date-based scoping: the hearing-date epoch-encoding
     * inconsistency (IST- vs UTC-midnight) and two hearings landing on the same calendar day.
     *
     * Rules:
     *  - The new order's own freshly-created warrants (orderId == newOrderId) are never reissued.
     *  - Of the remaining warrants, the previous cycle is the orderId group created most recently
     *    (latest warrant createdTime); only that group is reissued, so older cycles are untouched.
     *  - Warrants with no orderId (older data), or an unknown newOrderId, fall back to date scoping.
     */
    private List<Task> filterToPreviousCycle(List<Task> warrants, String newOrderId, Long newHearingDate) {
        if (newOrderId == null || newOrderId.isEmpty()) {
            return filterToPreviousHearingDate(warrants, newHearingDate);
        }

        Map<String, List<Task>> byOrder = new LinkedHashMap<>();
        boolean anyWithOrderId = false;
        for (Task warrant : warrants) {
            String orderId = warrant.getOrderId() != null ? warrant.getOrderId().toString() : null;
            if (orderId == null) {
                continue;
            }
            anyWithOrderId = true;
            if (orderId.equals(newOrderId)) {
                continue; // never reissue the new order's own warrants
            }
            byOrder.computeIfAbsent(orderId, k -> new ArrayList<>()).add(warrant);
        }

        if (!anyWithOrderId) {
            log.info("No warrant carries an orderId; falling back to hearing-date scoping");
            return filterToPreviousHearingDate(warrants, newHearingDate);
        }

        String previousOrderId = null;
        long previousCycleCreatedTime = Long.MIN_VALUE;
        for (Map.Entry<String, List<Task>> entry : byOrder.entrySet()) {
            long groupCreatedTime = latestCreatedTime(entry.getValue());
            if (groupCreatedTime > previousCycleCreatedTime) {
                previousCycleCreatedTime = groupCreatedTime;
                previousOrderId = entry.getKey();
            }
        }

        if (previousOrderId == null) {
            log.info("Only the new order's own warrants are active; none will be reissued");
            return Collections.emptyList();
        }

        List<Task> filtered = byOrder.get(previousOrderId);
        log.info("Scoped {} warrant(s) down to {} from previous cycle order {}",
                warrants.size(), filtered.size(), previousOrderId);
        return filtered;
    }

    /** Latest createdTime across a group of warrants (Long.MIN_VALUE if none carry audit details). */
    private long latestCreatedTime(List<Task> warrants) {
        long latest = Long.MIN_VALUE;
        for (Task warrant : warrants) {
            if (warrant.getAuditDetails() != null && warrant.getAuditDetails().getCreatedTime() != null) {
                latest = Math.max(latest, warrant.getAuditDetails().getCreatedTime());
            }
        }
        return latest;
    }

    /**
     * Restricts a list of warrants to only those tagged to the "previous hearing date",
     * so that older warrants from earlier hearings are not affected by the reissue flow.
     * The previous hearing date is derived from the warrants themselves
     * (see {@link #resolvePreviousHearingDate(List, Long)}).
     * All comparisons happen at IST-day granularity (see {@link #normalizeToIstDayStart(Long)})
     * because different writers tag the same hearing with different epoch encodings.
     */
    private List<Task> filterToPreviousHearingDate(List<Task> warrants, Long newHearingDate) {
        Long previousHearingDay = resolvePreviousHearingDate(warrants, newHearingDate);
        if (previousHearingDay == null) {
            log.info("Could not resolve a previous hearing date from {} warrant(s); none will be reissued", warrants.size());
            return Collections.emptyList();
        }

        List<Task> filtered = new ArrayList<>();
        for (Task warrant : warrants) {
            if (previousHearingDay.equals(normalizeToIstDayStart(getHearingDateFromTask(warrant)))) {
                filtered.add(warrant);
            }
        }
        log.info("Filtered {} warrant(s) down to {} tagged to previous hearing day (IST day start): {}",
                warrants.size(), filtered.size(), previousHearingDay);
        return filtered;
    }

    /**
     * Determines the previous hearing date from the warrants' own tagged hearing dates
     * (taskDetails.caseDetails.hearingDate), normalized to IST day start. Picks the latest
     * tagged day strictly before the newly scheduled hearing day; warrants already tagged to
     * the new hearing day are never reissued, so a duplicate hearing event (create +
     * scheduler-svc update) is a no-op.
     * Only when newHearingDate is unknown does it fall back to the latest tagged day overall.
     * Returns null when no warrant carries a usable hearing date.
     */
    private Long resolvePreviousHearingDate(List<Task> warrants, Long newHearingDate) {
        Long newHearingDay = normalizeToIstDayStart(newHearingDate);
        Long latestBeforeNew = null;
        Long latestOverall = null;
        for (Task warrant : warrants) {
            Long hearingDay = normalizeToIstDayStart(getHearingDateFromTask(warrant));
            if (hearingDay == null) {
                continue;
            }
            if (latestOverall == null || hearingDay > latestOverall) {
                latestOverall = hearingDay;
            }
            if (newHearingDay == null || hearingDay < newHearingDay) {
                if (latestBeforeNew == null || hearingDay > latestBeforeNew) {
                    latestBeforeNew = hearingDay;
                }
            }
        }
        if (latestBeforeNew != null) {
            return latestBeforeNew;
        }
        // Only fall back to the latest tagged date when the new hearing date is unknown;
        // otherwise warrants already tagged to the new date would be reissued again on the
        // duplicate hearing event emitted during order publish (create + scheduler-svc update).
        return newHearingDay == null ? latestOverall : null;
    }

    /**
     * Buckets an epoch by its IST calendar day. Hearing-date tags for the same hearing are
     * encoded inconsistently by different writers: the backend writes the hearing startTime as
     * IST midnight (e.g. 1781461800000 = 2026-06-15 00:00 IST = 2026-06-14 18:30 UTC), while a
     * warrant created from the order form can carry UTC midnight of the same calendar day
     * (e.g. 1781481600000 = 2026-06-15 00:00 UTC). These two encodings of the SAME hearing differ
     * by the 5h30m IST offset and floor to DIFFERENT UTC days (06-14 vs 06-15) — so flooring to the
     * UTC day split the iCoPS and RPAD warrants of one hearing into different buckets, and only one
     * channel got picked up for reissue. Shifting by the IST offset before flooring maps both
     * encodings to the same IST day (06-15), while hearings on different IST days still bucket
     * apart. The returned value is in IST-shifted epoch space; it is only ever compared against
     * other values produced by this method, so equality and ordering remain correct.
     */
    private Long normalizeToIstDayStart(Long epochMillis) {
        if (epochMillis == null) {
            return null;
        }
        return Math.floorDiv(epochMillis + IST_OFFSET_MILLIS, MILLIS_PER_DAY) * MILLIS_PER_DAY;
    }

    private Long getHearingDateFromTask(Task task) {
        try {
            if (task.getTaskDetails() != null) {
                JsonNode taskDetails = objectMapper.convertValue(task.getTaskDetails(), JsonNode.class);
                if (taskDetails.has("caseDetails") && taskDetails.get("caseDetails").has("hearingDate")) {
                    return taskDetails.get("caseDetails").get("hearingDate").asLong();
                }
            }
        } catch (Exception e) {
            log.warn("Could not extract hearingDate from task: {}", task.getTaskNumber());
        }
        return null;
    }

    private boolean isIcopsDeliveryChannel(Task task) {
        try {
            JsonNode taskDetails = objectMapper.convertValue(task.getTaskDetails(), JsonNode.class);
            if (taskDetails != null && taskDetails.has("deliveryChannels") && !taskDetails.get("deliveryChannels").isNull()) {
                JsonNode deliveryChannels = taskDetails.get("deliveryChannels");
                if (deliveryChannels.has(CHANNEL_CODE) && !deliveryChannels.get(CHANNEL_CODE).isNull()) {
                    String channelCode = deliveryChannels.get(CHANNEL_CODE).textValue();
                    return POLICE.equalsIgnoreCase(channelCode);
                }
            }
        } catch (Exception e) {
            log.error("Error checking iCoPS delivery channel: ", e);
        }
        return false;
    }

    private boolean isExpiredByBail(Task task) {
        try {
            if (task.getAdditionalDetails() != null) {
                JsonNode additionalDetails = objectMapper.convertValue(task.getAdditionalDetails(), JsonNode.class);
                return additionalDetails != null && additionalDetails.path("expiredByBail").asBoolean(false);
            }
        } catch (Exception e) {
            log.warn("Could not read expiredByBail from task: {}", task.getTaskNumber());
        }
        return false;
    }

    private Set<String> collectReissueSourceIds(List<Task> warrants) {
        Set<String> sourceIds = new HashSet<>();
        for (Task warrant : warrants) {
            try {
                if (warrant.getAdditionalDetails() == null) {
                    continue;
                }
                JsonNode additionalDetails = objectMapper.convertValue(warrant.getAdditionalDetails(), JsonNode.class);
                JsonNode sourceId = additionalDetails.path("reissueSourceWarrantId");
                if (!sourceId.isMissingNode() && !sourceId.isNull()) {
                    sourceIds.add(sourceId.asText());
                }
            } catch (Exception e) {
                log.warn("Could not read reissueSourceWarrantId from task: {}", warrant.getTaskNumber());
            }
        }
        return sourceIds;
    }

    private void setAdditionalDetail(Task task, String key, Object value) {
        ObjectNode additionalDetails;
        if (task.getAdditionalDetails() == null || !(task.getAdditionalDetails() instanceof ObjectNode)) {
            additionalDetails = objectMapper.createObjectNode();
        } else {
            additionalDetails = (ObjectNode) task.getAdditionalDetails();
        }

        if (value instanceof String) {
            additionalDetails.put(key, (String) value);
        } else if (value instanceof Long) {
            additionalDetails.put(key, (Long) value);
        } else if (value instanceof Integer) {
            additionalDetails.put(key, (Integer) value);
        } else if (value instanceof Boolean) {
            additionalDetails.put(key, (Boolean) value);
        } else if (value == null) {
            additionalDetails.putNull(key);
        } else {
            // Fallback for other types (Double, nested objects, arrays, etc.)
            log.warn("setAdditionalDetail received unexpected value type {} for key {}; converting via objectMapper",
                    value.getClass().getName(), key);
            additionalDetails.set(key, objectMapper.convertValue(value, JsonNode.class));
        }

        task.setAdditionalDetails(additionalDetails);
    }

    private void incrementRevisionNumber(Task task) {
        ObjectNode additionalDetails;
        if (task.getAdditionalDetails() == null || !(task.getAdditionalDetails() instanceof ObjectNode)) {
            additionalDetails = objectMapper.createObjectNode();
        } else {
            additionalDetails = (ObjectNode) task.getAdditionalDetails();
        }

        int currentRevision = 0;
        if (additionalDetails.has("reissueRevisionNumber")) {
            currentRevision = additionalDetails.get("reissueRevisionNumber").asInt();
        }
        additionalDetails.put("reissueRevisionNumber", currentRevision + 1);
        task.setAdditionalDetails(additionalDetails);
    }

    private void updateHearingDateInTaskDetails(Task task, Long newHearingDate, boolean updateOriginalHearingDate) {
        try {
            ObjectNode taskDetails;
            if (task.getTaskDetails() instanceof ObjectNode) {
                taskDetails = (ObjectNode) task.getTaskDetails();
            } else if (task.getTaskDetails() != null) {
                // taskDetails from search is a LinkedHashMap (row mapper reads it as Object.class);
                // convert it instead of replacing it with an empty node, which would wipe
                // warrantDetails, deliveryChannels, respondentDetails, etc.
                taskDetails = objectMapper.convertValue(task.getTaskDetails(), ObjectNode.class);
            } else {
                taskDetails = objectMapper.createObjectNode();
            }

            ObjectNode caseDetails;
            if (taskDetails.has("caseDetails") && taskDetails.get("caseDetails") instanceof ObjectNode) {
                caseDetails = (ObjectNode) taskDetails.get("caseDetails");
            } else {
                caseDetails = objectMapper.createObjectNode();
                taskDetails.set("caseDetails", caseDetails);
            }

            caseDetails.put("hearingDate", newHearingDate);
            // Only a reissued (cloned) warrant resets originalHearingDate to the new date - a reissue
            // is a fresh process. The in-place reschedule keeps the date the warrant was first issued for.
            if (updateOriginalHearingDate) {
                caseDetails.put("originalHearingDate", newHearingDate);
            }
            task.setTaskDetails(taskDetails);
        } catch (Exception e) {
            log.error("Error updating hearing date in taskDetails: ", e);
        }
    }

    private String extractPartyUniqueId(Task task) {
        try {
            if (task.getTaskDetails() != null) {
                JsonNode taskDetails = objectMapper.convertValue(task.getTaskDetails(), JsonNode.class);
                JsonNode respondentUniqueId = taskDetails.path("respondentDetails").path("uniqueId");
                if (!respondentUniqueId.isMissingNode() && !respondentUniqueId.isNull()) {
                    return respondentUniqueId.asText();
                }
                JsonNode witnessUniqueId = taskDetails.path("witnessDetails").path("uniqueId");
                if (!witnessUniqueId.isMissingNode() && !witnessUniqueId.isNull()) {
                    return witnessUniqueId.asText();
                }
            }
        } catch (Exception e) {
            log.warn("Could not extract partyUniqueId from task: {}", task.getTaskNumber());
        }
        return null;
    }

    private void updateOrderPartyUniqueIds(RequestInfo requestInfo, String orderId, List<String> newPartyUniqueIds) {
        try {
            Order order = orderUtil.getOrderByOrderId(requestInfo, orderId);
            List<String> partyUniqueIds = order.getPartyUniqueIds();
            if (partyUniqueIds == null) {
                partyUniqueIds = new ArrayList<>();
            }
            for (String id : newPartyUniqueIds) {
                if (!partyUniqueIds.contains(id)) {
                    partyUniqueIds.add(id);
                }
            }
            order.setPartyUniqueIds(partyUniqueIds);

            OrderRequest orderRequest = OrderRequest.builder()
                    .requestInfo(requestInfo)
                    .order(order)
                    .build();

            producer.push(config.getOrderUpdatePartyUniqueIdTopic(), orderRequest);
            log.info("Pushed {} partyUniqueIds to order: {} on topic: {}", partyUniqueIds.size(), orderId, config.getOrderUpdateUniqueIdTopic());
        } catch (Exception e) {
            log.error("Error updating partyUniqueIds for order: {}", orderId, e);
        }
    }

    /**
     * Re-creates the "payment pending for warrant" pending task for a freshly reissued warrant,
     * mirroring the pending task originally raised at order publish time
     * (see order-management PublishOrderWarrant). It is only raised for warrants that land in
     * PENDING_PAYMENT; the caller gates on that. The assignees are the complainant (or, for
     * accused/witness warrants, the respondent) litigants together with their advocates and POA
     * holders, resolved from the case. Any failure is logged and swallowed so it never blocks the
     * reissue flow.
     */
    private void createPaymentPendingTaskForWarrant(RequestInfo requestInfo, Task warrant) {
        try {
            TaskRequest taskRequest = TaskRequest.builder()
                    .requestInfo(requestInfo)
                    .task(warrant)
                    .build();

            List<CourtCase> courtCases = caseUtil.getCaseDetails(taskRequest);
            if (CollectionUtils.isEmpty(courtCases)) {
                log.error("Could not create payment pending task for reissued warrant {}: courtCase not found", warrant.getTaskNumber());
                return;
            }
            CourtCase courtCase = courtCases.get(0);

            Map<String, List<String>> advocateMapping = advocateUtil.getLitigantAdvocateMapping(courtCase);
            Map<String, List<POAHolder>> poaMapping = caseUtil.getLitigantPoaMapping(courtCase);

            String type = isWarrantForAccusedWitness(warrant) ? "respondent" : "complainant";
            List<Party> parties = caseUtil.getRespondentOrComplainant(courtCase, type);

            List<String> assigneeUUIDs = new ArrayList<>();
            List<String> litigantIndividualIds = new ArrayList<>();
            for (Party party : parties) {
                String litigantUUID = jsonUtil.getNestedValue(party.getAdditionalDetails(), List.of("uuid"), String.class);
                if (advocateMapping.containsKey(litigantUUID)) {
                    assigneeUUIDs.addAll(advocateMapping.get(litigantUUID));
                }
                assigneeUUIDs.add(litigantUUID);
                litigantIndividualIds.add(party.getIndividualId());

                List<POAHolder> poaHolders = poaMapping.get(party.getIndividualId());
                if (poaHolders != null) {
                    for (POAHolder holder : poaHolders) {
                        String poaUUID = jsonUtil.getNestedValue(holder.getAdditionalDetails(), List.of("uuid"), String.class);
                        if (poaUUID != null) {
                            assigneeUUIDs.add(poaUUID);
                        }
                    }
                }
            }

            List<User> uniqueAssignees = assigneeUUIDs.stream()
                    .distinct()
                    .map(uuid -> User.builder().uuid(uuid).build())
                    .collect(Collectors.toList());

            Map<String, Object> additionalDetails = new HashMap<>();
            additionalDetails.put("litigants", litigantIndividualIds);

            ZoneId zoneId = ZoneId.of(config.getZoneId());
            long currentISTMillis = ZonedDateTime.now(zoneId).toInstant().toEpochMilli();
            long sla = config.getWarrantPaymentSlaValue() + currentISTMillis;

            PendingTask pendingTask = PendingTask.builder()
                    .name(PAYMENT_PENDING_FOR_WARRANT)
                    .referenceId(MANUAL + warrant.getTaskNumber())
                    .entityType(ORDER_DEFAULT_ENTITY_TYPE)
                    .status(PAYMENT_PENDING_POLICE)
                    .assignedTo(uniqueAssignees)
                    .cnrNumber(courtCase.getCnrNumber())
                    .filingNumber(courtCase.getFilingNumber())
                    .caseId(courtCase.getId().toString())
                    .caseTitle(courtCase.getCaseTitle())
                    .isCompleted(false)
                    .stateSla(sla)
                    .additionalDetails(additionalDetails)
                    .screenType("home")
                    .build();

            pendingTaskUtil.createPendingTask(PendingTaskRequest.builder()
                    .requestInfo(requestInfo)
                    .pendingTask(pendingTask)
                    .build());
            log.info("Created payment pending task for reissued warrant: {}", warrant.getTaskNumber());
        } catch (Exception e) {
            log.error("Error creating payment pending task for reissued warrant: {}", warrant.getTaskNumber(), e);
        }
    }

    /**
     * Closes the stale "payment pending for warrant" task left behind when a warrant in
     * PENDING_PAYMENT is terminated for reissue. Mirrors the referenceId used when the task is
     * raised ({@code MANUAL + taskNumber}, see {@link #createPaymentPendingTaskForWarrant}) so the
     * analytics layer matches and marks it COMPLETED. Failures are logged and swallowed so they
     * never block the reissue flow.
     */
    private void closePaymentPendingTaskForWarrant(RequestInfo requestInfo, Task warrant) {
        try {
            pendingTaskUtil.closeManualPendingTask(
                    MANUAL + warrant.getTaskNumber(),
                    requestInfo,
                    warrant.getFilingNumber(),
                    warrant.getCnrNumber(),
                    warrant.getCaseId(),
                    warrant.getCaseTitle(),
                    warrant.getTaskType());
            log.info("Closed payment pending task for terminated warrant: {}", warrant.getTaskNumber());
        } catch (Exception e) {
            log.error("Error closing payment pending task for terminated warrant: {}", warrant.getTaskNumber(), e);
        }
    }

    /**
     * Cancels the outstanding demand(s) raised against a warrant that is being terminated for
     * reissue while still in PENDING_PAYMENT, mirroring the hearing service's
     * {@code cancelRelatedDemands} so the litigant is not left with a stale payable bill alongside
     * the replacement warrant's fresh demand. The warrant demand's consumer code is
     * {@code taskNumber + "_" + suffix}, where the suffix(es) come from the MDMS payment.paymentType
     * master keyed by the warrant's delivery channel (NOT the generic taskDetails.consumerCode).
     * Any failure - including "no demand found" - is logged and swallowed so it never blocks reissue.
     */
    private void cancelPaymentDemandForWarrant(RequestInfo requestInfo, Task warrant) {
        try {
            Set<String> consumerCodes = extractWarrantConsumerCodes(requestInfo, warrant);
            if (consumerCodes.isEmpty()) {
                log.info("No consumer codes resolved for warrant {}; skipping demand cancellation", warrant.getTaskNumber());
                return;
            }

            DemandCriteria demandCriteria = new DemandCriteria();
            demandCriteria.setTenantId(warrant.getTenantId());
            demandCriteria.setConsumerCode(consumerCodes);

            RequestInfoWrapper requestInfoWrapper = new RequestInfoWrapper();
            requestInfoWrapper.setRequestInfo(requestInfo);

            DemandResponse demandResponse = demandUtil.searchDemand(demandCriteria, requestInfoWrapper);
            if (demandResponse == null || CollectionUtils.isEmpty(demandResponse.getDemands())) {
                log.info("No demands found to cancel for warrant {} (consumer codes: {})", warrant.getTaskNumber(), consumerCodes);
                return;
            }

            for (Demand demand : demandResponse.getDemands()) {
                demand.setStatus(Demand.StatusEnum.CANCELLED);
            }

            DemandRequest demandRequest = new DemandRequest();
            demandRequest.setRequestInfo(requestInfo);
            demandRequest.setDemands(demandResponse.getDemands());
            demandUtil.updateDemand(demandRequest);
            log.info("Cancelled {} demand(s) for terminated warrant {} (consumer codes: {})",
                    demandResponse.getDemands().size(), warrant.getTaskNumber(), consumerCodes);
        } catch (Exception e) {
            log.error("Error cancelling demand for terminated warrant: {}", warrant.getTaskNumber(), e);
        }
    }

    /**
     * Resolves the demand consumer codes for a warrant from the MDMS payment.paymentType master.
     * Every payment type whose deliveryChannel matches the warrant's own delivery channel
     * contributes a consumer code of {@code taskNumber + "_" + suffix}. Mirrors the hearing
     * service's OrderUtil.extractConsumerCode so the two services derive identical codes.
     */
    private Set<String> extractWarrantConsumerCodes(RequestInfo requestInfo, Task warrant) {
        Set<String> consumerCodes = new HashSet<>();
        String deliveryChannel = getDeliveryChannelName(warrant);
        if (deliveryChannel == null) {
            log.info("Delivery channel not found for warrant: {}", warrant.getTaskNumber());
            return consumerCodes;
        }

        JSONArray paymentTypes = mdmsUtil.fetchMdmsData(requestInfo, warrant.getTenantId(),
                        PAYMENT_MODULE_NAME, Collections.singletonList(PAYMENT_TYPE_MASTER_NAME))
                .get(PAYMENT_MODULE_NAME).get(PAYMENT_TYPE_MASTER_NAME);

        for (Object obj : paymentTypes) {
            if (obj instanceof Map<?, ?> mapObj) {
                Object channelObj = mapObj.get("deliveryChannel");
                Object suffixObj = mapObj.get("suffix");
                if (channelObj != null && suffixObj != null
                        && channelObj.toString().toUpperCase().contains(deliveryChannel.toUpperCase())) {
                    consumerCodes.add(warrant.getTaskNumber() + "_" + suffixObj);
                }
            }
        }
        return consumerCodes;
    }

    /**
     * Reads the warrant's delivery channel name (taskDetails.deliveryChannels.channelName) used to
     * match MDMS payment types. This is the human channel name (e.g. "Police", "RPAD"), distinct
     * from channelCode (e.g. POLICE) used elsewhere for the iCoPS check.
     */
    private String getDeliveryChannelName(Task warrant) {
        try {
            JsonNode taskDetails = objectMapper.convertValue(warrant.getTaskDetails(), JsonNode.class);
            if (taskDetails != null && taskDetails.has("deliveryChannels") && !taskDetails.get("deliveryChannels").isNull()) {
                JsonNode deliveryChannels = taskDetails.get("deliveryChannels");
                if (deliveryChannels.has("channelName") && !deliveryChannels.get("channelName").isNull()) {
                    return deliveryChannels.get("channelName").textValue();
                }
            }
        } catch (Exception e) {
            log.warn("Could not read delivery channel name from warrant: {}", warrant.getTaskNumber());
        }
        return null;
    }

    /**
     * A warrant is "for an accused/witness" when its respondentDetails.ownerType is ACCUSED, in
     * which case the pending task is assigned to the respondent side rather than the complainant.
     */
    private boolean isWarrantForAccusedWitness(Task warrant) {
        try {
            if (warrant.getTaskDetails() != null) {
                JsonNode taskDetails = objectMapper.convertValue(warrant.getTaskDetails(), JsonNode.class);
                JsonNode ownerType = taskDetails.path("respondentDetails").path("ownerType");
                return !ownerType.isMissingNode() && !ownerType.isNull()
                        && ACCUSED.equalsIgnoreCase(ownerType.textValue());
            }
        } catch (Exception e) {
            log.warn("Could not determine warrantForAccusedWitness from task: {}", warrant.getTaskNumber());
        }
        return false;
    }
}
