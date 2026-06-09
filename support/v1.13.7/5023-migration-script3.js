const { Pool } = require("pg");
const axios = require("axios");
const winston = require("winston");
const { diffString } = require('json-diff');
const { diff } = require('json-diff-ts');
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
const caseSearchApi = "http://localhost:8080/case/v1/_search?tenantId=kl";
const taskSearchApi = "http://localhost:8081/task/v1/search?tenantId=kl";
const orderSearchApi = "http://1localhost:8082/order/v1/search?tenantId=kl";


// const updateTaskApi = "http:///task/v1/task-details?tenantId=kl";
// const updateOrderApi = "http:///order/v1/order-details?tenantId=kl";

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


function normalizeKey(key) {
    return /^\d+$/.test(key) ? `[${key}]` : `.${key}`;
}

// Build a readable path like a.b[0].c.d
function buildPath(pathArray) {
    return pathArray
        .map((p, i) => (i === 0 ? p : normalizeKey(p)))
        .join("")
        .replace(".[", "["); // fix for starting array
}

// Flatten json-diff-ts diff output
function flattenJsonDiff(diffs, basePath = [], output = []) {
    for (const diff of diffs) {
        const { type, key, value, oldValue, changes, embeddedKey } = diff;

        // merge embedded index if present
        const nextKey = embeddedKey === "$index" ? `[${key}]` : key;
        const fullPath = [...basePath, nextKey];

        if (changes && Array.isArray(changes)) {
            // recurse deeper
            flattenJsonDiff(changes, fullPath, output);
        } else {
            // leaf update → output final readable format
            const pathString = buildPath(fullPath);

            if (type === "UPDATE") {
                output.push(`${pathString}: ${JSON.stringify(oldValue)} → ${JSON.stringify(value)}`);
            }

            if (type === "ADD") {
                output.push(`${pathString}: added ${JSON.stringify(value)}`);
            }

            if (type === "REMOVE") {
                output.push(`${pathString}: removed ${JSON.stringify(value)}`);
            }
        }
    }
    return output;
}


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


// function delay(ms) {
//   return new Promise((resolve) => setTimeout(resolve, ms));
// }

function randomDelay(min = 400, max = 600) {
    return new Promise(resolve =>
        setTimeout(resolve, Math.floor(Math.random() * (max - min + 1)) + min)
    );
}



async function fetchTasks(criteria) {
    await randomDelay(400, 600); // random 400–600 ms
    const payload = { criteria, RequestInfo };

    try {
        const response = await axios.post(taskSearchApi, payload, { headers: HEADERS });
        return response.data ?? [];
    } catch (e) {
        log.error(`Error while fetching task for criteria ${JSON.stringify(criteria)}: ${e.message}`);
        return [];
    }
}

async function fetchCases(criteria) {
    await randomDelay(400, 600); // random 400–600 ms
    const payload = { criteria, RequestInfo };

    try {
        const response = await axios.post(caseSearchApi, payload, { headers: HEADERS });
        return response.data?.criteria?.[0]?.responseList ?? [];
    } catch (e) {
        log.error(`Error while fetching cases for criteria ${JSON.stringify(criteria)}: ${e.message}`);
        return [];
    }
}

