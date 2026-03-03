# pdf-service

> **Version:** 1.2.2 | **Runtime:** Node.js (Babel/ES6 transpiled) | **Framework:** Express.js

---

## Table of Contents

1. [Overview](#1-overview)
2. [Architecture](#2-architecture)
3. [Folder Structure Explanation](#3-folder-structure-explanation)
4. [Installation](#4-installation)
5. [Environment Variables](#5-environment-variables)
6. [How PDF Generation Works](#6-how-pdf-generation-works)
7. [How PDF Merge Works](#7-how-pdf-merge-works)
8. [API Documentation](#8-api-documentation)
9. [Error Handling Strategy](#9-error-handling-strategy)
10. [Improvement Suggestions](#10-improvement-suggestions)
11. [Future Extension Ideas](#11-future-extension-ideas)

---

## 1. Overview

`pdf-service` is a standalone Node.js microservice that generates, stores, searches, and merges PDF documents based on externally loaded JSON configurations. It is part of the **eGovernments / PUCAR (DRISTI) platform** and functions as a data-driven PDF engine — it does **not** contain hardcoded document layouts. Instead, it reads two types of JSON configs at startup:

- **Data Configs** – Describe *what data* to extract from the incoming request body (via JSONPath), where to fetch supplemental data from external APIs, and how to localise string values.
- **Format Configs** – Describe *how the PDF looks* (layout, fonts, tables, headers, footers, page breaks) in [pdfmake](http://pdfmake.org/) document-definition format.

At request time, it combines live data (from the HTTP request) with the pre-loaded configs, renders a fully populated pdfmake document definition using the **Mustache** template engine, and produces binary PDFs which are then:

- Uploaded to **eGov Filestore** service, OR
- Returned directly as a binary HTTP response (preview/no-save mode), OR
- Saved temporarily to disk and merged into a single bulk PDF via the **Kafka consumer** flow.

The service additionally supports:

- **QR Code generation** embedded in PDFs
- **External API calls** to enrich data at render time
- **Localisation** (i18n) from the eGov Localisation service, with in-memory TTL caching (`node-cache`, 5-minute TTL)
- **Multi-font support** for regional Indian languages (Hindi, Punjabi, Odia, Malayalam, Kannada)
- **Bulk PDF processing** via Kafka consumer + PostgreSQL job tracking
- **Job cancellation** for in-progress bulk PDF tasks
- **SMS notification** (via Kafka) when a bulk merged PDF is ready

---

## 2. Architecture

### 2.1 High-Level Architecture

```
┌───────────────────────────────────────────────────────────────────────┐
│                         CLIENTS / FRONTEND                            │
└────────────────────┬──────────────────────────────────────────────────┘
                     │ HTTP POST
                     ▼
┌───────────────────────────────────────────────────────────────────────┐
│                         pdf-service (Express)                         │
│                                                                       │
│  ┌────────────────────────────────────────────────────────────────┐   │
│  │  REST Endpoints                                                │   │
│  │  POST /pdf-service/v1/_create         (generate + save)        │   │
│  │  POST /pdf-service/v1/_createnosave   (generate + return bin.) │   │
│  │  POST /pdf-service/v1/_search         (lookup stored jobs)     │   │
│  │  POST /pdf-service/v1/_getBulkPdfRecordsDetails                │   │
│  │  POST /pdf-service/v1/_deleteBulkPdfRecordsDetails             │   │
│  │  POST /pdf-service/v1/_cancelProcess                           │   │
│  │  POST /pdf-service/v1/_getUnrigesteredCodes                    │   │
│  │  POST /pdf-service/v1/_clearUnrigesteredCodes                  │   │
│  └─────────────────────────┬──────────────────────────────────────┘   │
│                            │                                           │
│  ┌─────────────────────────▼──────────────────────────────────────┐   │
│  │               Core Generation Pipeline                         │   │
│  │                                                                │   │
│  │  validateRequest() → prepareBegin() → prepareBulk()            │   │
│  │       → handlelogic() [per object]                             │   │
│  │            ├─ directMapping()   (data from req body)           │   │
│  │            ├─ externalAPIMapping() (data from other services)  │   │
│  │            ├─ generateQRCodes() (QR image generation)          │   │
│  │            └─ handleDerivedMapping() (computed formulae)       │   │
│  │       → fillValues() [Mustache template rendering]             │   │
│  │       → pdfMakePrinter.createPdfKitDocument()                  │   │
│  └─────────────────────────┬──────────────────────────────────────┘   │
│                            │                                           │
│  ┌─────────────────────────▼──────────────────────────────────────┐   │
│  │          Output Handlers                                       │   │
│  │  _create      → fileStoreAPICall() → Kafka Publish → DB record │   │
│  │  _createnosave → HTTP binary response                          │   │
│  │  Kafka Consumer → save to disk → mergePdf() → fileStoreAPICall │   │
│  └────────────────────────────────────────────────────────────────┘   │
│                                                                       │
│  ┌──────────────┐  ┌──────────────┐  ┌───────────────────────────┐   │
│  │  node-cache  │  │  PostgreSQL   │  │   Kafka Consumer/Producer │   │
│  │ (localisation│  │ (job tracking)│  │  (bulk PDF job queue)     │   │
│  │  TTL cache)  │  │               │  │                           │   │
│  └──────────────┘  └──────────────┘  └───────────────────────────┘   │
└───────────────────────────────────────────────────────────────────────┘
         │                    │                        │
         ▼                    ▼                        ▼
 eGov Filestore        eGov Localisation       eGov Notification
 (file upload/URL)     (i18n lookup)           SMS (Kafka topic)
```

### 2.2 Main Modules

| Module | File(s) | Responsibility |
|---|---|---|
| **App Entry Point** | `src/index.js` | Express setup, config loading, all route handlers, core pipeline functions |
| **Env Variables** | `src/EnvironmentVariables.js` | Centralised environment config with defaults |
| **Direct Mapping** | `src/utils/directMapping.js` | Data extraction from request body (JSONPath), type conversions, localisation |
| **External API Mapping** | `src/utils/externalAPIMapping.js` | HTTP calls to other services for supplemental data, response normalisation |
| **FileStore API** | `src/utils/fileStoreAPICall.js` | Upload PDF to eGov Filestore, URL shortening |
| **Commons** | `src/utils/commons.js` | Localisation lookup (cached), date formatting, helper utilities |
| **Queries** | `src/queries.js` | PostgreSQL queries (CRUD for job records), Kafka publish, PDF merge, bulk tracking |
| **Kafka Producer** | `src/kafka/producer.js` | Singleton Kafka producer for publishing job-completion events |
| **Kafka Consumer** | `src/kafka/consumer.js` | Kafka consumer for bulk PDF generation jobs (queue-based, sequential processing) |
| **Logger** | `src/config/logger.js` | Winston-based structured logger (console transport) |
| **API Util** | `src/api/api.js` | Generic `httpRequest` helper (axios wrapper, partially used) |
| **Middleware** | `src/middleware/index.js` | Express router stub (empty – no middleware defined yet) |

### 2.3 Request Flow — `_create` Endpoint

```
POST /pdf-service/v1/_create?key=<config-key>&tenantId=<tenant>
 │
 ├─ Middleware: requestId injection (x-request-id or uuid)
 │
 ├─ validateRequest()
 │     ├─ key present?
 │     ├─ tenantId present?
 │     ├─ RequestInfo.userInfo present?
 │     └─ formatConfigMap[key] & dataConfigMap[key] loaded?
 │
 ├─ createAndSave()
 │     ├─ prepareBegin()                   → reads baseKeyPath, entityIdPath from dataConfig
 │     │     └─ prepareBulk()              → iterates over array of module objects
 │     │           └─ handlelogic() [each object]
 │     │                 ├─ directMapping()       → extract values from req body
 │     │                 ├─ externalAPIMapping()  → call external services
 │     │                 ├─ generateQRCodes()     → produce QR image data URLs
 │     │                 └─ handleDerivedMapping()→ evaluate formula expressions
 │     │                 └─ fillValues()          → Mustache render on formatConfig
 │     │
 │     └─ createPdfBinary()
 │           └─ process.nextTick → uploadFiles()
 │                 ├─ printer.createPdfKitDocument()  [pdfmake → PDFKit stream]
 │                 └─ doc.on('end') → fileStoreAPICall() → insertStoreIds()
 │                       └─ Kafka Publish (PDF_GEN_CREATE topic)
 │                             └─ successCallback → HTTP 201 JSON response
 │
 └─ HTTP 201 { filestoreIds, jobid, totalcount, ... }
```

### 2.4 Kafka Bulk Flow

```
Kafka Topic: PDF_GEN_RECEIVE
      │
      ▼
 consumer.js (ConsumerGroup, groupId: "bulk-pdf")
      │
      ▼
 async.queue (concurrency: 1) → sequential processing
      │
      ▼
 createNoSave(data)
      ├─ prepareBegin() → prepareBulk() → handlelogic() [same pipeline]
      ├─ printer.createPdfKitDocument()
      └─ doc.on('end') → write file to SAVE_PDF_DIR/<jobId>/<key>-<ts>.pdf
            └─ insertRecords(DB) → mergePdf()
                  ├─ Read all PDFs from jobId folder
                  ├─ pdf-merger-js → output.pdf
                  ├─ fileStoreAPICall(output.pdf)
                  ├─ Update DB status = 'DONE'
                  ├─ sendNotification() → Kafka SMS topic
                  └─ Cleanup temp folder
```

---

## 3. Folder Structure Explanation

```
pdf-service/
├── Dockerfile                    # Alpine Node 20 image; runs yarn install + yarn start
├── LOCALSETUP.md                 # Quick local setup guide
├── CHANGELOG.md                  # Release changelog
├── package.json                  # Dependencies and npm scripts
├── pdf-swagger-contract.yml      # OpenAPI 3.0 spec for all exposed endpoints
├── .babelrc                      # Babel config (ES2015 + stage-0 presets)
├── migration/
│   ├── ddl/                      # Flyway-compatible SQL migration scripts
│   │   ├── V20190823165613__pdf_gen_ddl.sql       # Creates egov_pdf_gen table
│   │   ├── V20190909124712__add_column.sql         # Adds entityid column
│   │   ├── V20191104004312__modify_add_column.sql  # Adds isconsolidated, totalcount, key, etc.
│   │   ├── V20200408004912__modify_add_column.sql  # Adds documenttype, modulename columns
│   │   ├── V20211029004912__bulk_pdf.sql           # Creates egov_bulk_pdf_info table
│   │   ├── V20211124004912__bulk_pdf_add_column.sql # Adds tenantid, locality, businessservice, etc.
│   │   └── V20211207004912__bulk_pdf_add_status_column.sql # Adds status column  
│   └── Dockerfile                # Migration runner container
├── postman/                      # Postman collection(s) for API testing
└── src/
    ├── index.js                  # ★ Main entry point – Express app, all routes, pipeline
    ├── EnvironmentVariables.js   # Centralised env config with fallback defaults
    ├── queries.js                # PostgreSQL + Kafka + PDF merge logic
    ├── config/
    │   └── logger.js             # Winston structured logger (stdout only)
    ├── api/
    │   └── api.js                # Generic axios HTTP request wrapper (utility)
    ├── kafka/
    │   ├── consumer.js           # Kafka ConsumerGroup (bulk job listener, queue-based)
    │   └── producer.js           # Kafka Producer singleton (job publish)
    ├── middleware/
    │   └── index.js              # Express Router stub (currently empty)
    ├── models/                   # (empty – no ORM models defined)
    ├── utils/
    │   ├── commons.js            # Localisation, date formatting, caching, utilities
    │   ├── directMapping.js      # Data extraction from request body (main mapper)
    │   ├── externalAPIMapping.js # HTTP calls to external DIGIT services for data enrichment
    │   └── fileStoreAPICall.js   # Upload PDF to eGov Filestore; URL shortening
    ├── fonts/                    # TrueType font files for pdfmake
    │   ├── Cambay-Regular.ttf, Cambay-Bold.ttf, ...
    │   ├── Roboto-Regular.ttf, Roboto-Bold.ttf, ...
    │   ├── BalooBhaina2-Regular.ttf, ...  (Odia / Odiya script)
    │   ├── BalooPaaji2-Regular.ttf, ...   (Punjabi / Gurmukhi script)
    │   └── malayalam-sangam-mn.ttf, Manjari-*.ttf (Malayalam script)
    ├── lib/                      # (directory exists, appears unused/empty)
    └── public/                   # Static files served by Express (currently empty)
```

---

## 4. Installation

### Prerequisites

| Dependency | Version |
|---|---|
| Node.js | 20.x (LTS) |
| npm / yarn | ≥ 6 |
| PostgreSQL | ≥ 11 |
| Apache Kafka | ≥ 2.x |
| eGov Filestore Service | Running & accessible |
| eGov Localisation Service | Running & accessible |

### Steps

```bash
# 1. Clone the repository
git clone https://github.com/pucardotorg/dristi-solutions.git
cd dristi-solutions/backend/ui-integration-services/pdf-service

# 2. Install dependencies
npm install
# or
yarn install

# 3. Configure data and format config URLs
# Edit src/EnvironmentVariables.js OR set the environment variables:
#   DATA_CONFIG_URLS=file:///absolute/path/to/your-data-config.json
#   FORMAT_CONFIG_URLS=file:///absolute/path/to/your-format-config.json
# Multiple configs can be comma-separated.

# 4. Run database migrations
# Use Flyway or apply the SQL files in migration/ddl/ in order against your PostgreSQL DB.

# 5. Start the service in development mode (with hot-reload via nodemon)
npm run dev

# 6. Start in production mode (transpiles to dist/ first, then runs node)
npm start
```

### Docker

```bash
docker build --build-arg WORK_DIR=. -t pdf-service .
docker run -p 8080:8080 \
  -e EGOV_FILESTORE_SERVICE_HOST=http://filestore:8080 \
  -e KAFKA_BROKER_HOST=kafka:9092 \
  -e DB_HOST=postgres \
  -e DB_PASSWORD=yourpassword \
  -e DATA_CONFIG_URLS=https://... \
  -e FORMAT_CONFIG_URLS=https://... \
  pdf-service
```

---

## 5. Environment Variables

All variables are defined in `src/EnvironmentVariables.js` with fallback defaults.

| Variable | Default | Description |
|---|---|---|
| `SERVER_PORT` | `8080` | HTTP server port |
| `MAX_NUMBER_PAGES` | `80` | Maximum number of document objects bundled into a single PDF file (controls file splitting for bulk generation) |
| `DATA_CONFIG_URLS` | GitHub raw URL | Comma-separated list of data config URLs or local `file://` paths |
| `FORMAT_CONFIG_URLS` | GitHub raw URL | Comma-separated list of format config URLs or local `file://` paths |
| `EGOV_FILESTORE_SERVICE_HOST` | `http://egov-filestore:8080` | Base URL of the eGov Filestore service |
| `EGOV_LOCALISATION_HOST` | `http://localhost:9001/` | Base URL of the eGov Localisation service |
| `EGOV_LOCALISATION_SEARCH` | `localization/messages/v2/_search` | Path for localisation search endpoint |
| `EGOV_EXTERNAL_HOST` | `https://dev.digit.org/` | Base URL of the eGov external services (used in `external_host` type mapping) |
| `KAFKA_BROKER_HOST` | `localhost:9092` | Kafka broker address |
| `KAFKA_CREATE_JOB_TOPIC` | `PDF_GEN_CREATE` | Kafka topic to publish after PDF creation (triggers DB persistence via consumer elsewhere) |
| `KAFKA_RECEIVE_CREATE_JOB_TOPIC` | `PDF_GEN_RECEIVE` | Kafka topic this service **listens** on for bulk PDF generation jobs |
| `KAFKA_PDF_ERROR_TOPIC` | `PDF_GEN_ERROR` | Kafka topic to publish on bulk PDF errors |
| `KAFKA_TOPICS_NOTIFICATION` | `egov.core.notification.sms` | Kafka topic for sending SMS notifications about bulk PDF completion |
| `DB_USER` | `postgres` | PostgreSQL username |
| `DB_PASSWORD` | `postgres` | PostgreSQL password |
| `DB_HOST` | `localhost` | PostgreSQL host |
| `DB_NAME` | `PdfGen` | PostgreSQL database name |
| `DB_PORT` | `5432` | PostgreSQL port |
| `DATE_TIMEZONE` | `Asia/Kolkata` | Timezone used for all date/time formatting via `moment-timezone` |
| `DEFAULT_LOCALISATION_LOCALE` | `en_IN` | Fallback locale when RequestInfo does not specify one |
| `DEFAULT_LOCALISATION_TENANT` | `pb` | Fallback tenant ID for localisation queries |
| `STATE_LEVEL_TENANT_ID` | `in.stateb` | Hardcoded state-level tenant ID injected into external API calls (**Note:** currently hardcoded value, not a `process.env` read — see [Improvement Suggestions](#10-improvement-suggestions)) |
| `SAVE_PDF_DIR` | `/mnt/pdf/` | Filesystem directory for temporary bulk PDF storage during merge |
| `IS_ENVIRONMENT_CENTRAL_INSTANCE` | `false` | When `true`, enables multi-tenant PostgreSQL schema routing and topic prefixing |
| `STATE_SCHEMA_INDEX_POSITION_TENANTID` | `1` | Index position in dot-separated tenantId used to derive PostgreSQL schema name |
| `DEFAULT_VARIABLE_VALUE` | `NA` | Default string to use when a mapped field has no value in the request data |

---

## 6. How PDF Generation Works

### 6.1 Config Loading at Startup

On startup, `src/index.js` reads the comma-separated `DATA_CONFIG_URLS` and `FORMAT_CONFIG_URLS`. Each URL can be:
- `file:///path/to/config.json` — read synchronously from the local filesystem
- `https://...` — fetched via `axios.get()`

Data configs are indexed by `data.key` into `dataConfigMap`. Format configs are indexed by `data.key` into `formatConfigMap`.

Both maps are **module-level globals** shared across all requests for the lifetime of the process.

### 6.2 Data Config JSON Schema

```json
{
  "key": "case",
  "documentType": "CASE",
  "DataConfigs": {
    "moduleName": "rainmaker-dristi",
    "baseKeyPath": "$.Cases.*",
    "entityIdPath": "$.id",
    "isCommonTableBorderRequired": true,
    "mappings": [
      {
        "mappings": [
          {
            "direct": [
              {
                "variable": "caseName",
                "type": "string",
                "value": { "path": "$.courtCaseNumber" }
              },
              {
                "variable": "filingDate",
                "type": "date",
                "format": "DD/MM/YYYY",
                "value": { "path": "$.filingDate" }
              },
              {
                "variable": "userType",
                "type": "citizen-employee-title"
              },
              {
                "variable": "externalUrl",
                "type": "external_host"
              },
              {
                "variable": "logoImage",
                "type": "image",
                "url": "https://example.com/logo.png"
              },
              {
                "variable": "witnesses",
                "type": "array",
                "value": { "path": "$.witnesses" },
                "format": {
                  "scema": [
                    { "variable": "name", "value": "name", "type": "string" },
                    { "variable": "dob",  "value": "dob",  "type": "date", "format": "DD/MM/YYYY" }
                  ]
                }
              }
            ],
            "externalAPI": [
              {
                "path": "https://host/case/v2/_search",
                "queryParam": "ids={$.id}",
                "requesttype": "POST",
                "responseMapping": [
                  { "variable": "applicantName", "value": "$.Cases[0].applicant.name", "type": "string" }
                ]
              }
            ],
            "qrcodeConfig": [
              {
                "variable": "qrCodeImage",
                "value": "https://digitalcourt.gov.in/case/{{caseId}}",
                "url": true
              }
            ],
            "derived": [
              {
                "variable": "fineTotal",
                "formula": "{{fineAmount}} + {{processingFee}}",
                "type": "number"
              }
            ]
          }
        ]
      }
    ]
  }
}
```

#### Direct Mapping Types

| `type` | Behaviour |
|---|---|
| `string` (default) | Extract value from request body at `value.path` using JSONPath |
| `date` | Parse as date, format with `moment-timezone` using `format` field |
| `array` | Extract an array at `value.path`, iterate with a `scema` (schema) definition |
| `array-column` | Similar to `array` but formats data as column arrays for pdfmake tables |
| `image` | Fetch image from `url`, convert to base64 data URI |
| `label` | Localise a hardcoded key (no request body lookup) |
| `function` | Execute an arbitrary JS expression (`Function()` constructor — **security risk**) |
| `citizen-employee-title` | Sets "Citizen Copy" or "Employee Copy" based on RequestInfo user type |
| `external_host` | Injects the `EGOV_EXTERNAL_HOST` value |
| `selectFromRequestInfo` | Extracts value from `RequestInfo` rather than the module object |

### 6.3 Format Config JSON Schema

The format config is a standard **pdfmake document definition**, keyed under `"config"`:

```json
{
  "key": "case",
  "config": {
    "defaultStyle": { "font": "Roboto", "fontSize": 10 },
    "pageMargins": [20, 40, 20, 60],
    "header": { "text": "COURT", "alignment": "center" },
    "footer": "function(currentPage, pageCount) { return { text: currentPage + '/' + pageCount, alignment: 'center' }; }",
    "content": [
      {
        "text": "Case Number: {{caseName}}",
        "style": "heading"
      },
      {
        "table": {
          "body": [
            ["Applicant Name", "{{applicantName}}"]
          ]
        },
        "layout": {}
      },
      {
        "image": "{{qrCodeImage}}",
        "width": 80
      }
    ],
    "styles": {
      "heading": { "fontSize": 14, "bold": true }
    }
  }
}
```

> **Important:** The `footer` field is serialised as a **string** in JSON and is reconstructed as a real JS `Function` at runtime using `convertFooterStringtoFunctionIfExist()`. This is a known limitation of JSON serialisation of function types.

### 6.4 Template Rendering

The `fillValues()` function applies the **Mustache** template engine:

- Double-brace syntax `{{variableName}}` is used for simple string values.
- **Triple-brace syntax** `{{{variableName}}}` is a special extension: it injects a pre-rendered pdfmake **rich text object** (a parsed JSON node, not just a string). This allows embedding complex pdfmake structures (stacks, columns, etc.) dynamically.

Mustache is configured with `mustache.escape = identity` (no HTML escaping) to preserve raw text content.

Post-render, a series of regex replacements normalise the JSON output from Mustache rendering artefacts (e.g. removing empty string artefacts from array brackets).

### 6.5 Font Support

Fonts are stored in `src/fonts/` and registered as `fontDescriptors`:

| Font Family | Files | Script |
|---|---|---|
| `Cambay` | Regular, Bold, Italic, BoldItalic | Latin / English |
| `Roboto` | Regular, Bold, Italic, BoldItalic | Latin / English (default) |
| `BalooBhaina` | Regular, Bold, BoldItalic | Odia (`od_IN`, `or_IN`) |
| `BalooPaaji` | Regular, Bold | Punjabi (`pn_IN`) |
| `MalayalamSangamMn` | Regular, Bold | Malayalam (`ml_IN`), also `en_IN` |
| `ManjiriMalyalam` | Regular, Bold | Alternative Malayalam |

The locale is extracted from `RequestInfo.msgId` (format: `<anything>|<locale>`). The `defaultFontMapping` object maps locales to font families. When a locale maps to `'default'`, no `defaultStyle.font` override is applied.

---

## 7. How PDF Merge Works

### Library

`pdf-merger-js` (version `3.2.1`) is used to concatenate multiple PDF files into one.

### Flow

Merging is used exclusively in the **bulk PDF** flow (Kafka consumer path):

1. Each Kafka message triggers `createNoSave()`, which generates one PDF file and saves it to `SAVE_PDF_DIR/<jobId>/<key>-<timestamp>.pdf`.
2. `insertRecords()` updates the `egov_bulk_pdf_info` table in PostgreSQL, tracking `recordscompleted` vs `totalrecords`.
3. `mergePdf()` is called after each file is written. It checks if `recordscompleted >= totalrecords` **and** the number of files on disk matches `numberOfFiles`.
4. If both conditions are true, it uses `PDFMerger` to merge all files in the job folder into `output.pdf`.
5. `output.pdf` is uploaded to Filestore, the DB record is updated with `status = 'DONE'` and the `filestoreid`.
6. An SMS notification is sent via Kafka (`sendNotification()`).
7. The temporary job folder is deleted recursively.

**Cancellation**: If `status = 'CANCEL'` is found in the DB when `mergePdf()` runs, the merge is skipped and temporary files are cleaned up.

### Database Tables

**`egov_pdf_gen`** — Stores records for individual PDF creation jobs:

| Column | Type | Description |
|---|---|---|
| `jobid` | VARCHAR(100) PK | Unique job identifier (`<key><timestamp>`) |
| `tenantid` | VARCHAR(50) | Tenant ID |
| `entityid` | VARCHAR | Business entity ID (e.g., case ID) |
| `createdtime` | BIGINT | Unix timestamp (ms) of job start |
| `endtime` | BIGINT | Unix timestamp (ms) of job completion |
| `filestoreids` | JSON | Array of Filestore IDs |
| `isconsolidated` | BOOLEAN | Whether this is a multi-entity consolidated PDF |
| `totalcount` | INT | Total number of objects in this job |
| `key` | VARCHAR | Config key used |
| `documenttype` | VARCHAR | Document type from data config |
| `modulename` | VARCHAR | Module name from data config |

**`egov_bulk_pdf_info`** — Tracks bulk PDF merge jobs:

| Column | Type | Description |
|---|---|---|
| `jobid` | VARCHAR(100) PK | Bulk job ID |
| `uuid` | VARCHAR(256) | User UUID who initiated the job |
| `recordscompleted` | BIGINT | Number of PDFs processed so far |
| `totalrecords` | BIGINT | Total expected PDFs |
| `filestoreid` | VARCHAR(50) | Filestore ID of the final merged PDF |
| `status` | VARCHAR | `INPROGRESS`, `DONE`, or `CANCEL` |
| `tenantid`, `locality`, `businessservice`, `consumercode` | VARCHAR | Domain-specific metadata |

---

## 8. API Documentation

### 8.1 POST `/pdf-service/v1/_create`

Generates PDFs for all objects in the request body, uploads them to Filestore, persists job records, and returns Filestore IDs.

**Query Parameters:**

| Parameter | Required | Description |
|---|---|---|
| `key` | ✅ | Config key identifying which data/format config to use |
| `tenantId` | ✅ | DIGIT tenant identifier |
| `isconsolidated` | ❌ | `true` = merge all objects into one PDF; `false` (default) = one PDF per object |

**Request Body:**

```json
{
  "RequestInfo": {
    "apiId": "Rainmaker",
    "ver": "1.0",
    "ts": null,
    "action": "_create",
    "did": "1",
    "key": "",
    "msgId": "20170310130900|en_IN",
    "authToken": "<auth-token>",
    "userInfo": {
      "id": 1,
      "uuid": "user-uuid",
      "type": "CITIZEN",
      "tenantId": "in.stateb.kl",
      "roles": []
    }
  },
  "Cases": [
    {
      "id": "case-001",
      "courtCaseNumber": "KER/2024/001",
      "filingDate": 1700000000000
    }
  ]
}
```

**Response (201):**

```json
{
  "ResponseInfo": { ... },
  "message": "Success",
  "filestoreIds": ["filestore-uuid-1"],
  "jobid": "case1700000000000",
  "createdtime": 1700000000000,
  "endtime": 1700000001000,
  "tenantid": "in.stateb.kl",
  "totalcount": 1,
  "key": "case",
  "documentType": "CASE",
  "moduleName": "rainmaker-dristi"
}
```

**cURL Example:**

```bash
curl -X POST "http://localhost:8080/pdf-service/v1/_create?key=case&tenantId=in.stateb.kl" \
  -H "Content-Type: application/json" \
  -d '{
    "RequestInfo": {
      "apiId": "Rainmaker", "ver": "1.0", "ts": null,
      "msgId": "20170310130900|en_IN", "authToken": "TOKEN",
      "userInfo": { "id": 1, "uuid": "abc", "type": "CITIZEN", "tenantId": "in.stateb.kl", "roles": [] }
    },
    "Cases": [{ "id": "case-001", "courtCaseNumber": "KER/2024/001", "filingDate": 1700000000000 }]
  }'
```

---

### 8.2 POST `/pdf-service/v1/_createnosave`

Generates a PDF and returns it directly as a binary HTTP response. No Filestore upload, no DB record. Primarily used for **preview** functionality.

**Query Parameters:** Same as `_create` (`key`, `tenantId`).

**Response (201):** Binary PDF with `Content-disposition: attachment;filename=<key>-<ts>.pdf`

**cURL Example:**

```bash
curl -X POST "http://localhost:8080/pdf-service/v1/_createnosave?key=case&tenantId=in.stateb.kl" \
  -H "Content-Type: application/json" \
  -d '{ ... same request body ... }' \
  --output case-preview.pdf
```

---

### 8.3 POST `/pdf-service/v1/_search`

Searches previously generated PDF records from PostgreSQL.

**Query Parameters:**

| Parameter | Required | Description |
|---|---|---|
| `tenantid` | ✅ (central instance) | Tenant identifier |
| `jobid` | ✅ or `entityid` | Comma-separated job ID(s) |
| `entityid` | ✅ or `jobid` | Business entity ID |
| `isconsolidated` | ❌ | Filter by consolidated flag |

**Response (200):**

```json
{
  "ResponseInfo": { ... },
  "searchresult": [
    {
      "filestoreids": ["filestore-uuid"],
      "jobid": "case1700000000000",
      "tenantid": "in.stateb.kl",
      "createdtime": 1700000000000,
      "endtime": 1700000001000,
      "totalcount": 1,
      "key": "case",
      "documentType": "CASE",
      "moduleName": "rainmaker-dristi"
    }
  ]
}
```

---

### 8.4 POST `/pdf-service/v1/_getBulkPdfRecordsDetails`

Returns bulk PDF job status records for the authenticated user.

**Query Parameters:** `uuid` (from RequestInfo), `offset`, `limit`, `jobId`

---

### 8.5 POST `/pdf-service/v1/_cancelProcess`

Cancels an in-progress bulk PDF job.

**Query Parameters:** `jobId`

---

### 8.6 POST `/pdf-service/v1/_deleteBulkPdfRecordsDetails`

Deletes all temporary PDF files from the `SAVE_PDF_DIR`.

---

### 8.7 POST `/pdf-service/v1/_getUnrigesteredCodes`

Returns localisation codes that were encountered during PDF generation but had no registered translation in the localisation service.

---

### 8.8 POST `/pdf-service/v1/_clearUnrigesteredCodes`

Attempts to re-fetch localisation for all unregistered codes and removes any that are now found.

---

## 9. Error Handling Strategy

### HTTP Layer

- All route handlers are wrapped with `express-async-handler`, preventing unhandled promise rejections from crashing the process.
- Validation errors return **HTTP 400** with a descriptive message and `ResponseInfo`.
- Unexpected exceptions return **HTTP 400** with `some unknown error while creating: <message>`.
- No `HTTP 500` is returned from route handlers (both validation failures and internal errors use 400).

### Logging

The service uses **Winston** with a structured log format:

```
YYYY-MM-DD HH:mm:ss+0530 [LEVEL] [pdf-service] <message> | {"key":"value",...}
```

Log levels used:
- `INFO` – Request lifecycle, file upload progress, Kafka events, config loading
- `ERROR` – All errors with `.stack` where available, structured metadata

Logs are written to **stdout only** (no file transport). In containerised environments this is readable via `docker logs` or a log aggregation sidecar.

### Async File Upload

PDF upload to Filestore is done inside `process.nextTick()` — meaning control returns to the HTTP response **before** the upload completes. The actual Filestore and Kafka operations happen asynchronously. If the upload fails, the error is logged but the HTTP response has already been sent with `201`. This means **upload failures are silent to the caller**.

### Kafka Errors

- Producer errors are logged and trigger the `errorCallback`.
- Consumer errors (including `offsetOutOfRange`) are logged but do not crash the process.
- The async queue in the consumer (concurrency: 1) pauses the consumer while a job is processing and resumes on drain.

---

## 10. Improvement Suggestions

### 🔴 Critical / Security

1. **`Function()` constructor in derived mappings and footer:**
   `Function('use strict'; return (${expression})`)()` and `Function(type, directArr[i].format)(...)` execute arbitrary JavaScript from the config. If config files are user-editable or fetched from untrusted sources, this is a **Remote Code Execution (RCE)** vector. Consider using a safe expression evaluator library like `expr-eval` or `mathjs` for formula evaluation, and a serialised representation for footer functions.

2. **`STATE_LEVEL_TENANT_ID` is hardcoded:**
   `STATE_LEVEL_TENANT_ID: "in.stateb"` is not read from `process.env` despite the default structure suggesting it should be. This will break deployments for other states.

3. **HTTP 400 for all errors:**
   Internal server errors (e.g., DB failures, unexpected exceptions) return HTTP 400 instead of 500. This makes it hard for callers to distinguish between bad requests and server-side faults.

### 🟠 High Priority

4. **Silent upload failures:** The `process.nextTick` approach in `_create` means the HTTP 201 response is sent before uploads complete. If `fileStoreAPICall` or Kafka publish fails, the caller receives a successful response but no PDF is actually stored. Consider a synchronous upload approach (with reasonable timeout) or a webhook/callback pattern.

5. **`escapeRegex` duplication:** The same function `escapeRegex` is defined separately in both `directMapping.js` and `externalAPIMapping.js`. Extract it to `commons.js`.

6. **`formatconfig` used before declaration in `uploadFiles`:**
   In `uploadFiles()` (line ~259), `formatconfig` is referenced but was not passed as a parameter to this function — it references the outer scope variable from the module-level closure. This creates a hidden dependency and can lead to stale config if configs are ever reloaded dynamically.

7. **`objectItem` self-reference bug in `externalAPIMapping.js`:**
   Line 414: `const objectItem = objectItem;` is a self-reference declaration that results in `undefined`. The localisation post-processing loop for nested objects in external API mapping is broken.

8. **No retry logic on Filestore or external API calls:**
   Network failures against Filestore or eGov Localisation result in immediate errors. Add exponential backoff retry with `axios-retry` or similar.

### 🟡 Medium Priority

9. **No input validation on request body schema:** The service does not validate the structure of the incoming request body beyond checking that `RequestInfo`, `key`, and `tenantId` are present. A schema validator (e.g., AJV) should be used.

10. **`dataConfigMap` and `formatConfigMap` are in-memory globals:** Config is loaded asynchronously at startup with no completion signal. Requests arriving before configs are loaded will receive a "no config found for key" error. Add a readiness check endpoint or a startup gate.

11. **`pg` pool used with callback API and async mixed:** `queries.js` mixes callback-style `pool.query()` (in `getFileStoreIds`) with `await pool.query()` (in `insertRecords`). Standardise on the async/await pattern throughout.

12. **Bulk merge relies on filesystem file count:** `mergePdf()` checks `fileNames.length == numberOfFiles` to trigger merging. This is fragile — a stale file from a previous run in the same folder, or a race condition between writers, could cause premature or missed merges.

13. **`request` package is imported but not used:** `import request from "request"` in `index.js` is unused. The `request` package is deprecated. Remove it.

14. **Commented-out dead code:** Multiple large blocks of commented code exist (`prepareSingle`, old Kafka consumer logic, etc.). Remove them or move to Git history.

---

## 11. Future Extension Ideas

### Template Versioning
Introduce a version field in data and format configs. Store previously loaded configs in a versioned registry to allow rolling rollbacks and A/B testing of PDF layouts without service restarts.

### Config Hot-Reload
Expose a management endpoint (e.g., `POST /pdf-service/admin/reload`) that re-fetches data and format configs from their source URLs without requiring a service restart.

### Redis-backed Localisation Cache
Replace the in-process `node-cache` with a Redis cache shared across multiple instances. This avoids cache cold-starts on pod restarts in a multi-replica Kubernetes deployment.

### Streaming Large PDFs
For very large PDFs (hundreds of pages), implement HTTP streaming by piping the PDFKit document stream directly to the response instead of buffering all chunks in memory. This reduces peak memory usage significantly.

### S3 / Object Storage Integration
Add a pluggable storage adapter interface. Currently, the service is tightly coupled to the eGov Filestore service. Adding an S3 adapter would allow the service to be used independently of the eGov ecosystem.

### PDF Template Caching
Cache the parsed format config object (after initial rendering of static elements) to reduce redundant JSON deep-copy operations per request.

### Health & Readiness Endpoints
Add `GET /health/live` and `GET /health/ready` endpoints:
- **Liveness:** Returns 200 if the process is running.
- **Readiness:** Returns 200 only after all configs are loaded, the DB pool is connected, and Kafka is ready. Required for Kubernetes probes.

### Observability
Integrate OpenTelemetry or Prometheus metrics to track:
- PDF generation latency (p50, p95, p99)
- Filestore upload success/failure rates
- Kafka consumer lag
- Config cache hit rates

### Queue-based Rate Limiting for `_create`
HTTP `_create` requests with large arrays of objects can be memory-intensive. Add a queue (e.g., Bull/BullMQ) with configurable concurrency to prevent OOM conditions under burst traffic.

---

*This README was generated by deep static analysis of the pdf-service source code on 2026-03-02. For questions or corrections, refer to the source files or raise an issue in the repository.*