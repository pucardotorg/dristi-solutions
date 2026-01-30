const { Pool } = require("pg");
const axios = require("axios");
const winston = require("winston");
const { RequestInfo, HEADERS, filingNumbers } = require("./config");

// ==========================
// CONFIG
// ==========================
const pool = new Pool({
    user: "",
    host: "",
    database: "",
    password: "",
    port: 5432,
});

// const esSearchUrl = "http://localhost:9200/order-notification-view/_search";
// const esUpdateUrl = "http://localhost:9200/order-notification-view/_update_by_query";
// const esUsername = "";
// const esPassword = "";

const caseSearchApi = "http:///case/v1/_search?tenantId=kl";
const taskSearchApi = "http:///task/v1/search?tenantId=kl";
const orderSearchApi = "http:///order/v1/search?tenantId=kl";

const updateTaskApi = "http:///task/v1/task-details?tenantId=kl";
const updateOrderApi = "http:///order/v1/order-details?tenantId=kl";

const BATCH_SIZE = 80;
const INITIAL_OFFSET = 0;

// Winston log with enhanced logging
const log = winston.createLogger({
    level: "info",
    format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.printf(({ level, message, timestamp }) => {
            return `[${timestamp}] ${level.toUpperCase()}: ${message}`;
        })
    ),
    transports: [
        new winston.transports.File({ filename: "sync-error_case.log", level: "error" }),
        new winston.transports.File({ filename: "sync-combined_case.log" }),
        new winston.transports.Console(),
    ],
});

// ==========================
// UTILITY FUNCTIONS
// ==========================
function safeExit(code = 1) {
    log.error("🚨 Script terminated due to critical error");
    pool.end().then(() => process.exit(code));
}

function validateConfig() {
    const required = [
        { name: 'DB_HOST', value: pool.options.host },
        { name: 'DB_DATABASE', value: pool.options.database },
        { name: 'ES_SEARCH_URL', value: esSearchUrl },
        { name: 'ES_USERNAME', value: esUsername }
    ];

    for (const config of required) {
        if (!config.value) {
            log.error(`❌ Missing required config: ${config.name}`);
            safeExit();
        }
    }
    log.info("✅ Configuration validated");
}

async function runQuery(query, params = []) {
    const client = await pool.connect();
    try {
        const result = await client.query(query, params);
        return result.rows;
    } catch (error) {
        log.error(`Database query failed: ${error.message}`);
        throw error;
    } finally {
        client.release();
    }
}

async function validateDBandElasticConnection() {
    // Validate configuration
    validateConfig();

    // Test database connection
    await runQuery("SELECT 1 as test");
    log.info("✅ Database connection verified");

    // Test Elasticsearch connection
    await axios.get("http://localhost:9200/_cluster/health", {
        auth: { username: esUsername, password: esPassword },
        timeout: 10000
    });
    log.info("✅ Elasticsearch connection verified");
}

// ==========================
// MAIN LOGIC FUNCTIONS
// ==========================


// Global cache to avoid overwriting newer updates with old values
const orderUpdateCacheMap = new Map();
// Key: orderId
// Value: { additionalDetails, compositeItems, ... }


async function fetchTasks(criteria) {
    const payload = { criteria, RequestInfo: RequestInfo };

    try {
        const response = await axios.post(taskSearchApi, payload, { HEADERS });
        return (
            response.data ?? []
        );
    } catch (e) {
        log.error(`Error while fetching task for criteria ${JSON.stringify(criteria)}: ${e.message}`);
        return [];
    }
}

async function fetchCases(criteria) {
    const payload = { criteria, RequestInfo: RequestInfo };

    try {
        const response = await axios.post(caseSearchApi, payload, { HEADERS });
        return (
            response.data?.criteria?.[0]?.responseList ?? []
        );
    } catch (e) {
        log.error(`Error while fetching cases for criteria ${JSON.stringify(criteria)}: ${e.message}`);
        return [];
    }
}