async function fetchOrders(criteria) {
    await randomDelay(400, 600); // random 400–600 ms
    const payload = { criteria, RequestInfo };

    try {
        const response = await axios.post(orderSearchApi, payload, { headers: HEADERS });
        return response.data.list ?? [];
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


function getAddressIdFromTaskAddress(data = {}) {
    try {
        let nameValue = data?.name;

        // If name is an object with a "name" field
        if (nameValue && typeof nameValue === "object" && "name" in nameValue) {
            nameValue = nameValue.name;
        }

        // Now ensure it's a string
        if (typeof nameValue !== "string") return null;

        const raw = nameValue.trim();
        if (!raw) return null;

        // Take only the first word
        const firstName = raw.split(/\s+/)[0];

        return firstName.toLowerCase();
    } catch {
        return null;
    }
}





function getAddressIdsFromCaseAddress(data = {}) {
    const clean = (str) =>
        str?.trim().split(/\s+/)[0].toLowerCase() || null;

    // Extract first tokens
    const company = clean(data.respondentCompanyName);
    const first = clean(data.respondentFirstName);
    const middle = clean(data.respondentMiddleName);
    const last = clean(data.respondentLastName);

    // Priority: company → first → middle → last
    return company || first || middle || last || null;
}




function indexCaseByAddress(caseObj) {
    const respondentMap = new Map(); // addressId -> array of respondents
    const witnessMap = new Map();    // addressId -> array of witnesses

    const filingNumber = caseObj?.filingNumber;

    // -------------------- RESPONDENTS --------------------
    const respondents = caseObj?.additionalDetails?.respondentDetails?.formdata ?? [];

    for (const r of respondents) {
        const data = r.data || {};
        const nameId = getAddressIdsFromCaseAddress(data);
        if (!nameId) continue;



        // DUPLICATE CASE DETECTION
        if (respondentMap.has(nameId)) {
            log.warn(
                `[CASE ${filingNumber}] ⚠ DUPLICATE RESPONDENT FOUND (multiple case entries share same nameId=${nameId})`
            );
        }

        // STORE respondent
        if (!respondentMap.has(nameId)) {
            respondentMap.set(nameId, []);
        }
        respondentMap.get(nameId).push(r);
    }


    // -------------------- WITNESSES --------------------
    const witnesses = caseObj?.witnessDetails ?? [];

    for (const w of witnesses) {
        const nameId = getAddressIdsFromCaseAddress(w?.data);
        if (!nameId) continue;



        if (witnessMap.has(nameId)) {
            log.warn(
                `[CASE ${filingNumber}] ⚠ DUPLICATE WITNESS FOUND (multiple case entries share same nameId=${nameId})`
            );
        }

        if (!witnessMap.has(nameId)) {
            witnessMap.set(nameId, []);
        }
        witnessMap.get(nameId).push(w);

    }

    // log respondantMap and witnessMap json
    log.info(`[CASE ${filingNumber}] Respondent Map: ${JSON.stringify([...respondentMap])}`);
    log.info(`[CASE ${filingNumber}] Witness Map: ${JSON.stringify([...witnessMap])}`);

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
            `[CASE ${filingNumber}] AFTER: ✔ Task ${taskNumber} updated with uniqueId=${caseUniqueId} for ${partyType}: payload prepared: ${JSON.stringify(updatePayload?.taskDetailsDTO?.taskDetails)}`
        );

        const flattenedDiffs = flattenJsonDiff(diff(taskDetails, updatePayload?.taskDetailsDTO?.taskDetails));
        log.info(`flattenedDiffs length ${taskNumber}: ${flattenedDiffs.length}`);
        flattenedDiffs.forEach((line) => log.info(`flattenedDiffs ${taskNumber}: ${JSON.stringify(line)}`));

    } catch (e) {
        log.error(
            `[CASE ${filingNumber}] ❌ Failed to update task ${taskNumber} for ${partyType}: ${e.message}`
        );
    }
}


