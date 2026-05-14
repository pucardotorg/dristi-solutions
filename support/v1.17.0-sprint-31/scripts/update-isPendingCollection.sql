SELECT COUNT(*) FROM dristi_task dt
WHERE dt.taskdetails -> 'deliveryChannels' ->> 'isPendingCollection' = 'true'
  AND dt.taskdetails -> 'deliveryChannels' ->> 'feePaidDate' IS NULL;

UPDATE dristi_task dt
SET taskdetails = jsonb_set(
        taskdetails,
        '{deliveryChannels,isPendingCollection}',
        'false'::jsonb
                  )
WHERE jsonb_typeof(taskdetails -> 'deliveryChannels') = 'object'
  AND taskdetails -> 'deliveryChannels' ->> 'isPendingCollection' = 'true'
  AND taskdetails -> 'deliveryChannels' ->> 'feePaidDate' IS NULL;
