const { Pool } = require("pg");
const axios = require("axios");
const winston = require("winston");
const { diffString } = require('json-diff');
const { diff } = require('json-diff-ts');
const { RequestInfo, HEADERS, filingNumbers, orders } = require("./config");

// ==========================
// CONFIG
// ==========================
const pool = new Pool({

});

// const esSearchUrl = process.env.ES_SEARCH_URL || "http://localhost:9200/pending-tasks-index/_search";
// const esPendingUpdateUrl = process.env.ES_PENDING_UPDATE_URL || "http://localhost:9200/pending-tasks-index/_update_by_query";
// const esUsernameFromEnv = process.env.ES_USERNAME || "elastic";
// const esPasswordFromEnv = process.env.ES_PASSWORD || "asdf";

// Active ES configuration for pending-tasks-index
const esPendingSearchUrl = process.env.ES_PENDING_SEARCH_URL || "http://192.168.5.139:8080/pending-tasks-index/_search";
const esPendingUpdateUrl = process.env.ES_PENDING_UPDATE_URL || "http://192.168.5.139:8080/pending-tasks-index/_update_by_query";
const esUsername = process.env.ES_USERNAME || "elastic";
const esPassword = process.env.ES_PASSWORD || "changeme";

// Billing service config (mirrors Java searchDemand/updateDemand usage)
// const billingServiceHost = process.env.BILLING_SERVICE_HOST || "http://localhost:8080";
const demandSearchEndpoint = process.env.DEMAND_SEARCH_ENDPOINT || "http://192.168.5.139:8080/billing-service/demand/_search";
const demandUpdateEndpoint = process.env.DEMAND_UPDATE_ENDPOINT || "http://192.168.5.139:8080/billing-service/demand/_update";

// const caseSearchApi = "http://localhost:8080/case/v1/_search?tenantId=kl";
const taskSearchApi = process.env.TASK_SEARCH_API || "http://192.168.5.139:8081/task/v1/search?tenantId=kl";
// const orderSearchApi = "https://dristi-kerala-dev.pucar.org/order/v1/search?tenantId=kl";

// const updateTaskApi = process.env.UPDATE_TASK_API || "http://localhost:8081/task/v1/task-details?tenantId=kl";
// const updateCaseApi = process.env.UPDATE_CASE_API || "http://192.168.6.110:8080/case/v1/admin/edit_case?tenantId=kl";
// const updateOrderApi = "https://dristi-kerala-dev.pucar.org/order/v1/order-details?tenantId=kl";

const BATCH_SIZE = 80;
const INITIAL_OFFSET = 0;

// Maximum number of BOTD-eligible rows to fetch from DB (can be overridden via env)
const MAX_BOTD_DB_ROWS = parseInt(process.env.BOTD_DB_LIMIT || "7000", 10);

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
        new winston.transports.File({ filename: "sync-error_botd_elastic.log", level: "error" }),
        new winston.transports.File({ filename: "sync-combined_botd_elastic.log" }),
        new winston.transports.Console(),
    ],
});

// ==========================
// UTILITY FUNCTIONS
// ==========================

function randomDelay(min = 400, max = 600) {
    return new Promise(resolve =>
        setTimeout(resolve, Math.floor(Math.random() * (max - min + 1)) + min)
    );
}

// Convert array key to [index] format
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


// ==========================
// MAIN LOGIC FUNCTIONS
// ==========================


async function searchTaskByNumber(taskNumber) {
    const payload = {
        criteria: {
            tenantId: "kl",
            taskNumber,
        },
        pagination: {
            limit: 10,
            offSet: 0,
        },
        RequestInfo,
    };

    const response = await axios.post(taskSearchApi, payload, { headers: HEADERS });
    return response.data?.list || [];
}

async function searchDemand(tenantId, consumerCodes) {
    const url = `${demandSearchEndpoint}?tenantId=${encodeURIComponent(
        tenantId
    )}&consumerCode=${encodeURIComponent(consumerCodes.join(","))}`;

    const requestInfoWrapper = {
        RequestInfo,
    };

    return await axios.post(url, requestInfoWrapper);
}