async function fetchOrders(criteria) {
    const payload = { criteria, RequestInfo: RequestInfo };

    try {
        const response = await axios.post(orderSearchApi, payload, { HEADERS });
        return (
            response.data.list ?? []
        );
    } catch (e) {
        log.error(`Error while fetching orders for criteria ${JSON.stringify(criteria)}: ${e.message}`);
        return [];
    }
}



async function fetchCaseByFilingNumber(filingNumber) {
    const cases = await fetchCases([{ filingNumber, tenantId: "kl" }]);
    return cases;
}

async function fetchOrdersById(orderId) {
    const orders = await fetchOrders({ id: orderId, tenantId: "kl" });
    return orders;
}


async function fetchOrderWithCache(orderId) {
    // 1. If we already have updated version → return that
    if (orderUpdateCacheMap.has(orderId)) {
        return orderUpdateCacheMap.get(orderId);
    }

    // 2. Else fetch original from DB/API
    const orders = await fetchOrdersById(orderId);
    const order = orders?.[0];

    if (order) {
        orderUpdateCacheMap.set(orderId, order); // store unmodified version
    }

    return order;
}


function getAddressIdFromTaskAddress(address) {
    return [
        address?.locality?.trim()
    ]
        .filter(Boolean)
        .join("|") || null;
}


function getAddressIdsFromCaseAddress(addressDetails) {
    if (!Array.isArray(addressDetails)) return [];

    return addressDetails
        .map(addr => addr?.addressDetails?.locality?.trim())
        .filter(Boolean);
}


function indexCaseByAddress(caseObj) {
    const respondentMap = new Map(); // addressId -> array of respondents
    const witnessMap = new Map();    // addressId -> array of witnesses

    const filingNumber = caseObj?.filingNumber;

    // -------------------- RESPONDENTS --------------------
    const respondents = caseObj?.additionalDetails?.respondentDetails?.formdata ?? [];

    for (const r of respondents) {
        const data = r.data || {};
        const addrIds = getAddressIdsFromCaseAddress(data.addressDetails);
        if (!addrIds.length) continue;

        for (const addrId of addrIds) {

            // DUPLICATE CASE DETECTION
            if (respondentMap.has(addrId)) {
                log.warn(
                    `[CASE ${filingNumber}] ⚠ DUPLICATE RESPONDENT FOUND (multiple case entries share same addressId=${addrId})`
                );
                log.warn(
                    `[CASE ${filingNumber}] → Existing Respondent Entries: ${JSON.stringify(respondentMap.get(addrId))}`
                );
                log.warn(
                    `[CASE ${filingNumber}] → New Respondent Entry: ${JSON.stringify(r)}`
                );
            }

            // STORE respondent
            if (!respondentMap.has(addrId)) {
                respondentMap.set(addrId, []);
            }
            respondentMap.get(addrId).push(r);
        }
    }

    // -------------------- WITNESSES --------------------
    const witnesses = caseObj?.witnessDetails ?? [];

    for (const w of witnesses) {
        const addrIds = getAddressIdsFromCaseAddress(w.addressDetails);
        if (!addrIds.length) continue;

        for (const addrId of addrIds) {

            if (witnessMap.has(addrId)) {
                log.warn(
                    `[CASE ${filingNumber}] ⚠ DUPLICATE WITNESS FOUND (multiple case entries share same addressId=${addrId})`
                );
                log.warn(
                    `[CASE ${filingNumber}] → Existing Witness Entries: ${JSON.stringify(witnessMap.get(addrId))}`
                );
                log.warn(
                    `[CASE ${filingNumber}] → New Witness Entry: ${JSON.stringify(w)}`
                );
            }

            if (!witnessMap.has(addrId)) {
                witnessMap.set(addrId, []);
            }
            witnessMap.get(addrId).push(w);
        }
    }

    return { respondentMap, witnessMap };
}



