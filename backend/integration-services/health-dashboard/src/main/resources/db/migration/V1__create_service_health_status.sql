CREATE TABLE IF NOT EXISTS eg_service_health_status (
    id                BIGSERIAL,
    service_name      VARCHAR(100)  NOT NULL,
    service_url       VARCHAR(500),
    last_status       VARCHAR(10)   NOT NULL DEFAULT 'UNKNOWN',
    last_updated_time BIGINT,
    response_time_ms  BIGINT,
    message           VARCHAR(2000)
);