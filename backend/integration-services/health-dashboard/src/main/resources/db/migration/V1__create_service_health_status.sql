CREATE TABLE IF NOT EXISTS eg_service_health_status (
    id                BIGSERIAL,
    service_name      VARCHAR(100)  NOT NULL,
    service_url       VARCHAR(500),
    last_status       VARCHAR(10)   NOT NULL DEFAULT 'UNKNOWN',
    last_updated_time BIGINT,
    response_time_ms  BIGINT,
    message           VARCHAR(2000),
    CONSTRAINT pk_service_health_status PRIMARY KEY (id),
    CONSTRAINT uq_service_name UNIQUE (service_name)
);

INSERT INTO eg_service_health_status (service_name, service_url, last_status)
VALUES
    ('ESIGN',    'tcp://esignservice.cdac.in:443',              'UNKNOWN'),
    ('SMS',      'https://msdgweb.mgov.gov.in/esms/sendsmsrequestDLT', 'UNKNOWN'),
    ('TREASURY', 'https://etreasury.kerala.gov.in/',            'UNKNOWN'),
    ('ICOPS',    'tcp://api-icops.keralapolice.gov.in:443',     'UNKNOWN')
ON CONFLICT (service_name) DO NOTHING;