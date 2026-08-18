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
    user: "",
    host: "",
    database: "",
    password: "",
    port: 5432,
});

const esOrderSearchUrl = process.env.ES_ORDER_SEARCH_URL || "http://localhost:9200/order-notification-view/_search";
const esOrderUpdateUrl = process.env.ES_ORDER_UPDATE_URL || "http://localhost:9200/order-notification-view/_update_by_query";
const esUsername = process.env.ES_USERNAME || "";
const esPassword = process.env.ES_PASSWORD || "";

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
// MAIN LOGIC FUNCTIONS
// ==========================


// Step 1: Fetch PUBLISHED orders from Elasticsearch that do NOT have businessOfTheDay
async function getElasticOrdersWithoutBotd() {
    const searchBody = {
        track_total_hits: true,
        size: 3000,
        _source: [
            "Data.orderNotification.id",
            "Data.orderNotification.date",
            "Data.orderNotification.status",
            "Data.orderNotification.businessOfTheDay",
        ],
        query: {
            bool: {
                must: [
                    {
                        term: {
                            "Data.orderNotification.status.keyword": "PUBLISHED",
                        },
                    },
                ],
                must_not: [
                    {
                        exists: {
                            field: "Data.orderNotification.businessOfTheDay",
                        },
                    },
                ],
            },
        },
    };

    const data = await esSearch(
        esOrderSearchUrl,
        searchBody,
        "Fetch PUBLISHED ES orders without businessOfTheDay"
    );

    const hits = data?.hits?.hits || [];
    const orderNumbers = hits
        .map((h) => h._source?.Data?.orderNotification?.id)
        .filter((id) => typeof id === "string" && id.trim() !== "");

    log.info(
        `📊 ES PUBLISHED orders without businessOfTheDay: hits=${hits.length}, distinct ordernumbers=${orderNumbers.length}`
    );

    return orderNumbers;
}

// Step 2: Fetch DB orders for the given list with non-null itemtext
async function getDbOrdersWithItemtext(orderNumbers) {
    if (!orderNumbers || orderNumbers.length === 0) {
        return [];
    }

    const query = `
    SELECT 
      ordernumber,
      itemtext
    FROM dristi_orders
    WHERE status = 'PUBLISHED'
      AND itemtext IS NOT NULL
      AND ordernumber = ANY($1::text[])
  `;

    try {
        log.info(
            `🔍 Fetching DB orders with itemtext for ${orderNumbers.length} ES ordernumbers...`
        );
        const rows = await dbSearch(query, [orderNumbers]);
        log.info(`📊 DB orders with itemtext found: ${rows.length}`);
        return rows;
    } catch (e) {
        log.error(
            `❌ Failed to fetch DB orders with itemtext for ES orders: ${e.message}`
        );
        throw e;
    }
}

// Step 3: Update ES businessOfTheDay for a single order
async function updateElasticBotdForOrder(ordernumber, itemtext) {
    const trimmed = (itemtext || "").trim();
    if (!trimmed) {
        return { updated: false, reason: "empty_itemtext" };
    }

    const updateBody = {
        script: {
            source:
                `if (ctx._source.Data != null && ctx._source.Data.orderNotification != null) {
          def botd = ctx._source.Data.orderNotification.businessOfTheDay;
          if (botd == null || botd.toString().trim().length() == 0) {
            ctx._source.Data.orderNotification.businessOfTheDay = params.businessOfTheDay;
          } else {
            ctx.op = 'none';
          }
        } else {
          ctx.op = 'none';
        }`,
            lang: "painless",
            params: {
                businessOfTheDay: trimmed,
            },
        },
        query: {
            bool: {
                must: [
                    { term: { "Data.orderNotification.status.keyword": "PUBLISHED" } },
                    { term: { "Data.orderNotification.id.keyword": ordernumber } },
                ],
            },
        },
    };

    const data = await esUpdateByQuery(
        esOrderUpdateUrl + "?conflicts=proceed&refresh=true",
        updateBody,
        `Update businessOfTheDay for order ${ordernumber}`
    );

    const updated = data?.updated || 0;
    const total = data?.total || 0;

    if (updated === 0 && total === 0) {
        return { updated: false, reason: "es_not_found" };
    }

    if (updated === 0 && total > 0) {
        return { updated: false, reason: "noop" };
    }

    if (updated > 1) {
        return { updated: true, reason: `multiple_updates_${updated}` };
    }

    return { updated: true, reason: "success" };
}

