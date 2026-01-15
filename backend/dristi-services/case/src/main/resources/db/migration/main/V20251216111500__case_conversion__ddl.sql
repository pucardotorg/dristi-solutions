CREATE TABLE dristi_case_conversion (
    tenantId varchar(64),
    caseId varchar(64),
    filingNumber varchar(64),
    cnrNumber varchar(64),
    dateOfConversion BIGINT,
    convertedFrom varchar(64),
    convertedTo varchar(64),
    preCaseNumber varchar(64),
    postCaseNumber varchar(64)
);