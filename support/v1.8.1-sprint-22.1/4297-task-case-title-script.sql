-- This script is used to update the caseid and casetitle in the dristi_task table
-- based on the filingnumber from the dristi_cases table.
SELECT 
  t.id,
  t.caseid AS old_caseid,
  t.casetitle AS old_casetitle,
  c.id AS new_caseid,
  c.casetitle AS new_casetitle
FROM dristi_task t
JOIN dristi_cases c ON t.filingnumber = c.filingnumber
WHERE t.caseid IS NULL OR t.casetitle IS NULL;


-- This script updates the caseid and casetitle in the dristi_task table
-- based on the filingnumber from the dristi_cases table.
UPDATE dristi_task t 
SET 
  caseid = c.id, 
  casetitle = c.casetitle 
FROM 
  dristi_cases c 
WHERE 
  (t.caseid IS NULL OR t.casetitle IS NULL) 
  AND t.filingnumber = c.filingnumber;