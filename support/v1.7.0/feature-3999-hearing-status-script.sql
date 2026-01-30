// script to update status from abated to abandoned

select status,hearingid from dristi_hearing where status = 'ABATED';

// this is to get the hearingid of the hearings that are abated

// sql to update the status from abated to abandoned in db
UPDATE dristi_hearing
SET status = 'ABANDONED'
WHERE status = 'ABATED';

// script to update the hearingDetails.status in open-hearing-index from abated to abandoned
// this is to check if the status is updated in the index
GET open-hearing-index/_search
{
  "size": 0,
  "aggs": {
    "distinct_statuses": {
      "terms": {
        "field": "Data.hearingDetails.status.keyword",
        "size": 100
      }
    }
  }
}

// query to update the status in the index

POST open-hearing-index/_update_by_query
{
  "script": {
    "source": "ctx._source.Data.hearingDetails.status = 'ABANDONED'",
    "lang": "painless"
  },
  "query": {
    "term": {
      "Data.hearingDetails.status.keyword": "ABATED"
    }
  }
}