UPDATE dristi_task
SET feepaiddate =
        (
            EXTRACT
            (
                    EPOCH FROM
                    TO_DATE(taskdetails -> 'deliveryChannels' ->> 'feePaidDate',
                            'DD-MM-YYYY')
            ) * 1000
        )::bigint
WHERE taskdetails -> 'deliveryChannels' ->> 'feePaidDate' IS NOT NULL
AND taskdetails -> 'deliveryChannels' ->> 'feePaidDate' <> '';
