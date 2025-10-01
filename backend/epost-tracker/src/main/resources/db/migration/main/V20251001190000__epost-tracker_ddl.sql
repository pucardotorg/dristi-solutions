ALTER TABLE dristi_epost_tracker
ALTER COLUMN booking_date TYPE int8
USING (EXTRACT(EPOCH FROM (to_timestamp(booking_date, 'YYYY-MM-DD') AT TIME ZONE 'Asia/Kolkata')) * 1000)::bigint,
ALTER COLUMN received_date TYPE int8
USING (EXTRACT(EPOCH FROM (to_timestamp(received_date, 'YYYY-MM-DD') AT TIME ZONE 'Asia/Kolkata')) * 1000)::bigint;