async function updateTask(id, filingNumber, taskNumber, taskDetails, partyType, caseUniqueId) {
    if (!caseUniqueId) {
        log.error(
            `[CASE ${filingNumber}] ❌ caseUniqueId missing for ${partyType} in task ${taskNumber}`
        );
        return;
    }

    let updatedTaskDetails = structuredClone(taskDetails);

    // ------------------------
    //  Detect existing Unique ID
    // ------------------------
    let existingUniqueId = null;

    if (partyType === "ACCUSED") {
        existingUniqueId = taskDetails?.respondentDetails?.uniqueId || null;
    }
    else if (partyType === "WITNESS") {
        existingUniqueId = taskDetails?.witnessDetails?.uniqueId || null;
    }
    else {
        log.error(
            `[CASE ${filingNumber}] ❌ Unknown partyType ${partyType} in task ${taskNumber}`
        );
        return;
    }

    // ------------------------
    //  Case 1: UniqueId already exists
    // ------------------------
    if (existingUniqueId) {
        if (existingUniqueId === caseUniqueId) {
            log.warn(
                `[CASE ${filingNumber}] ✔ uniqueId already matched (${existingUniqueId}) for ${partyType} in task ${taskNumber} — skipping update`
            );
        } else {
            log.warn(
                `[CASE ${filingNumber}] ⚠ uniqueId mismatch for ${partyType} in task ${taskNumber}.`
            );
            log.warn(
                `[CASE ${filingNumber}] → Existing uniqueId: ${existingUniqueId}, Expected: ${caseUniqueId}`
            );
            log.warn(
                `[CASE ${filingNumber}] → NOT overwriting uniqueId`
            );
        }
        return; // stop here – do NOT update DB
    }

    // ------------------------
    //  Case 2: UniqueId is missing → Perform update
    // ------------------------
    log.info(
        `[CASE ${filingNumber}] ➜ Updating ${partyType} task ${taskNumber} with uniqueId=${caseUniqueId}`
    );

    // Inject based on partyType
    if (partyType === "ACCUSED") {
        updatedTaskDetails = {
            ...taskDetails,
            respondentDetails: {
                ...(taskDetails?.respondentDetails || {}),
                uniqueId: caseUniqueId
            }
        };
    }

    if (partyType === "WITNESS") {
        updatedTaskDetails = {
            ...taskDetails,
            witnessDetails: {
                ...(taskDetails?.witnessDetails || {}),
                uniqueId: caseUniqueId
            }
        };
    }

    const updatePayload = {
        taskDetailsDTO: {
            id,
            tenantId: 'kl',
            filingNumber,
            taskNumber,
            uniqueId: caseUniqueId,
            taskDetails: updatedTaskDetails,
        },
        RequestInfo: RequestInfo
    };

    try {

        log.info(
            `[CASE ${filingNumber}] BEFORE: Task ${taskNumber} uniqueId=${caseUniqueId} for ${partyType}: taskdetails : ${JSON.stringify(taskDetails)}`
        );

        await axios.post(
            updateTaskApi,
            updatePayload,
            { headers: HEADERS }
        );

        log.info(
            `[CASE ${filingNumber}] AFTER: ✔ Task ${taskNumber} updated with uniqueId=${caseUniqueId} for ${partyType}: payload prepared: ${JSON.stringify(updatePayload?.taskDetails)}`
        );

    } catch (e) {
        log.error(
            `[CASE ${filingNumber}] ❌ Failed to update task ${taskNumber} for ${partyType}: ${e.message}`
        );
    }
}


