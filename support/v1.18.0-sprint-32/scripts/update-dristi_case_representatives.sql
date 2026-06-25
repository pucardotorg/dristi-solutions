WITH src AS (
    SELECT
        dc.id       AS case_id,
        dc.tenantid AS tenant_id,
        (m.mad_elem->'advocateBarRegNumberWithName'->>'advocateId')::text AS advocateid,
        m.mad_elem->'advocateNameDetails' AS name_details,
        m.mad_elem->'advocateBarRegNumberWithName' AS bar_details
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
    WHERE dc.additionaldetails ? 'advocateDetails'
)

UPDATE dristi_case_representatives dr
SET additionaldetails =
    COALESCE(dr.additionaldetails, '{}'::jsonb)
    ||
    jsonb_build_object(
        'firstName', COALESCE(NULLIF(dr.additionaldetails->>'firstName',''), src.name_details->>'firstName'),
        'middleName', COALESCE(NULLIF(dr.additionaldetails->>'middleName',''), src.name_details->>'middleName'),
        'lastName', COALESCE(NULLIF(dr.additionaldetails->>'lastName',''), src.name_details->>'lastName'),
        'mobileNumber', COALESCE(NULLIF(dr.additionaldetails->>'mobileNumber',''), src.name_details->>'advocateMobileNumber')
    ),
    lastmodifiedby = 'migration-script',
    lastmodifiedtime = (extract(epoch from now()) * 1000)::bigint

FROM src
WHERE dr.case_id   = src.case_id
  AND dr.tenantid  = src.tenant_id
  AND dr.advocateid = src.advocateid;
