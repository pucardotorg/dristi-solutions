CREATE EXTENSION IF NOT EXISTS "pgcrypto";

UPDATE dristi_hearing
SET attendees = (
  SELECT jsonb_agg(
           jsonb_set(
             elem,
             '{id}',
             to_jsonb(gen_random_uuid())
           )
         )
  FROM jsonb_array_elements(attendees) AS elem
)
WHERE attendees IS NOT NULL;


// script to update transcripts and update hearingSummary
SELECT hearingid, transcript->>0 AS first_element, LENGTH(transcript->>0) AS first_element_length
FROM public.dristi_hearing
WHERE
    transcript IS NOT NULL
    AND jsonb_typeof(transcript) = 'array'
    AND jsonb_array_length(transcript) > 0
    AND transcript->>0 IS NOT NULL
    AND transcript->>0 <> ''
    AND transcript->>0 <> 'null'
and LENGTH(transcript->>0) > 1000;

UPDATE public.dristi_hearing
SET hearingsummary = (
    CASE
        WHEN transcript IS NULL THEN NULL
        WHEN jsonb_typeof(transcript) != 'array' THEN NULL
        WHEN jsonb_array_length(transcript) IS NULL THEN NULL
        WHEN jsonb_array_length(transcript) = 0 THEN NULL
        WHEN transcript->>0 IS NULL THEN NULL
        WHEN transcript->>0 = 'null' THEN NULL
        WHEN transcript->>0 = '' THEN NULL
        ELSE transcript->>0
    END
);