async function updateCompositeOrderItem(order, orderId, itemId, filingNumber, caseUniqueId) {
    if (!caseUniqueId) {
        log.error(`[CASE ${filingNumber}] ❌ caseUniqueId missing for COMPOSITE orderId=${orderId}`);
        return;
    }

    const compositeItems = structuredClone(order?.compositeItems);

    // Find the specific composite item
    const itemIndex = compositeItems.findIndex(ci => ci.id === itemId);

    if (itemIndex === -1) {
        log.error(`[CASE ${filingNumber}] ❌ compositeItem not found for itemId=${itemId} in orderId=${orderId}`);
        return;
    }

    const compositeItem = compositeItems[itemIndex];
    const formdata = compositeItem?.orderSchema?.additionalDetails?.formdata;

    if (!formdata) {
        log.error(`[CASE ${filingNumber}] ❌ No formdata found in compositeItem itemId=${itemId} orderId=${orderId}`);
        return;
    }

    const orderType = formdata?.orderType?.code;
    if (!orderType) {
        log.error(`[CASE ${filingNumber}] ❌ No orderType.code in compositeItem itemId=${itemId} orderId=${orderId}`);
        return;
    }

    // Formdata key map
    const formDataKeyMap = {
        NOTICE: "noticeOrder",
        SUMMONS: "SummonsOrder",
        WARRANT: "warrantFor",
        PROCLAMATION: "proclamationFor",
        ATTACHMENT: "attachmentFor",
    };

    const fdKey = formDataKeyMap[orderType];
    if (!fdKey) {
        log.error(`[CASE ${filingNumber}] ❌ Unsupported orderType=${orderType} in compositeItem ${itemId}: orderId=${orderId}`);
        return;
    }

    const fdBlock = formdata[fdKey];
    if (!fdBlock) {
        log.error(`[CASE ${filingNumber}] ❌ Missing ${fdKey} block in compositeItem ${itemId}: orderId=${orderId}`);
        return;
    }

    const party = fdBlock.party;
    if (!party) {
        log.error(`[CASE ${filingNumber}] ❌ Missing party block inside ${fdKey} in compositeItem ${itemId}: orderId=${orderId}: fdBlock=${JSON.stringify(fdBlock)}`);
        return;
    }



    // Case 1: ARRAY → skip
    if (Array.isArray(party)) {
        log.warn(`[CASE ${filingNumber}] ⚠ ${fdKey}.party is ARRAY → skipping compositeItem ${itemId} orderId: ${orderId}: party=${JSON.stringify(party)}`);
        return;
    }

    const partyData = party?.data;
    // Case 2: OBJECT → can enrich
    if (typeof partyData === "object" && partyData !== null) {
        const existingUid = partyData.uniqueId;

        if (existingUid) {
            if (existingUid === caseUniqueId) {
                log.warn(
                    `[CASE ${filingNumber}] ✔ uniqueId already matched in compositeItem ${itemId} → skipping: orderId=${orderId}`
                );
            } else {
                log.warn(
                    `[CASE ${filingNumber}] ⚠ uniqueId mismatch in compositeItem ${itemId} orderId=${orderId} (existing=${existingUid}, expected=${caseUniqueId}) → NOT overwriting`
                );
            }
            return;
        }

        // Inject uniqueId
        partyData.uniqueId = caseUniqueId;

        // Build updated compositeItem
        const updatedCompositeItem = {
            ...compositeItem,
            orderSchema: {
                ...compositeItem.orderSchema,
                additionalDetails: {
                    ...compositeItem.orderSchema.additionalDetails,
                    formdata: {
                        ...formdata,
                        [fdKey]: {
                            ...fdBlock,
                            party: {
                                ...party,
                                data: {
                                    ...partyData
                                }
                            }
                        }
                    }
                }
            }
        };

        // Replace in array
        compositeItems[itemIndex] = updatedCompositeItem;

        // Update cache with latest merged structure
        orderUpdateCacheMap.set(orderId, {
            ...order,
            compositeItems: compositeItems
        });

        // Prepare final update payload
        const updatePayload = {
            RequestInfo,
            orderDetailsDTO : {
                id: orderId,
                tenantId: "kl",
                filingNumber,
                orderNumber: order?.orderNumber,
                uniqueId: caseUniqueId,
                additionalDetails: order?.additionalDetails,
                compositeItems // updated composite items list
            }
        };

        try {

            log.info(
                `[CASE ${filingNumber}] ✔ BEFORE UPDATING COMPOSITE order for itemId=${itemId} updateOrderId: ${orderId} with uniqueId=${caseUniqueId}: additionalDetails ${JSON.stringify(order?.additionalDetails)} compositeItems ${JSON.stringify(order?.compositeItems)}`
            );

            await axios.post(
                updateOrderApi,
                updatePayload,
                { headers: HEADERS }
            );

            log.info(
                `[CASE ${filingNumber}] ✔ AFTER UPDATING COMPOSITE order for itemId=${itemId} updateOrderId: ${orderId} with uniqueId=${caseUniqueId}: additionalDetails ${JSON.stringify(updatePayload?.additionalDetails)} compositeItems ${JSON.stringify(updatePayload?.compositeItems)}`
            );

        } catch (err) {
            log.error(
                `[CASE ${filingNumber}] ❌ FAILED UPDATING COMPOSITE order ${orderId} itemId=${itemId}: ${err.message}`
            );
        }

        return;
    }

    // Unexpected type
    log.error(
        `[CASE ${filingNumber}] ❌ Unexpected data structure in ${fdKey}.party.data (itemId=${itemId}): orderId=${orderId} → skipping: partyData=${JSON.stringify(party)}`
    );
}


