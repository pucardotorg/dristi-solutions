UPDATE dristi_task
SET taskdetails = jsonb_set(
        taskdetails,
        '{caseDetails,originalHearingDate}',
        taskdetails -> 'caseDetails' -> 'hearingDate'
                  )
WHERE taskdetails -> 'caseDetails' -> 'hearingDate' IS NOT NULL
  AND NOT (taskdetails -> 'caseDetails' ? 'originalHearingDate');
