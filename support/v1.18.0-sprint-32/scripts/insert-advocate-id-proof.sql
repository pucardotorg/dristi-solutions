WITH src AS (
    SELECT
        dc.id AS case_id,
        dc.tenantid,
        (m.mad_elem->'advocateBarRegNumberWithName'->>'advocateId')::text AS advocateid,

        jsonb_array_elements(
            CASE
                WHEN jsonb_typeof(m.mad_elem->'advocateNameDetails'->'advocateIdProof') = 'array'
                THEN m.mad_elem->'advocateNameDetails'->'advocateIdProof'
                ELSE '[]'::jsonb
            END
        ) AS id_doc

    FROM dristi_cases dc

    CROSS JOIN LATERAL jsonb_array_elements(
        CASE
            WHEN jsonb_typeof(dc.additionaldetails->'advocateDetails'->'formdata') = 'array'
            THEN dc.additionaldetails->'advocateDetails'->'formdata'
            ELSE '[]'::jsonb
        END
    ) AS f(formdata)

    CROSS JOIN LATERAL jsonb_array_elements(
        CASE
            WHEN jsonb_typeof(f.formdata->'data'->'multipleAdvocatesAndPip'->'multipleAdvocateNameDetails') = 'array'
            THEN f.formdata->'data'->'multipleAdvocatesAndPip'->'multipleAdvocateNameDetails'
            ELSE '[]'::jsonb
        END
    ) AS m(mad_elem)
)

INSERT INTO dristi_case_document (
    id,
    filestore,
    documenttype,
    case_id,
    representative_id,
    additionaldetails,
    isactive
)
SELECT
    gen_random_uuid()::text,
    src.id_doc->>'fileStore',
    'ADVOCATE_ID_PROOF',
    NULL,
    dr.id,
    jsonb_build_object(
        'fileName', COALESCE(src.id_doc->>'fileName', src.id_doc->>'filename'),
        'documentName', COALESCE(src.id_doc->>'documentName', src.id_doc->>'documentname')
    ),
    TRUE
FROM src
JOIN dristi_case_representatives dr
  ON dr.case_id = src.case_id
 AND dr.tenantid = src.tenantid
 AND dr.advocateid = src.advocateid
WHERE src.id_doc->>'fileStore' IS NOT NULL
  AND btrim(src.id_doc->>'fileStore') <> '';