async function updateDemand(demandRequest) {
    const url = `${demandUpdateEndpoint}`;
    return await axios.post(url, demandRequest);
}


// Close pending task document in pending-tasks-index for a given consumer code
// by setting Data.isCompleted=true, with before/after + diff logging and stats.
async function closePendingTaskForConsumerCode(consumerCode, stats) {
    try {
        // consumerCode format: <taskNumber>_<suffix>, e.g. KL-000523-2025-TK2_EPOST_COURT
        const parts = consumerCode.split("_");
        if (!parts.length) {
            log.info(`Unable to derive taskNumber from consumer code: ${consumerCode}`);
            stats.set(
                "pendingTasksNotFound",
                (stats.get("pendingTasksNotFound") || 0) + 1
            );
            return;
        }

        const taskNumber = parts[0];
        const docId = `MANUAL_${taskNumber}`;

        log.info(
            `Fetching pending-tasks-index document for consumer code ${consumerCode} (docId=${docId})`
        );

        const searchBody = {
            query: {
                term: {
                    _id: docId,
                },
            },
        };

        const searchResult = await esSearch(
            esPendingSearchUrl,
            searchBody,
            `Fetch pending task doc ${docId}`
        );

        const hits = (searchResult && searchResult.hits && searchResult.hits.hits) || [];
        if (!hits.length) {
            log.info(
                `No pending-tasks-index document found for consumer code ${consumerCode} (docId=${docId}); skipping ES task close`
            );
            stats.set(
                "pendingTasksNotFound",
                (stats.get("pendingTasksNotFound") || 0) + 1
            );
            return;
        }

        const hit = hits[0];
        const source = hit._source || {};
        const data = source.Data;

        if (!data) {
            log.info(
                `Pending-tasks-index document ${docId} has no Data field; skipping ES task close`
            );
            stats.set(
                "pendingTasksNotFound",
                (stats.get("pendingTasksNotFound") || 0) + 1
            );
            return;
        }

        const originalData = JSON.parse(JSON.stringify(data));

        if (originalData.isCompleted === true) {
            log.info(
                `Pending task already completed for consumer code ${consumerCode} (docId=${docId}); skipping ES update`
            );
            stats.set(
                "pendingTasksAlreadyCompleted",
                (stats.get("pendingTasksAlreadyCompleted") || 0) + 1
            );
            return;
        }

        const updatedData = { ...originalData, isCompleted: true };

        // Log before/after snapshots and structured diff
        try {
            log.info(
                `Pending task BEFORE update for consumer code ${consumerCode} (docId=${docId}): ${JSON.stringify(
                    originalData
                )}`
            );
            log.info(
                `Pending task AFTER update for consumer code ${consumerCode} (docId=${docId}): ${JSON.stringify(
                    updatedData
                )}`
            );

            const taskDiff = diff(originalData, updatedData) || [];
            const flattenedTaskDiff = flattenJsonDiff(taskDiff, [], []);

            if (flattenedTaskDiff.length > 0) {
                log.info(
                    `Field-level diff for pending task of consumer code ${consumerCode} (docId=${docId}):\n${flattenedTaskDiff.join(
                        "\n"
                    )}`
                );
            } else {
                log.info(
                    `No field-level differences detected between BEFORE and AFTER for pending task of consumer code ${consumerCode} (docId=${docId})`
                );
            }
        } catch (e) {
            log.error(
                `Error while computing/logging diff for pending task of consumer code ${consumerCode} (docId=${docId}): ${e.message}`
            );
        }

        const updateBody = {
            script: {
                source:
                    "if (ctx._source != null && ctx._source.Data != null) { ctx._source.Data.isCompleted = true; }",
                lang: "painless",
            },
            query: {
                term: {
                    _id: docId,
                },
            },
        };

        const updateResult = await esUpdateByQuery(
            `${esPendingUpdateUrl}?conflicts=proceed&refresh=true`,
            updateBody,
            `Mark isCompleted=true for pending task ${docId}`
        );

        const updated = (updateResult && updateResult.updated) || 0;
        if (updated > 0) {
            stats.set(
                "pendingTasksUpdated",
                (stats.get("pendingTasksUpdated") || 0) + updated
            );
            log.info(
                `Successfully marked pending task as completed in ES for consumer code ${consumerCode} (docId=${docId}), updated=${updated}`
            );
        } else {
            log.info(
                `ES update_by_query for pending task ${docId} returned updated=0; nothing changed in ES`
            );
        }
    } catch (e) {
        stats.set(
            "pendingTasksUpdateErrors",
            (stats.get("pendingTasksUpdateErrors") || 0) + 1
        );
        log.error(
            `Error while closing pending task in ES for consumer code ${consumerCode}: ${e.message}`
        );
    }
}


