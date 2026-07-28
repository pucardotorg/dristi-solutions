-- =====================================================================
-- Consolidated DDL for case (fresh-install reference)
-- Generated from Flyway migrations in db/migration/main
-- This script represents the FINAL schema state after applying all
-- versioned migrations below, in order. It is a reference/documentation
-- script for provisioning a new environment quickly — it does NOT
-- replace the existing Flyway migration history. Deployed environments
-- must continue to use the original versioned migration files.
--
-- Source files reviewed (32):
--   V20240424110535__case__ddl.sql
--   V20240506110535__witness__ddl.sql
--   V20240612122500__case__ddl.sql
--   V20240619124622__case__ddl.sql
--   V20240701124622__case__ddl.sql
--   V20240722124622__case__ddl.sql
--   V20240730110535__case__ddl.sql
--   V20240912193000__case__ddl.sql
--   V20240921110535__case__ddl.sql
--   V20240924110535__case__ddl.sql
--   V20240925110535__case__ddl.sql
--   V20241122110535__case__ddl.sql
--   V20250101110535__case__ddl.sql
--   V20250106152900__case__ddl.sql
--   V20250122142700__case_litigant__ddl.sql
--   V20250206143300__case__ddl.sql
--   V20250206183300__case__ddl.sql
--   V20250218183300__case__ddl.sql
--   V20250318183300__case__ddl.sql
--   V20250325183300__case__ddl.sql
--   V20250408134300__poaholder__ddl.sql
--   V20250508183300__case__ddl.sql
--   V20250818130500__caseLPR__ddl.sql
--   V20250819103000__witnessdetails__ddl.sql
--   V20251125141700__natureofdisposal__dd.sql
--   V20251216111500__case_conversion__ddl.sql
--   V20260127143000__advocate_office_case_member__ddl.sql
--   V20260129143000__advocate_office_case_member__ddl.sql
--   V20260131003700__add_advocate_filing_status__ddl.sql
--   V20260408003700__secondary_stage__ddl.sql
--   V20260427150000__lifecycle_status__ddl.sql
--   V20260605120000__case_participation__ddl.sql
--
-- Notes on reconciliation:
--   * dristi_cases.id and dristi_cases.caseTitle were widened from
--     VARCHAR(64) to VARCHAR(1000) by later migrations; final widths used.
--   * dristi_cases.filingDate / registrationDate / judgementDate were
--     originally VARCHAR(64), dropped, then re-added as int8 (epoch millis);
--     final int8 type used.
--   * dristi_cases.substage, isLPRCase, stagebackup, substagebackup were
--     added earlier and later DROPPED (V20260427150000) — omitted below.
--     The index idx_dristi_cases_substage (created on the now-dropped
--     substage column) is likewise omitted (Postgres auto-drops a
--     single-column index when its column is dropped).
--   * dristi_case_representing.caseId was renamed to case_id
--     (V20240612122500) — final column name case_id used.
--   * idx_dristi_cases_tenant_id was originally created with
--     CREATE INDEX CONCURRENTLY; CONCURRENTLY is omitted here since it
--     cannot run inside a single multi-statement script/transaction.
--   * dristi_case_conversion has no primary key / id column in the
--     source migration — preserved as-is.
--   * No CREATE SEQUENCE and no FOREIGN KEY constraints exist anywhere
--     in this service's migration history.
-- =====================================================================

-- ==== Sequences ====
-- (none — all primary keys are application-supplied VARCHAR ids)

-- ==== Tables ====

CREATE TABLE dristi_cases (
    id                          VARCHAR(1000) NOT NULL PRIMARY KEY,
    tenantId                    varchar(1000) NOT NULL,
    resolutionMechanism         varchar(64) NULL,
    caseTitle                   VARCHAR(1000),
    caseDescription             varchar(64) NULL,
    filingNumber                varchar(64) NULL,
    caseNumber                  varchar(64) NULL,
    cnrNumber                   varchar(64) NULL,
    courtCaseNumber             varchar(64) NULL,
    accessCode                  varchar(64) NULL,
    courtId                     varchar(64) NULL,
    benchId                     varchar(64) NULL,
    filingDate                  int8 NULL,
    registrationDate            int8 NULL,
    caseCategory                varchar(64) NULL,
    natureOfPleading            varchar(64) NULL,
    status                      varchar(64) NULL,
    remarks                     varchar(64) NULL,
    isActive                    bool NULL,
    caseDetails                 JSONB NULL,
    additionalDetails           jsonb NULL,
    createdBy                   varchar(64) NULL,
    lastModifiedBy               varchar(64) NULL,
    createdTime                 int8 NULL,
    lastModifiedTime            int8 NULL,
    judgeId                     varchar(64) NULL,
    stage                       varchar(64) NULL,
    judgementDate                int8 NULL,
    outcome                     varchar(64),
    caseType                    varchar(64) NULL,
    cmpNumber                   varchar(64) NULL,
    advocateCount                int8 NULL,
    pendingAdvocateRequests      jsonb NULL,
    lprNumber                   varchar(64) NULL,
    courtCaseNumberBackup        varchar(64) NULL,
    witnessDetails               jsonb NOT NULL DEFAULT '[]'::jsonb,
    natureOfDisposal             varchar(64),
    secondaryStage               JSONB NULL,
    lifecycleStatus              varchar(32) DEFAULT 'ACTIVE'
);