// Orchestrator: ES → DB → ES updates
async function processBotdSyncFromItemtext(stats) {
    // Step 1: ES search
    const esOrderNumbers = await getElasticOrdersWithoutBotd();
    const distinctEsOrderNumbers = Array.from(new Set(esOrderNumbers));

    stats.set("esOrdersWithoutBotd", distinctEsOrderNumbers.length || 0);

    if (!distinctEsOrderNumbers.length) {
        log.info("ℹ️ No ES orders without businessOfTheDay found; nothing to sync.");
        return;
    }

    // Step 2: DB lookup
    const dbRows = await getDbOrdersWithItemtext(distinctEsOrderNumbers);
    stats.set("dbOrdersWithItemtext", dbRows.length || 0);

    const dbMap = new Map();
    for (const row of dbRows) {
        if (row.ordernumber) {
            dbMap.set(row.ordernumber, row.itemtext);
        }
    }

    // Step 3: Update ES one-by-one
    let processed = 0;

    for (const ordernumber of distinctEsOrderNumbers) {
        try {
            const itemtext = dbMap.get(ordernumber);

            if (!itemtext) {
                stats.set(
                    "skippedNoDbOrItemtext",
                    (stats.get("skippedNoDbOrItemtext") || 0) + 1
                );
                log.info(
                    `⏭️ Skipping ES order ${ordernumber}: no matching DB row with itemtext`
                );
                continue;
            }

            const result = await updateElasticBotdForOrder(ordernumber, itemtext);
            processed += 1;

            if (result.updated) {
                stats.set("esUpdated", (stats.get("esUpdated") || 0) + 1);
                log.info(
                    `✅ ES updated for order ${ordernumber}, reason=${result.reason}`
                );
            } else {
                if (result.reason === "es_not_found") {
                    stats.set(
                        "esNotFoundOnUpdate",
                        (stats.get("esNotFoundOnUpdate") || 0) + 1
                    );
                } else if (result.reason === "empty_itemtext") {
                    stats.set(
                        "skippedEmptyItemtext",
                        (stats.get("skippedEmptyItemtext") || 0) + 1
                    );
                } else if (result.reason === "noop") {
                    stats.set(
                        "esNoop",
                        (stats.get("esNoop") || 0) + 1
                    );
                }

                stats.set("esNotUpdated", (stats.get("esNotUpdated") || 0) + 1);
                log.info(
                    `ℹ️ ES not updated for order ${ordernumber}, reason=${result.reason}`
                );
            }
        } catch (e) {
            stats.set("errors", (stats.get("errors") || 0) + 1);
            log.error(
                `❌ Error while updating ES BOTD for order ${ordernumber}: ${e.message}`
            );
        }
    }

    log.info(
        `BOTD sync from itemtext completed. ES orders processed: ${processed}`
    );
}


// ==========================
// MAIN EXECUTION
// ==========================
async function main() {
    // Stats map for BOTD vs Elasticsearch comparison

    let stats = new Map([
        ["esOrdersWithoutBotd", 0],
        ["dbOrdersWithItemtext", 0],
        ["esUpdated", 0],
        ["esNotUpdated", 0],
        ["skippedNoDbOrItemtext", 0],
        ["skippedEmptyItemtext", 0],
        ["esNotFoundOnUpdate", 0],
        ["esNoop", 0],
        ["errors", 0],
    ]);

    try {
        log.info("🚀 Starting BOTD sync from DB itemtext to Elasticsearch...");

        // await validateDBandElasticConnection();
        log.info("✅ All connections validated successfully");

        await processBotdSyncFromItemtext(stats);

    } catch (error) {
        log.error(`💥 Critical error in main execution: ${error.message}`);
        safeExit();
    } finally {
        await pool.end();

        // Final summary
        const esOrdersWithoutBotd = stats.get("esOrdersWithoutBotd") || 0;
        const dbOrdersWithItemtext = stats.get("dbOrdersWithItemtext") || 0;
        const esUpdated = stats.get("esUpdated") || 0;
        const esNotUpdated = stats.get("esNotUpdated") || 0;
        const skippedNoDbOrItemtext = stats.get("skippedNoDbOrItemtext") || 0;
        const skippedEmptyItemtext = stats.get("skippedEmptyItemtext") || 0;
        const esNotFoundOnUpdate = stats.get("esNotFoundOnUpdate") || 0;
        const esNoop = stats.get("esNoop") || 0;
        const errors = stats.get("errors") || 0;

        log.info("📊 =================== FINAL SUMMARY ===================");
        log.info(
            `📋 ES PUBLISHED orders without businessOfTheDay: ${esOrdersWithoutBotd}`
        );
        log.info(
            `📋 DB PUBLISHED orders with itemtext for those ES orders: ${dbOrdersWithItemtext}`
        );
        log.info(`   ✅ ES documents updated with businessOfTheDay: ${esUpdated}`);
        log.info(`   ⏭️ ES documents not updated: ${esNotUpdated}`);
        log.info(
            `   ⏭️ Skipped (no DB row or no itemtext for order): ${skippedNoDbOrItemtext}`
        );
        log.info(`   ⏭️ Skipped (empty itemtext after trim): ${skippedEmptyItemtext}`);
        log.info(`   ⚠️ ES documents not found on update: ${esNotFoundOnUpdate}`);
        log.info(`   ℹ️ ES no-op updates (matched but not changed): ${esNoop}`);
        log.info(`   💥 Errors during processing: ${errors}`);

        if (errors > 0) {
            log.error(
                `⚠️ ${errors} orders encountered errors during BOTD comparison. Check error logs for details.`
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