function buildMdmsMap(mdmsdata) {
    const mdmsMap = new Map();
    if (!Array.isArray(mdmsdata)) return mdmsMap;

    for (const item of mdmsdata) {
        if (!item || !item.suffix) continue;
        // last one wins if duplicates exist
        mdmsMap.set(item.suffix, item.deliveryChannel || null);
    }

    return mdmsMap;
}


function getDeliveryChannelFromTask(task) {
    const details = task && task.taskDetails;
    if (!details || !details.deliveryChannels) return null;

    const deliveryChannels = details.deliveryChannels;
    const channelName = deliveryChannels.channelName;

    if (!channelName) return null;
    return String(channelName);
}

function buildConsumerCodesForTask(task, mdmsdata) {
    const taskNumber = task && task.taskNumber;
    const deliveryChannel = getDeliveryChannelFromTask(task);

    if (!taskNumber) {
        log.info("taskNumber not found on task while building consumer codes");
        return [];
    }

    if (!deliveryChannel) {
        log.info(`delivery channel not found for task: ${taskNumber}`);
        return [];
    }

    const consumerCodes = [];

    for (const row of mdmsdata || []) {
        if (!row) continue;

        const rowChannel = row.deliveryChannel;
        if (
            rowChannel &&
            rowChannel.toString().toUpperCase().includes(deliveryChannel.toUpperCase())
        ) {
            const suffix = row.suffix;
            if (suffix) {
                consumerCodes.push(`${taskNumber}_${suffix}`);
            }
        }
    }

    return consumerCodes;
}