CREATE TABLE dristi_case_document (
    id                  varchar(64) NOT NULL PRIMARY KEY,
    fileStore           varchar(64) NULL,
    documentUid         varchar(64) NULL,
    documentType        varchar(64) NULL,
    case_id             varchar(64) NULL,
    linked_case_id      varchar(64) NULL,
    litigant_id         varchar(64) NULL,
    representative_id   varchar(64) NULL,
    representing_id     varchar(64) NULL,
    additionalDetails   JSONB NULL,
    isActive            bool DEFAULT TRUE,
    poaholder_id        VARCHAR(128)
);

CREATE TABLE dristi_linked_case (
    id                  varchar(64) NOT NULL PRIMARY KEY,
    relationshipType    varchar(64) NULL,
    caseNumbers         varchar(64) NULL,
    isActive            bool NULL,
    case_id             varchar(64) NULL,
    additionalDetails   JSONB NULL,
    createdBy           varchar(64) NULL,
    lastModifiedBy      varchar(64) NULL,
    createdTime         int8 NULL,
    lastModifiedTime    int8 NULL
);

CREATE TABLE dristi_case_statutes_and_sections (
    id                  varchar(64) NOT NULL PRIMARY KEY,
    tenantId            varchar(64) NULL,
    statutes            varchar(64) NULL,
    sections            varchar(64) NULL,
    subsections         varchar(64) NULL,
    case_id             varchar(64) NULL,
    additionalDetails   JSONB NULL,
    createdBy           varchar(64) NULL,
    lastModifiedBy      varchar(64) NULL,
    createdTime         int8 NULL,
    lastModifiedTime    int8 NULL
);

CREATE TABLE dristi_case_litigants (
    id                    varchar(64) NOT NULL PRIMARY KEY,
    tenantId              varchar(64) NULL,
    partyCategory         varchar(64) NULL,
    individualId          varchar(64) NULL,
    organisationID        varchar(64) NULL,
    partyType             varchar(64) NULL,
    isActive              bool NULL,
    case_id               varchar(64) NULL,
    additionalDetails     JSONB NULL,
    createdBy             varchar(64) NULL,
    lastModifiedBy        varchar(64) NULL,
    createdTime           int8 NULL,
    lastModifiedTime      int8 NULL,
    hasSigned             BOOLEAN NULL,
    isResponseRequired    bool DEFAULT FALSE
);

CREATE TABLE dristi_case_representatives (
    id                       varchar(64) NOT NULL PRIMARY KEY,
    tenantId                 varchar(64) NULL,
    advocateId               varchar(64) NULL,
    isActive                 bool NULL,
    case_id                  varchar(64) NULL,
    additionalDetails        JSONB NULL,
    createdBy                varchar(64) NULL,
    lastModifiedBy           varchar(64) NULL,
    createdTime              int8 NULL,
    lastModifiedTime         int8 NULL,
    hasSigned                BOOLEAN NULL,
    advocate_filing_status   varchar(64) NULL
);

CREATE TABLE dristi_case_representing (
    id                  varchar(64) NOT NULL PRIMARY KEY,
    tenantId            varchar(64) NULL,
    partyCategory       varchar(64) NULL,
    individualId        varchar(64) NULL,
    organisationId      varchar(64) NULL,
    case_id             varchar(64) NULL, -- renamed from caseId (V20240612122500)
    partyType           varchar(64) NULL,
    isActive            bool NULL,
    representative_id   varchar(64) NULL,
    additionalDetails   JSONB NULL,
    createdBy           varchar(64) NULL,
    lastModifiedBy      varchar(64) NULL,
    createdTime         int8 NULL,
    lastModifiedTime    int8 NULL
);