async function updateCompositeOrderItem(order, orderId, itemId, filingNumber, caseUniqueId, casePartyData) {
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

    let party = fdBlock.party;
    let fallbackUsed = false;
    if (!party) {
        log.warn(`[CASE ${filingNumber}] ❌ Missing party block inside ${fdKey} in compositeItem ${itemId}: orderId=${orderId}: fdBlock=${JSON.stringify(fdBlock)}`);
        if(!casePartyData){
            log.error(`[CASE ${filingNumber}] ❌ No casePartyData provided as fallback for ${fdKey}.party in compositeItem ${itemId}: orderId=${orderId} → skipping`);
            return;
        }
        party = {data: casePartyData}; // Fallback to casePartyData if provided
        fallbackUsed = true;
        log.warn(
            `[CASE ${filingNumber}] ⚠ Using casePartyData as fallback for ${fdKey}.party in compositeItem ${itemId}: orderId=${orderId}: party=${JSON.stringify(party)}`
        );
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
                            ...( !fallbackUsed ? fdBlock : {} ),
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
                `[CASE ${filingNumber}] ✔ AFTER UPDATING COMPOSITE order for itemId=${itemId} updateOrderId: ${orderId} with uniqueId=${caseUniqueId}: additionalDetails ${JSON.stringify(updatePayload?.orderDetailsDTO?.additionalDetails)} compositeItems ${JSON.stringify(updatePayload?.orderDetailsDTO?.compositeItems)}`
            );

            const flattenedDiffs = flattenJsonDiff(diff(order?.additionalDetails, updatePayload?.orderDetailsDTO?.additionalDetails));
            log.info(`flattenedDiffs length ${orderId}: ${flattenedDiffs.length}`);
            flattenedDiffs.forEach((line) => log.info(`flattenedDiffs ${orderId}: ${JSON.stringify(line)}`));

            const flattenedDiffs1 = flattenJsonDiff(diff(order?.compositeItems, updatePayload?.orderDetailsDTO?.compositeItems));
            log.info(`flattenedDiffs1 length ${orderId}: ${flattenedDiffs1.length}`);
            flattenedDiffs1.forEach((line) => log.info(`flattenedDiffs1 ${orderId}: ${JSON.stringify(line)}`));

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


async function updateIntermediateOrder(order, orderId, itemId, filingNumber, caseUniqueId, casePartyData) {
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

    let party = targetBlock?.party;
    let fallbackUsed = false;
    if (!party) {
        log.warn(`[CASE ${filingNumber}] ❌ No party block found inside ${fdKey} for order ${orderId}: targetBlock=${JSON.stringify(targetBlock)}`);
        if(!casePartyData){
            log.error(`[CASE ${filingNumber}] ❌ No casePartyData provided as fallback for ${fdKey}.party in order ${orderId} → skipping`);
            return;
        }
        party = {data: casePartyData}; // Fallback to casePartyData if provided
        fallbackUsed = true;
        log.warn(
            `[CASE ${filingNumber}] ⚠ Using casePartyData as fallback for ${fdKey}.party in order ${orderId}: party=${JSON.stringify(party)}`
        );
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
                        ...( !fallbackUsed ? targetBlock : {} ),
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
                `[CASE ${filingNumber}] AFTER UPDATING INTERMEDIATE Order for ${orderType} with uniqueId=${caseUniqueId}: updateOrderId: ${orderId} additionalDetails ${JSON.stringify(updatePayload?.orderDetailsDTO?.additionalDetails)} compositeItems ${JSON.stringify(updatePayload?.orderDetailsDTO?.compositeItems)}`
            );

            const flattenedDiffs = flattenJsonDiff(diff(order?.additionalDetails, updatePayload?.orderDetailsDTO?.additionalDetails));
            log.info(`flattenedDiffs length ${orderId}: ${flattenedDiffs.length}`);
            flattenedDiffs.forEach((line) => log.info(`flattenedDiffs ${orderId}: ${JSON.stringify(line)}`));

            const flattenedDiffs1 = flattenJsonDiff(diff(order?.compositeItems, updatePayload?.orderDetailsDTO?.compositeItems));
            log.info(`flattenedDiffs1 length ${orderId}: ${flattenedDiffs1.length}`);
            flattenedDiffs1.forEach((line) => log.info(`flattenedDiffs1 ${orderId}: ${JSON.stringify(line)}`));

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


async function updateOrder(orderId, itemId, filingNumber, caseUniqueId, casePartyData) {
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
        const updatedOrder = await updateIntermediateOrder(order, orderId, itemId, filingNumber, caseUniqueId, casePartyData);

        if (updatedOrder) {
            orderUpdateCacheMap.set(orderId, updatedOrder);
        }

        return updatedOrder;
    }

    if (category === "COMPOSITE") {
        const updatedOrder = await updateCompositeOrderItem(order, orderId, itemId, filingNumber, caseUniqueId, casePartyData);

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
                    const addrId = getAddressIdFromTaskAddress(td.respondentDetails);

                    if (addrId && respondentMap.has(addrId)) {
                        const caseRespondents = respondentMap.get(addrId);

                        if (caseRespondents.length > 1) {
                            log.warn(
                                `[CASE ${task.taskNumber}] ⚠ Task Respondent maps to MULTIPLE case respondents (duplicate case entries).| NOTICE-SUMMONS addressId=${addrId}`
                            );
                            log.info(`caseRespondents: ${JSON.stringify(caseRespondents)}`);
                            log.info(`task details: ${JSON.stringify(td)}`);
                            // for (let i = 0; i < caseRespondents.length - 1; i++) {
                            //   const a = caseRespondents[i];
                            //   const b = caseRespondents[i + 1];

                            //   const diff = diffString(a, b);

                            //   log.warn(`[CASE ${task.taskNumber}] Difference between respondent[${i}] and respondent[${i + 1}]:\n${diff}`);
                            // }
                            //101
                        } else {
                            log.info(
                                `[CASE ${task.taskNumber}] ✔ Task Respondent mapped to case respondent.| NOTICE-SUMMONS addressId=${addrId}`
                            );
                            log.info(`caseRespondents: ${JSON.stringify(caseRespondents)}`);
                            log.info(`respondentDetails: ${JSON.stringify(td.respondentDetails)}`);
                            await updateTask(task?.id, task?.filingNumber, task?.taskNumber, td, "ACCUSED", caseRespondents?.[0]?.uniqueId);
                            await updateOrder(task?.orderId, task?.additionalDetails?.itemId, task?.filingNumber, caseRespondents?.[0]?.uniqueId, caseRespondents?.[0]?.data)
                        }
                    } else {
                        log.warn(
                            `[CASE ${task.taskNumber}] ❌ Task Respondent NOT mapped. addressId=${addrId} not found in case respondents: respondentMap=${JSON.stringify([...respondentMap])}`
                        );
                        log.info(`respondentDetails: ${JSON.stringify(td.respondentDetails)}`);
                        //4
                    }
                }
            } else {
                if (td.witnessDetails) {
                    const addrId = getAddressIdFromTaskAddress(td.witnessDetails);

                    if (addrId && witnessMap.has(addrId)) {
                        const caseWitnesses = witnessMap.get(addrId);

                        if (caseWitnesses.length > 1) {
                            log.warn(
                                `[CASE ${task.taskNumber}] ⚠ Task Witness maps to MULTIPLE case witnesses (duplicate case entries). addressId=${addrId}`
                            );
                            log.info(`caseWitnesses: ${JSON.stringify(caseWitnesses)}`);
                            log.info(`witnessDetails: ${JSON.stringify(td.witnessDetails)}`);
                        } else {
                            log.info(
                                `[CASE ${task.taskNumber}] ✔ Task Witness mapped to case witness. addressId=${addrId}`
                            );
                            log.info(`caseWitnesses: ${JSON.stringify(caseWitnesses)}`);
                            log.info(`witnessDetails: ${JSON.stringify(td.witnessDetails)}`);
                            await updateTask(task?.id, task?.filingNumber, task?.taskNumber, td, "WITNESS", caseWitnesses?.[0]?.uniqueId);
                            await updateOrder(task?.orderId, task?.additionalDetails?.itemId, task?.filingNumber, caseWitnesses?.[0]?.uniqueId, caseWitnesses?.[0]?.data)
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
                const addrId = getAddressIdFromTaskAddress(td.respondentDetails);

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
                    const addrId = getAddressIdFromTaskAddress(td.respondentDetails);

                    if (addrId && respondentMap.has(addrId)) {
                        const caseRespondents = respondentMap.get(addrId);
                        if (caseRespondents.length > 1) {
                            caseRespondentsduplicate = true;
                            log.warn(
                                `[CASE ${task.taskNumber}] ⚠ Task Respondent maps to MULTIPLE case respondents (duplicate case entries).| WARRANT addressId=${addrId}: caseRespondents=${JSON.stringify(caseRespondents)}`
                            );
                            log.info(`caseRespondents: ${JSON.stringify(caseRespondents)}`);
                            log.info(`respondentDetails: ${JSON.stringify(td.respondentDetails)}`);
                            //101 as above
                        } else {
                            respondentMapped = true;
                            log.info(
                                `[CASE ${task.taskNumber}] ✔ Task Respondent mapped to case respondent.| WARRANT addressId=${addrId}`
                            );
                            log.info(`caseRespondents: ${JSON.stringify(caseRespondents)}`);
                            log.info(`respondentDetails: ${JSON.stringify(td.respondentDetails)}`);
                            await updateTask(task?.id, task?.filingNumber, task?.taskNumber, td, "ACCUSED", caseRespondents?.[0]?.uniqueId);
                            await updateOrder(task?.orderId, task?.additionalDetails?.itemId, task?.filingNumber, caseRespondents?.[0]?.uniqueId, caseRespondents?.[0]?.data)
                        }
                    } else if (addrId && witnessMap.has(addrId)) {
                        const caseWitnesses = witnessMap.get(addrId);
                        if (caseWitnesses.length > 1) {
                            caseWitnessesduplicate = true;
                            log.warn(
                                `[CASE ${task.taskNumber}] ⚠ Task Respondent maps to MULTIPLE case witnesses (duplicate case entries).| WARRANT addressId=${addrId}: caseWitnesses=${JSON.stringify(caseWitnesses)}`
                            );
                            log.info(`caseWitnesses: ${JSON.stringify(caseWitnesses)}`);
                            log.info(`respondentDetails: ${JSON.stringify(td.respondentDetails)}`);
                        } else {
                            witnessMapped = true;
                            log.info(
                                `[CASE ${task.taskNumber}] ✔ Task Respondent mapped to case witnessess. addressId=${addrId}`
                            );
                            log.info(`caseWitnesses: ${JSON.stringify(caseWitnesses)}`);
                            log.info(`respondentDetails: ${JSON.stringify(td.respondentDetails)}`);
                            await updateTask(task?.id, task?.filingNumber, task?.taskNumber, td, "WITNESS", caseWitnesses?.[0]?.uniqueId);
                            await updateOrder(task?.orderId, task?.additionalDetails?.itemId, task?.filingNumber, caseWitnesses?.[0]?.uniqueId, caseWitnesses?.[0]?.data)
                        }
                    } else {
                        log.warn(
                            `[CASE ${task.taskNumber}] ❌ Task Respondent NOT mapped to any Witness or Respondant. addressId=${addrId} not found in case respondents: respondentMap=${JSON.stringify([...respondentMap])}, witnessMap=${JSON.stringify([...witnessMap])}`
                        );
                        log.info(`respondentDetails: ${JSON.stringify(td.respondentDetails)}`);
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
                    await processCaseAndTasks(cases[0], tasks);
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
    log.error(error.stack);
    safeExit();
});

process.on('unhandledRejection', (reason, promise) => {
    log.error('💥 Unhandled Rejection at:');
    log.error(promise);
    log.error(reason);
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
        log.error('💥 Script failed:');
        log.error(error);
        safeExit();
    });
}