async function updateIntermediateOrder(order, orderId, itemId, filingNumber, caseUniqueId) {
    if (!caseUniqueId) {
        log.error(`[CASE ${filingNumber}] ❌ caseUniqueId missing for orderId=${orderId}`);
        return;
    }

    const orderCopy = structuredClone(order);

    const formdata = orderCopy?.additionalDetails?.formdata;
    if (!formdata) {
        log.error(`[CASE ${filingNumber}] ❌ No formdata found in order ${orderId}`);
        return;
    }

    // Order Type
    const orderType = formdata?.orderType?.code;
    if (!orderType) {
        log.error(`[CASE ${filingNumber}] ❌ No orderType.code found in order ${orderId}`);
        return;
    }

    // Map code → formdata key
    const formDataKeyMap = {
        NOTICE: "noticeOrder",
        SUMMONS: "SummonsOrder",
        WARRANT: "warrantFor",
        PROCLAMATION: "proclamationFor",
        ATTACHMENT: "attachmentFor",
    };

    const fdKey = formDataKeyMap[orderType];
    if (!fdKey) {
        log.error(`[CASE ${filingNumber}] ❌ Unsupported orderType=${orderType} for order ${orderId}`);
        return;
    }

    const targetBlock = formdata[fdKey];
    if (!targetBlock) {
        log.error(`[CASE ${filingNumber}] ❌ ${fdKey} block missing in order ${orderId}`);
        return;
    }

    const party = targetBlock?.party;
    if (!party) {
        log.error(`[CASE ${filingNumber}] ❌ No party block found inside ${fdKey} for order ${orderId}: targetBlock=${JSON.stringify(targetBlock)}`);
        return;
    }



    // ----------------------------
    // Case 1: data is an ARRAY → skip
    // ----------------------------
    if (Array.isArray(party)) {
        log.warn(
            `[CASE ${filingNumber}] ⚠ ${fdKey}.party is an ARRAY → skipping uniqueId enrichment: orderId=${orderId}: party=${JSON.stringify(party)}`
        );
        return;
    }

    const partyData = party?.data;

    // ----------------------------
    // Case 2: data is an OBJECT → enrich safely
    // ----------------------------
    if (typeof partyData === "object" && partyData !== null) {
        const existing = partyData.uniqueId;

        if (existing) {
            if (existing === caseUniqueId) {
                log.warn(
                    `[CASE ${filingNumber}] ✔ uniqueId already matched in ${fdKey}.party.data → skipping update: orderId=${orderId}`
                );
            } else {
                log.warn(
                    `[CASE ${filingNumber}] ⚠ uniqueId mismatch in ${fdKey}.party.data (existing=${existing}, expected=${caseUniqueId}) → NOT overwriting: orderId=${orderId}`
                );
            }
            return;
        }

        // ----------------------------
        // Inject uniqueId
        // ----------------------------
        partyData.uniqueId = caseUniqueId;



        // Prepare update request
        const payloadData = {
            compositeItems: order?.compositeItems,
            additionalDetails: {
                ...order.additionalDetails,
                formdata: {
                    ...formdata,
                    [fdKey]: {
                        ...targetBlock,
                        party: {
                            ...party,
                            data: partyData
                        }
                    }
                }
            }
        };

        const updatePayload = {
            RequestInfo,
            orderDetailsDTO : {
                id: orderId,
                tenantId: "kl",
                filingNumber,
                orderNumber: order?.orderNumber,
                uniqueId: caseUniqueId,
                additionalDetails: payloadData.additionalDetails,
                compositeItems: payloadData.compositeItems
            }
        };



        // Update cache with latest merged structure
        orderUpdateCacheMap.set(orderId, {
            ...order,
            additionalDetails: updatePayload?.orderDetailsDTO?.additionalDetails
        });

        try {

            log.info(
                `[CASE ${filingNumber}] BEFORE UPDATING INTERMEDIATE Order Type ${orderType} with uniqueId=${caseUniqueId}: updateOrderId: ${orderId} additionalDetails ${JSON.stringify(order?.additionalDetails)} compositeItems ${JSON.stringify(order?.compositeItems)}`
            );

            await axios.post(
                updateOrderApi,
                updatePayload,
                { headers: HEADERS }
            );

            log.info(
                `[CASE ${filingNumber}] AFTER UPDATING INTERMEDIATE Order for ${orderType} with uniqueId=${caseUniqueId}: updateOrderId: ${orderId} additionalDetails ${JSON.stringify(updatePayload?.additionalDetails)} compositeItems ${JSON.stringify(updatePayload?.compositeItems)}`
            );

        } catch (err) {
            log.error(
                `[CASE ${filingNumber}] ❌ FAILED UPDATING order ${orderId}: ${err.message}`
            );
        }

        return;
    }

    // Unexpected structure
    log.error(
        `[CASE ${filingNumber}] ❌ Unexpected data structure for ${fdKey}.party.data → skipping: orderId=${orderId} partyData=${JSON.stringify(party)}`
    );
}


