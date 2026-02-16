-- Query to get admission date
SELECT
    cnrnumber,
    admit_createdtime
FROM (
         SELECT
             dc.cnrnumber,
             ewp.createdtime AS admit_createdtime,
             ROW_NUMBER() OVER (
            PARTITION BY dc.cnrnumber
            ORDER BY ewp.createdtime DESC
        ) AS rn
         FROM dristi_cases dc
                  JOIN eg_wf_processinstance_v2 ewp
                       ON ewp.businessid = dc.filingnumber
         WHERE ewp.action = 'ADMIT'
           AND dc.casetype = 'ST'
     ) t
WHERE rn = 1;

-- Query to update admission date
-- Provide admission date timestamp and cino
-- Create the query by using results of about query
update case_conversion
set
    converted_at = TO_TIMESTAMP('provide admission date timestamp' / 1000)
where
    cino = 'provide_cino';