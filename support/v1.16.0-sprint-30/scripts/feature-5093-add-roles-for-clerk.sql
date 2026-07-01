INSERT INTO eg_userrole_v1 (
    role_code,
    role_tenantid,
    user_id,
    user_tenantid,
    lastmodifieddate
)
SELECT
    new_role.role_code,
    'kl',                          -- role_tenantid
    u.id,                          -- user_id
    u.tenantid,                    -- user_tenantid
    NOW()     -- lastmodifieddate as epoch
FROM eg_user u
         JOIN (
    SELECT unnest(ARRAY[
                      'BAIL_BOND_CREATOR',
                  'BAIL_BOND_EDITOR',
                  'BAIL_BOND_VIEWER',
                  'EXAMINATION_VIEWER',
                  'MEDIATION_VIEWER',
                  'PLEA_VIEWER'
                      ]) AS role_code
) AS new_role ON TRUE
WHERE u.type = 'CITIZEN'
  AND u.tenantid = 'kl'
  and EXISTS (
    SELECT 1
    FROM individual i
             join jsonb_array_elements(i.additionalDetails->'fields') AS elem on true
    WHERE elem->>'key' = 'userType' AND elem->>'value' = 'ADVOCATE_CLERK' and i.userid = u.id::text
)
  AND NOT EXISTS (
    SELECT 1
    FROM eg_userrole_v1 r
    WHERE r.user_id = u.id
      AND r.role_code = new_role.role_code
      AND r.role_tenantid = 'kl'
);



UPDATE individual
SET
    -- 1. Update roles column
    roles = (
        SELECT jsonb_agg(DISTINCT r)
        FROM (
                 SELECT jsonb_array_elements(roles) AS r
                 UNION
                 SELECT jsonb_build_object(
                                'code', new_role,
                                'name', new_role,
                                'tenantId', 'kl',
                                'description', NULL
                        )
                 FROM unnest(ARRAY[
                                 'BAIL_BOND_CREATOR',
                             'BAIL_BOND_EDITOR',
                             'BAIL_BOND_VIEWER',
                             'EXAMINATION_VIEWER',
                             'MEDIATION_VIEWER',
                             'PLEA_VIEWER'
                                 ]) AS new_role
             ) AS all_roles
    ),

    -- 2. Update additionalDetails -> userTypeDetail.value as a parsed-then-restringified value
    additionalDetails = jsonb_set(
            additionalDetails,
            '{fields}',
            (
                SELECT jsonb_agg(
                               CASE
                                   WHEN elem->>'key' = 'userTypeDetail'
                                   AND ((elem->>'value')::jsonb ? 'role') THEN
             jsonb_build_object(
               'key', 'userTypeDetail',
               -- Store back as stringified JSON, not as object
               'value', to_jsonb((
                 jsonb_set(
                   (elem->>'value')::jsonb,
                   '{role}',
                   (
                     SELECT jsonb_agg(DISTINCT val)
                     FROM (
                       SELECT jsonb_array_elements_text((elem->>'value')::jsonb -> 'role') AS val
                       UNION
                       SELECT unnest(ARRAY[
		 'BAIL_BOND_CREATOR',
		    'BAIL_BOND_EDITOR',
		    'BAIL_BOND_VIEWER',
		    'EXAMINATION_VIEWER',
		    'MEDIATION_VIEWER',
		    'PLEA_VIEWER'
                       ])
                     ) AS combined(val)
                   )
                 )::text
               ))
             )
           ELSE elem
         END
       )
                FROM jsonb_array_elements(additionalDetails->'fields') AS elem
            )
                        )
WHERE EXISTS (
    SELECT 1
    FROM jsonb_array_elements(additionalDetails->'fields') AS elem
    WHERE elem->>'key' = 'userType' AND elem->>'value' = 'ADVOCATE_CLERK'
)



