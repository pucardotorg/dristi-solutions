// Script to extract the number from the court case number of 2025 year

SELECT
    REGEXP_REPLACE(courtcasenumber, 'ST/(\d+)/2025', '\1') AS extracted_number
FROM
    dristi_cases
WHERE
    courtcasenumber LIKE '%/2025%'
ORDER BY
    CAST(REGEXP_REPLACE(courtcasenumber, 'ST/(\d+)/2025', '\1') AS INTEGER) DESC;


// create sequence for 2025 year

create sequence seq_ccst_klkm522025;

// update the court case number of 2025 year with appropriate sequence
alter sequence seq_ccst_klkm522025 restart with 15;

// Script to extract the court case number of 2024 year

SELECT
    REGEXP_REPLACE(courtcasenumber, 'ST/(\d+)/2024', '\1') AS extracted_number
FROM
    dristi_cases
WHERE
    courtcasenumber LIKE '%/2024%'
ORDER BY
    CAST(REGEXP_REPLACE(courtcasenumber, 'ST/(\d+)/2024', '\1') AS INTEGER) DESC;

// create sequence for 2024 year

create sequence seq_ccst_klkm522024;

// update the court case number of 2024 year with appropriate sequence
alter sequence seq_ccst_klkm522024 restart with 15;