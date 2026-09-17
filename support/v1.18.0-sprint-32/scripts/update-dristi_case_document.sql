
WITH src AS (
    SELECT
        dc.id AS case_id,
        dc.tenantid,
        (m.mad_elem->'advocateBarRegNumberWithName'->>'advocateId')::text AS advocateid,

        jsonb_array_elements(
            CASE
                WHEN jsonb_typeof(f.formdata->'data'->'multipleAdvocatesAndPip'->'vakalatnamaFileUpload'->'document') = 'array'
                THEN f.formdata->'data'->'multipleAdvocatesAndPip'->'vakalatnamaFileUpload'->'document'
                ELSE '[]'::jsonb
            END
        ) AS vak_doc

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

UPDATE dristi_case_document dcd
SET additionaldetails =
    jsonb_build_object(
        'fileName', COALESCE(src.vak_doc->>'fileName', src.vak_doc->>'filename'),
        'documentName', COALESCE(src.vak_doc->>'documentName', src.vak_doc->>'documentname')
    )
FROM src
WHERE dcd.case_id = src.case_id
  AND dcd.documenttype = 'VAKALATNAMA_DOC'
  AND dcd.filestore = src.vak_doc->>'fileStore';
