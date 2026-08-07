CREATE TABLE IF NOT EXISTS eg_service_health (
    id           BIGSERIAL PRIMARY KEY,
    service_name VARCHAR(100) NOT NULL,
    service_url  VARCHAR(500)
);

CREATE TABLE IF NOT EXISTS eg_service_health_status (
    id                BIGSERIAL PRIMARY KEY,
    service_id        BIGINT        NOT NULL,
    last_status       VARCHAR(10)   NOT NULL DEFAULT 'UNKNOWN',
    last_updated_time BIGINT,
    response_time_ms  BIGINT,
    message           VARCHAR(2000)
);

CREATE INDEX IF NOT EXISTS idx_eg_service_health_status_service_id
    ON eg_service_health_status (service_id);

INSERT INTO eg_service_health (service_name, service_url) VALUES
    ('ESIGN', 'tcp://esignservice.cdac.in:443'),
    ('SMS', 'https://msdgweb.mgov.gov.in/esms/sendsmsrequestDLT'),
    ('TREASURY', 'https://etreasury.kerala.gov.in/'),
    ('ICOPS', 'tcp://api-icops.keralapolice.gov.in:443');