CREATE TABLE dristi_case_poaholders (
    id                       VARCHAR(128) PRIMARY KEY,
    tenant_id                VARCHAR(128) NOT NULL,
    case_id                  VARCHAR(128) NOT NULL,
    individual_id            VARCHAR(128),
    poa_type                 VARCHAR(128) NOT NULL,
    name                     VARCHAR(256),
    is_active                BOOLEAN,
    additional_details       JSONB,
    hasSigned                BOOLEAN NULL,
    representing_litigants   JSONB,
    created_by               VARCHAR(128),
    last_modified_by         VARCHAR(128),
    created_time             BIGINT,
    last_modified_time       BIGINT
);

-- REVIEW: source migration (V20251216111500__case_conversion__ddl.sql) defines
-- this table with no primary key and no id column at all — preserved verbatim.
CREATE TABLE dristi_case_conversion (
    tenantId            varchar(64),
    caseId              varchar(64),
    filingNumber        varchar(64),
    cnrNumber           varchar(64),
    dateOfConversion    BIGINT,
    convertedFrom       varchar(64),
    convertedTo         varchar(64),
    preCaseNumber       varchar(64),
    postCaseNumber      varchar(64)
);

CREATE TABLE dristi_advocate_office_case_member (
    id                          VARCHAR(64) NOT NULL PRIMARY KEY,
    tenant_id                   VARCHAR(64) NOT NULL,
    office_advocate_id          VARCHAR(64) NOT NULL,
    office_advocate_name        VARCHAR(256) NOT NULL,
    case_id                     VARCHAR(64) NOT NULL,
    member_id                   VARCHAR(64) NOT NULL,
    member_type                 VARCHAR(64) NOT NULL,
    member_name                 VARCHAR(256) NOT NULL,
    is_active                   BOOLEAN DEFAULT TRUE,
    created_by                  VARCHAR(64),
    last_modified_by            VARCHAR(64),
    created_time                int8,
    last_modified_time          int8,
    office_advocate_user_uuid   VARCHAR(64) NULL,
    member_user_uuid            VARCHAR(64) NULL
);

CREATE TABLE IF NOT EXISTS dristi_case_participation (
    id                  VARCHAR(64)  NOT NULL PRIMARY KEY,
    case_id             VARCHAR(64)  NOT NULL,
    filing_number       VARCHAR(64),
    tenant_id           VARCHAR(64)  NOT NULL,

    -- The person -- always populated
    individual_id       VARCHAR(64)  NOT NULL,
    user_uuid           VARCHAR(64),          -- from INDIVIDUAL.userUuid

    -- Populated only when persona = ADVOCATE_REP
    advocate_id         VARCHAR(64),          -- dristi_advocate.id (UUID)

    -- LITIGANT | ADVOCATE_REP | POA_HOLDER
    persona             VARCHAR(32)  NOT NULL,

    -- Mirrors dristi_case_litigants.partyType (complainant/respondent/petitioner...)
    party_type          VARCHAR(64),

    is_active           BOOLEAN      NOT NULL DEFAULT TRUE,

    created_by          VARCHAR(64),
    last_modified_by    VARCHAR(64),
    created_time        BIGINT,
    last_modified_time  BIGINT
);

COMMENT ON TABLE dristi_case_participation IS
    'Per-case participation record. persona = LITIGANT | ADVOCATE_REP | POA_HOLDER. '
    'Populated by migrate_case_participation.py for existing cases and by CaseService '
    'for new cases/join-case flows going forward.';

CREATE TABLE dristi_witness (
    id                   varchar(64) NOT NULL PRIMARY KEY,
    caseID               varchar(64) NULL,
    filingNumber         varchar(64) NULL,
    cnrNumber            varchar(64) NULL,
    witnessIdentifier    varchar(64) NULL,
    individualId         varchar(64) NULL,
    remarks              varchar(64) NULL,
    isActive             bool NULL,
    additionalDetails    JSONB NULL,
    createdBy            varchar(64) NULL,
    lastModifiedBy       varchar(64) NULL,
    createdTime          int8 NULL,
    lastModifiedTime     int8 NULL
);

CREATE TABLE dristi_case_hearing_type_priority (
    id            varchar(64) NOT NULL PRIMARY KEY,
    caseType      varchar(1000) NOT NULL,
    description   varchar(64) NULL,
    priority      int8 NULL,
    isActive      bool NULL
);

-- ==== Indexes ====