async function updateOrder(orderId, itemId, filingNumber, caseUniqueId) {
    if (!caseUniqueId) {
        log.error(`[CASE ${filingNumber}] ❌ caseUniqueId missing for orderId=${orderId}`);
        return;
    }

    // USE CACHE HERE
    let order = await fetchOrderWithCache(orderId);
    if (!order) {
        log.error(`[CASE ${filingNumber}] ❌ Order not found orderId=${orderId}`);
        return;
    }

    const category = order.orderCategory;

    if (category === "INTERMEDIATE") {
        const updatedOrder = await updateIntermediateOrder(order, orderId, itemId, filingNumber, caseUniqueId);

        if (updatedOrder) {
            orderUpdateCacheMap.set(orderId, updatedOrder);
        }

        return updatedOrder;
    }

    if (category === "COMPOSITE") {
        const updatedOrder = await updateCompositeOrderItem(order, orderId, itemId, filingNumber, caseUniqueId);

        if (updatedOrder) {
            orderUpdateCacheMap.set(orderId, updatedOrder);
        }

        return updatedOrder;
    }

    log.warn(`[CASE ${filingNumber}] ⚠ Unknown category "${category}" → skipping`);
}



async function processCaseAndTasks(caseObj, tasks) {
    const filingNumber = caseObj?.filingNumber;

    const { respondentMap, witnessMap } = indexCaseByAddress(caseObj);
    const taskList = tasks?.list || [];

    for (const task of taskList) {

        const td = task.taskDetails;
        if (!td) continue;
        if (!["WARRANT", "PROCLAMATION", "ATTACHMENT", "NOTICE", "SUMMONS"]
            .includes(task.taskType)) continue;


        if (["NOTICE", "SUMMONS"].includes(task.taskType)) {
            if (td?.noticeDetails?.docSubType === "ACCUSED" || td?.summonDetails?.docSubType === "ACCUSED") {
                if (td.respondentDetails) {
                    const addrId = getAddressIdFromTaskAddress(td.respondentDetails.address);

                    if (addrId && respondentMap.has(addrId)) {
                        const caseRespondents = respondentMap.get(addrId);

                        if (caseRespondents.length > 1) {
                            log.warn(
                                `[CASE ${task.taskNumber}] ⚠ Task Respondent maps to MULTIPLE case respondents (duplicate case entries).| NOTICE-SUMMONS addressId=${addrId}`
                            );
                            //101
                        } else {
                            log.info(
                                `[CASE ${task.taskNumber}] ✔ Task Respondent mapped to case respondent.| NOTICE-SUMMONS addressId=${addrId}`
                            );
                            await updateTask(task?.id, task?.filingNumber, task?.taskNumber, td, "ACCUSED", caseRespondents?.[0]?.uniqueId);
                            await updateOrder(task?.orderId, task?.additionalDetails?.itemId, task?.filingNumber, caseRespondents?.[0]?.uniqueId)
                        }
                    } else {
                        log.warn(
                            `[CASE ${task.taskNumber}] ❌ Task Respondent NOT mapped. addressId=${addrId} not found in case respondents`
                        );
                        //4
                    }
                }
            } else {
                if (td.witnessDetails) {
                    const addrId = getAddressIdFromTaskAddress(td.witnessDetails.address);

                    if (addrId && witnessMap.has(addrId)) {
                        const caseWitnesses = witnessMap.get(addrId);

                        if (caseWitnesses.length > 1) {
                            log.warn(
                                `[CASE ${task.taskNumber}] ⚠ Task Witness maps to MULTIPLE case witnesses (duplicate case entries). addressId=${addrId}`
                            );
                        } else {
                            log.info(
                                `[CASE ${task.taskNumber}] ✔ Task Witness mapped to case witness. addressId=${addrId}`
                            );
                            await updateTask(task?.id, task?.filingNumber, task?.taskNumber, td, "WITNESS", caseWitnesses?.[0]?.uniqueId);
                            await updateOrder(task?.orderId, task?.additionalDetails?.itemId, task?.filingNumber, caseWitnesses?.[0]?.uniqueId)
                        }
                    } else {
                        log.warn(
                            `[CASE ${task.taskNumber}] ❌ Task Witness NOT mapped. addressId=${addrId} not found in case witnesses`
                        );
                    }
                }
            }
        } else {
            // For other task types, check respondent to (case respondent) AND (case witness)
            let caseRespondentsduplicate = false;
            let caseWitnessesduplicate = false;
            let respondentMapped = false;
            let witnessMapped = false;

            if (td.respondentDetails) {
                const addrId = getAddressIdFromTaskAddress(td.respondentDetails.address);

                if (addrId && respondentMap.has(addrId)) {
                    const caseRespondents = respondentMap.get(addrId);
                    if (caseRespondents.length > 1) {
                        caseRespondentsduplicate = true;
                    } else {
                        respondentMapped = true;
                    }
                }
                if (addrId && witnessMap.has(addrId)) {
                    const caseWitnesses = witnessMap.get(addrId);
                    if (caseWitnesses.length > 1) {
                        caseWitnessesduplicate = true;
                    } else {
                        witnessMapped = true;
                    }
                }
            }

            if (respondentMapped && witnessMapped) {
                log.info(`[CASE ${task.taskNumber}] ⚠ Both case Respondent and Witness mapped Uniquely.`);
            } else {
                if (td.respondentDetails) {
                    const addrId = getAddressIdFromTaskAddress(td.respondentDetails.address);

                    if (addrId && respondentMap.has(addrId)) {
                        const caseRespondents = respondentMap.get(addrId);
                        if (caseRespondents.length > 1) {
                            caseRespondentsduplicate = true;
                            log.warn(
                                `[CASE ${task.taskNumber}] ⚠ Task Respondent maps to MULTIPLE case respondents (duplicate case entries).| WARRANT addressId=${addrId}: caseRespondents=${JSON.stringify(caseRespondents)}`
                            );
                            //101 as above
                        } else {
                            respondentMapped = true;
                            log.info(
                                `[CASE ${task.taskNumber}] ✔ Task Respondent mapped to case respondent.| WARRANT addressId=${addrId}`
                            );
                            await updateTask(task?.id, task?.filingNumber, task?.taskNumber, td, "ACCUSED", caseRespondents?.[0]?.uniqueId);
                            await updateOrder(task?.orderId, task?.additionalDetails?.itemId, task?.filingNumber, caseRespondents?.[0]?.uniqueId)
                        }
                    } else if (addrId && witnessMap.has(addrId)) {
                        const caseWitnesses = witnessMap.get(addrId);
                        if (caseWitnesses.length > 1) {
                            caseWitnessesduplicate = true;
                            log.warn(
                                `[CASE ${task.taskNumber}] ⚠ Task Respondent maps to MULTIPLE case witnesses (duplicate case entries).| WARRANT addressId=${addrId}: caseWitnesses=${JSON.stringify(caseWitnesses)}`
                            );
                        } else {
                            witnessMapped = true;
                            log.info(
                                `[CASE ${task.taskNumber}] ✔ Task Respondent mapped to case witnessess. addressId=${addrId}`
                            );
                            await updateTask(task?.id, task?.filingNumber, task?.taskNumber, td, "WITNESS", caseWitnesses?.[0]?.uniqueId);
                            await updateOrder(task?.orderId, task?.additionalDetails?.itemId, task?.filingNumber, caseWitnesses?.[0]?.uniqueId)
                        }
                    } else {
                        log.warn(
                            `[CASE ${task.taskNumber}] ❌ Task Respondent NOT mapped to any Witness or Respondant. addressId=${addrId} not found in case respondents`
                        );
                    }
                }
            }
        }
    }
}