async function cancelRelatedDemandsForTasks(tenantId, tasks, mdmsdata, stats) {
    if (!tasks || tasks.length === 0) {
        log.info("No tasks provided for cancelling related demands");
        return;
    }

    // Build unique consumer codes across all tasks
    const consumerCodesSet = new Set();
    for (const task of tasks) {
        const codes = buildConsumerCodesForTask(task, mdmsdata);
        codes.forEach((code) => consumerCodesSet.add(code));
    }

    const consumerCodes = Array.from(consumerCodesSet);

    if (!consumerCodes.length) {
        log.info("No consumer codes derived from tasks; skipping demand cancellation");
        return;
    }

    // Process each consumerCode individually to avoid very long URLs (414) and
    // to have fine-grained logging/statistics
    for (const code of consumerCodes) {
        // 1) Close corresponding pending task in ES (pending-tasks-index) first
        await closePendingTaskForConsumerCode(code, stats);

        // 2) Then fetch and cancel related demands
        log.info(`Fetching demands for consumer code: ${code}`);

        let demandResponse;
        try {
            const response = await searchDemand(tenantId, [code]);
            demandResponse = response.data;
        } catch (e) {
            stats.set("demandSearchErrors", (stats.get("demandSearchErrors") || 0) + 1);
            log.error(`Error while searching demand for ${code}: ${e.message}`);
            continue;
        }

        const demands = (demandResponse && demandResponse.Demands) || [];
        if (!demands.length) {
            log.info(`No demands found for consumer code: ${code}`);
            continue;
        }

        // Deep clone original demands for logging and diffing
        const originalDemands = JSON.parse(JSON.stringify(demands));

        demands.forEach((d) => {
            if (d && d.status !== "CANCELLED") {
                d.status = "CANCELLED";
            }
        });

        log.info(`Marking ${demands.length} demands as CANCELLED for consumer code: ${code}`);

        // Log before/after snapshots and structured diff
        try {
            log.info(
                `Demand payload BEFORE update for consumer code ${code}: ${JSON.stringify(
                    originalDemands
                )}`
            );
            log.info(
                `Demand payload AFTER update for consumer code ${code}: ${JSON.stringify(
                    demands
                )}`
            );

            const demandDiff = diff(originalDemands, demands) || [];
            const flattenedDiff = flattenJsonDiff(demandDiff, [], []);

            if (flattenedDiff.length > 0) {
                log.info(
                    `Field-level diff for demands of consumer code ${code}:\n${flattenedDiff.join(
                        "\n"
                    )}`
                );
            } else {
                log.info(
                    `No field-level differences detected between BEFORE and AFTER for consumer code ${code}`
                );
            }
        } catch (e) {
            log.error(
                `Error while computing/logging diff for demands of consumer code ${code}: ${e.message}`
            );
        }

        const demandRequest = {
            RequestInfo,
            demands,
        };

        try {
            await updateDemand(demandRequest);
            stats.set("demandUpdated", (stats.get("demandUpdated") || 0) + demands.length);
            log.info(
                `Updated demand status to CANCELLED for consumer code: ${code}`
            );
        } catch (e) {
            stats.set("demandUpdateErrors", (stats.get("demandUpdateErrors") || 0) + 1);
            log.error(`Error while updating demand for ${code}: ${e.message}`);
        }
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
// GENERIC DB / ES UTILITIES
// ==========================

// Generic DB search utility (wrapper over runQuery) for reusable SELECTs
async function dbSearch(query, params = []) {
    return await runQuery(query, params);
}

// Generic DB update utility (also wrapper over runQuery) for UPDATE/INSERT/DELETE
async function dbUpdate(query, params = []) {
    return await runQuery(query, params);
}

// Generic Elasticsearch search utility
async function esSearch(url, body, description = "") {
    try {
        if (description) {
            log.info(`🔍 ES search started: ${description}`);
        }

        const response = await axios.post(url, body, {
            auth: { username: esUsername, password: esPassword },
            timeout: 30000,
        });

        return response.data;
    } catch (e) {
        log.error(
            `❌ ES search failed${description ? ` for ${description}` : ""}: ${e.message}`
        );
        throw e;
    }
}

// Generic Elasticsearch update-by-query utility
async function esUpdateByQuery(url, body, description = "") {
    try {
        if (description) {
            log.info(`✏️ ES update_by_query started: ${description}`);
        }

        const response = await axios.post(url, body, {
            headers: { "Content-Type": "application/json" },
            auth: { username: esUsername, password: esPassword },
            timeout: 30000,
        });

        return response.data;
    } catch (e) {
        log.error(
            `❌ ES update_by_query failed${description ? ` for ${description}` : ""}: ${e.message}`
        );
        throw e;
    }
}



// ==========================
// MAIN EXECUTION
// ==========================
async function main() {
    // Stats map for expired task handling and task search

    let stats = new Map([
        ["esTasksMatched", 0],
        ["esTasksUpdated", 0],
        ["pendingTasksUpdated", 0],
        ["pendingTasksAlreadyCompleted", 0],
        ["pendingTasksNotFound", 0],
        ["pendingTasksUpdateErrors", 0],
        ["taskSearchFound", 0],
        ["taskSearchNotFound", 0],
        ["taskSearchErrors", 0],
        ["demandUpdated", 0],
        ["demandUpdateErrors", 0],
        ["demandSearchErrors", 0],
    ]);

    try {
        log.info("🚀 Starting expiredTasks processing for pending-tasks-index and task search...");

        // await validateDBandElasticConnection();
        log.info("✅ Basic configuration loaded");
        const expiredTasks = ['KL-000552-2025-TK3',
            'KL-000190-2025-TK7',
            'KL-000519-2025-TK3',
            'KL-000629-2025-TK1',
            'KL-000299-2024-TK5',
            'KL-000339-2024-TK9',
            'KL-000261-2024-TK5',
            'KL-000236-2025-TK5',
            'KL-000536-2025-TK1',
            'KL-000146-2024-TK2',
            'KL-000480-2025-TK2',
            'KL-000448-2025-TK3',
            'KL-000484-2025-TK1',
            'KL-000129-2025-TK2',
            'KL-000394-2025-TK3',
            'KL-000339-2024-TK7',
            'KL-000099-2025-TK4',
            'KL-000637-2025-TK1',
            'KL-000213-2025-TK3',
            'KL-000446-2025-TK4',
            'KL-000138-2025-TK4',
            'KL-000356-2024-TK6',
            'KL-000659-2025-TK2',
            'KL-000182-2025-TK6',
            'KL-000372-2025-TK2',
            'KL-000161-2025-TK7',
            'KL-000213-2025-TK4',
            'KL-000417-2025-TK4',
            'KL-000417-2025-TK2',
            'KL-000384-2025-TK6',
            'KL-000384-2025-TK3',
            'KL-000546-2025-TK9',
            'KL-000646-2025-TK1',
            'KL-000449-2025-TK7',
            'KL-000182-2025-TK5',
            'KL-000542-2025-TK6',
            'KL-000417-2025-TK3',
            'KL-000363-2025-TK3',
            'KL-000546-2025-TK7',
            'KL-000236-2025-TK6',
            'KL-000546-2025-TK8',
            'KL-000259-2025-TK7',
            'KL-000399-2025-TK3',
            'KL-000542-2025-TK5',
            'KL-000542-2025-TK4',
            'KL-000536-2025-TK2',
            'KL-000302-2025-TK10',
            'KL-000339-2024-TK6',
            'KL-000075-2024-TK8',
            'KL-000384-2025-TK4',
            'KL-000394-2025-TK2',
            'KL-000202-2025-TK5',
            'KL-000202-2025-TK6',
            'KL-000565-2025-TK4',
            'KL-000099-2025-TK5',
            'KL-000491-2025-TK2',
            'KL-000203-2025-TK3',
            'KL-000203-2025-TK4',
            'KL-000471-2025-TK4',
            'KL-000449-2025-TK6',
            'KL-000064-2025-TK4',
            'KL-000384-2025-TK5',
            'KL-000340-2024-TK10',
            'KL-000118-2024-TK5',
            'KL-000580-2025-TK2',
            'KL-000086-2025-TK5',
            'KL-000161-2025-TK8',
            'KL-000156-2024-TK6',
            'KL-000336-2025-TK4',
            'KL-000180-2025-TK5',
            'KL-000031-2025-TK5',
            'KL-000131-2025-TK2',
            'KL-000363-2025-TK4',
            'KL-000461-2025-TK5',
            'KL-000184-2025-TK4',
            'KL-000484-2025-TK2',
            'KL-000582-2025-TK1',
            'KL-000314-2024-TK5',
            'KL-000093-2025-TK5',
            'KL-000629-2025-TK2',
            'KL-000320-2024-TK6',
            'KL-000278-2025-TK4',
            'KL-000653-2025-TK1',
            'KL-000413-2025-TK4',
            'KL-000043-2025-TK9',
            'KL-000043-2025-TK8',
            'KL-000646-2025-TK2',
            'KL-000340-2024-TK9',
            'KL-000564-2025-TK4',
            'KL-000564-2025-TK3',
            'KL-000474-2025-TK5',
            'KL-000474-2025-TK4',
            'KL-000474-2025-TK3',
            'KL-000325-2024-TK4',
            'KL-000347-2024-TK6',
            'KL-000109-2025-TK2',
            'KL-000109-2025-TK1',
            'KL-000398-2025-TK4',
            'KL-000454-2025-TK4',
            'KL-000091-2025-TK4',
            'KL-000066-2025-TK4',
            'KL-000457-2025-TK4',
            'KL-000225-2025-TK4',
            'KL-000451-2025-TK5',
            'KL-000451-2025-TK3',
            'KL-000451-2025-TK4',
            'KL-000075-2024-TK7',
            'KL-000446-2025-TK3',
            'KL-000304-2025-TK4',
            'KL-000113-2025-TK5',
            'KL-000480-2025-TK3',
            'KL-000543-2025-TK7',
            'KL-000543-2025-TK6',
            'KL-000543-2025-TK5',
            'KL-000561-2025-TK2',
            'KL-000339-2024-TK8',
            'KL-000523-2025-TK3',
            'KL-000523-2025-TK2',
            'KL-000356-2024-TK7',
            'KL-000356-2024-TK5',
            'KL-000454-2025-TK3',
            'KL-000596-2025-TK2',
            'KL-000124-2025-TK6',
            'KL-000124-2025-TK5',
            'KL-000504-2025-TK3',
            'KL-000504-2025-TK2',
            'KL-000231-2025-TK6',
            'KL-000330-2025-TK3',
            'KL-000330-2025-TK2',
            'KL-000156-2024-TK5',
            'KL-000080-2025-TK5',
            'KL-000336-2025-TK3',
            'KL-000336-2025-TK2']

// const expiredTasks = ['KL-000552-2025-TK3',
// 'KL-000336-2025-TK2']

        const mdmsdata = [
            {
                "suffix": "TASK_COURT_POST_PROCESS",
                "deliveryChannel": "ONLINE"
            },
            {
                "suffix": "ICOPS_COURT",
                "deliveryChannel": "POLICE"
            },
            {
                "suffix": "POST_COURT",
                "deliveryChannel": "EPOST"
            },
            {
                "suffix": "POST_PROCESS",
                "deliveryChannel": "EPOST"
            },
            {
                "suffix": "EPOST_COURT",
                "deliveryChannel": "RPAD"
            },
            {
                "suffix": "ICOPS_COURT",
                "deliveryChannel": "POLICE"
            },
            {
                "suffix": "POST_COURT",
                "deliveryChannel": "EPOST"
            },
            {
                "suffix": "POST_PROCESS",
                "deliveryChannel": "EPOST"
            },
            {
                "suffix": "EPOST_COURT",
                "deliveryChannel": "RPAD"
            },
            {
                "suffix": "GENERIC",
                "deliveryChannel": "Online"
            },
            {
                "suffix": "POST_COURT",
                "deliveryChannel": "EPOST"
            },
            {
                "suffix": "POST_PROCESS",
                "deliveryChannel": "EPOST"
            },
            {
                "suffix": "EPOST_COURT",
                "deliveryChannel": "RPAD"
            },
            {
                "suffix": "JOIN_CASE",
                "deliveryChannel": "Online"
            },
            {
                "suffix": "ICOPS_COURT",
                "deliveryChannel": "POLICE"
            },
            {
                "suffix": "EPOST_COURT",
                "deliveryChannel": "RPAD"
            },
            {
                "suffix": "POST_PROCESS_COURT",
                "deliveryChannel": "EPOST"
            },
            {
                "suffix": "POST_COURT",
                "deliveryChannel": "EPOST"
            },
            {
                "suffix": "EMAIL_COURT",
                "deliveryChannel": "EMAIL"
            },
            {
                "suffix": "EMAIL_COURT",
                "deliveryChannel": "EMAIL"
            },
            {
                "suffix": "ICOPS_COURT",
                "deliveryChannel": "POLICE"
            },
            {
                "suffix": "CASE_FILING",
                "deliveryChannel": "Online"
            },
            {
                "suffix": "APPL_FILING",
                "deliveryChannel": "Online"
            },
            {
                "suffix": "SMS_COURT",
                "deliveryChannel": "SMS"
            },
            {
                "suffix": "EPOST_COURT",
                "deliveryChannel": "RPAD"
            },
            {
                "suffix": "POST_PROCESS_COURT",
                "deliveryChannel": "EPOST"
            },
            {
                "suffix": "POST_COURT",
                "deliveryChannel": "EPOST"
            },
            {
                "suffix": "SMS_COURT",
                "deliveryChannel": "SMS"
            }
        ]

        // Build MDMS map for quick lookup: suffix -> deliveryChannel
        const mdmsMap = buildMdmsMap(mdmsdata);
        log.info(`MDMS map prepared with ${mdmsMap.size} unique suffix entries`);

        // 1) For each expired taskNumber, perform task search
        const allFoundTasks = [];
        for (const taskNumber of expiredTasks) {
            try {
                const tasks = await searchTaskByNumber(taskNumber);
                if (tasks.length > 0) {
                    stats.set(
                        "taskSearchFound",
                        (stats.get("taskSearchFound") || 0) + 1
                    );
                    allFoundTasks.push(...tasks);
                    log.info(
                        `Task search for ${taskNumber} returned ${tasks.length} record(s)`
                    );
                } else {
                    stats.set(
                        "taskSearchNotFound",
                        (stats.get("taskSearchNotFound") || 0) + 1
                    );
                    log.info(`Task search for ${taskNumber} returned no records`);
                }
            } catch (e) {
                stats.set(
                    "taskSearchErrors",
                    (stats.get("taskSearchErrors") || 0) + 1
                );
                log.error(
                    `Error during task search for ${taskNumber}: ${e.message}`
                );
            }
        }

        // 2) Cancel related demands based on mdmsdata mapping and task delivery channel
        await cancelRelatedDemandsForTasks("kl", allFoundTasks, mdmsdata, stats);

    } catch (error) {
        log.error(`💥 Critical error in main execution: ${error.message}`);
        safeExit();
    } finally {
        await pool.end();

        // Final summary
        const esTasksMatched = stats.get("esTasksMatched") || 0;
        const esTasksUpdated = stats.get("esTasksUpdated") || 0;
        const pendingTasksUpdated = stats.get("pendingTasksUpdated") || 0;
        const pendingTasksAlreadyCompleted = stats.get("pendingTasksAlreadyCompleted") || 0;
        const pendingTasksNotFound = stats.get("pendingTasksNotFound") || 0;
        const pendingTasksUpdateErrors = stats.get("pendingTasksUpdateErrors") || 0;
        const taskSearchFound = stats.get("taskSearchFound") || 0;
        const taskSearchNotFound = stats.get("taskSearchNotFound") || 0;
        const taskSearchErrors = stats.get("taskSearchErrors") || 0;
        const demandUpdated = stats.get("demandUpdated") || 0;
        const demandUpdateErrors = stats.get("demandUpdateErrors") || 0;
        const demandSearchErrors = stats.get("demandSearchErrors") || 0;

        log.info("📊 =================== FINAL SUMMARY ===================");
        log.info(`📋 ES pending-tasks-index matched for expiredTasks: ${esTasksMatched}`);
        log.info(`   ✅ ES documents updated (isCompleted=true): ${esTasksUpdated}`);
        log.info(`   ✅ Pending tasks updated via per-consumer close: ${pendingTasksUpdated}`);
        log.info(`   ℹ️  Pending tasks already completed (no-op): ${pendingTasksAlreadyCompleted}`);
        log.info(`   ℹ️  Pending tasks not found / missing Data: ${pendingTasksNotFound}`);
        log.info(`   💥 Pending task update errors: ${pendingTasksUpdateErrors}`);
        log.info(`   🔍 Task search success count: ${taskSearchFound}`);
        log.info(`   🔍 Task search not-found count: ${taskSearchNotFound}`);
        log.info(`   💥 Task search error count: ${taskSearchErrors}`);
        log.info(`   ✅ Demands updated (status to CANCELLED): ${demandUpdated}`);
        log.info(`   💥 Demand update error count: ${demandUpdateErrors}`);
        log.info(`   💥 Demand search error count: ${demandSearchErrors}`);

        if (taskSearchErrors > 0 || demandUpdateErrors > 0 || demandSearchErrors > 0) {
            log.error(
                `⚠️ Errors encountered. taskSearchErrors=${taskSearchErrors}, demandUpdateErrors=${demandUpdateErrors}, demandSearchErrors=${demandSearchErrors}. Check error logs for details.`
            );
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


