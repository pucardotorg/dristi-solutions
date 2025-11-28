
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
         'MEDIATION_SIGNER'
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
                         'MEDIATION_SIGNER'
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
   WHERE elem->>'key' = 'userType' AND elem->>'value' = 'ADVOCATE'
 );