-- dristi_cases
CREATE INDEX IF NOT EXISTS idx_dristi_cases_dristi_cases_tenant_id ON dristi_cases(id, tenantId);
CREATE INDEX IF NOT EXISTS idx_dristi_cases_cnr_number ON dristi_cases(cnrNumber);
CREATE INDEX IF NOT EXISTS idx_dristi_cases_filing_number ON dristi_cases(filingNumber);
CREATE INDEX IF NOT EXISTS idx_dristi_cases_court_case_number ON dristi_cases(courtCaseNumber);
CREATE INDEX IF NOT EXISTS idx_dristi_cases_filing_date ON dristi_cases(filingDate);
CREATE INDEX IF NOT EXISTS idx_dristi_cases_registration_date ON dristi_cases(registrationDate);
CREATE INDEX IF NOT EXISTS idx_dristi_cases_judge_id ON dristi_cases(judgeId);
-- idx_dristi_cases_tenant_id was originally created with CREATE INDEX CONCURRENTLY
-- (V20250106152900); CONCURRENTLY omitted here (not valid inside a multi-statement script).
CREATE INDEX IF NOT EXISTS idx_dristi_cases_tenant_id ON dristi_cases(tenantId);
CREATE INDEX IF NOT EXISTS idx_dristi_cases_pending_advocate_requests ON dristi_cases USING GIN (pendingAdvocateRequests);
CREATE INDEX IF NOT EXISTS idx_dristi_cases_courtid ON dristi_cases(courtId);

-- dristi_case_document
CREATE INDEX IF NOT EXISTS idx_dristi_case_documents_case_id ON dristi_case_document(case_id);
CREATE INDEX IF NOT EXISTS idx_dristi_case_documents_filestore_id ON dristi_case_document(fileStore);
CREATE INDEX IF NOT EXISTS idx_dristi_case_document_type ON dristi_case_document(documentType);

-- dristi_linked_case
CREATE INDEX IF NOT EXISTS idx_dristi_linked_case_case_id ON dristi_linked_case(case_id);

-- dristi_case_statutes_and_sections
CREATE INDEX IF NOT EXISTS idx_dristi_case_statutes_and_sections_case_id ON dristi_case_statutes_and_sections(case_id);
CREATE INDEX IF NOT EXISTS idx_dristi_case_statutes_and_sections_statutes ON dristi_case_statutes_and_sections(statutes);

-- dristi_case_litigants
CREATE INDEX IF NOT EXISTS idx_dristi_case_litigants_case_id ON dristi_case_litigants(case_id);
CREATE INDEX IF NOT EXISTS idx_dristi_case_litigants_individual_id ON dristi_case_litigants(individualId);

-- dristi_case_representatives
CREATE INDEX IF NOT EXISTS idx_dristi_case_representatives_case_id ON dristi_case_representatives(case_id);
CREATE INDEX IF NOT EXISTS idx_dristi_case_representatives_advocate_id ON dristi_case_representatives(advocateId);

-- dristi_case_representing
CREATE INDEX IF NOT EXISTS idx_dristi_case_representing_representative_id ON dristi_case_representing(representative_id);

-- dristi_case_poaholders
CREATE INDEX idx_poaholders_tenant_case ON dristi_case_poaholders(tenant_id, case_id);
CREATE INDEX idx_poaholders_individual_tenant ON dristi_case_poaholders(individual_id, tenant_id) WHERE individual_id IS NOT NULL;

-- dristi_advocate_office_case_member
CREATE INDEX idx_advocate_office_case_member_office_id ON dristi_advocate_office_case_member(office_advocate_id);
CREATE INDEX idx_advocate_office_case_member_case_id ON dristi_advocate_office_case_member(case_id);
CREATE INDEX idx_advocate_office_case_member_member_id ON dristi_advocate_office_case_member(member_id);
CREATE INDEX idx_advocate_office_case_member_is_active ON dristi_advocate_office_case_member(is_active);
CREATE UNIQUE INDEX idx_advocate_office_case_member_unique ON dristi_advocate_office_case_member(office_advocate_id, case_id, member_id);

-- dristi_case_participation
CREATE INDEX IF NOT EXISTS idx_cp_case_id ON dristi_case_participation (case_id);
CREATE INDEX IF NOT EXISTS idx_cp_individual_id ON dristi_case_participation (individual_id);
CREATE INDEX IF NOT EXISTS idx_cp_advocate_id ON dristi_case_participation (advocate_id) WHERE advocate_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_cp_user_uuid ON dristi_case_participation (user_uuid) WHERE user_uuid IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_cp_case_user_uuid ON dristi_case_participation (case_id, user_uuid);
CREATE INDEX IF NOT EXISTS idx_cp_filing_user_uuid ON dristi_case_participation (filing_number, user_uuid);

-- ==== Foreign Keys (added post-table-creation to resolve ordering) ====
-- (none — no FOREIGN KEY constraints exist anywhere in this service's
--  migration history; all cross-table references are unenforced varchar ids)
