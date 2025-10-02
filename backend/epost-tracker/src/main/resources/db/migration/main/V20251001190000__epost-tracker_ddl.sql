ALTER TABLE dristi_epost_tracker
ALTER COLUMN booking_date TYPE int8
USING (
  CASE
    WHEN booking_date IS NULL OR booking_date = '' OR booking_date = 'null' THEN NULL
    ELSE (EXTRACT(EPOCH FROM (to_timestamp(booking_date, 'YYYY-MM-DD') AT TIME ZONE 'Asia/Kolkata')) * 1000)::bigint
  END
);

ALTER TABLE dristi_epost_tracker
ALTER COLUMN received_date TYPE int8
USING (
  CASE
    WHEN received_date IS NULL OR received_date = '' OR received_date = 'null' THEN NULL
    ELSE (EXTRACT(EPOCH FROM (to_timestamp(received_date, 'YYYY-MM-DD') AT TIME ZONE 'Asia/Kolkata')) * 1000)::bigint
  END
);