async function processAllCases() {
    try {
        for (const filingNumber of filingNumbers) {
            log.info(`Processing case: ${filingNumber}`);
            try {
                const cases = await fetchCaseByFilingNumber(filingNumber);

                if (cases.length === 0) {
                    log.error(`No case found for filing number: ${filingNumber}`);
                } else {
                    const tasks = await fetchTasks({ filingNumber, tenantId: "kl"});
                    log.info(`Fetched ${tasks?.list?.length || 0} tasks for filing number: ${filingNumber}`);
                    processCaseAndTasks(cases[0], tasks);
                    orderUpdateCacheMap.clear(); // Clear cache after each case
                }
            } catch (e) {
                log.error(`Error processing case ${filingNumber}: ${e.message}`);
            }
        }
    } catch (e) {
        log.error(`Error occurred: ${e.message}`);
    }
}


// ==========================
// MAIN EXECUTION
// ==========================
async function main() {
    let stats = {
        total: 0,
        success: 0,
        failed: 0,
        skipped: 0,
        alreadyExists: 0
    };

    try {
        log.info("🚀 Starting script...");

        // await validateDBandElasticConnection();
        // log.info("✅ All connections validated successfully");

        await processAllCases();

    } catch (error) {
        log.error(`💥 Critical error in main execution: ${error.message}`);
        safeExit();
    } finally {
        await pool.end();

        // // Final summary
        // log.info("📊 =================== FINAL SUMMARY ===================");
        // log.info(`📋 Total items processed: ${stats.total}`);
        // log.info(`✅ Successfully updated: ${stats.success}`);
        // log.info(`ℹ️ Already Existed: ${stats.alreadyExists}`);
        // log.info(`⏭️ Skipped: ${stats.skipped}`);
        // log.info(`❌ Failed: ${stats.failed}`);
        // log.info("🏁 Script completed successfully");

        if (stats.failed > 0) {
            log.error(`⚠️ ${stats.failed} orders failed to process. Check error logs for details.`);
            process.exit(1);
        }
    }
}

// ==========================
// ERROR HANDLING & STARTUP
// ==========================
process.on('uncaughtException', (error) => {
    log.error('💥 Uncaught Exception:', error);
    safeExit();
});

process.on('unhandledRejection', (reason, promise) => {
    log.error('💥 Unhandled Rejection at:', promise, 'reason:', reason);
    safeExit();
});

// Graceful shutdown
process.on('SIGINT', () => {
    log.info('👋 Received SIGINT, shutting down gracefully...');
    safeExit(0);
});

process.on('SIGTERM', () => {
    log.info('👋 Received SIGTERM, shutting down gracefully...');
    safeExit(0);
});

// Start the script
if (require.main === module) {
    main().catch((error) => {
        log.error('💥 Script failed:', error);
        safeExit();
    });
}


