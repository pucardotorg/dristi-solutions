-- noticeType
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_task_notice_type
    ON dristi_task ((taskdetails -> 'noticeDetails' ->> 'noticeType'));

-- deliveryChannels (object or array)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_task_delivery_channel_obj
    ON dristi_task ((taskdetails -> 'deliveryChannels' ->> 'channelName'));
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_task_delivery_channel_elem
    ON dristi_task USING GIN ((taskdetails -> 'deliveryChannels')) jsonb_path_ops;

-- hearingDate epoch (as text cast to bigint)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_task_hearing_date_epoch
    ON dristi_task (((taskdetails -> 'caseDetails' ->> 'hearingDate')::bigint));
